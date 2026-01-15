'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import GameCard, { type Game, type Priority } from './GameCard'

type DayFilter = 'today' | 'yesterday' | 'last-7-days'

const dayFilterOptions: { value: DayFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7-days', label: 'Last 7 Days' },
]

interface GameListProps {
  initialGames: Game[]
  initialFavorites: string[]
  lastScoresUpdate: Date | null
}

function DayFilterNav({
  selectedFilter,
  onFilterChange,
  className = '',
}: {
  selectedFilter: DayFilter
  onFilterChange: (filter: DayFilter) => void
  className?: string
}) {
  return (
    <nav className={`flex gap-1 ${className}`} role="tablist">
      {dayFilterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          role="tab"
          aria-selected={selectedFilter === option.value}
          className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedFilter === option.value
              ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100'
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

/**
 * Get the start of day (midnight) in local timezone
 */
function getLocalDateStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Get the calendar day difference between two dates in local timezone
 */
function getCalendarDayDiff(date: Date, reference: Date): number {
  const dateStart = getLocalDateStart(date)
  const refStart = getLocalDateStart(reference)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((dateStart.getTime() - refStart.getTime()) / msPerDay)
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

function filterCompletedByDay(games: Game[], filter: DayFilter): Game[] {
  const now = new Date()

  return games.filter((game) => {
    if (game.status !== 'completed' || !game.completedAt) return false
    const completedAt = new Date(game.completedAt)
    const dayDiff = getCalendarDayDiff(completedAt, now)

    switch (filter) {
      case 'today':
        return dayDiff === 0
      case 'yesterday':
        return dayDiff === -1
      case 'last-7-days':
        return dayDiff >= -7 && dayDiff <= 0
      default:
        return true
    }
  })
}

export default function GameList({ initialGames, initialFavorites, lastScoresUpdate }: GameListProps) {
  const [selectedFilter, setSelectedFilter] = useState<DayFilter>('last-7-days')
  const [showScores, setShowScores] = useState(false)

  const { favoriteGames, otherGames } = useMemo(() => {
    // Get live and upcoming games (not filtered by day)
    const liveGames = initialGames.filter((g) => g.status === 'live')
    const upcomingGames = initialGames.filter((g) => g.status === 'upcoming')

    // Get completed games filtered by day
    const filteredCompletedGames = filterCompletedByDay(initialGames, selectedFilter)

    // Combine all games for display
    const allGamesForDisplay = [...filteredCompletedGames, ...liveGames, ...upcomingGames]

    // Split into favorites and others
    const favorites = allGamesForDisplay.filter((g) => isGameFavorite(g, initialFavorites))
    const others = allGamesForDisplay.filter((g) => !isGameFavorite(g, initialFavorites))

    return {
      favoriteGames: orderByStatus(favorites),
      otherGames: orderByStatus(others),
    }
  }, [initialGames, initialFavorites, selectedFilter])

  const hasGames = favoriteGames.length > 0 || otherGames.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">SpoilSport</h1>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
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
                href="/settings"
                className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Day Filter - Desktop only */}
          <DayFilterNav
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            className="mt-4 hidden sm:flex"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
        {!hasGames ? (
          <div className="text-center py-12">
            <p className="text-stone-500 dark:text-stone-400">No games found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Your Teams Section */}
            {favoriteGames.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Your Teams
                </h2>
                <div className="space-y-2">
                  {favoriteGames.map((game) => (
                    <GameCard key={game.id} game={game} isFavorite showScores={showScores} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Games Section */}
            {otherGames.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Other Games
                </h2>
                <div className="space-y-2">
                  {otherGames.map((game) => (
                    <GameCard key={game.id} game={game} showScores={showScores} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-700 mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Scores last updated:{' '}
            {lastScoresUpdate ? formatLastUpdated(new Date(lastScoresUpdate)) : 'Unknown'}
          </p>
        </div>
      </footer>
    </div>
  )
}
