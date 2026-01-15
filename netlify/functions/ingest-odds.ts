import type { Config, Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and, gte, lte, or } from 'drizzle-orm'
import { gameExpectations, games, teams, gameStateSnapshots } from '../../db/schema'
import {
  createOddsClient,
  normalizeEvents,
  SUPPORTED_SPORTS,
  OddsAPIError,
  type ScoreEvent,
} from '../../lib/odds-api'

// Ingestion runs every 5 minutes, but conditionally fetches based on game activity

interface IngestionResult {
  sportKey: string
  eventsProcessed: number
  expectationsWritten: number
  gamesCreated: number
  teamsCreated: number
  scoresUpdated: number
  errors: string[]
}

interface GameActivityStatus {
  hasLiveGames: boolean
  hasGamesStartingSoon: boolean
  liveGameCount: number
  upcomingWithinHour: number
}

/**
 * Check if there are live games or games starting soon
 * This helps us decide whether to fetch scores (costs API calls)
 */
async function checkGameActivity(
  db: ReturnType<typeof drizzle>
): Promise<GameActivityStatus> {
  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

  // Find games that are marked as live
  const liveGames = await db
    .select()
    .from(games)
    .where(eq(games.status, 'live'))

  // Find games that should be live (started within last 3 hours, not completed)
  // This catches games that haven't been updated to 'live' status yet
  const potentiallyLiveGames = await db
    .select()
    .from(games)
    .where(
      and(
        eq(games.status, 'upcoming'),
        lte(games.scheduledTime, now),
        gte(games.scheduledTime, threeHoursAgo)
      )
    )

  // Find games starting within the next hour
  const upcomingSoonGames = await db
    .select()
    .from(games)
    .where(
      and(
        eq(games.status, 'upcoming'),
        gte(games.scheduledTime, now),
        lte(games.scheduledTime, oneHourFromNow)
      )
    )

  const totalLive = liveGames.length + potentiallyLiveGames.length

  return {
    hasLiveGames: totalLive > 0,
    hasGamesStartingSoon: upcomingSoonGames.length > 0,
    liveGameCount: totalLive,
    upcomingWithinHour: upcomingSoonGames.length,
  }
}

/**
 * Map sport key to league name
 */
function getLeagueFromSportKey(sportKey: string): string {
  const leagueMap: Record<string, string> = {
    basketball_nba: 'NBA',
    americanfootball_nfl: 'NFL',
    baseball_mlb: 'MLB',
    icehockey_nhl: 'NHL',
  }
  return leagueMap[sportKey] || sportKey.toUpperCase()
}

/**
 * Find or create a team by name
 */
async function findOrCreateTeam(
  db: ReturnType<typeof drizzle>,
  teamName: string,
  league: string
): Promise<{ id: string; created: boolean }> {
  // Try to find existing team (exact match)
  const existing = await db
    .select()
    .from(teams)
    .where(eq(teams.name, teamName))
    .limit(1)

  if (existing.length > 0) {
    return { id: existing[0].id, created: false }
  }

  // Create new team
  const [newTeam] = await db
    .insert(teams)
    .values({ name: teamName, league })
    .returning({ id: teams.id })

  return { id: newTeam.id, created: true }
}

/**
 * Find or create a game for the given teams and time
 */
