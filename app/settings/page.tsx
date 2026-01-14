import { fetchAllTeams, fetchFavoriteTeams } from '../actions/games'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function Settings() {
  const [teams, favoriteTeams] = await Promise.all([
    fetchAllTeams(),
    fetchFavoriteTeams(),
  ])

  return <SettingsForm teams={teams} initialFavorites={favoriteTeams} />
}
