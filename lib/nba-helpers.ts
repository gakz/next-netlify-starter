/**
 * NBA-specific derivation helpers for game state analysis.
 * These functions derive spoiler-safe signals from raw game data.
 * No UI labels or priority values are computed here.
 */

export type Stage = 'early' | 'mid' | 'late'
export type ActivityLevel = 'low' | 'medium' | 'high'

/**
 * Determine game stage based on quarter and clock.
 * - early: Q1–Q2
 * - mid: Q3 or early Q4 (more than 5 minutes remaining)
 * - late: final 5 minutes of Q4 or overtime
 */
export function getStage(quarter: number, clockSeconds: number): Stage {
  if (quarter <= 2) {
    return 'early'
  }

  if (quarter === 3) {
    return 'mid'
  }

  // Q4 or overtime
  if (quarter === 4 && clockSeconds > 300) {
    return 'mid'
  }

  return 'late'
}

/**
 * Determine if a game is competitive based on score differential and stage.
 * Thresholds tighten as game progresses:
 * - early: diff <= 12
 * - mid: diff <= 10
 * - late: diff <= 8
 */
export function isCompetitive(scoreDiff: number, stage: Stage): boolean {
  const absDiff = Math.abs(scoreDiff)

  switch (stage) {
    case 'early':
      return absDiff <= 12
    case 'mid':
      return absDiff <= 10
    case 'late':
      return absDiff <= 8
    default:
      return false
  }
}

/**
 * Determine activity level based on combined scoring and game flow.
 * This is a rough heuristic based on total points and pace.
 */
export function getActivityLevel(
  homeScore: number,
  awayScore: number,
  quarter: number,
  clockSeconds: number
): ActivityLevel {
  const totalPoints = homeScore + awayScore

  // Calculate expected points per quarter (NBA average ~27-28 per team per quarter)
  const quartersPlayed = quarter - 1 + (720 - clockSeconds) / 720
  const expectedPoints = quartersPlayed * 55 // ~55 total points per quarter

  if (quartersPlayed < 0.5) {
    // Not enough data yet
    return 'medium'
  }

  const paceFactor = totalPoints / expectedPoints

  if (paceFactor > 1.15) {
    return 'high'
  }

  if (paceFactor < 0.85) {
    return 'low'
  }

  return 'medium'
}

/**
 * Calculate tension score (0-100) based on game state.
 * Higher tension = more watchable game.
 */
export function calculateTensionScore(
  scoreDiff: number,
  stage: Stage,
  competitive: boolean
): number {
  const absDiff = Math.abs(scoreDiff)

  // Base tension from score differential (closer = higher)
  let tension = Math.max(0, 100 - absDiff * 5)

  // Stage multiplier (late game tension matters more)
  const stageMultiplier = {
    early: 0.6,
    mid: 0.8,
    late: 1.0,
  }

  tension *= stageMultiplier[stage]

  // Competitive bonus
  if (competitive) {
    tension = Math.min(100, tension * 1.2)
  }

  return Math.round(tension)
}
