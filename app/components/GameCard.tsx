'use client'

export type Priority = 'low' | 'medium' | 'high'
export type GameStatus = 'upcoming' | 'live' | 'completed'

export interface Game {
  id: string
  awayTeam: string
  homeTeam: string
  status: GameStatus
  priority: Priority
  scheduledTime: Date | null
  completedAt: Date | null
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

// Left border intensity by priority (neutral slate)
const priorityBorderStyles: Record<Priority, string> = {
  high: 'border-l-[3px] border-l-slate-500 dark:border-l-slate-400',
  medium: 'border-l-[3px] border-l-slate-300 dark:border-l-slate-600',
  low: 'border-l-[3px] border-l-slate-200 dark:border-l-slate-700',
}

// Subtle weight differentiation by priority
const priorityCardStyles: Record<Priority, string> = {
  high: 'py-4 shadow-sm',
  medium: 'py-3.5',
  low: 'py-3 opacity-85',
}

// Priority text styling (de-emphasized)
const priorityTextStyles: Record<Priority, string> = {
  high: 'text-xs text-stone-400 dark:text-stone-500',
  medium: 'text-xs text-stone-400 dark:text-stone-500',
  low: 'text-xs text-stone-300 dark:text-stone-600',
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function formatScheduledTime(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (diffDays === 0) return `Today, ${timeStr}`
  if (diffDays === 1) return `Tomorrow, ${timeStr}`
  return `${date.toLocaleDateString([], { weekday: 'short' })}, ${timeStr}`
}

export default function GameCard({ game, isFavorite = false }: GameCardProps) {
  const isCompleted = game.status === 'completed'
  const isLive = game.status === 'live'
  const isUpcoming = game.status === 'upcoming'

  return (
    <div
      className={`
        bg-white border border-stone-200 rounded-lg px-4
        dark:bg-stone-800 dark:border-stone-700
        ${priorityBorderStyles[game.priority]}
        ${priorityCardStyles[game.priority]}
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
            {isCompleted && (
              <>Completed &bull; {formatRelativeDate(game.completedAt)}</>
            )}
            {isLive && 'In progress'}
            {isUpcoming && formatScheduledTime(game.scheduledTime)}
          </p>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          {isLive && (
            <span className="text-sm text-stone-600 dark:text-stone-300">Live</span>
          )}
          {isUpcoming && (
            <span className="text-sm text-stone-400 dark:text-stone-500">Upcoming</span>
          )}
          <span className={priorityTextStyles[game.priority]}>
            {priorityLabels[game.priority]}
          </span>
        </div>
      </div>
    </div>
  )
}
