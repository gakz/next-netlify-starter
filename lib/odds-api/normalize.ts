import type { Event, Bookmaker, Market, NormalizedExpectation } from './types'

/**
 * Normalizes raw odds data from The Odds API into our internal format.
 * Extracts spread market from the first available bookmaker.
 * Note: Totals market is no longer fetched to minimize API credit usage.
 */

/**
 * Find the first bookmaker with the specified markets available
 */
function findBookmakerWithMarkets(
  bookmakers: Bookmaker[],
  requiredMarkets: string[]
): Bookmaker | null {
  // Prefer well-known US bookmakers for consistency
  const preferredBookmakers = ['fanduel', 'draftkings', 'betmgm', 'caesars']

  // First try preferred bookmakers
  for (const preferred of preferredBookmakers) {
    const bookmaker = bookmakers.find(
      (b) =>
        b.key === preferred &&
        requiredMarkets.every((market) =>
          b.markets.some((m) => m.key === market)
        )
    )
    if (bookmaker) return bookmaker
  }

  // Fall back to any bookmaker with required markets
  return (
    bookmakers.find((b) =>
      requiredMarkets.every((market) => b.markets.some((m) => m.key === market))
    ) || null
  )
}

/**
 * Extract spread values from a spreads market
 */
function extractSpreads(
  market: Market,
  homeTeam: string
): { spreadHome: number | null; spreadAway: number | null } {
  const homeOutcome = market.outcomes.find((o) => o.name === homeTeam)
  const awayOutcome = market.outcomes.find((o) => o.name !== homeTeam)

  return {
    spreadHome: homeOutcome?.point ?? null,
    spreadAway: awayOutcome?.point ?? null,
  }
}

// Note: extractTotals function was removed as we no longer fetch totals market
// to reduce API credit usage. The totalValue fields are kept in the schema
// for backwards compatibility but will always be null going forward.

/**
 * Normalize a single event into our internal format
 * Note: We only fetch spreads market to minimize API credit usage.
 * totalValue fields are kept for schema compatibility but will always be null.
 */
export function normalizeEvent(event: Event): NormalizedExpectation | null {
  // Find a bookmaker with spreads market (we no longer fetch totals to save API credits)
  const bookmaker = findBookmakerWithMarkets(event.bookmakers, ['spreads'])

  if (!bookmaker) {
    // Try to get spreads from any bookmaker
    const anyBookmaker = event.bookmakers[0]
    if (!anyBookmaker) {
      return null
    }

    const spreadsMarket = anyBookmaker.markets.find((m) => m.key === 'spreads')

    if (!spreadsMarket) {
      return null
    }

    const spreads = extractSpreads(spreadsMarket, event.home_team)

    return {
      externalEventId: event.id,
      sportKey: event.sport_key,
      commenceTime: new Date(event.commence_time),
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      ...spreads,
      // Totals no longer fetched to save API credits
      totalValue: null,
      totalOverPrice: null,
      totalUnderPrice: null,
      bookmaker: anyBookmaker.key,
    }
  }

  const spreadsMarket = bookmaker.markets.find((m) => m.key === 'spreads')

  const spreads = spreadsMarket
    ? extractSpreads(spreadsMarket, event.home_team)
    : { spreadHome: null, spreadAway: null }

  return {
    externalEventId: event.id,
    sportKey: event.sport_key,
    commenceTime: new Date(event.commence_time),
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    ...spreads,
    // Totals no longer fetched to save API credits
    totalValue: null,
    totalOverPrice: null,
    totalUnderPrice: null,
    bookmaker: bookmaker.key,
  }
}

/**
 * Normalize multiple events
 */
export function normalizeEvents(events: Event[]): NormalizedExpectation[] {
  return events
    .map(normalizeEvent)
    .filter((e): e is NormalizedExpectation => e !== null)
}
