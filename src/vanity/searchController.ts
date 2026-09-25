import type { MatchConfig, SearchPosition } from './matching'
import type { WorkerPlan } from './workers'
import type {
  WorkerOutboundMessage,
  WorkerStartMessage,
} from './workerMessages'

export type FoundWallet = {
  publicKey: string
  privateKey: string
  secretKey: Uint8Array
}

export type SearchProgress = {
  searchId: number
  attempts: number
  elapsedMs: number
  speed: number
  workers: number
}

export type SearchLifecycle =
  | 'idle'
  | 'searching'
  | 'stopping'
  | 'found'
  | 'stopped'
  | 'error'

export type SearchControllerCallbacks = {
  onProgress: (progress: SearchProgress) => void
  onFound: (wallet: FoundWallet, searchId: number) => void
  onError: (message: string, searchId: number) => void
  onStopped: (searchId: number) => void
}

export type StartSearchOptions = {
  match: MatchConfig
  plan: WorkerPlan
  needsPolyfill: boolean
  progressEvery?: number
}

/**
 * Multi-worker vanity search controller with explicit search IDs.
 * First accepted match wins; stale search messages are ignored.
 */
export class SearchController {
  private workers: Worker[] = []
  private attempts = 0
  private startTime = 0
  private lifecycle: SearchLifecycle = 'idle'
  private activeSearchId = 0
  private nextSearchId = 1
  private winnerAccepted = false
  private uiTimer: number | null = null
  private readonly callbacks: SearchControllerCallbacks
  private lastWorkerCount = 0

  constructor(callbacks: SearchControllerCallbacks) {
    this.callbacks = callbacks
  }

  get isSearching(): boolean {
    return this.lifecycle === 'searching'
  }

  get currentLifecycle(): SearchLifecycle {
    return this.lifecycle
  }

  get currentSearchId(): number {
    return this.activeSearchId
  }

  getAttemptCount(): number {
    return this.attempts
  }

  getElapsedMs(): number {
    if (!this.startTime) return 0
    return Date.now() - this.startTime
  }

  getSpeed(): number {
    const seconds = this.getElapsedMs() / 1000
    if (seconds <= 0) return 0
    return Math.round(this.attempts / seconds)
  }

  get hasAcceptedWinner(): boolean {
    return this.winnerAccepted
  }

  getActiveWorkerCountForTests(): number {
    return this.workers.length
  }

  start(options: StartSearchOptions): number {
    this.stop({ silent: true })

    const searchId = this.nextSearchId++
    this.activeSearchId = searchId
    this.lifecycle = 'searching'
    this.winnerAccepted = false
    this.attempts = 0
    this.startTime = Date.now()
    this.lastWorkerCount = options.plan.workers

    const workerCount = options.plan.workers
    const progressEvery = options.progressEvery ?? 1000

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(new URL('../kitWorker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
        this.handleWorkerMessage(event.data)
      }

      worker.onerror = (event) => {
        event.preventDefault()
        if (this.activeSearchId !== searchId || this.lifecycle !== 'searching') {
          return
        }
        this.callbacks.onError(
          'A generation worker crashed. Please try again or lower Performance settings.',
          searchId
        )
        this.stop({ silent: true })
        this.lifecycle = 'error'
      }

      const startMessage: WorkerStartMessage = {
        type: 'start',
        searchId,
        pattern: options.match.pattern,
        endPattern: options.match.endPattern || '',
        position: options.match.position,
        caseSensitive: options.match.caseSensitive,
        batchConcurrency: options.plan.batchConcurrency,
        progressEvery,
        needsPolyfill: options.needsPolyfill,
      }

      worker.postMessage(startMessage)
      this.workers.push(worker)
    }

    this.uiTimer = window.setInterval(() => {
      if (this.lifecycle !== 'searching' || this.activeSearchId !== searchId) {
        return
      }
      this.callbacks.onProgress({
        searchId,
        attempts: this.attempts,
        elapsedMs: this.getElapsedMs(),
        speed: this.getSpeed(),
        workers: workerCount,
      })
    }, 150)

    return searchId
  }

  beginForTests(searchId = 1): void {
    this.activeSearchId = searchId
    this.nextSearchId = searchId + 1
    this.lifecycle = 'searching'
    this.winnerAccepted = false
    this.attempts = 0
    this.startTime = Date.now()
  }

  handleWorkerMessageForTests(data: WorkerOutboundMessage): void {
    this.handleWorkerMessage(data)
  }

  private isActiveSearch(searchId: number): boolean {
    return (
      searchId === this.activeSearchId &&
      (this.lifecycle === 'searching' || this.lifecycle === 'stopping')
    )
  }

  private handleWorkerMessage(data: WorkerOutboundMessage): void {
    if (!('searchId' in data) || !this.isActiveSearch(data.searchId)) {
      return
    }

    // After stop begins, ignore everything except we already ignore via lifecycle.
    if (this.lifecycle === 'stopping') {
      return
    }

    if (data.type === 'progress') {
      if (this.lifecycle !== 'searching') return
      this.attempts += data.attempts
      return
    }

    if (data.type === 'error') {
      if (this.winnerAccepted || this.lifecycle !== 'searching') return
      this.lifecycle = 'error'
      this.callbacks.onError(data.message, data.searchId)
      this.stop({ silent: true })
      return
    }

    if (data.type === 'found') {
      if (this.winnerAccepted || this.lifecycle !== 'searching') return
      this.winnerAccepted = true
      this.lifecycle = 'found'

      const wallet: FoundWallet = {
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        secretKey: new Uint8Array(data.secretKey),
      }

      this.stop({ silent: true })
      this.callbacks.onFound(wallet, data.searchId)
      return
    }

    if (data.type === 'ready') {
      if (this.lifecycle !== 'searching') return
      this.callbacks.onProgress({
        searchId: data.searchId,
        attempts: this.attempts,
        elapsedMs: this.getElapsedMs(),
        speed: this.getSpeed(),
        workers: this.lastWorkerCount,
      })
    }
  }

  stop(options?: { silent?: boolean }): void {
    const searchId = this.activeSearchId
    const wasSearching = this.lifecycle === 'searching'

    if (wasSearching) {
      this.lifecycle = 'stopping'
    }

    if (this.uiTimer != null) {
      window.clearInterval(this.uiTimer)
      this.uiTimer = null
    }

    const workers = this.workers
    this.workers = []

    for (const worker of workers) {
      try {
        worker.postMessage({ type: 'cancel', searchId })
      } catch {
        // Worker may already be gone.
      }
      try {
        worker.terminate()
      } catch {
        // Ignore.
      }
    }

    if (wasSearching && !options?.silent && !this.winnerAccepted) {
      this.lifecycle = 'stopped'
      this.callbacks.onStopped(searchId)
      return
    }

    if (this.lifecycle === 'stopping') {
      this.lifecycle = this.winnerAccepted ? 'found' : 'idle'
    }
  }
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function describeSearchTarget(
  pattern: string,
  endPattern: string,
  position: SearchPosition
): string {
  if (position === 'bothEnds') {
    return `${pattern}…${endPattern}`
  }
  return pattern
}
