'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleFavoriteTeam } from '../actions/games'

interface Team {
  id: string
  name: string
  league: string
}

interface SettingsFormProps {
  teams: Team[]
  initialFavorites: string[]
  isLoggedIn: boolean
}

export default function SettingsForm({ teams, initialFavorites, isLoggedIn }: SettingsFormProps) {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = (team: Team) => {
    if (!isLoggedIn) {
      router.push('/auth/sign-in')
      return
    }

    const isFavorite = favorites.includes(team.name)

    // Optimistic update
    if (isFavorite) {
      setFavorites(favorites.filter((f) => f !== team.name))
    } else {
      setFavorites([...favorites, team.name])
    }

    // Server update
    startTransition(async () => {
      const result = await toggleFavoriteTeam(team.id, isFavorite)
      if (result.requiresAuth) {
        // Revert optimistic update and redirect to login
        if (isFavorite) {
          setFavorites([...favorites, team.name])
        } else {
          setFavorites(favorites.filter((f) => f !== team.name))
        }
        router.push('/auth/sign-in')
      }
    })
  }

  // Group teams by league
  const teamsByLeague = teams.reduce<Record<string, Team[]>>((acc, team) => {
    if (!acc[team.league]) acc[team.league] = []
    acc[team.league].push(team)
    return acc
  }, {})

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
        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-stone-100 border border-stone-200 rounded-lg dark:bg-stone-800 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              <Link href="/auth/sign-in" className="font-medium text-stone-900 hover:underline dark:text-stone-100">
                Sign in
              </Link>{' '}
              to save your favorite teams across devices.
            </p>
          </div>
        )}

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

          <div className="space-y-6">
            {Object.entries(teamsByLeague).map(([league, leagueTeams]) => (
              <div key={league}>
                <h3 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">
                  {league}
                </h3>
                <div className="space-y-1">
                  {leagueTeams.map((team) => {
                    const selected = favorites.includes(team.name)
                    return (
                      <button
                        key={team.id}
                        onClick={() => handleToggle(team)}
                        disabled={isPending}
                        className={`
                          w-full text-left px-4 py-3 rounded-lg border transition-colors
                          ${isPending ? 'opacity-70' : ''}
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
                            {team.name}
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
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-auto dark:border-stone-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-stone-400 text-center dark:text-stone-500">
            {isLoggedIn
              ? 'Your preferences are saved automatically.'
              : 'Sign in to save your preferences.'}
          </p>
        </div>
      </footer>
    </div>
  )
}
