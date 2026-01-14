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

function filterCompletedByDay(games: Game[], filter: DayFilter): Game[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)

  return games.filter((game) => {
    if (game.status !== 'completed' || !game.completedAt) return false
    const completedAt = new Date(game.completedAt)

    switch (filter) {
      case 'today':
        return completedAt >= startOfToday
      case 'yesterday':
        return completedAt >= startOfYesterday && completedAt < startOfToday
      case 'last-7-days':
        return completedAt >= startOfWeek
      default:
        return true
    }
  })
}

export default function GameList({ initialGames, initialFavorites }: GameListProps) {
  const [selectedFilter, setSelectedFilter] = useState<DayFilter>('last-7-days')

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
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">SpoilSport</h1>
            <Link
              href="/settings"
              className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
            >
              Settings
            </Link>
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
      <main className="max-w-2xl mx-auto px-4 py-6">
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
                    <GameCard key={game.id} game={game} isFavorite />
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
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Fixed Footer Navigation - Mobile only */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 sm:hidden dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <DayFilterNav
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        </div>
      </footer>
    </div>
  )
}
