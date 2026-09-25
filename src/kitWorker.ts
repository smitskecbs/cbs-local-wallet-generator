import { generateKeyPair } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import { createAddressMatcher, type MatchConfig } from './vanity/matching'
import {
  exportSolanaSecretKey,
  secretKeyToBase58,
} from './vanity/export'
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './vanity/workerMessages'

const DEFAULT_PROGRESS_EVERY = 1000

let cancelRequested = false
let activeSearchId = 0

async function ensureWorkerEd25519(needsPolyfill: boolean): Promise<void> {
  if (!needsPolyfill) {
    try {
      await crypto.subtle.generateKey({ name: 'Ed25519' }, false, [
        'sign',
        'verify',
      ])
      return
    } catch {
      // Fall through to polyfill.
    }
  }

  const { install } = await import('@solana/webcrypto-ed25519-polyfill')
  install()
}

async function grind(config: {
  searchId: number
  matchConfig: MatchConfig
  batchConcurrency: number
  progressEvery: number
}): Promise<void> {
  const matcher = createAddressMatcher(config.matchConfig)
  const batchConcurrency = Math.max(1, config.batchConcurrency)
  const progressEvery = Math.max(100, config.progressEvery)
  let attemptsSinceReport = 0

  while (!cancelRequested && activeSearchId === config.searchId) {
    const batch = await Promise.all(
      Array.from({ length: batchConcurrency }, async () => {
        const keyPair = await generateKeyPair(true)
        const address = await getAddressFromPublicKey(keyPair.publicKey)
        return { keyPair, address }
      })
    )

    for (const candidate of batch) {
      if (cancelRequested || activeSearchId !== config.searchId) {
        self.postMessage({
          type: 'cancelled',
          searchId: config.searchId,
        } satisfies WorkerOutboundMessage)
        return
      }

      attemptsSinceReport++

      if (matcher(candidate.address)) {
        const secretKey = await exportSolanaSecretKey(candidate.keyPair)
        const privateKey = await secretKeyToBase58(secretKey)

        self.postMessage({
          type: 'found',
          searchId: config.searchId,
          publicKey: candidate.address,
          privateKey,
          secretKey: Array.from(secretKey),
        } satisfies WorkerOutboundMessage)

        secretKey.fill(0)
        return
      }
    }

    if (attemptsSinceReport >= progressEvery) {
      self.postMessage({
        type: 'progress',
        searchId: config.searchId,
        attempts: attemptsSinceReport,
      } satisfies WorkerOutboundMessage)
      attemptsSinceReport = 0
    }
  }

  if (attemptsSinceReport > 0 && activeSearchId === config.searchId) {
    self.postMessage({
      type: 'progress',
      searchId: config.searchId,
      attempts: attemptsSinceReport,
    } satisfies WorkerOutboundMessage)
  }

  self.postMessage({
    type: 'cancelled',
    searchId: config.searchId,
  } satisfies WorkerOutboundMessage)
}

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>) => {
  const data = event.data

  if (data.type === 'cancel') {
    if (data.searchId === activeSearchId) {
      cancelRequested = true
    }
    return
  }

  if (data.type !== 'start') {
    return
  }

  activeSearchId = data.searchId
  cancelRequested = false

  try {
    await ensureWorkerEd25519(data.needsPolyfill)

    self.postMessage({
      type: 'ready',
      searchId: data.searchId,
    } satisfies WorkerOutboundMessage)

    await grind({
      searchId: data.searchId,
      matchConfig: {
        pattern: data.pattern,
        endPattern: data.endPattern,
        position: data.position,
        caseSensitive: data.caseSensitive,
      },
      batchConcurrency: data.batchConcurrency,
      progressEvery: data.progressEvery ?? DEFAULT_PROGRESS_EVERY,
    })
  } catch (error) {
    if (cancelRequested || activeSearchId !== data.searchId) {
      return
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Address generation failed inside the worker.'

    self.postMessage({
      type: 'error',
      searchId: data.searchId,
      message,
    } satisfies WorkerOutboundMessage)
  }
}
