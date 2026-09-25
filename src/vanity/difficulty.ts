import type { SearchPosition } from './matching'

export type DifficultyLabel =
  | 'Easy'
  | 'Moderate'
  | 'Hard'
  | 'Very hard'
  | 'Extreme'

export const AVERAGE_SOLANA_ADDRESS_LENGTH = 44

export type DifficultyEstimate = {
  expectedAttempts: number
  label: DifficultyLabel
  estimatedSeconds: number | null
}

function getCaseMultiplier(pattern: string, caseSensitive: boolean): number {
  if (caseSensitive) return 1

  const blocked = new Set(['0', 'O', 'I', 'l'])
  let multiplier = 1

  for (const character of pattern) {
    const lower = character.toLowerCase()
    const upper = character.toUpperCase()
    const lowerAllowed = !blocked.has(lower)
    const upperAllowed = !blocked.has(upper)

    if (lower !== upper && lowerAllowed && upperAllowed) {
      multiplier *= 2
    }
  }

  return multiplier
}

export function estimateExpectedAttempts(options: {
  pattern: string
  endPattern?: string
  position: SearchPosition
  caseSensitive: boolean
}): number {
  const { pattern, endPattern = '', position, caseSensitive } = options

  if (!pattern) return 0
  if (position === 'bothEnds' && !endPattern) return 0

  let totalLength = pattern.length
  let caseMultiplier = getCaseMultiplier(pattern, caseSensitive)
  let matchMultiplier = 1

  if (position === 'both') {
    matchMultiplier = 2
  }

  if (position === 'anywhere') {
    matchMultiplier = Math.max(
      1,
      AVERAGE_SOLANA_ADDRESS_LENGTH - pattern.length + 1
    )
  }

  if (position === 'bothEnds') {
    totalLength = pattern.length + endPattern.length
    caseMultiplier =
      getCaseMultiplier(pattern, caseSensitive) *
      getCaseMultiplier(endPattern, caseSensitive)
  }

  const exactSpace = Math.pow(58, totalLength)
  return Math.max(1, Math.round(exactSpace / caseMultiplier / matchMultiplier))
}

export function getDifficultyLabel(expectedAttempts: number): DifficultyLabel {
  if (expectedAttempts < 10_000) return 'Easy'
  if (expectedAttempts < 500_000) return 'Moderate'
  if (expectedAttempts < 20_000_000) return 'Hard'
  if (expectedAttempts < 2_000_000_000) return 'Very hard'
  return 'Extreme'
}

export function formatEstimatedTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'unknown'
  if (seconds < 1) return 'less than 1 second'
  if (seconds < 60) return `${Math.round(seconds)} seconds`

  const minutes = seconds / 60
  if (minutes < 60) return `${Math.round(minutes)} minutes`

  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours * 10) / 10} hours`

  const days = hours / 24
  if (days < 365) return `${Math.round(days * 10) / 10} days`

  const years = days / 365
  return `${Math.round(years * 10) / 10} years`
}

export function estimateDifficulty(options: {
  pattern: string
  endPattern?: string
  position: SearchPosition
  caseSensitive: boolean
  measuredSpeed?: number | null
}): DifficultyEstimate {
  const expectedAttempts = estimateExpectedAttempts(options)
  const label = getDifficultyLabel(expectedAttempts)
  const speed = options.measuredSpeed

  const estimatedSeconds =
    speed && speed > 0 ? expectedAttempts / speed : null

  return { expectedAttempts, label, estimatedSeconds }
}
