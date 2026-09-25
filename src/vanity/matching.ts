export const BLOCKED_BASE58_CHARS = ['0', 'O', 'I', 'l'] as const

export const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]*$/

/** UX limit for the normal generator (engine may accept longer; UI caps at 5). */
export const UX_MAX_VANITY_CHARS = 5

export type SearchPosition =
  | 'prefix'
  | 'suffix'
  | 'both'
  | 'bothEnds'
  | 'anywhere'

export type MatchConfig = {
  pattern: string
  endPattern?: string
  position: SearchPosition
  caseSensitive: boolean
}

export function getInvalidBase58Characters(value: string): string[] {
  const invalid: string[] = []

  for (const character of value) {
    if (!BASE58_PATTERN.test(character) && !invalid.includes(character)) {
      invalid.push(character)
    }
  }

  return invalid
}

export function hasBlockedBase58Characters(value: string): boolean {
  return BLOCKED_BASE58_CHARS.some((character) => value.includes(character))
}

/**
 * Live field feedback for vanity text inputs.
 * Uses the same Base58 alphabet as validateSearchPatterns.
 */
export function getPatternFieldFeedback(value: string): string | null {
  if (value.length > UX_MAX_VANITY_CHARS) {
    return 'Maximum 5 characters.'
  }

  const invalid = getInvalidBase58Characters(value)
  if (invalid.length > 0) {
    return 'This character is not available in a Solana address. Base58 does not use 0, O, I or l.'
  }

  return null
}

export function validateSearchPatterns(
  pattern: string,
  endPattern: string,
  position: SearchPosition
): { ok: true } | { ok: false; message: string } {
  if (!pattern) {
    return { ok: false, message: 'Please enter a search pattern.' }
  }

  if (position === 'bothEnds' && !endPattern) {
    return {
      ok: false,
      message: 'Start AND end mode needs both a start pattern and an end pattern.',
    }
  }

  if (
    pattern.length > UX_MAX_VANITY_CHARS ||
    endPattern.length > UX_MAX_VANITY_CHARS
  ) {
    return {
      ok: false,
      message: 'Maximum 5 characters.',
    }
  }

  const invalid = [
    ...getInvalidBase58Characters(pattern),
    ...getInvalidBase58Characters(endPattern),
  ]

  if (invalid.length > 0) {
    return {
      ok: false,
      message:
        'This character is not available in a Solana address. Base58 does not use 0, O, I or l.',
    }
  }

  return { ok: true }
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createMatchRegex(config: MatchConfig): RegExp {
  const flags = config.caseSensitive ? '' : 'i'
  const start = escapeRegex(config.pattern)
  const end = escapeRegex(config.endPattern || '')

  if (config.position === 'prefix') {
    return new RegExp('^' + start, flags)
  }

  if (config.position === 'suffix') {
    return new RegExp(start + '$', flags)
  }

  if (config.position === 'both') {
    return new RegExp('^' + start + '|' + start + '$', flags)
  }

  if (config.position === 'bothEnds') {
    return new RegExp('^' + start + '.*' + end + '$', flags)
  }

  if (config.position === 'anywhere') {
    return new RegExp(start, flags)
  }

  return new RegExp('^' + start, flags)
}

export function createAddressMatcher(config: MatchConfig): (address: string) => boolean {
  const regex = createMatchRegex(config)
  return (address: string) => regex.test(address)
}

export function matchesAddress(address: string, config: MatchConfig): boolean {
  return createAddressMatcher(config)(address)
}
