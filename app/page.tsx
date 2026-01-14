'use client'

import { useState } from 'react'
import GameCard from './components/GameCard'
import {
  mockGames,
  filterGamesByDay,
  groupGamesByFavorite,
  favoriteTeams,
  type DayFilter,
} from './data/mockGames'

const dayFilterOptions: { value: DayFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7-days', label: 'Last 7 Days' },
]

export default function Home() {
  const [selectedFilter, setSelectedFilter] = useState<DayFilter>('last-7-days')
  const filteredGames = filterGamesByDay(mockGames, selectedFilter)
  const { favoriteGames, otherGames } = groupGamesByFavorite(filteredGames, favoriteTeams)

  const hasGames = favoriteGames.length > 0 || otherGames.length > 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Game Review</h1>

            {/* Spoiler Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-600 dark:text-stone-400">Strict spoiler mode</span>
              <div className="relative">
                <div className="w-10 h-6 bg-stone-400 rounded-full cursor-not-allowed dark:bg-stone-600">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm dark:bg-stone-200" />
                </div>
              </div>
              <span className="text-xs text-stone-500 uppercase tracking-wide dark:text-stone-400">On</span>
            </div>
          </div>

          {/* Day Filter */}
          <nav className="mt-4 flex gap-1" role="tablist">
            {dayFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedFilter(option.value)}
                role="tab"
                aria-selected={selectedFilter === option.value}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedFilter === option.value
                    ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </nav>
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

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-auto dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-stone-400 text-center dark:text-stone-500">
            All games shown are completed. No outcomes revealed.
          </p>
        </div>
      </footer>
    </div>
  )
}
