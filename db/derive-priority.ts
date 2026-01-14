import type { GameStateSnapshot } from './schema'

export type Priority = 'low' | 'medium' | 'high'

/**
 * Derives priority from game state snapshot metrics.
 * No labels are stored in the database - this is computed at render time.
 */
export function derivePriority(snapshot: GameStateSnapshot | null): Priority {
  if (!snapshot) {
    return 'medium' // Default for games without snapshots
  }

  const { tensionScore, momentumShifts, leadChanges, closeFinish } = snapshot

  // High priority: High tension, multiple momentum shifts, or close finish
  if (tensionScore >= 70 || closeFinish || (momentumShifts >= 3 && leadChanges >= 2)) {
    return 'high'
  }

  // Low priority: Low tension, few momentum changes
  if (tensionScore <= 30 && momentumShifts <= 1 && leadChanges <= 1) {
    return 'low'
  }

  // Medium priority: Everything else
  return 'medium'
}

/**
 * Get the latest snapshot for a game (the one we use for priority)
 */
export function getLatestSnapshot(
  snapshots: GameStateSnapshot[]
): GameStateSnapshot | null {
  if (snapshots.length === 0) return null

  // Prefer final snapshot, otherwise get the most recent
  const finalSnapshot = snapshots.find((s) => s.isFinal)
  if (finalSnapshot) return finalSnapshot

  return snapshots.reduce((latest, current) =>
    current.capturedAt > latest.capturedAt ? current : latest
  )
}
