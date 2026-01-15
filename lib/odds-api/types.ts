import { z } from 'zod'

/**
 * Zod schemas for The Odds API v4 responses
 * https://the-odds-api.com/liveapi/guides/v4/
 */

// Sport object from /v4/sports endpoint
export const SportSchema = z.object({
  key: z.string(),
  group: z.string(),
  title: z.string(),
  description: z.string(),
  active: z.boolean(),
  has_outrights: z.boolean(),
})

export const SportsResponseSchema = z.array(SportSchema)

// Outcome within a market
export const OutcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
  point: z.number().optional(), // For spreads and totals
})

// Market (spreads, totals, h2h, etc.)
export const MarketSchema = z.object({
  key: z.string(), // 'spreads', 'totals', 'h2h'
  last_update: z.string().optional(),
  outcomes: z.array(OutcomeSchema),
})

// Bookmaker with their markets
export const BookmakerSchema = z.object({
  key: z.string(),
  title: z.string(),
  last_update: z.string(),
  markets: z.array(MarketSchema),
})

// Event (game) with odds
export const EventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(), // ISO 8601 format
  home_team: z.string(),
  away_team: z.string(),
  bookmakers: z.array(BookmakerSchema),
})

export const OddsResponseSchema = z.array(EventSchema)

// Type exports
export type Sport = z.infer<typeof SportSchema>
export type Outcome = z.infer<typeof OutcomeSchema>
export type Market = z.infer<typeof MarketSchema>
export type Bookmaker = z.infer<typeof BookmakerSchema>
export type Event = z.infer<typeof EventSchema>

// Scores API types
export const ScoreSchema = z.object({
  name: z.string(),
  score: z.string().nullable(),
})

export const ScoreEventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  completed: z.boolean(),
  scores: z.array(ScoreSchema).nullable(),
  last_update: z.string().nullable().optional(),
})

export const ScoresResponseSchema = z.array(ScoreEventSchema)

export type ScoreEvent = z.infer<typeof ScoreEventSchema>

// Internal normalized format for database insertion
export interface NormalizedExpectation {
  externalEventId: string
  sportKey: string
  commenceTime: Date
  homeTeam: string
  awayTeam: string
  spreadHome: number | null
  spreadAway: number | null
  totalValue: number | null
  totalOverPrice: number | null
  totalUnderPrice: number | null
  bookmaker: string | null
}

// Configuration for supported sports
export interface SportConfig {
  key: string
  name: string
  markets: string[]
}

// Supported sports configuration
export const SUPPORTED_SPORTS: SportConfig[] = [
  {
    key: 'basketball_nba',
    name: 'NBA',
    markets: ['spreads', 'totals'],
  },
  // Future sports can be added here:
  // {
  //   key: 'americanfootball_nfl',
  //   name: 'NFL',
  //   markets: ['spreads', 'totals'],
  // },
  // {
  //   key: 'baseball_mlb',
  //   name: 'MLB',
  //   markets: ['spreads', 'totals'],
  // },
]
