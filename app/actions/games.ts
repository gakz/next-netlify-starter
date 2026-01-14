'use server'

import type { GameWithDetails } from '@/db/queries'
import type { Priority, GameStatus } from '@/app/components/GameCard'

// Re-export types for client use
export type { GameWithDetails }

// Check if database is configured
function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
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
    const { getMockUser, getUserFavoriteTeams } = await import('@/db/queries')
    const user = await getMockUser()
    if (!user) return []
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
 * Toggle a team as favorite
 */
export async function toggleFavoriteTeam(teamId: string, isFavorite: boolean): Promise<void> {
  if (!isDatabaseConfigured()) {
    return // No-op when database not configured
  }

  try {
    const { getMockUser, addFavoriteTeam, removeFavoriteTeam } = await import('@/db/queries')
    const user = await getMockUser()
    if (!user) return

    if (isFavorite) {
      await removeFavoriteTeam(user.id, teamId)
    } else {
      await addFavoriteTeam(user.id, teamId)
    }
  } catch (error) {
    console.error('Failed to toggle favorite team:', error)
  }
}

// Mock data fallback
function getMockGames(): GameWithDetails[] {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  return [
    // Upcoming
    { id: 'u1', awayTeam: 'Boston Celtics', homeTeam: 'Philadelphia 76ers', status: 'upcoming' as GameStatus, priority: 'high' as Priority, scheduledTime: tomorrow, completedAt: null },
    { id: 'u2', awayTeam: 'Los Angeles Dodgers', homeTeam: 'San Francisco Giants', status: 'upcoming' as GameStatus, priority: 'medium' as Priority, scheduledTime: tomorrow, completedAt: null },
    // Live
    { id: 'l1', awayTeam: 'New York Yankees', homeTeam: 'Toronto Blue Jays', status: 'live' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: null },
    { id: 'l2', awayTeam: 'Denver Nuggets', homeTeam: 'Phoenix Suns', status: 'live' as GameStatus, priority: 'medium' as Priority, scheduledTime: now, completedAt: null },
    // Completed - today
    { id: 'c1', awayTeam: 'Boston Celtics', homeTeam: 'Miami Heat', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: now, completedAt: now },
    { id: 'c2', awayTeam: 'Los Angeles Lakers', homeTeam: 'Golden State Warriors', status: 'completed' as GameStatus, priority: 'medium' as Priority, scheduledTime: now, completedAt: now },
    // Completed - yesterday
    { id: 'c3', awayTeam: 'New York Yankees', homeTeam: 'Boston Red Sox', status: 'completed' as GameStatus, priority: 'high' as Priority, scheduledTime: yesterday, completedAt: yesterday },
    { id: 'c4', awayTeam: 'Philadelphia 76ers', homeTeam: 'Miami Heat', status: 'completed' as GameStatus, priority: 'low' as Priority, scheduledTime: yesterday, completedAt: yesterday },
    // Completed - 2 days ago
    { id: 'c5', awayTeam: 'San Francisco Giants', homeTeam: 'Los Angeles Dodgers', status: 'completed' as GameStatus, priority: 'low' as Priority, scheduledTime: twoDaysAgo, completedAt: twoDaysAgo },
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
