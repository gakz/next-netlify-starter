'use client'

import { useState } from 'react'
import Link from 'next/link'
import GameCard from './components/GameCard'
import { useFavorites } from './context/FavoritesContext'
import {
  mockGames,
  filterGamesByDay,
  groupGamesByFavorite,
  type DayFilter,
} from './data/mockGames'

const dayFilterOptions: { value: DayFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7-days', label: 'Last 7 Days' },
]

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

export default function Home() {
  const [selectedFilter, setSelectedFilter] = useState<DayFilter>('last-7-days')
  const { favorites } = useFavorites()
  const filteredGames = filterGamesByDay(mockGames, selectedFilter)
  const { favoriteGames, otherGames } = groupGamesByFavorite(filteredGames, favorites)

  const hasGames = favoriteGames.length > 0 || otherGames.length > 0

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Game Review</h1>
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
      <main className="max-w-2xl mx-auto px-4 py-6">
        {!hasGames ? (
          <div className="text-center py-12">
            <p className="text-stone-500 dark:text-stone-400">No games found for this period.</p>
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
