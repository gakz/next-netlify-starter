import { fetchAllTeams, fetchFavoriteTeams, isAuthenticated } from '../actions/games'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function Settings() {
  const [teams, favoriteTeams, isLoggedIn] = await Promise.all([
    fetchAllTeams(),
    fetchFavoriteTeams(),
    isAuthenticated(),
  ])

  return <SettingsForm teams={teams} initialFavorites={favoriteTeams} isLoggedIn={isLoggedIn} />
}
