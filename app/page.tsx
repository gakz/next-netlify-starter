import { fetchGames, fetchFavoriteTeams } from './actions/games'
import GameList from './components/GameList'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [games, favoriteTeams] = await Promise.all([
    fetchGames(),
    fetchFavoriteTeams(),
  ])

  return <GameList initialGames={games} initialFavorites={favoriteTeams} />
}
