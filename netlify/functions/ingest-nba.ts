import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { games, gameStateSnapshots, teams } from '../../db/schema'
import {
  getStage,
  isCompetitive,
  getActivityLevel,
  calculateTensionScore,
} from '../../lib/nba-helpers'

/**
 * Simulated NBA game state.
 * This represents raw data that would come from an NBA API.
 */
interface SimulatedGameState {
  homeTeamName: string
  awayTeamName: string
  quarter: number
  clockSeconds: number
  homeScore: number
  awayScore: number
  status: 'scheduled' | 'live' | 'completed'
}

/**
 * Generate dummy NBA game states.
 * Varies states across runs to simulate progression.
 */
function generateDummyGames(): SimulatedGameState[] {
  // Use current time to create variation across runs
  const now = Date.now()
  const seed = Math.floor(now / (5 * 60 * 1000)) // Changes every 5 minutes

  // Helper to generate pseudo-random number from seed
  const random = (index: number) => {
    const x = Math.sin(seed + index) * 10000
    return x - Math.floor(x)
  }

  return [
    // Game 1: Close late-game thriller
    {
      homeTeamName: 'Boston Celtics',
      awayTeamName: 'Miami Heat',
      quarter: 4,
      clockSeconds: Math.floor(random(1) * 180), // 0-3 minutes left
      homeScore: 98 + Math.floor(random(11) * 10),
      awayScore: 96 + Math.floor(random(12) * 10),
      status: 'live',
    },
    // Game 2: Blowout in progress
    {
      homeTeamName: 'Los Angeles Lakers',
      awayTeamName: 'Golden State Warriors',
      quarter: 3,
      clockSeconds: Math.floor(random(2) * 720),
      homeScore: 75 + Math.floor(random(21) * 15),
      awayScore: 52 + Math.floor(random(22) * 10),
      status: 'live',
    },
    // Game 3: Early competitive game
    {
      homeTeamName: 'Philadelphia 76ers',
      awayTeamName: 'Denver Nuggets',
      quarter: 2,
      clockSeconds: Math.floor(random(3) * 720),
      homeScore: 28 + Math.floor(random(31) * 15),
      awayScore: 30 + Math.floor(random(32) * 15),
      status: 'live',
    },
    // Game 4: Completed game (varies final score)
    {
      homeTeamName: 'Phoenix Suns',
      awayTeamName: 'Miami Heat',
      quarter: 4,
      clockSeconds: 0,
      homeScore: 105 + Math.floor(random(41) * 15),
      awayScore: 108 + Math.floor(random(42) * 12),
      status: 'completed',
    },
    // Game 5: Scheduled for later
    {
      homeTeamName: 'Boston Celtics',
      awayTeamName: 'Denver Nuggets',
      quarter: 0,
      clockSeconds: 720,
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
    },
  ]
}

export default async function handler(req: Request, context: Context) {
  const startTime = Date.now()

  // Initialize database connection
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not configured')
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql)

  try {
    // Generate dummy game states
    const dummyGames = generateDummyGames()
    let gamesProcessed = 0
    let snapshotsWritten = 0

    // Fetch all NBA teams from database
    const nbaTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.league, 'NBA'))

    const teamsByName = new Map(nbaTeams.map((t) => [t.name, t]))

    for (const gameState of dummyGames) {
      // Look up teams
      const homeTeam = teamsByName.get(gameState.homeTeamName)
      const awayTeam = teamsByName.get(gameState.awayTeamName)

      if (!homeTeam || !awayTeam) {
        console.log(`Skipping game: team not found (${gameState.homeTeamName} vs ${gameState.awayTeamName})`)
        continue
      }

      // Find or skip game (we only process existing games)
      const existingGames = await db
        .select()
        .from(games)
        .where(eq(games.homeTeamId, homeTeam.id))
        .limit(1)

      if (existingGames.length === 0) {
        console.log(`Skipping game: no matching game record for ${homeTeam.name}`)
        continue
      }

      const game = existingGames[0]
      gamesProcessed++

      // Skip scheduled games (no snapshot needed)
      if (gameState.status === 'scheduled') {
        continue
      }

      // Derive spoiler-safe signals
      const scoreDiff = gameState.homeScore - gameState.awayScore
      const stage = getStage(gameState.quarter, gameState.clockSeconds)
      const competitive = isCompetitive(scoreDiff, stage)
      const activityLevel = getActivityLevel(
        gameState.homeScore,
        gameState.awayScore,
        gameState.quarter,
        gameState.clockSeconds
      )
      const tensionScore = calculateTensionScore(scoreDiff, stage, competitive)

      // Determine if this is a final snapshot
      const isFinal = gameState.status === 'completed'

      // Write snapshot (insert only, no updates)
      await db.insert(gameStateSnapshots).values({
        gameId: game.id,
        capturedAt: new Date(),
        tensionScore,
        momentumShifts: Math.floor(Math.abs(scoreDiff) / 5), // Rough estimate
        leadChanges: competitive ? Math.floor(tensionScore / 20) : 0,
        closeFinish: isFinal && Math.abs(scoreDiff) <= 5,
        isFinal,
        stage,
        competitive,
        activityLevel,
        homeScore: gameState.homeScore,
        awayScore: gameState.awayScore,
      })

      snapshotsWritten++
    }

    const duration = Date.now() - startTime

    // Log summary
    console.log(`NBA Ingestion Complete:`)
    console.log(`  Games processed: ${gamesProcessed}`)
    console.log(`  Snapshots written: ${snapshotsWritten}`)
    console.log(`  Duration: ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        gamesProcessed,
        snapshotsWritten,
        durationMs: duration,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('NBA Ingestion Error:', error)
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

// No schedule - this is a manual/test function only
// Use ingest-odds.ts for production scheduled ingestion
