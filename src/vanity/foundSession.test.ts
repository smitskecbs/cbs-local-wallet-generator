import { describe, expect, it } from 'vitest'
import {
  lifecycleFromBackupStatus,
  markConfirmed,
  markDownloaded,
  requiresDiscardWarning,
} from './foundSession'

describe('foundSession lifecycle', () => {
  it('maps backup status to lifecycle', () => {
    expect(lifecycleFromBackupStatus(null)).toBe('cleared')
    expect(lifecycleFromBackupStatus('unsecured')).toBe('found-unsecured')
    expect(lifecycleFromBackupStatus('downloaded')).toBe('found-unsecured')
    expect(lifecycleFromBackupStatus('confirmed')).toBe('found-backed-up')
  })

  it('requires discard warning until confirmed', () => {
    expect(requiresDiscardWarning('unsecured')).toBe(true)
    expect(requiresDiscardWarning('downloaded')).toBe(true)
    expect(requiresDiscardWarning('confirmed')).toBe(false)
    expect(requiresDiscardWarning(null)).toBe(false)
  })

  it('markDownloaded does not downgrade confirmed', () => {
    expect(markDownloaded('unsecured')).toBe('downloaded')
    expect(markDownloaded('confirmed')).toBe('confirmed')
    expect(markConfirmed()).toBe('confirmed')
  })
})
