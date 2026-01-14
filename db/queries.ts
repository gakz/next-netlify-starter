import { db } from './index'
import { games, teams, gameStateSnapshots, users, userTeams } from './schema'
import { eq, desc, and, gte } from 'drizzle-orm'
import { derivePriority, getLatestSnapshot, type Priority } from './derive-priority'

export type GameStatus = 'upcoming' | 'live' | 'completed'

export interface GameWithDetails {
  id: string
  awayTeam: string
  homeTeam: string
  status: GameStatus
  priority: Priority
  scheduledTime: Date | null
  completedAt: Date | null
}

/**
 * Get all games with their teams and derived priority
 */
export async function getGames(): Promise<GameWithDetails[]> {
  const results = await db.query.games.findMany({
    with: {
      awayTeam: true,
      homeTeam: true,
      snapshots: true,
    },
    orderBy: [desc(games.createdAt)],
  })

  return results.map((game) => ({
    id: game.id,
    awayTeam: game.awayTeam.name,
    homeTeam: game.homeTeam.name,
    status: game.status as GameStatus,
    priority: derivePriority(getLatestSnapshot(game.snapshots)),
    scheduledTime: game.scheduledTime,
    completedAt: game.completedAt,
  }))
}

/**
 * Get games filtered by status
 */
export async function getGamesByStatus(status: GameStatus): Promise<GameWithDetails[]> {
  const results = await db.query.games.findMany({
    where: eq(games.status, status),
    with: {
      awayTeam: true,
      homeTeam: true,
      snapshots: true,
    },
    orderBy: [desc(games.scheduledTime)],
  })

  return results.map((game) => ({
    id: game.id,
    awayTeam: game.awayTeam.name,
    homeTeam: game.homeTeam.name,
    status: game.status as GameStatus,
    priority: derivePriority(getLatestSnapshot(game.snapshots)),
    scheduledTime: game.scheduledTime,
    completedAt: game.completedAt,
  }))
}

/**
 * Get completed games within a date range
 */
export async function getCompletedGames(since?: Date): Promise<GameWithDetails[]> {
  const whereClause = since
    ? and(eq(games.status, 'completed'), gte(games.completedAt, since))
    : eq(games.status, 'completed')

  const results = await db.query.games.findMany({
    where: whereClause,
    with: {
      awayTeam: true,
      homeTeam: true,
      snapshots: true,
    },
    orderBy: [desc(games.completedAt)],
  })

  return results.map((game) => ({
    id: game.id,
    awayTeam: game.awayTeam.name,
    homeTeam: game.homeTeam.name,
    status: game.status as GameStatus,
    priority: derivePriority(getLatestSnapshot(game.snapshots)),
    scheduledTime: game.scheduledTime,
    completedAt: game.completedAt,
  }))
}

/**
 * Get the mock user (first user in database)
 */
export async function getMockUser() {
  const user = await db.query.users.findFirst({
    with: {
      userTeams: {
        with: {
          team: true,
        },
      },
    },
  })

  return user
}

/**
 * Get favorite team names for a user
 */
export async function getUserFavoriteTeams(userId: string): Promise<string[]> {
  const results = await db.query.userTeams.findMany({
    where: eq(userTeams.userId, userId),
    with: {
      team: true,
    },
  })

  return results.map((ut) => ut.team.name)
}

/**
 * Get all teams
 */
export async function getAllTeams() {
  return db.query.teams.findMany({
    orderBy: [teams.name],
  })
}

/**
 * Add a team to user favorites
 */
export async function addFavoriteTeam(userId: string, teamId: string) {
  await db.insert(userTeams).values({ userId, teamId }).onConflictDoNothing()
}

/**
 * Remove a team from user favorites
 */
export async function removeFavoriteTeam(userId: string, teamId: string) {
  await db
    .delete(userTeams)
    .where(and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId)))
}
