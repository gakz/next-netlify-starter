import { fetchAllTeams, fetchFavoriteTeams } from '../actions/games'
import SettingsForm from './SettingsForm'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Settings() {
  await getCurrentUser() // Protect route - redirects if not authenticated

  const [teams, favoriteTeams] = await Promise.all([
    fetchAllTeams(),
    fetchFavoriteTeams(),
  ])

  return <SettingsForm teams={teams} initialFavorites={favoriteTeams} />
}
