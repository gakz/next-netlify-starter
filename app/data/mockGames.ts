import type { Game } from '../components/GameCard'

export const mockGames: Game[] = [
  {
    id: '1',
    awayTeam: 'Boston Celtics',
    homeTeam: 'Miami Heat',
    completedDate: 'Today',
    watchability: 'highly-watchable',
    descriptors: ['Sustained tension', 'Extended finish', 'Momentum swings'],
  },
  {
    id: '2',
    awayTeam: 'Los Angeles Lakers',
    homeTeam: 'Golden State Warriors',
    completedDate: 'Today',
    watchability: 'worth-considering',
    descriptors: ['Competitive late', 'Momentum swings'],
  },
  {
    id: '3',
    awayTeam: 'New York Yankees',
    homeTeam: 'Boston Red Sox',
    completedDate: 'Yesterday',
    watchability: 'highly-watchable',
    descriptors: ['Extended finish', 'Sustained tension'],
  },
  {
    id: '4',
    awayTeam: 'Manchester United',
    homeTeam: 'Liverpool',
    completedDate: 'Yesterday',
    watchability: 'skip',
    descriptors: ['Early-decided'],
  },
  {
    id: '5',
    awayTeam: 'Denver Nuggets',
    homeTeam: 'Phoenix Suns',
    completedDate: '2 days ago',
    watchability: 'worth-considering',
    descriptors: ['Sustained tension', 'Competitive late'],
  },
  {
    id: '6',
    awayTeam: 'Chicago Bears',
    homeTeam: 'Green Bay Packers',
    completedDate: '3 days ago',
    watchability: 'highly-watchable',
    descriptors: ['Momentum swings', 'Extended finish', 'Competitive late'],
  },
  {
    id: '7',
    awayTeam: 'San Francisco Giants',
    homeTeam: 'Los Angeles Dodgers',
    completedDate: '5 days ago',
    watchability: 'skip',
    descriptors: ['Early-decided'],
  },
  {
    id: '8',
    awayTeam: 'Toronto Maple Leafs',
    homeTeam: 'Montreal Canadiens',
    completedDate: '6 days ago',
    watchability: 'worth-considering',
    descriptors: ['Competitive late', 'Sustained tension'],
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
