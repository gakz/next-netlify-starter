'use client'

export type Priority = 'low' | 'medium' | 'high'

export interface Game {
  id: string
  awayTeam: string
  homeTeam: string
  completedDate: string
  priority: Priority
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
  return (
    <div
      className={`
        bg-white border border-stone-200 rounded-lg p-4
        dark:bg-stone-800 dark:border-stone-700
        ${priorityCardStyles[game.priority]}
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
            Completed &bull; {game.completedDate}
          </p>
        </div>
        <span className="text-sm text-stone-500 dark:text-stone-400 whitespace-nowrap">
          {priorityLabels[game.priority]}
        </span>
      </div>
    </div>
  )
}
