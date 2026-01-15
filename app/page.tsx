import { fetchGames, fetchFavoriteTeams, fetchLastScoresUpdate } from './actions/games'
import GameList from './components/GameList'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [games, favoriteTeams, lastScoresUpdate] = await Promise.all([
    fetchGames(),
    fetchFavoriteTeams(),
    fetchLastScoresUpdate(),
  ])

  return (
    <GameList
      initialGames={games}
      initialFavorites={favoriteTeams}
      lastScoresUpdate={lastScoresUpdate}
    />
  )
}
