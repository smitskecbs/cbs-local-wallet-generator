import { describe, expect, it } from 'vitest'
import {
  createMatchRegex,
  getInvalidBase58Characters,
  matchesAddress,
  validateSearchPatterns,
} from './matching'

describe('matching', () => {
  it('detects invalid Base58 characters including 0 O I l', () => {
    expect(getInvalidBase58Characters('CB0S')).toEqual(['0'])
    expect(getInvalidBase58Characters('OIl')).toEqual(['O', 'I', 'l'])
    expect(getInvalidBase58Characters('CBS')).toEqual([])
  })

  it('validates search patterns before start', () => {
    expect(validateSearchPatterns('', '', 'prefix').ok).toBe(false)
    expect(validateSearchPatterns('CBS', '', 'bothEnds').ok).toBe(false)
    expect(validateSearchPatterns('CB0', '', 'prefix').ok).toBe(false)
    expect(validateSearchPatterns('CBS', 'mint', 'bothEnds').ok).toBe(true)
    expect(validateSearchPatterns('ABCDEF', '', 'prefix').ok).toBe(false)
  })

  it('reports beginner-friendly Base58 feedback', () => {
    const result = validateSearchPatterns('CB0', '', 'prefix')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('not available in a Solana address')
      expect(result.message).toContain('0, O, I or l')
    }
  })

  it('matches prefix case-sensitively and case-insensitively', () => {
    const address = 'ManGoabcXYZ'

    expect(
      matchesAddress(address, {
        pattern: 'Man',
        position: 'prefix',
        caseSensitive: true,
      })
    ).toBe(true)

    expect(
      matchesAddress(address, {
        pattern: 'man',
        position: 'prefix',
        caseSensitive: true,
      })
    ).toBe(false)

    expect(
      matchesAddress(address, {
        pattern: 'man',
        position: 'prefix',
        caseSensitive: false,
      })
    ).toBe(true)
  })

  it('matches suffix, anywhere, OR, and AND modes', () => {
    const address = 'CBSxxxxSOL'

    expect(
      matchesAddress(address, {
        pattern: 'SOL',
        position: 'suffix',
        caseSensitive: true,
      })
    ).toBe(true)

    expect(
      matchesAddress(address, {
        pattern: 'xxx',
        position: 'anywhere',
        caseSensitive: true,
      })
    ).toBe(true)

    expect(
      matchesAddress(address, {
        pattern: 'CBS',
        position: 'both',
        caseSensitive: true,
      })
    ).toBe(true)

    expect(
      matchesAddress(address, {
        pattern: 'SOL',
        position: 'both',
        caseSensitive: true,
      })
    ).toBe(true)

    expect(
      matchesAddress(address, {
        pattern: 'CBS',
        endPattern: 'SOL',
        position: 'bothEnds',
        caseSensitive: true,
      })
    ).toBe(true)

    expect(
      matchesAddress(address, {
        pattern: 'CBS',
        endPattern: 'XYZ',
        position: 'bothEnds',
        caseSensitive: true,
      })
    ).toBe(false)
  })

  it('builds anchored regexes for positions', () => {
    expect(createMatchRegex({
      pattern: 'ab',
      position: 'prefix',
      caseSensitive: true,
    }).source).toBe('^ab')

    expect(createMatchRegex({
      pattern: 'ab',
      position: 'suffix',
      caseSensitive: true,
    }).source).toBe('ab$')
  })
})
