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
  homeScore: number | null
  awayScore: number | null
}

export interface GameCardProps {
  game: Game
  isFavorite?: boolean
  showScores?: boolean
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

/**
 * Calculate watchability score (1-10 displayed, but constrained to ~3-9)
 * State-based caps:
 * - Upcoming: max 6
 * - Completed: max 8 (avoid 9+)
 * - Live: full range
 */
function getWatchabilityScore(priority: Priority, status: GameStatus): number {
  // Base scores by priority
  const baseScores: Record<Priority, Record<GameStatus, number>> = {
    high: {
      upcoming: 6,
      live: 8.5,
      completed: 8,
    },
    medium: {
      upcoming: 5,
      live: 7,
      completed: 6.5,
    },
    low: {
      upcoming: 4,
      live: 5,
      completed: 4,
    },
  }

  return baseScores[priority][status]
}

/**
 * Format score for display (only .0 or .5 decimals)
 */
function formatScore(score: number): string {
  if (score % 1 === 0) {
    return score.toString()
  }
  return score.toFixed(1)
}

/**
 * Get the start of day (midnight) in local timezone for a given date
 */
function getLocalDateStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Get the calendar day difference between two dates in local timezone
 * Positive = date is in the future, Negative = date is in the past
 */
function getCalendarDayDiff(date: Date, reference: Date = new Date()): number {
  const dateStart = getLocalDateStart(date)
  const refStart = getLocalDateStart(reference)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((dateStart.getTime() - refStart.getTime()) / msPerDay)
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return ''

  const dayDiff = getCalendarDayDiff(date)

  if (dayDiff === 0) return 'Today'
  if (dayDiff === -1) return 'Yesterday'
  if (dayDiff > -7) return `${Math.abs(dayDiff)} days ago`
  return date.toLocaleDateString()
}

function formatScheduledTime(date: Date | null): string {
  if (!date) return ''

  const dayDiff = getCalendarDayDiff(date)
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (dayDiff === 0) return `Today, ${timeStr}`
  if (dayDiff === 1) return `Tomorrow, ${timeStr}`
  if (dayDiff === -1) return `Yesterday, ${timeStr}`
  return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${timeStr}`
}

export default function GameCard({ game, isFavorite = false, showScores = false }: GameCardProps) {
  const isCompleted = game.status === 'completed'
  const isLive = game.status === 'live'
  const isUpcoming = game.status === 'upcoming'
  const hasScores = game.awayScore !== null && game.homeScore !== null
  const watchabilityScore = getWatchabilityScore(game.priority, game.status)

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
        <div className="flex items-center gap-3 whitespace-nowrap">
          {showScores && hasScores && (
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {game.awayScore} - {game.homeScore}
            </span>
          )}
          {isLive && (
            <span className="text-sm text-stone-600 dark:text-stone-300">Live</span>
          )}
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
            {formatScore(watchabilityScore)}
          </span>
        </div>
      </div>
    </div>
  )
}
