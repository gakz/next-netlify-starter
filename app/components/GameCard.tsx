'use client'

export type Priority = 'low' | 'medium' | 'high'
export type GameStatus = 'upcoming' | 'live' | 'completed'

export interface Game {
  id: string
  awayTeam: string
  homeTeam: string
  status: GameStatus
  // For completed games
  completedDate?: string
  priority?: Priority
  // For upcoming games
  scheduledTime?: string
}

interface GameCardProps {
  game: Game
  isFavorite?: boolean
}

const priorityLabels: Record<Priority, string> = {
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
}

// Subtle structural differentiation by priority
const priorityCardStyles: Record<Priority, string> = {
  high: 'shadow-sm',
  medium: 'shadow-none',
  low: 'shadow-none opacity-90',
}

export default function GameCard({ game, isFavorite = false }: GameCardProps) {
  const isCompleted = game.status === 'completed'
  const isLive = game.status === 'live'
  const isUpcoming = game.status === 'upcoming'

  const cardStyles = isCompleted && game.priority
    ? priorityCardStyles[game.priority]
    : 'shadow-none'

  return (
    <div
      className={`
        bg-white border border-stone-200 rounded-lg p-4
        dark:bg-stone-800 dark:border-stone-700
        ${cardStyles}
        ${isFavorite ? 'border-l-2 border-l-stone-400 dark:border-l-stone-500' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex-1">
          <h3
            className={`text-base text-stone-900 dark:text-stone-100 ${
              isFavorite ? 'font-semibold' : 'font-medium'
            }`}
          >
            {game.awayTeam} vs {game.homeTeam}
          </h3>
          <p className="text-sm text-stone-500 mt-1 dark:text-stone-400">
            {isCompleted && game.completedDate && (
              <>Completed &bull; {game.completedDate}</>
            )}
            {isLive && 'In progress'}
            {isUpcoming && game.scheduledTime && (
              <>{game.scheduledTime}</>
            )}
          </p>
        </div>
        <span className="text-sm text-stone-500 dark:text-stone-400 whitespace-nowrap">
          {isCompleted && game.priority && priorityLabels[game.priority]}
          {isLive && (
            <span className="text-stone-600 dark:text-stone-300">Live</span>
          )}
          {isUpcoming && (
            <span className="text-stone-400 dark:text-stone-500">Upcoming</span>
          )}
        </span>
      </div>
    </div>
  )
}
