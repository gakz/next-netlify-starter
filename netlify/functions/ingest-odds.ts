import type { Config, Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and } from 'drizzle-orm'
import { gameExpectations, games, teams } from '../../db/schema'
import {
  createOddsClient,
  normalizeEvents,
  SUPPORTED_SPORTS,
  OddsAPIError,
  type NormalizedExpectation,
} from '../../lib/odds-api'

// Ingestion interval: every 15 minutes

interface IngestionResult {
  sportKey: string
  eventsProcessed: number
  expectationsWritten: number
  gamesMatched: number
  errors: string[]
}

/**
 * Try to match an expectation to an existing game in the database
 */
async function matchGameId(
  db: ReturnType<typeof drizzle>,
  expectation: NormalizedExpectation
): Promise<string | null> {
  // Get teams from database
  const allTeams = await db.select().from(teams)

  // Find home and away teams by name (case-insensitive partial match)
  const homeTeam = allTeams.find(
    (t) =>
      t.name.toLowerCase().includes(expectation.homeTeam.toLowerCase()) ||
      expectation.homeTeam.toLowerCase().includes(t.name.toLowerCase())
  )
  const awayTeam = allTeams.find(
    (t) =>
      t.name.toLowerCase().includes(expectation.awayTeam.toLowerCase()) ||
      expectation.awayTeam.toLowerCase().includes(t.name.toLowerCase())
  )

  if (!homeTeam || !awayTeam) {
    return null
  }

  // Find a game with these teams
  const matchingGames = await db
    .select()
    .from(games)
    .where(and(eq(games.homeTeamId, homeTeam.id), eq(games.awayTeamId, awayTeam.id)))
    .limit(1)

  return matchingGames[0]?.id ?? null
}

/**
 * Ingest odds for a single sport
 */
async function ingestSport(
  db: ReturnType<typeof drizzle>,
  sportConfig: (typeof SUPPORTED_SPORTS)[number]
): Promise<IngestionResult> {
  const result: IngestionResult = {
    sportKey: sportConfig.key,
    eventsProcessed: 0,
    expectationsWritten: 0,
    gamesMatched: 0,
    errors: [],
  }

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
        // Try to match to an existing game
        const gameId = await matchGameId(db, expectation)
        console.log(`[DEBUG] Event ${expectation.externalEventId}: gameId=${gameId}, type=${typeof gameId}`)

        if (gameId) {
          result.gamesMatched++
        }

        // Build values object, only including gameId when it has a value
        const insertValues = {
          ...(gameId ? { gameId } : {}),
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
        }
        console.log(`[DEBUG] Insert values keys: ${Object.keys(insertValues).join(', ')}`)
        console.log(`[DEBUG] gameId in values: ${'gameId' in insertValues}`)

        // Insert the expectation (always insert new records to track history)
        await db.insert(gameExpectations).values(insertValues)

        result.expectationsWritten++
        console.log(`[DEBUG] Successfully inserted event ${expectation.externalEventId}`)
      } catch (err) {
        // Log detailed error information
        console.error(`[DEBUG] Insert error for ${expectation.externalEventId}:`, err)
        const message =
          err instanceof Error ? err.message : 'Unknown error inserting expectation'
        result.errors.push(`Event ${expectation.externalEventId}: ${message}`)
      }
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
    console.log('Starting odds ingestion...')
    console.log(`Configured sports: ${SUPPORTED_SPORTS.map((s) => s.key).join(', ')}`)

    const results: IngestionResult[] = []

    // Ingest each configured sport
    for (const sportConfig of SUPPORTED_SPORTS) {
      console.log(`\nProcessing ${sportConfig.name} (${sportConfig.key})...`)
      const result = await ingestSport(db, sportConfig)
      results.push(result)

      // Log sport results
      console.log(`  Events processed: ${result.eventsProcessed}`)
      console.log(`  Expectations written: ${result.expectationsWritten}`)
      console.log(`  Games matched: ${result.gamesMatched}`)
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`)
        result.errors.forEach((e) => console.log(`    - ${e}`))
      }
    }

    const duration = Date.now() - startTime

    // Summary
    const totalEvents = results.reduce((sum, r) => sum + r.eventsProcessed, 0)
    const totalWritten = results.reduce((sum, r) => sum + r.expectationsWritten, 0)
    const totalMatched = results.reduce((sum, r) => sum + r.gamesMatched, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

    console.log('\n=== Odds Ingestion Complete ===')
    console.log(`Total events processed: ${totalEvents}`)
    console.log(`Total expectations written: ${totalWritten}`)
    console.log(`Total games matched: ${totalMatched}`)
    console.log(`Total errors: ${totalErrors}`)
    console.log(`Duration: ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalEvents,
          totalWritten,
          totalMatched,
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

// Netlify scheduled function config: runs every 15 minutes
// Note: schedule must be a static string literal for Netlify to detect it at build time
export const config: Config = {
  schedule: '*/15 * * * *',
}
