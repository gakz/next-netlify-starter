import type { Game, Priority, GameStatus } from '../components/GameCard'

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
  // Upcoming games
  {
    id: 'u1',
    awayTeam: 'Boston Celtics',
    homeTeam: 'Philadelphia 76ers',
    status: 'upcoming',
    scheduledTime: 'Tomorrow, 7:30 PM',
  },
  {
    id: 'u2',
    awayTeam: 'Green Bay Packers',
    homeTeam: 'Minnesota Vikings',
    status: 'upcoming',
    scheduledTime: 'Sunday, 1:00 PM',
  },
  {
    id: 'u3',
    awayTeam: 'Los Angeles Dodgers',
    homeTeam: 'San Francisco Giants',
    status: 'upcoming',
    scheduledTime: 'Tomorrow, 9:00 PM',
  },
  // Live games
  {
    id: 'l1',
    awayTeam: 'New York Yankees',
    homeTeam: 'Toronto Blue Jays',
    status: 'live',
  },
  {
    id: 'l2',
    awayTeam: 'Manchester United',
    homeTeam: 'Arsenal',
    status: 'live',
  },
  // Completed games
  {
    id: '1',
    awayTeam: 'Boston Celtics',
    homeTeam: 'Miami Heat',
    status: 'completed',
    completedDate: 'Today',
    priority: 'high',
  },
  {
    id: '2',
    awayTeam: 'Los Angeles Lakers',
    homeTeam: 'Golden State Warriors',
    status: 'completed',
    completedDate: 'Today',
    priority: 'medium',
  },
  {
    id: '3',
    awayTeam: 'New York Yankees',
    homeTeam: 'Boston Red Sox',
    status: 'completed',
    completedDate: 'Yesterday',
    priority: 'high',
  },
  {
    id: '4',
    awayTeam: 'Manchester United',
    homeTeam: 'Liverpool',
    status: 'completed',
    completedDate: 'Yesterday',
    priority: 'low',
  },
  {
    id: '5',
    awayTeam: 'Denver Nuggets',
    homeTeam: 'Phoenix Suns',
    status: 'completed',
    completedDate: '2 days ago',
    priority: 'medium',
  },
  {
    id: '6',
    awayTeam: 'Chicago Bears',
    homeTeam: 'Green Bay Packers',
    status: 'completed',
    completedDate: '3 days ago',
    priority: 'high',
  },
  {
    id: '7',
    awayTeam: 'San Francisco Giants',
    homeTeam: 'Los Angeles Dodgers',
    status: 'completed',
    completedDate: '5 days ago',
    priority: 'low',
  },
  {
    id: '8',
    awayTeam: 'Toronto Maple Leafs',
    homeTeam: 'Montreal Canadiens',
    status: 'completed',
    completedDate: '6 days ago',
    priority: 'medium',
  },
]

export type DayFilter = 'today' | 'yesterday' | 'last-7-days'

export function filterGamesByDay(games: Game[], filter: DayFilter): Game[] {
  // Only filter completed games by day
  const completedGames = games.filter((game) => game.status === 'completed')

  switch (filter) {
    case 'today':
      return completedGames.filter((game) => game.completedDate === 'Today')
    case 'yesterday':
      return completedGames.filter((game) => game.completedDate === 'Yesterday')
    case 'last-7-days':
      return completedGames
    default:
      return completedGames
  }
}

export function getGamesByStatus(games: Game[]): {
  liveGames: Game[]
  upcomingGames: Game[]
  completedGames: Game[]
} {
  return {
    liveGames: games.filter((game) => game.status === 'live'),
    upcomingGames: games.filter((game) => game.status === 'upcoming'),
    completedGames: games.filter((game) => game.status === 'completed'),
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
  return [...games].sort((a, b) => {
    const aPriority = a.priority ? priorityOrder[a.priority] : 999
    const bPriority = b.priority ? priorityOrder[b.priority] : 999
    return aPriority - bPriority
  })
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

export function filterByFavorites(
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

  return { favoriteGames, otherGames }
}
