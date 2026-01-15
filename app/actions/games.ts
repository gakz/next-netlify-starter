'use server'

import type { GameWithDetails } from '@/db/queries'
import type { Priority, GameStatus } from '@/app/components/GameCard'
import { getCurrentUserOrNull, ensureUserInDatabase } from '@/lib/auth'

// Check if database is configured
function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUserOrNull()
  return !!user
}

/**
 * Get all games from database or fall back to mock data
 */
export async function fetchGames(): Promise<GameWithDetails[]> {
  if (!isDatabaseConfigured()) {
    // Return mock data when database is not configured
    return getMockGames()
  }

  try {
    const { getGames } = await import('@/db/queries')
    return await getGames()
  } catch (error) {
    console.error('Failed to fetch games from database:', error)
    return getMockGames()
  }
}

/**
 * Get user's favorite team names
 */
export async function fetchFavoriteTeams(): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return ['Boston Celtics', 'New York Yankees', 'Kansas City Chiefs']
  }

  try {
    const user = await getCurrentUserOrNull()
    if (!user) return []

    const { getUserFavoriteTeams } = await import('@/db/queries')
    return await getUserFavoriteTeams(user.id)
  } catch (error) {
    console.error('Failed to fetch favorite teams:', error)
    return []
  }
}

/**
 * Get all available teams
 */
export async function fetchAllTeams(): Promise<{ id: string; name: string; league: string }[]> {
  if (!isDatabaseConfigured()) {
    return getMockTeams()
  }

  try {
    const { getAllTeams } = await import('@/db/queries')
    return await getAllTeams()
  } catch (error) {
    console.error('Failed to fetch teams:', error)
    return getMockTeams()
  }
}

/**
 * Toggle a team as favorite (requires authentication)
 */
