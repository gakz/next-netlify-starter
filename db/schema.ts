import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  primaryKey,
  text,
  doublePrecision,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { usersSync } from 'drizzle-orm/neon'

// Re-export usersSync for queries
export { usersSync }

// Teams table
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  league: varchar('league', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Games table
export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  awayTeamId: uuid('away_team_id')
    .notNull()
    .references(() => teams.id),
  homeTeamId: uuid('home_team_id')
    .notNull()
    .references(() => teams.id),
  status: varchar('status', { length: 20 }).notNull().default('upcoming'), // upcoming, live, completed
  scheduledTime: timestamp('scheduled_time'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Game state snapshots - captures metrics at a point in time
// Used to derive watchability/priority at render time
export const gameStateSnapshots = pgTable('game_state_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameId: uuid('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  // Metrics used to derive priority (no labels stored)
  tensionScore: integer('tension_score').notNull().default(0), // 0-100
  momentumShifts: integer('momentum_shifts').notNull().default(0),
  leadChanges: integer('lead_changes').notNull().default(0),
  closeFinish: boolean('close_finish').notNull().default(false),
  // Whether this is the final/latest snapshot
  isFinal: boolean('is_final').notNull().default(false),
  // NBA-specific fields (populated by ingestion function)
  stage: varchar('stage', { length: 20 }), // early, mid, late
  competitive: boolean('competitive'),
  activityLevel: varchar('activity_level', { length: 20 }), // low, medium, high
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
})

// Game expectations - betting odds data for internal heuristics
// NOT for public display - used only for watchability predictions
export const gameExpectations = pgTable('game_expectations', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }),
  sportKey: varchar('sport_key', { length: 100 }).notNull(), // e.g., 'basketball_nba'
  externalEventId: varchar('external_event_id', { length: 255 }), // The Odds API event ID
  commenceTime: timestamp('commence_time'),
  homeTeam: varchar('home_team', { length: 255 }),
  awayTeam: varchar('away_team', { length: 255 }),
  // Spread data
  spreadHome: doublePrecision('spread_home'), // e.g., -4.5
  spreadAway: doublePrecision('spread_away'), // e.g., +4.5
  // Totals data
  totalValue: doublePrecision('total_value'), // e.g., 224.5
  totalOverPrice: doublePrecision('total_over_price'), // decimal odds
  totalUnderPrice: doublePrecision('total_under_price'), // decimal odds
  // Metadata
  source: varchar('source', { length: 100 }).notNull().default('the-odds-api'),
  bookmaker: varchar('bookmaker', { length: 100 }), // which bookmaker the odds came from
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
})

// Users table - synced from Neon Auth on first login
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Neon Auth user ID
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// User favorite teams (many-to-many)
export const userTeams = pgTable(
  'user_teams',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.teamId] })]
)

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  homeGames: many(games, { relationName: 'homeTeam' }),
  awayGames: many(games, { relationName: 'awayTeam' }),
  userTeams: many(userTeams),
}))

export const gamesRelations = relations(games, ({ one, many }) => ({
  awayTeam: one(teams, {
    fields: [games.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  homeTeam: one(teams, {
    fields: [games.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  snapshots: many(gameStateSnapshots),
}))

export const gameStateSnapshotsRelations = relations(gameStateSnapshots, ({ one }) => ({
  game: one(games, {
    fields: [gameStateSnapshots.gameId],
    references: [games.id],
  }),
}))

export const gameExpectationsRelations = relations(gameExpectations, ({ one }) => ({
  game: one(games, {
    fields: [gameExpectations.gameId],
    references: [games.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  userTeams: many(userTeams),
}))

export const userTeamsRelations = relations(userTeams, ({ one }) => ({
  user: one(users, {
    fields: [userTeams.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [userTeams.teamId],
    references: [teams.id],
  }),
}))

// Type exports
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type GameStateSnapshot = typeof gameStateSnapshots.$inferSelect
export type NewGameStateSnapshot = typeof gameStateSnapshots.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserTeam = typeof userTeams.$inferSelect
export type NewUserTeam = typeof userTeams.$inferInsert
export type GameExpectation = typeof gameExpectations.$inferSelect
export type NewGameExpectation = typeof gameExpectations.$inferInsert
