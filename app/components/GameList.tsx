'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import GameCard, { type Game, type Priority } from './GameCard'
import { useTheme } from '../ThemeProvider'

type SportFilter = 'all' | 'NBA' | 'NFL'

const sportFilterOptions: { value: SportFilter; label: string }[] = [
  { value: 'all', label: 'All games' },
  { value: 'NBA', label: 'NBA' },
  { value: 'NFL', label: 'NFL' },
]

interface GameListProps {
  initialGames: Game[]
  initialFavorites: string[]
  lastScoresUpdate: Date | null
  isLoggedIn: boolean
}

function SportFilterNav({
  selectedFilter,
  onFilterChange,
  className = '',
}: {
  selectedFilter: SportFilter
  onFilterChange: (filter: SportFilter) => void
  className?: string
}) {
  return (
    <nav className={`flex gap-1 ${className}`} role="tablist" aria-label="Filter by sport">
      {sportFilterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          role="tab"
          aria-selected={selectedFilter === option.value}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selectedFilter === option.value
              ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </nav>
  )
}

const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function sortByPriority(games: Game[]): Game[] {
  return [...games].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

function orderByStatus(games: Game[]): Game[] {
  const completed = sortByPriority(games.filter((g) => g.status === 'completed'))
  const live = sortByPriority(games.filter((g) => g.status === 'live'))
  const upcoming = sortByPriority(games.filter((g) => g.status === 'upcoming'))
  return [...completed, ...live, ...upcoming]
}

function isGameFavorite(game: Game, favorites: string[]): boolean {
  return favorites.includes(game.awayTeam) || favorites.includes(game.homeTeam)
}

type DayBucket = 'yesterday' | 'today' | 'tomorrow' | 'other'

function getGameDayBucket(game: Game): DayBucket {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)

  const gameDate = game.status === 'completed' ? game.completedAt : game.scheduledTime
  if (!gameDate) return 'other'

  const date = new Date(gameDate)
  if (date >= yesterday && date < today) return 'yesterday'
  if (date >= today && date < tomorrow) return 'today'
  if (date >= tomorrow && date < dayAfterTomorrow) return 'tomorrow'
  return 'other'
}

function formatLastUpdated(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export default function GameList({ initialGames, initialFavorites, lastScoresUpdate, isLoggedIn }: GameListProps) {
  const [showScores, setShowScores] = useState(false)
  const [selectedSport, setSelectedSport] = useState<SportFilter>('all')
  const { theme, setTheme } = useTheme()

  const { favoriteGames, favoritePreviousGames, yesterdayGames, todayGames, tomorrowGames } = useMemo(() => {
    // Split into favorites and others (favorites are NOT filtered by sport)
    const allFavorites = initialGames.filter((g) => isGameFavorite(g, initialFavorites))
    const allOthers = initialGames.filter((g) => !isGameFavorite(g, initialFavorites))

    // For logged-in users, find the most recent completed game for each favorite team
    const previousGames: Game[] = []
    if (isLoggedIn && initialFavorites.length > 0) {
      const completedFavorites = allFavorites
        .filter((g) => g.status === 'completed' && g.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

      // Get the most recent completed game for each favorite team
      const seenTeams = new Set<string>()
      for (const game of completedFavorites) {
        const matchingTeams = initialFavorites.filter(
          (team) => game.awayTeam === team || game.homeTeam === team
        )
        for (const team of matchingTeams) {
          if (!seenTeams.has(team)) {
            seenTeams.add(team)
            if (!previousGames.some((g) => g.id === game.id)) {
              previousGames.push(game)
            }
          }
        }
      }
    }

    // Exclude previous games from the main favorites list to avoid duplicates
    const previousGameIds = new Set(previousGames.map((g) => g.id))
    const currentFavorites = allFavorites.filter((g) => !previousGameIds.has(g.id))

    // Apply sport filter only to the Games section
    const sportFilteredOthers = selectedSport === 'all'
      ? allOthers
      : allOthers.filter((g) => g.league === selectedSport)

    // Categorize other games by day
    const yesterday = sortByPriority(sportFilteredOthers.filter((g) => getGameDayBucket(g) === 'yesterday'))
    const today = sortByPriority(sportFilteredOthers.filter((g) => getGameDayBucket(g) === 'today'))
    const tomorrow = sortByPriority(sportFilteredOthers.filter((g) => getGameDayBucket(g) === 'tomorrow'))

    return {
      favoriteGames: orderByStatus(currentFavorites),
      favoritePreviousGames: previousGames,
      yesterdayGames: yesterday,
      todayGames: today,
      tomorrowGames: tomorrow,
    }
  }, [initialGames, initialFavorites, isLoggedIn, selectedSport])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src="/spoilsport-logo.svg" alt="SpoilSport" className="h-5 dark:invert" />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-stone-100 dark:bg-stone-700/50 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-stone-500 dark:text-stone-400">Scores</span>
                <button
                  role="switch"
                  aria-checked={showScores}
                  onClick={() => setShowScores(!showScores)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showScores ? 'bg-stone-600 dark:bg-stone-500' : 'bg-stone-300 dark:bg-stone-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showScores ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <Link
                href={isLoggedIn ? '/settings' : '/auth/sign-in'}
                className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              >
                {isLoggedIn ? 'Settings' : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-8">
              {/* Your Teams Section */}
              {(favoriteGames.length > 0 || favoritePreviousGames.length > 0) && (
                <section>
                  <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
                    Your Teams
                  </h2>
                  <div className="space-y-2">
                    {favoriteGames.map((game) => (
                      <GameCard key={game.id} game={game} favoriteTeams={initialFavorites} showScores={showScores} />
                    ))}
                  </div>

                  {/* Previous Games for favorite teams */}
                  {favoritePreviousGames.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">
                        Last Game
                      </h3>
                      <div className="space-y-2">
                        {favoritePreviousGames.map((game) => (
                          <GameCard key={game.id} game={game} favoriteTeams={initialFavorites} showScores={showScores} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Sign in callout for non-logged in users */}
              {!isLoggedIn && (
                <div className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
                  <p className="text-sm text-stone-600 dark:text-stone-300">
                    <Link
                      href="/auth/sign-in"
                      className="font-medium text-stone-900 dark:text-stone-100 hover:underline"
                    >
                      Sign in
                    </Link>
                    {' '}or{' '}
                    <Link
                      href="/auth/sign-up"
                      className="font-medium text-stone-900 dark:text-stone-100 hover:underline"
                    >
                      create an account
                    </Link>
                    {' '}to save your favorite teams.
                  </p>
                </div>
              )}

              {/* Games Section */}
              <section>
                <SportFilterNav
                  selectedFilter={selectedSport}
                  onFilterChange={setSelectedSport}
                  className="mb-3"
                />

                {(yesterdayGames.length > 0 || todayGames.length > 0 || tomorrowGames.length > 0) ? (
                  <>
                    {yesterdayGames.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">
                          Yesterday
                        </h3>
                        <div className="space-y-2">
                          {yesterdayGames.map((game) => (
                            <GameCard key={game.id} game={game} showScores={showScores} />
                          ))}
                        </div>
                      </div>
                    )}

                    {todayGames.length > 0 && (
                      <div className={yesterdayGames.length > 0 ? 'mt-4' : ''}>
                        <h3 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">
                          Today
                        </h3>
                        <div className="space-y-2">
                          {todayGames.map((game) => (
                            <GameCard key={game.id} game={game} showScores={showScores} />
                          ))}
                        </div>
                      </div>
                    )}

                    {tomorrowGames.length > 0 && (
                      <div className={(yesterdayGames.length > 0 || todayGames.length > 0) ? 'mt-4' : ''}>
                        <h3 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">
                          Tomorrow
                        </h3>
                        <div className="space-y-2">
                          {tomorrowGames.map((game) => (
                            <GameCard key={game.id} game={game} showScores={showScores} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center">
                    No {selectedSport === 'all' ? '' : selectedSport + ' '}games found.
                  </p>
                )}
              </section>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-700 mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Scores last updated:{' '}
            {lastScoresUpdate ? formatLastUpdated(new Date(lastScoresUpdate)) : 'Unknown'}
          </p>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="text-xs bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-600 rounded px-2 py-1 cursor-pointer hover:border-stone-400 dark:hover:border-stone-500"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </footer>
    </div>
  )
}
