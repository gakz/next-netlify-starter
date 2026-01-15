import type { Metadata } from 'next'
import { fetchAllTeams, fetchFavoriteTeams, isAuthenticated } from '../actions/games'
import SettingsForm from './SettingsForm'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your favorite teams and preferences on SpoilSport.',
}

export const dynamic = 'force-dynamic'

export default async function Settings() {
  const [teams, favoriteTeams, isLoggedIn] = await Promise.all([
    fetchAllTeams(),
    fetchFavoriteTeams(),
    isAuthenticated(),
  ])

  return <SettingsForm teams={teams} initialFavorites={favoriteTeams} isLoggedIn={isLoggedIn} />
}
