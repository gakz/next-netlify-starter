import {
  SportsResponseSchema,
  OddsResponseSchema,
  type Sport,
  type Event,
  type SportConfig,
} from './types'

const BASE_URL = 'https://api.the-odds-api.com/v4'

export class OddsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public remainingRequests?: string
  ) {
    super(message)
    this.name = 'OddsAPIError'
  }
}

/**
 * Client for The Odds API v4
 */
export class OddsAPIClient {
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new OddsAPIError('ODDS_API_KEY is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Make a request to The Odds API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<{ data: T; remainingRequests: string | null }> {
    const url = new URL(`${BASE_URL}${endpoint}`)
    url.searchParams.set('apiKey', this.apiKey)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url.toString())

    const remainingRequests = response.headers.get('x-requests-remaining')

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new OddsAPIError(
        `API request failed: ${response.status} - ${errorText}`,
        response.status,
        remainingRequests ?? undefined
      )
    }

    const data = await response.json()

    return { data, remainingRequests }
  }

  /**
   * Fetch all available sports
   */
  async getSports(): Promise<Sport[]> {
    const { data } = await this.request<unknown>('/sports')
    const parsed = SportsResponseSchema.safeParse(data)

    if (!parsed.success) {
      throw new OddsAPIError(
        `Failed to parse sports response: ${parsed.error.message}`
      )
    }

    return parsed.data
  }

  /**
   * Check if a sport is available
   */
  async isSportAvailable(sportKey: string): Promise<boolean> {
    const sports = await this.getSports()
    return sports.some((s) => s.key === sportKey && s.active)
  }

  /**
   * Fetch odds for a specific sport
   */
  async getOdds(config: SportConfig): Promise<{
    events: Event[]
    remainingRequests: string | null
  }> {
    const { data, remainingRequests } = await this.request<unknown>(
      `/sports/${config.key}/odds`,
      {
        regions: 'us',
        markets: config.markets.join(','),
        oddsFormat: 'decimal',
        dateFormat: 'iso',
      }
    )

    const parsed = OddsResponseSchema.safeParse(data)

    if (!parsed.success) {
      throw new OddsAPIError(
        `Failed to parse odds response: ${parsed.error.message}`
      )
    }

    return { events: parsed.data, remainingRequests }
  }
}

/**
 * Create an OddsAPIClient from environment variables
 */
export function createOddsClient(): OddsAPIClient {
  const apiKey = process.env.ODDS_API_KEY

  if (!apiKey) {
    throw new OddsAPIError(
      'ODDS_API_KEY environment variable is not configured'
    )
  }

  return new OddsAPIClient(apiKey)
}
