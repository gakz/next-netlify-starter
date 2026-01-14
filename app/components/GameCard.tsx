'use client'

export type WatchabilityLevel = 'skip' | 'worth-considering' | 'highly-watchable'

export interface Game {
  id: string
  awayTeam: string
  homeTeam: string
  completedDate: string
  watchability: WatchabilityLevel
  descriptors: string[]
}

interface GameCardProps {
  game: Game
}

const watchabilityLabels: Record<WatchabilityLevel, string> = {
  'skip': 'Skip',
  'worth-considering': 'Worth considering',
  'highly-watchable': 'Highly watchable',
}

const watchabilityStyles: Record<WatchabilityLevel, string> = {
  'skip': 'bg-stone-200 text-stone-600',
  'worth-considering': 'bg-stone-300 text-stone-700',
  'highly-watchable': 'bg-stone-400 text-stone-800',
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-medium text-stone-900">
            {game.awayTeam} vs {game.homeTeam}
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Completed &bull; {game.completedDate}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${watchabilityStyles[game.watchability]}`}
        >
          {watchabilityLabels[game.watchability]}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {game.descriptors.map((descriptor, index) => (
          <li key={index} className="text-sm text-stone-600 flex items-start">
            <span className="mr-2 text-stone-400">&ndash;</span>
            {descriptor}
          </li>
        ))}
      </ul>
    </div>
  )
}
