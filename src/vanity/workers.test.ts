import { describe, expect, it } from 'vitest'
import { resolveWorkerPlan } from './workers'

describe('workers', () => {
  it('AUTO uses the measured balanced desktop profile', () => {
    const plan = resolveWorkerPlan({
      preset: 'auto',
      hardwareConcurrency: 20,
      isMobile: false,
    })
    expect(plan.workers).toBe(8)
    expect(plan.batchConcurrency).toBe(1)
  })

  it('AUTO caps workers on very high core counts', () => {
    const plan = resolveWorkerPlan({
      preset: 'auto',
      hardwareConcurrency: 32,
      isMobile: false,
    })
    expect(plan.workers).toBe(8)
    expect(plan.batchConcurrency).toBe(1)
  })

  it('AUTO is conservative on mobile', () => {
    const plan = resolveWorkerPlan({
      preset: 'auto',
      hardwareConcurrency: 8,
      isMobile: true,
    })
    expect(plan.workers).toBeLessThanOrEqual(2)
    expect(plan.batchConcurrency).toBe(1)
  })

  it('supports low / balanced / maximum presets', () => {
    expect(
      resolveWorkerPlan({
        preset: 'low',
        hardwareConcurrency: 12,
        isMobile: false,
      })
    ).toMatchObject({ workers: 1, batchConcurrency: 1 })

    expect(
      resolveWorkerPlan({
        preset: 'balanced',
        hardwareConcurrency: 12,
        isMobile: false,
      })
    ).toMatchObject({ workers: 6, batchConcurrency: 1 })

    expect(
      resolveWorkerPlan({
        preset: 'maximum',
        hardwareConcurrency: 20,
        isMobile: false,
      })
    ).toMatchObject({ workers: 18, batchConcurrency: 2 })
  })
})
