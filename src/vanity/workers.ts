export type PerformancePreset = 'auto' | 'low' | 'balanced' | 'maximum'

export type WorkerPlan = {
  workers: number
  batchConcurrency: number
  preset: PerformancePreset
  hardwareConcurrency: number
  isMobile: boolean
}

export function detectMobile(
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)
}

/**
 * Resolve worker count and per-worker batch concurrency.
 *
 * Chromium Phase 5 measurements (hw=20) showed worker count dominates.
 * Raising batchConcurrency above 1 rarely helped and often hurt at high
 * worker counts. AUTO/Balanced target the measured sweet spot:
 * about half the cores, capped, with concurrency 1.
 */
export function resolveWorkerPlan(options: {
  preset: PerformancePreset
  hardwareConcurrency?: number
  isMobile?: boolean
}): WorkerPlan {
  const hardwareConcurrency = Math.max(
    1,
    options.hardwareConcurrency ??
      (typeof navigator !== 'undefined'
        ? navigator.hardwareConcurrency || 4
        : 4)
  )
  const isMobile = options.isMobile ?? detectMobile()
  const preset = options.preset

  if (preset === 'low') {
    return {
      workers: 1,
      batchConcurrency: 1,
      preset,
      hardwareConcurrency,
      isMobile,
    }
  }

  if (preset === 'maximum') {
    if (isMobile) {
      return {
        workers: Math.max(1, Math.min(4, hardwareConcurrency)),
        batchConcurrency: 1,
        preset,
        hardwareConcurrency,
        isMobile,
      }
    }

    return {
      workers: Math.max(1, hardwareConcurrency - 2),
      batchConcurrency: 2,
      preset,
      hardwareConcurrency,
      isMobile,
    }
  }

  // AUTO and Balanced share the measured balanced profile.
  if (isMobile) {
    return {
      workers: Math.max(1, Math.min(2, Math.floor(hardwareConcurrency / 2))),
      batchConcurrency: 1,
      preset,
      hardwareConcurrency,
      isMobile,
    }
  }

  return {
    workers: Math.max(1, Math.min(8, Math.floor(hardwareConcurrency / 2))),
    batchConcurrency: 1,
    preset,
    hardwareConcurrency,
    isMobile,
  }
}