export async function toggleFavoriteTeam(teamId: string, isFavorite: boolean): Promise<{ success: boolean; requiresAuth?: boolean }> {
  if (!isDatabaseConfigured()) {
    return { success: false }
  }

  try {
    const user = await getCurrentUserOrNull()
    if (!user) {
      return { success: false, requiresAuth: true }
    }

    // Ensure user exists in our database
    await ensureUserInDatabase(user.id, user.email || '')

    const { addFavoriteTeam, removeFavoriteTeam } = await import('@/db/queries')

    if (isFavorite) {
      await removeFavoriteTeam(user.id, teamId)
    } else {
      await addFavoriteTeam(user.id, teamId)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to toggle favorite team:', error)
    return { success: false }
  }
}

// Mock team records
const mockTeamRecords: Record<string, { wins: number; losses: number }> = {
  'Boston Celtics': { wins: 45, losses: 12 },
  'Philadelphia 76ers': { wins: 38, losses: 19 },
  'Miami Heat': { wins: 32, losses: 25 },
  'Denver Nuggets': { wins: 42, losses: 15 },
  'Phoenix Suns': { wins: 35, losses: 22 },
  'Los Angeles Lakers': { wins: 30, losses: 27 },
  'Golden State Warriors': { wins: 28, losses: 29 },
  'New York Yankees': { wins: 70, losses: 45 },
  'Toronto Blue Jays': { wins: 65, losses: 50 },
  'Boston Red Sox': { wins: 55, losses: 60 },
  'Los Angeles Dodgers': { wins: 75, losses: 40 },
  'San Francisco Giants': { wins: 60, losses: 55 },
  // NFL teams
  'Kansas City Chiefs': { wins: 11, losses: 1 },
  'Buffalo Bills': { wins: 10, losses: 2 },
  'Philadelphia Eagles': { wins: 10, losses: 2 },
  'Dallas Cowboys': { wins: 8, losses: 4 },
  'San Francisco 49ers': { wins: 9, losses: 3 },
  'Detroit Lions': { wins: 9, losses: 3 },
  'Miami Dolphins': { wins: 8, losses: 4 },
}

function getMockRecord(teamName: string): { wins: number; losses: number } | null {
  return mockTeamRecords[teamName] ?? null
}

// Mock data fallback
function getMockGames(): GameWithDetails[] {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const in6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  return [
    // NBA - Upcoming - spread + records: Two top teams (Celtics vs 76ers) - close game expected
    { id: 'u1', awayTeam: 'Boston Celtics', homeTeam: 'Philadelphia 76ers', league: 'NBA', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -2.5, totalValue: 218.5, awayTeamRecord: getMockRecord('Boston Celtics'), homeTeamRecord: getMockRecord('Philadelphia 76ers') },
    // MLB - Upcoming - close spread, competitive records
    { id: 'u2', awayTeam: 'Los Angeles Dodgers', homeTeam: 'San Francisco Giants', league: 'MLB', status: 'upcoming' as GameStatus, priority: 'medium' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -1.5, totalValue: 8.5, awayTeamRecord: getMockRecord('Los Angeles Dodgers'), homeTeamRecord: getMockRecord('San Francisco Giants') },
    // NBA - Upcoming - large spread, mismatch (Heat vs dominant Nuggets)
    { id: 'u3', awayTeam: 'Miami Heat', homeTeam: 'Denver Nuggets', league: 'NBA', status: 'upcoming' as GameStatus, priority: 'low' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -9.5, totalValue: 215.0, awayTeamRecord: getMockRecord('Miami Heat'), homeTeamRecord: getMockRecord('Denver Nuggets') },
    // NFL - Upcoming - Thursday Night Football
    { id: 'u4', awayTeam: 'Kansas City Chiefs', homeTeam: 'Buffalo Bills', league: 'NFL', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -1.5, totalValue: 48.5, awayTeamRecord: getMockRecord('Kansas City Chiefs'), homeTeamRecord: getMockRecord('Buffalo Bills') },
    // NFL - Upcoming - Sunday games (multiple)
    { id: 'u5', awayTeam: 'San Francisco 49ers', homeTeam: 'Philadelphia Eagles', league: 'NFL', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: in3Days, completedAt: null, homeScore: null, awayScore: null, spread: -3.0, totalValue: 47.5, awayTeamRecord: getMockRecord('San Francisco 49ers'), homeTeamRecord: getMockRecord('Philadelphia Eagles') },
    { id: 'u6', awayTeam: 'Detroit Lions', homeTeam: 'Dallas Cowboys', league: 'NFL', status: 'upcoming' as GameStatus, priority: 'medium' as Priority, scheduledTime: in3Days, completedAt: null, homeScore: null, awayScore: null, spread: -2.5, totalValue: 51.0, awayTeamRecord: getMockRecord('Detroit Lions'), homeTeamRecord: getMockRecord('Dallas Cowboys') },
    { id: 'u7', awayTeam: 'Buffalo Bills', homeTeam: 'Miami Dolphins', league: 'NFL', status: 'upcoming' as GameStatus, priority: 'medium' as Priority, scheduledTime: in3Days, completedAt: null, homeScore: null, awayScore: null, spread: -4.5, totalValue: 49.0, awayTeamRecord: getMockRecord('Buffalo Bills'), homeTeamRecord: getMockRecord('Miami Dolphins') },
    // NFL - Upcoming - Sunday Night Football
    { id: 'u8', awayTeam: 'Kansas City Chiefs', homeTeam: 'San Francisco 49ers', league: 'NFL', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: in5Days, completedAt: null, homeScore: null, awayScore: null, spread: -1.0, totalValue: 46.5, awayTeamRecord: getMockRecord('Kansas City Chiefs'), homeTeamRecord: getMockRecord('San Francisco 49ers') },
    // NFL - Upcoming - Monday Night Football
    { id: 'u9', awayTeam: 'Philadelphia Eagles', homeTeam: 'Detroit Lions', league: 'NFL', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: in6Days, completedAt: null, homeScore: null, awayScore: null, spread: -2.0, totalValue: 50.5, awayTeamRecord: getMockRecord('Philadelphia Eagles'), homeTeamRecord: getMockRecord('Detroit Lions') },
    // MLB - Live
    { id: 'l1', awayTeam: 'New York Yankees', homeTeam: 'Toronto Blue Jays', league: 'MLB', status: 'live' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: null, homeScore: 3, awayScore: 5, spread: null, totalValue: null, awayTeamRecord: getMockRecord('New York Yankees'), homeTeamRecord: getMockRecord('Toronto Blue Jays') },
    // NBA - Live
    { id: 'l2', awayTeam: 'Denver Nuggets', homeTeam: 'Phoenix Suns', league: 'NBA', status: 'live' as GameStatus, priority: 'medium' as Priority, scheduledTime: now, completedAt: null, homeScore: 87, awayScore: 92, spread: null, totalValue: null, awayTeamRecord: getMockRecord('Denver Nuggets'), homeTeamRecord: getMockRecord('Phoenix Suns') },
    // NFL - Live
    { id: 'l3', awayTeam: 'Philadelphia Eagles', homeTeam: 'Dallas Cowboys', league: 'NFL', status: 'live' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: null, homeScore: 21, awayScore: 24, spread: null, totalValue: null, awayTeamRecord: getMockRecord('Philadelphia Eagles'), homeTeamRecord: getMockRecord('Dallas Cowboys') },
    // NBA - Completed - today
    { id: 'c1', awayTeam: 'Boston Celtics', homeTeam: 'Miami Heat', league: 'NBA', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: now, homeScore: 98, awayScore: 102, spread: null, totalValue: null, awayTeamRecord: getMockRecord('Boston Celtics'), homeTeamRecord: getMockRecord('Miami Heat') },
    { id: 'c2', awayTeam: 'Los Angeles Lakers', homeTeam: 'Golden State Warriors', league: 'NBA', status: 'completed' as GameStatus, priority: 'medium' as Priority, scheduledTime: now, completedAt: now, homeScore: 115, awayScore: 108, spread: null, totalValue: null, awayTeamRecord: getMockRecord('Los Angeles Lakers'), homeTeamRecord: getMockRecord('Golden State Warriors') },
    // MLB - Completed - yesterday
    { id: 'c3', awayTeam: 'New York Yankees', homeTeam: 'Boston Red Sox', league: 'MLB', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: yesterday, completedAt: yesterday, homeScore: 4, awayScore: 7, spread: null, totalValue: null, awayTeamRecord: getMockRecord('New York Yankees'), homeTeamRecord: getMockRecord('Boston Red Sox') },
    // NBA - Completed - yesterday
    { id: 'c4', awayTeam: 'Philadelphia 76ers', homeTeam: 'Miami Heat', league: 'NBA', status: 'completed' as GameStatus, priority: 'low' as Priority, scheduledTime: yesterday, completedAt: yesterday, homeScore: 110, awayScore: 95, spread: null, totalValue: null, awayTeamRecord: getMockRecord('Philadelphia 76ers'), homeTeamRecord: getMockRecord('Miami Heat') },
    // NFL - Completed - yesterday
    { id: 'c5', awayTeam: 'San Francisco 49ers', homeTeam: 'Detroit Lions', league: 'NFL', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: yesterday, completedAt: yesterday, homeScore: 31, awayScore: 34, spread: null, totalValue: null, awayTeamRecord: getMockRecord('San Francisco 49ers'), homeTeamRecord: getMockRecord('Detroit Lions') },
    // MLB - Completed - 2 days ago
    { id: 'c6', awayTeam: 'San Francisco Giants', homeTeam: 'Los Angeles Dodgers', league: 'MLB', status: 'completed' as GameStatus, priority: 'low' as Priority, scheduledTime: twoDaysAgo, completedAt: twoDaysAgo, homeScore: 6, awayScore: 3, spread: null, totalValue: null, awayTeamRecord: getMockRecord('San Francisco Giants'), homeTeamRecord: getMockRecord('Los Angeles Dodgers') },
    // NFL - Completed - 2 days ago
    { id: 'c7', awayTeam: 'Miami Dolphins', homeTeam: 'Buffalo Bills', league: 'NFL', status: 'completed' as GameStatus, priority: 'medium' as Priority, scheduledTime: twoDaysAgo, completedAt: twoDaysAgo, homeScore: 28, awayScore: 20, spread: null, totalValue: null, awayTeamRecord: getMockRecord('Miami Dolphins'), homeTeamRecord: getMockRecord('Buffalo Bills') },
  ]
}

function getMockTeams(): { id: string; name: string; league: string }[] {
  return [
    { id: 't1', name: 'Boston Celtics', league: 'NBA' },
    { id: 't2', name: 'Miami Heat', league: 'NBA' },
    { id: 't3', name: 'Los Angeles Lakers', league: 'NBA' },
    { id: 't4', name: 'Golden State Warriors', league: 'NBA' },
    { id: 't5', name: 'Philadelphia 76ers', league: 'NBA' },
    { id: 't6', name: 'Denver Nuggets', league: 'NBA' },
    { id: 't7', name: 'Phoenix Suns', league: 'NBA' },
    { id: 't8', name: 'New York Yankees', league: 'MLB' },
    { id: 't9', name: 'Boston Red Sox', league: 'MLB' },
    { id: 't10', name: 'Los Angeles Dodgers', league: 'MLB' },
    { id: 't11', name: 'San Francisco Giants', league: 'MLB' },
    { id: 't12', name: 'Toronto Blue Jays', league: 'MLB' },
    { id: 't13', name: 'Kansas City Chiefs', league: 'NFL' },
    { id: 't14', name: 'San Francisco 49ers', league: 'NFL' },
    { id: 't15', name: 'Philadelphia Eagles', league: 'NFL' },
    { id: 't16', name: 'Dallas Cowboys', league: 'NFL' },
    { id: 't17', name: 'Buffalo Bills', league: 'NFL' },
    { id: 't18', name: 'Miami Dolphins', league: 'NFL' },
    { id: 't19', name: 'Detroit Lions', league: 'NFL' },
  ]
}

/**
 * Get the timestamp of the most recent scores update
 */
export async function fetchLastScoresUpdate(): Promise<Date | null> {
  if (!isDatabaseConfigured()) {
    // Return current time as mock data fallback
    return new Date()
  }

  try {
    const { getLastScoresUpdate } = await import('@/db/queries')
    return await getLastScoresUpdate()
  } catch (error) {
    console.error('Failed to fetch last scores update:', error)
    return null
  }
}
