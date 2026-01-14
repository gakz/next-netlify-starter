'use client'

import Link from 'next/link'
import { useFavorites } from '../context/FavoritesContext'
import { allTeams } from '../data/mockGames'

export default function Settings() {
  const { isFavorite, toggleFavorite, favorites } = useFavorites()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 dark:bg-stone-800 dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
            >
              &larr; Back
            </Link>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wide">
              Your Teams
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {favorites.length === 0
                ? 'No teams selected'
                : `${favorites.length} team${favorites.length === 1 ? '' : 's'} selected`}
            </p>
          </div>

          <div className="space-y-1">
            {allTeams.map((team) => {
              const selected = isFavorite(team)
              return (
                <button
                  key={team}
                  onClick={() => toggleFavorite(team)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border transition-colors
                    ${
                      selected
                        ? 'border-stone-400 bg-stone-100 dark:border-stone-500 dark:bg-stone-700'
                        : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-750'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        selected
                          ? 'font-medium text-stone-900 dark:text-stone-100'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {team}
                    </span>
                    {selected && (
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        Following
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-auto dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-stone-400 text-center dark:text-stone-500">
            Your preferences are saved locally.
          </p>
        </div>
      </footer>
    </div>
  )
}
