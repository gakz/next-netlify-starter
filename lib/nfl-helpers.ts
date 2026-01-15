/**
 * NFL-specific derivation helpers for game state analysis.
 * These functions derive spoiler-safe signals from raw game data.
 * No UI labels or priority values are computed here.
 */

export type Stage = 'early' | 'mid' | 'late'
export type ActivityLevel = 'low' | 'medium' | 'high'

/**
 * Determine game stage based on quarter and clock.
 * NFL quarters are 15 minutes each.
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
 * NFL scoring is lower, so thresholds are tighter than NBA:
 * - early: diff <= 14 (two touchdowns)
 * - mid: diff <= 11 (touchdown + field goal + safety, or about 1.5 possessions)
 * - late: diff <= 8 (one possession)
 */
export function isCompetitive(scoreDiff: number, stage: Stage): boolean {
  const absDiff = Math.abs(scoreDiff)

  switch (stage) {
    case 'early':
      return absDiff <= 14
    case 'mid':
      return absDiff <= 11
    case 'late':
      return absDiff <= 8
    default:
      return false
  }
}

/**
 * Determine activity level based on combined scoring and game flow.
 * NFL average is ~21-24 points per team per game (~42-48 total).
 * High-scoring games are more exciting.
 */
export function getActivityLevel(
  homeScore: number,
  awayScore: number,
  quarter: number,
  clockSeconds: number
): ActivityLevel {
  const totalPoints = homeScore + awayScore

  // NFL: 15 min quarters, ~12 points per team per quarter = ~24 total per quarter
  // More realistic: ~10-12 total points per quarter
  const quartersPlayed = quarter - 1 + (900 - clockSeconds) / 900 // 900 seconds = 15 min
  const expectedPoints = quartersPlayed * 12 // ~12 total points per quarter

  if (quartersPlayed < 0.5) {
    // Not enough data yet
    return 'medium'
  }

  const paceFactor = totalPoints / expectedPoints

  if (paceFactor > 1.25) {
    return 'high'
  }

  if (paceFactor < 0.75) {
    return 'low'
  }

  return 'medium'
}

/**
 * Calculate tension score (0-100) based on game state.
 * Higher tension = more watchable game.
 * NFL games with close scores in late stages are very tense.
 */
export function calculateTensionScore(
  scoreDiff: number,
  stage: Stage,
  competitive: boolean
): number {
  const absDiff = Math.abs(scoreDiff)

  // Base tension from score differential
  // NFL: each point matters more, so use steeper curve
  let tension = Math.max(0, 100 - absDiff * 7)

  // Stage multiplier (late game tension matters more)
  const stageMultiplier = {
    early: 0.5,
    mid: 0.75,
    late: 1.0,
  }

  tension *= stageMultiplier[stage]

  // Competitive bonus
  if (competitive) {
    tension = Math.min(100, tension * 1.25)
  }

  return Math.round(tension)
}
