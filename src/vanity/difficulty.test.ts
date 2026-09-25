import { describe, expect, it } from 'vitest'
import {
  estimateExpectedAttempts,
  getDifficultyLabel,
} from './difficulty'

describe('difficulty', () => {
  it('computes expected attempts from Base58 space', () => {
    expect(
      estimateExpectedAttempts({
        pattern: 'A',
        position: 'prefix',
        caseSensitive: true,
      })
    ).toBe(58)

    expect(
      estimateExpectedAttempts({
        pattern: 'AA',
        position: 'prefix',
        caseSensitive: true,
      })
    ).toBe(58 * 58)
  })

  it('reduces expected attempts for case-insensitive letter patterns', () => {
    const sensitive = estimateExpectedAttempts({
      pattern: 'Ab',
      position: 'prefix',
      caseSensitive: true,
    })
    const insensitive = estimateExpectedAttempts({
      pattern: 'Ab',
      position: 'prefix',
      caseSensitive: false,
    })
    expect(insensitive).toBeLessThan(sensitive)
  })

  it('maps attempt counts to Easy…Extreme labels', () => {
    expect(getDifficultyLabel(100)).toBe('Easy')
    expect(getDifficultyLabel(50_000)).toBe('Moderate')
    expect(getDifficultyLabel(1_000_000)).toBe('Hard')
    expect(getDifficultyLabel(100_000_000)).toBe('Very hard')
    expect(getDifficultyLabel(3_000_000_000)).toBe('Extreme')
  })

  it('accounts for anywhere and bothEnds multipliers', () => {
    const prefix = estimateExpectedAttempts({
      pattern: 'ABC',
      position: 'prefix',
      caseSensitive: true,
    })
    const anywhere = estimateExpectedAttempts({
      pattern: 'ABC',
      position: 'anywhere',
      caseSensitive: true,
    })
    expect(anywhere).toBeLessThan(prefix)

    const bothEnds = estimateExpectedAttempts({
      pattern: 'AB',
      endPattern: 'CD',
      position: 'bothEnds',
      caseSensitive: true,
    })
    expect(bothEnds).toBe(58 ** 4)
  })
})