async function findOrCreateGame(
  db: ReturnType<typeof drizzle>,
  homeTeamId: string,
  awayTeamId: string,
  commenceTime: Date
): Promise<{ id: string; created: boolean }> {
  // Look for existing game with same teams within a 24-hour window of commence time
  const windowStart = new Date(commenceTime.getTime() - 12 * 60 * 60 * 1000)
  const windowEnd = new Date(commenceTime.getTime() + 12 * 60 * 60 * 1000)

  const existing = await db
    .select()
    .from(games)
    .where(
      and(
        eq(games.homeTeamId, homeTeamId),
        eq(games.awayTeamId, awayTeamId),
        gte(games.scheduledTime, windowStart),
        lte(games.scheduledTime, windowEnd)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    return { id: existing[0].id, created: false }
  }

  // Create new game
  const [newGame] = await db
    .insert(games)
    .values({
      homeTeamId,
      awayTeamId,
      scheduledTime: commenceTime,
      status: 'upcoming',
    })
    .returning({ id: games.id })

  return { id: newGame.id, created: true }
}

/**
 * Process scores for games and update their status/snapshots
 */
async function processScores(
  db: ReturnType<typeof drizzle>,
  sportKey: string,
  scoreEvents: ScoreEvent[]
): Promise<number> {
  let updated = 0

  for (const event of scoreEvents) {
    try {
      // Find the game by matching teams
      const homeTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.name, event.home_team))
        .limit(1)

      const awayTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.name, event.away_team))
        .limit(1)

      if (homeTeam.length === 0 || awayTeam.length === 0) continue

      // Find the game within time window
      const commenceTime = new Date(event.commence_time)
      const windowStart = new Date(commenceTime.getTime() - 12 * 60 * 60 * 1000)
      const windowEnd = new Date(commenceTime.getTime() + 12 * 60 * 60 * 1000)

      const existingGames = await db
        .select()
        .from(games)
        .where(
          and(
            eq(games.homeTeamId, homeTeam[0].id),
            eq(games.awayTeamId, awayTeam[0].id),
            gte(games.scheduledTime, windowStart),
            lte(games.scheduledTime, windowEnd)
          )
        )
        .limit(1)

      if (existingGames.length === 0) continue

      const game = existingGames[0]

      // Parse scores
      let homeScore: number | null = null
      let awayScore: number | null = null

      if (event.scores) {
        for (const score of event.scores) {
          if (score.name === event.home_team && score.score) {
            homeScore = parseInt(score.score, 10)
          } else if (score.name === event.away_team && score.score) {
            awayScore = parseInt(score.score, 10)
          }
        }
      }

      // Determine game status
      const now = new Date()
      const hasStarted = commenceTime <= now
      const newStatus = event.completed
        ? 'completed'
        : hasStarted
          ? 'live'
          : 'upcoming'

      // Update game status if changed
      if (game.status !== newStatus) {
        await db
          .update(games)
          .set({
            status: newStatus,
            completedAt: event.completed ? now : null,
          })
          .where(eq(games.id, game.id))
      }

      // Create snapshot if we have scores
      if (homeScore !== null && awayScore !== null) {
        const scoreDiff = Math.abs(homeScore - awayScore)
        const isClose = scoreDiff <= 10
        const tensionScore = isClose ? Math.min(100, 50 + (10 - scoreDiff) * 5) : Math.max(0, 50 - scoreDiff)

        await db.insert(gameStateSnapshots).values({
          gameId: game.id,
          capturedAt: now,
          tensionScore,
          momentumShifts: 0,
          leadChanges: 0,
          closeFinish: event.completed && scoreDiff <= 5,
          isFinal: event.completed,
          homeScore,
          awayScore,
        })

        updated++
      }
    } catch (err) {
      console.error(`[${sportKey}] Error processing score for ${event.id}:`, err)
    }
  }

  return updated
}

/**
 * Ingest odds for a single sport
 * @param fetchScores - Whether to also fetch live scores (costs additional API call)
 */
async function ingestSport(
  db: ReturnType<typeof drizzle>,
  sportConfig: (typeof SUPPORTED_SPORTS)[number],
  fetchScores: boolean = true
): Promise<IngestionResult> {
  const result: IngestionResult = {
    sportKey: sportConfig.key,
    eventsProcessed: 0,
    expectationsWritten: 0,
    gamesCreated: 0,
    teamsCreated: 0,
    scoresUpdated: 0,
    errors: [],
  }

  const league = getLeagueFromSportKey(sportConfig.key)

  try {
    const client = createOddsClient()

    // Fetch odds for the sport
    const { events, remainingRequests } = await client.getOdds(sportConfig)
    console.log(
      `[${sportConfig.key}] Fetched ${events.length} events. API requests remaining: ${remainingRequests}`
    )

    // Normalize events
    const expectations = normalizeEvents(events)
    result.eventsProcessed = events.length

    // Insert each expectation
    for (const expectation of expectations) {
      try {
        // Find or create home team
        const homeTeamResult = await findOrCreateTeam(db, expectation.homeTeam, league)
        if (homeTeamResult.created) {
          result.teamsCreated++
          console.log(`[${sportConfig.key}] Created team: ${expectation.homeTeam}`)
        }

        // Find or create away team
        const awayTeamResult = await findOrCreateTeam(db, expectation.awayTeam, league)
        if (awayTeamResult.created) {
          result.teamsCreated++
          console.log(`[${sportConfig.key}] Created team: ${expectation.awayTeam}`)
        }

        // Find or create game
        const gameResult = await findOrCreateGame(
          db,
          homeTeamResult.id,
          awayTeamResult.id,
          expectation.commenceTime
        )
        if (gameResult.created) {
          result.gamesCreated++
          console.log(
            `[${sportConfig.key}] Created game: ${expectation.awayTeam} @ ${expectation.homeTeam}`
          )
        }

        // Insert the expectation with gameId
        await db.insert(gameExpectations).values({
          gameId: gameResult.id,
          sportKey: expectation.sportKey,
          externalEventId: expectation.externalEventId,
          commenceTime: expectation.commenceTime,
          homeTeam: expectation.homeTeam,
          awayTeam: expectation.awayTeam,
          spreadHome: expectation.spreadHome,
          spreadAway: expectation.spreadAway,
          totalValue: expectation.totalValue,
          totalOverPrice: expectation.totalOverPrice,
          totalUnderPrice: expectation.totalUnderPrice,
          bookmaker: expectation.bookmaker,
          source: 'the-odds-api',
          capturedAt: new Date(),
        })

        result.expectationsWritten++
      } catch (err) {
        console.error(`[${sportConfig.key}] Error processing ${expectation.externalEventId}:`, err)
        const message =
          err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`Event ${expectation.externalEventId}: ${message}`)
      }
    }

    // Fetch and process scores only if requested (saves API calls when no games active)
    if (fetchScores) {
      try {
        const { events: scoreEvents, remainingRequests: scoresRemaining } =
          await client.getScores(sportConfig.key, 1)
        console.log(
          `[${sportConfig.key}] Fetched ${scoreEvents.length} score events. API requests remaining: ${scoresRemaining}`
        )

        result.scoresUpdated = await processScores(db, sportConfig.key, scoreEvents)
      } catch (scoreErr) {
        console.error(`[${sportConfig.key}] Error fetching scores:`, scoreErr)
        result.errors.push(
          `Scores fetch error: ${scoreErr instanceof Error ? scoreErr.message : 'Unknown'}`
        )
      }
    } else {
      console.log(`[${sportConfig.key}] Skipping scores fetch (no active games)`)
    }
  } catch (err) {
    if (err instanceof OddsAPIError) {
      result.errors.push(`API Error: ${err.message}`)
    } else {
      result.errors.push(
        `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`
      )
    }
  }

  return result
}

