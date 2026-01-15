'use server'

import type { GameWithDetails } from '@/db/queries'
import type { Priority, GameStatus } from '@/app/components/GameCard'
import { getCurrentUserOrNull, ensureUserInDatabase } from '@/lib/auth'

// Re-export types for client use
export type { GameWithDetails }

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
    return ['Boston Celtics', 'New York Yankees', 'Los Angeles Dodgers']
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

// Mock data fallback
function getMockGames(): GameWithDetails[] {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  return [
    // Upcoming - spread: negative = home favorite, close spread = competitive
    { id: 'u1', awayTeam: 'Boston Celtics', homeTeam: 'Philadelphia 76ers', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -2.5, totalValue: 218.5 },
    { id: 'u2', awayTeam: 'Los Angeles Dodgers', homeTeam: 'San Francisco Giants', status: 'upcoming' as GameStatus, priority: 'medium' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -1.5, totalValue: 8.5 },
    { id: 'u3', awayTeam: 'Miami Heat', homeTeam: 'Denver Nuggets', status: 'upcoming' as GameStatus, priority: 'low' as Priority, scheduledTime: tomorrow, completedAt: null, homeScore: null, awayScore: null, spread: -9.5, totalValue: 215.0 },
    // Live
    { id: 'l1', awayTeam: 'New York Yankees', homeTeam: 'Toronto Blue Jays', status: 'live' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: null, homeScore: 3, awayScore: 5, spread: null, totalValue: null },
    { id: 'l2', awayTeam: 'Denver Nuggets', homeTeam: 'Phoenix Suns', status: 'live' as GameStatus, priority: 'medium' as Priority, scheduledTime: now, completedAt: null, homeScore: 87, awayScore: 92, spread: null, totalValue: null },
    // Completed - today
    { id: 'c1', awayTeam: 'Boston Celtics', homeTeam: 'Miami Heat', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: now, homeScore: 98, awayScore: 102, spread: null, totalValue: null },
    { id: 'c2', awayTeam: 'Los Angeles Lakers', homeTeam: 'Golden State Warriors', status: 'completed' as GameStatus, priority: 'medium' as Priority, scheduledTime: now, completedAt: now, homeScore: 115, awayScore: 108, spread: null, totalValue: null },
    // Completed - yesterday
    { id: 'c3', awayTeam: 'New York Yankees', homeTeam: 'Boston Red Sox', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: yesterday, completedAt: yesterday, homeScore: 4, awayScore: 7, spread: null, totalValue: null },
    { id: 'c4', awayTeam: 'Philadelphia 76ers', homeTeam: 'Miami Heat', status: 'completed' as GameStatus, priority: 'low' as Priority, scheduledTime: yesterday, completedAt: yesterday, homeScore: 110, awayScore: 95, spread: null, totalValue: null },
    // Completed - 2 days ago
    { id: 'c5', awayTeam: 'San Francisco Giants', homeTeam: 'Los Angeles Dodgers', status: 'completed' as GameStatus, priority: 'low' as Priority, scheduledTime: twoDaysAgo, completedAt: twoDaysAgo, homeScore: 6, awayScore: 3, spread: null, totalValue: null },
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
