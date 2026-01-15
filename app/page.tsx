import { fetchGames, fetchFavoriteTeams, fetchLastScoresUpdate, isAuthenticated } from './actions/games'
import GameList from './components/GameList'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [games, favoriteTeams, lastScoresUpdate, isLoggedIn] = await Promise.all([
    fetchGames(),
    fetchFavoriteTeams(),
    fetchLastScoresUpdate(),
    isAuthenticated(),
  ])

  return (
    <GameList
      initialGames={games}
      initialFavorites={favoriteTeams}
      lastScoresUpdate={lastScoresUpdate}
      isLoggedIn={isLoggedIn}
    />
  )
}