export default async function handler(req: Request, context: Context) {
  const startTime = Date.now()

  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not configured')
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.ODDS_API_KEY) {
    console.error('ODDS_API_KEY not configured')
    return new Response(
      JSON.stringify({ error: 'Odds API key not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql)

  try {
    // Check game activity to determine fetch strategy
    const activity = await checkGameActivity(db)
    const shouldFetchScores = activity.hasLiveGames || activity.hasGamesStartingSoon

    // Only fetch odds every 15 minutes when no games are active (3rd run of 5-min cycle)
    const currentMinute = new Date().getMinutes()
    const isOddsRefreshTime = currentMinute % 15 < 5 // First 5 minutes of each 15-min window
    const shouldFetchOdds = shouldFetchScores || isOddsRefreshTime

    console.log('=== Ingestion Status ===')
    console.log(`Live games: ${activity.liveGameCount}`)
    console.log(`Games starting within hour: ${activity.upcomingWithinHour}`)
    console.log(`Fetch strategy: ${shouldFetchScores ? 'ACTIVE (odds + scores)' : shouldFetchOdds ? 'REFRESH (odds only)' : 'SKIP'}`)

    // Skip entirely if no games active and not time for odds refresh
    if (!shouldFetchOdds) {
      console.log('No active games and not time for odds refresh. Skipping API calls.')
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'No active games',
          activity,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`\nConfigured sports: ${SUPPORTED_SPORTS.map((s) => s.key).join(', ')}`)

    const results: IngestionResult[] = []

    // Ingest each configured sport
    for (const sportConfig of SUPPORTED_SPORTS) {
      console.log(`\nProcessing ${sportConfig.name} (${sportConfig.key})...`)
      const result = await ingestSport(db, sportConfig, shouldFetchScores)
      results.push(result)

      // Log sport results
      console.log(`  Events processed: ${result.eventsProcessed}`)
      console.log(`  Expectations written: ${result.expectationsWritten}`)
      console.log(`  Games created: ${result.gamesCreated}`)
      console.log(`  Teams created: ${result.teamsCreated}`)
      console.log(`  Scores updated: ${result.scoresUpdated}`)
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`)
        result.errors.forEach((e) => console.log(`    - ${e}`))
      }
    }

    const duration = Date.now() - startTime

    // Summary
    const totalEvents = results.reduce((sum, r) => sum + r.eventsProcessed, 0)
    const totalWritten = results.reduce((sum, r) => sum + r.expectationsWritten, 0)
    const totalGamesCreated = results.reduce((sum, r) => sum + r.gamesCreated, 0)
    const totalTeamsCreated = results.reduce((sum, r) => sum + r.teamsCreated, 0)
    const totalScoresUpdated = results.reduce((sum, r) => sum + r.scoresUpdated, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

    console.log('\n=== Odds Ingestion Complete ===')
    console.log(`Total events processed: ${totalEvents}`)
    console.log(`Total expectations written: ${totalWritten}`)
    console.log(`Total games created: ${totalGamesCreated}`)
    console.log(`Total teams created: ${totalTeamsCreated}`)
    console.log(`Total scores updated: ${totalScoresUpdated}`)
    console.log(`Total errors: ${totalErrors}`)
    console.log(`Duration: ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalEvents,
          totalWritten,
          totalGamesCreated,
          totalTeamsCreated,
          totalScoresUpdated,
          totalErrors,
          durationMs: duration,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Odds Ingestion Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Ingestion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Netlify scheduled function config: runs every 5 minutes
// Actual API usage is optimized based on game activity:
// - Live games: fetches odds + scores (2 API calls)
// - Games starting soon: fetches odds + scores (2 API calls)
// - No active games: fetches odds only every 15 min (1 API call), skips other runs
export const config: Config = {
  schedule: '*/5 * * * *',
}
