'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { defaultFavoriteTeams } from '../data/mockGames'

const STORAGE_KEY = 'favorite-teams'

interface FavoritesContextType {
  favorites: string[]
  toggleFavorite: (team: string) => void
  isFavorite: (team: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(defaultFavoriteTeams)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch {
        // Invalid JSON, use defaults
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when favorites change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const toggleFavorite = (team: string) => {
    setFavorites((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    )
  }

  const isFavorite = (team: string) => favorites.includes(team)

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
