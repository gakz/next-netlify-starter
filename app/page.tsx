import { fetchGames, fetchFavoriteTeams } from './actions/games'
import GameList from './components/GameList'
import { getCurrentUser, ensureUserInDatabase } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getCurrentUser()

  // Ensure user exists in our database on first visit
  await ensureUserInDatabase(user.id, user.primaryEmail || '')

  const [games, favoriteTeams] = await Promise.all([
    fetchGames(),
    fetchFavoriteTeams(),
  ])

  return <GameList initialGames={games} initialFavorites={favoriteTeams} />
}
