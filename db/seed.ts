import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import {
  teams,
  games,
  gameStateSnapshots,
  users,
  userTeams,
} from './schema'

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql)

  console.log('Seeding database...')

  // Clear existing data
  await db.delete(userTeams)
  await db.delete(gameStateSnapshots)
  await db.delete(games)
  await db.delete(users)
  await db.delete(teams)

  // Create teams across 2 leagues
  const insertedTeams = await db
    .insert(teams)
    .values([
      // NBA
      { name: 'Boston Celtics', league: 'NBA' },
      { name: 'Miami Heat', league: 'NBA' },
      { name: 'Los Angeles Lakers', league: 'NBA' },
      { name: 'Golden State Warriors', league: 'NBA' },
      { name: 'Philadelphia 76ers', league: 'NBA' },
      { name: 'Denver Nuggets', league: 'NBA' },
      { name: 'Phoenix Suns', league: 'NBA' },
      // MLB
      { name: 'New York Yankees', league: 'MLB' },
      { name: 'Boston Red Sox', league: 'MLB' },
      { name: 'Los Angeles Dodgers', league: 'MLB' },
      { name: 'San Francisco Giants', league: 'MLB' },
      { name: 'Toronto Blue Jays', league: 'MLB' },
      // NFL
      { name: 'Kansas City Chiefs', league: 'NFL' },
      { name: 'San Francisco 49ers', league: 'NFL' },
      { name: 'Philadelphia Eagles', league: 'NFL' },
      { name: 'Dallas Cowboys', league: 'NFL' },
      { name: 'Buffalo Bills', league: 'NFL' },
      { name: 'Miami Dolphins', league: 'NFL' },
      { name: 'Detroit Lions', league: 'NFL' },
    ])
    .returning()

  console.log(`Created ${insertedTeams.length} teams`)

  // Helper to find team by name
  const findTeam = (name: string) => {
    const team = insertedTeams.find((t) => t.name === name)
    if (!team) throw new Error(`Team not found: ${name}`)
    return team
  }

  // Create games with various statuses
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const insertedGames = await db
    .insert(games)
    .values([
      // Upcoming games
      {
        awayTeamId: findTeam('Boston Celtics').id,
        homeTeamId: findTeam('Philadelphia 76ers').id,
        status: 'upcoming',
        scheduledTime: tomorrow,
      },
      {
        awayTeamId: findTeam('Los Angeles Dodgers').id,
        homeTeamId: findTeam('San Francisco Giants').id,
        status: 'upcoming',
        scheduledTime: tomorrow,
      },
      // Live games
      {
        awayTeamId: findTeam('New York Yankees').id,
        homeTeamId: findTeam('Toronto Blue Jays').id,
        status: 'live',
        scheduledTime: now,
      },
      {
        awayTeamId: findTeam('Denver Nuggets').id,
        homeTeamId: findTeam('Phoenix Suns').id,
        status: 'live',
        scheduledTime: now,
      },
      // Completed games - today
      {
        awayTeamId: findTeam('Boston Celtics').id,
        homeTeamId: findTeam('Miami Heat').id,
        status: 'completed',
        scheduledTime: now,
        completedAt: now,
      },
      {
        awayTeamId: findTeam('Los Angeles Lakers').id,
        homeTeamId: findTeam('Golden State Warriors').id,
        status: 'completed',
        scheduledTime: now,
        completedAt: now,
      },
      // Completed games - yesterday
      {
        awayTeamId: findTeam('New York Yankees').id,
        homeTeamId: findTeam('Boston Red Sox').id,
        status: 'completed',
        scheduledTime: yesterday,
        completedAt: yesterday,
      },
      {
        awayTeamId: findTeam('Philadelphia 76ers').id,
        homeTeamId: findTeam('Miami Heat').id,
        status: 'completed',
        scheduledTime: yesterday,
        completedAt: yesterday,
      },
      // Completed games - 2 days ago
      {
        awayTeamId: findTeam('San Francisco Giants').id,
        homeTeamId: findTeam('Los Angeles Dodgers').id,
        status: 'completed',
        scheduledTime: twoDaysAgo,
        completedAt: twoDaysAgo,
      },
      // NFL - Upcoming games
      {
        awayTeamId: findTeam('Kansas City Chiefs').id,
        homeTeamId: findTeam('Buffalo Bills').id,
        status: 'upcoming',
        scheduledTime: tomorrow,
      },
      // NFL - Live games
      {
        awayTeamId: findTeam('Philadelphia Eagles').id,
        homeTeamId: findTeam('Dallas Cowboys').id,
        status: 'live',
        scheduledTime: now,
      },
      // NFL - Completed games
      {
        awayTeamId: findTeam('San Francisco 49ers').id,
        homeTeamId: findTeam('Detroit Lions').id,
        status: 'completed',
        scheduledTime: yesterday,
        completedAt: yesterday,
      },
      {
        awayTeamId: findTeam('Miami Dolphins').id,
        homeTeamId: findTeam('Buffalo Bills').id,
        status: 'completed',
        scheduledTime: twoDaysAgo,
        completedAt: twoDaysAgo,
      },
    ])
    .returning()

  console.log(`Created ${insertedGames.length} games`)

  // Create game state snapshots with varying metrics
  // These metrics determine priority at render time
  const snapshotData = [
    // Upcoming games - predictions
    { gameIndex: 0, tensionScore: 75, momentumShifts: 0, leadChanges: 0, closeFinish: false, isFinal: false },
    { gameIndex: 1, tensionScore: 60, momentumShifts: 0, leadChanges: 0, closeFinish: false, isFinal: false },
    // Live games - in-progress metrics
    { gameIndex: 2, tensionScore: 80, momentumShifts: 4, leadChanges: 3, closeFinish: false, isFinal: false },
    { gameIndex: 3, tensionScore: 45, momentumShifts: 1, leadChanges: 1, closeFinish: false, isFinal: false },
    // Completed games - final metrics
    { gameIndex: 4, tensionScore: 85, momentumShifts: 5, leadChanges: 4, closeFinish: true, isFinal: true }, // High
    { gameIndex: 5, tensionScore: 50, momentumShifts: 2, leadChanges: 2, closeFinish: false, isFinal: true }, // Medium
    { gameIndex: 6, tensionScore: 90, momentumShifts: 6, leadChanges: 5, closeFinish: true, isFinal: true }, // High
    { gameIndex: 7, tensionScore: 25, momentumShifts: 1, leadChanges: 0, closeFinish: false, isFinal: true }, // Low
    { gameIndex: 8, tensionScore: 20, momentumShifts: 0, leadChanges: 0, closeFinish: false, isFinal: true }, // Low
    // NFL games
    { gameIndex: 9, tensionScore: 70, momentumShifts: 0, leadChanges: 0, closeFinish: false, isFinal: false }, // Upcoming - Chiefs vs Bills
    { gameIndex: 10, tensionScore: 85, momentumShifts: 3, leadChanges: 2, closeFinish: false, isFinal: false }, // Live - Eagles vs Cowboys
    { gameIndex: 11, tensionScore: 95, momentumShifts: 5, leadChanges: 4, closeFinish: true, isFinal: true }, // Completed - High - 49ers vs Lions
    { gameIndex: 12, tensionScore: 40, momentumShifts: 1, leadChanges: 1, closeFinish: false, isFinal: true }, // Completed - Medium - Dolphins vs Bills
  ]

  // Add multiple snapshots for live games to simulate progression
  const liveGameExtraSnapshots = [
    // Earlier snapshots for first live game
    { gameIndex: 2, tensionScore: 60, momentumShifts: 2, leadChanges: 1, closeFinish: false, isFinal: false, offsetMinutes: -30 },
    { gameIndex: 2, tensionScore: 70, momentumShifts: 3, leadChanges: 2, closeFinish: false, isFinal: false, offsetMinutes: -15 },
  ]

  const allSnapshots = [
    ...snapshotData.map((s) => ({
      gameId: insertedGames[s.gameIndex].id,
      tensionScore: s.tensionScore,
      momentumShifts: s.momentumShifts,
      leadChanges: s.leadChanges,
      closeFinish: s.closeFinish,
      isFinal: s.isFinal,
      capturedAt: now,
    })),
    ...liveGameExtraSnapshots.map((s) => ({
      gameId: insertedGames[s.gameIndex].id,
      tensionScore: s.tensionScore,
      momentumShifts: s.momentumShifts,
      leadChanges: s.leadChanges,
      closeFinish: s.closeFinish,
      isFinal: s.isFinal,
      capturedAt: new Date(now.getTime() + s.offsetMinutes * 60 * 1000),
    })),
  ]

  const insertedSnapshots = await db
    .insert(gameStateSnapshots)
    .values(allSnapshots)
    .returning()

  console.log(`Created ${insertedSnapshots.length} game state snapshots`)

  // Note: Users are now created by Neon Auth on first login
  // User data is synced to our users table automatically

  console.log('Seeding complete!')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
