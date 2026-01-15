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

// Multi-word city prefixes to strip from team names
const multiWordCities = [
  'Los Angeles',
  'Golden State',
  'New York',
  'San Francisco',
  'San Antonio',
  'San Diego',
  'Oklahoma City',
  'Kansas City',
  'Salt Lake',
  'New Orleans',
  'St. Louis',
  'Tampa Bay',
]

/**
 * Extract team nickname from full team name
 * e.g., "Los Angeles Lakers" -> "Lakers", "Boston Celtics" -> "Celtics"
 */
function getTeamNickname(fullName: string): string {
  // Check for multi-word city prefixes first
  for (const city of multiWordCities) {
    if (fullName.startsWith(city + ' ')) {
      return fullName.slice(city.length + 1)
    }
  }
  // Otherwise, assume single-word city and take everything after first space
  const spaceIndex = fullName.indexOf(' ')
  if (spaceIndex !== -1) {
    return fullName.slice(spaceIndex + 1)
  }
  return fullName
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

/**
 * Rating badge component with semantic ring indicator
 * The ring fill represents the rating on a 1-10 scale
 */
function RatingBadge({
  score,
  isLive,
  isFavorite,
}: {
  score: number
  isLive: boolean
  isFavorite: boolean
}) {
  // Calculate ring progress (score 1-10 maps to 0-100%)
  const progress = (score / 10) * 100

  // Context-aware emphasis
  const isHighRating = score >= 8
  const isLowRating = score < 5

  // Determine badge styling based on context
  const getBadgeStyles = () => {
    if (isFavorite) {
      // Your Teams: reduced emphasis, contextual feel
      return {
        size: 'w-9 h-9',
        textSize: 'text-sm',
        ringColor: 'stroke-stone-300 dark:stroke-stone-500',
        bgColor: 'bg-stone-50 dark:bg-stone-700/50',
        textColor: 'text-stone-600 dark:text-stone-300',
      }
    }

    if (isLive && isHighRating) {
      // Live + high rating: elevated emphasis
      return {
        size: 'w-11 h-11',
        textSize: 'text-lg',
        ringColor: 'stroke-stone-500 dark:stroke-stone-300',
        bgColor: 'bg-stone-100 dark:bg-stone-700',
        textColor: 'text-stone-900 dark:text-stone-50',
      }
    }

    if (isLive && isLowRating) {
      // Live + low rating: reduced emphasis
      return {
        size: 'w-10 h-10',
        textSize: 'text-base',
        ringColor: 'stroke-stone-300 dark:stroke-stone-600',
        bgColor: 'bg-stone-50 dark:bg-stone-700/70',
        textColor: 'text-stone-500 dark:text-stone-400',
      }
    }

    // Default: standard emphasis
    return {
      size: 'w-10 h-10',
      textSize: 'text-base',
      ringColor: 'stroke-stone-400 dark:stroke-stone-500',
      bgColor: 'bg-stone-100 dark:bg-stone-700',
      textColor: 'text-stone-800 dark:text-stone-100',
    }
  }

  const styles = getBadgeStyles()
  const svgSize = isFavorite ? 36 : isLive && isHighRating ? 44 : 40
  const radius = isFavorite ? 15 : isLive && isHighRating ? 19 : 17
  const actualCircumference = 2 * Math.PI * radius
  const actualOffset = actualCircumference - (progress / 100) * actualCircumference

  return (
    <div className={`relative ${styles.size} flex items-center justify-center`}>
      {/* Background ring (track) */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        fill="none"
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          className="stroke-stone-200 dark:stroke-stone-600"
          strokeWidth="2"
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          className={styles.ringColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={actualCircumference}
          strokeDashoffset={actualOffset}
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
        />
      </svg>
      {/* Inner badge */}
      <div
        className={`
          relative flex items-center justify-center
          w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-full
          ${styles.bgColor}
        `}
      >
        <span className={`${styles.textSize} font-bold ${styles.textColor}`}>
          {formatScore(score)}
        </span>
      </div>
    </div>
  )
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
        flex items-center gap-3
        bg-white border border-stone-200 rounded-lg px-4
        dark:bg-stone-800 dark:border-stone-700
        ${priorityBorderStyles[game.priority]}
        ${priorityCardStyles[game.priority]}
      `}
    >
      {/* Card content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={`text-base text-stone-900 dark:text-stone-100 truncate ${
              isFavorite ? 'font-semibold' : 'font-medium'
            }`}
          >
            {getTeamNickname(game.awayTeam)} vs {getTeamNickname(game.homeTeam)}
          </h3>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {isLive ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Live
            </span>
          ) : isCompleted ? (
            <>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                Final
              </span>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {formatRelativeDate(game.completedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {formatScheduledTime(game.scheduledTime)}
            </p>
          )}
          {showScores && hasScores && (
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              {game.awayScore} - {game.homeScore}
            </span>
          )}
        </div>
      </div>

      {/* Rating badge - structurally integrated */}
      <RatingBadge
        score={watchabilityScore}
        isLive={isLive}
        isFavorite={isFavorite}
      />
    </div>
  )
}
