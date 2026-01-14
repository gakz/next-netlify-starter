import type { Event, Bookmaker, Market, NormalizedExpectation } from './types'

/**
 * Normalizes raw odds data from The Odds API into our internal format.
 * Extracts spread and totals markets from the first available bookmaker.
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

/**
 * Extract totals values from a totals market
 */
function extractTotals(market: Market): {
  totalValue: number | null
  totalOverPrice: number | null
  totalUnderPrice: number | null
} {
  const overOutcome = market.outcomes.find((o) => o.name === 'Over')
  const underOutcome = market.outcomes.find((o) => o.name === 'Under')

  return {
    totalValue: overOutcome?.point ?? underOutcome?.point ?? null,
    totalOverPrice: overOutcome?.price ?? null,
    totalUnderPrice: underOutcome?.price ?? null,
  }
}

/**
 * Normalize a single event into our internal format
 */
export function normalizeEvent(event: Event): NormalizedExpectation | null {
  // Find a bookmaker with both spreads and totals
  const bookmaker = findBookmakerWithMarkets(event.bookmakers, [
    'spreads',
    'totals',
  ])

  if (!bookmaker) {
    // Try to get partial data if at least one market is available
    const anyBookmaker = event.bookmakers[0]
    if (!anyBookmaker) {
      return null
    }

    const spreadsMarket = anyBookmaker.markets.find((m) => m.key === 'spreads')
    const totalsMarket = anyBookmaker.markets.find((m) => m.key === 'totals')

    if (!spreadsMarket && !totalsMarket) {
      return null
    }

    const spreads = spreadsMarket
      ? extractSpreads(spreadsMarket, event.home_team)
      : { spreadHome: null, spreadAway: null }
    const totals = totalsMarket
      ? extractTotals(totalsMarket)
      : { totalValue: null, totalOverPrice: null, totalUnderPrice: null }

    return {
      externalEventId: event.id,
      sportKey: event.sport_key,
      commenceTime: new Date(event.commence_time),
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      ...spreads,
      ...totals,
      bookmaker: anyBookmaker.key,
    }
  }

  const spreadsMarket = bookmaker.markets.find((m) => m.key === 'spreads')
  const totalsMarket = bookmaker.markets.find((m) => m.key === 'totals')

  const spreads = spreadsMarket
    ? extractSpreads(spreadsMarket, event.home_team)
    : { spreadHome: null, spreadAway: null }
  const totals = totalsMarket
    ? extractTotals(totalsMarket)
    : { totalValue: null, totalOverPrice: null, totalUnderPrice: null }

  return {
    externalEventId: event.id,
    sportKey: event.sport_key,
    commenceTime: new Date(event.commence_time),
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    ...spreads,
    ...totals,
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
