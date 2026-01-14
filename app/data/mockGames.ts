import type { Game, Priority } from '../components/GameCard'

// Default favorite teams (used if no localStorage data)
export const defaultFavoriteTeams: string[] = [
  'Boston Celtics',
  'New York Yankees',
  'Green Bay Packers',
]

// All available teams extracted from games
export const allTeams: string[] = [
  'Boston Celtics',
  'Boston Red Sox',
  'Chicago Bears',
  'Denver Nuggets',
  'Golden State Warriors',
  'Green Bay Packers',
  'Liverpool',
  'Los Angeles Dodgers',
  'Los Angeles Lakers',
  'Manchester United',
  'Miami Heat',
  'Montreal Canadiens',
  'New York Yankees',
  'Phoenix Suns',
  'San Francisco Giants',
  'Toronto Maple Leafs',
]

export const mockGames: Game[] = [
  {
    id: '1',
    awayTeam: 'Boston Celtics',
    homeTeam: 'Miami Heat',
    completedDate: 'Today',
    priority: 'high',
  },
  {
    id: '2',
    awayTeam: 'Los Angeles Lakers',
    homeTeam: 'Golden State Warriors',
    completedDate: 'Today',
    priority: 'medium',
  },
  {
    id: '3',
    awayTeam: 'New York Yankees',
    homeTeam: 'Boston Red Sox',
    completedDate: 'Yesterday',
    priority: 'high',
  },
  {
    id: '4',
    awayTeam: 'Manchester United',
    homeTeam: 'Liverpool',
    completedDate: 'Yesterday',
    priority: 'low',
  },
  {
    id: '5',
    awayTeam: 'Denver Nuggets',
    homeTeam: 'Phoenix Suns',
    completedDate: '2 days ago',
    priority: 'medium',
  },
  {
    id: '6',
    awayTeam: 'Chicago Bears',
    homeTeam: 'Green Bay Packers',
    completedDate: '3 days ago',
    priority: 'high',
  },
  {
    id: '7',
    awayTeam: 'San Francisco Giants',
    homeTeam: 'Los Angeles Dodgers',
    completedDate: '5 days ago',
    priority: 'low',
  },
  {
    id: '8',
    awayTeam: 'Toronto Maple Leafs',
    homeTeam: 'Montreal Canadiens',
    completedDate: '6 days ago',
    priority: 'medium',
  },
]

export type DayFilter = 'today' | 'yesterday' | 'last-7-days'

export function filterGamesByDay(games: Game[], filter: DayFilter): Game[] {
  switch (filter) {
    case 'today':
      return games.filter((game) => game.completedDate === 'Today')
    case 'yesterday':
      return games.filter((game) => game.completedDate === 'Yesterday')
    case 'last-7-days':
      return games
    default:
      return games
  }
}

export function isGameFavorite(game: Game, favorites: string[]): boolean {
  return favorites.includes(game.awayTeam) || favorites.includes(game.homeTeam)
}

const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function sortGamesByPriority(games: Game[]): Game[] {
  return [...games].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

export function groupGamesByFavorite(
  games: Game[],
  favorites: string[]
): { favoriteGames: Game[]; otherGames: Game[] } {
  const favoriteGames: Game[] = []
  const otherGames: Game[] = []

  for (const game of games) {
    if (isGameFavorite(game, favorites)) {
      favoriteGames.push(game)
    } else {
      otherGames.push(game)
    }
  }

  return {
    favoriteGames: sortGamesByPriority(favoriteGames),
    otherGames: sortGamesByPriority(otherGames),
  }
}
