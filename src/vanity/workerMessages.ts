import type { SearchPosition } from './matching'

export type WorkerStartMessage = {
  type: 'start'
  searchId: number
  pattern: string
  endPattern: string
  position: SearchPosition
  caseSensitive: boolean
  batchConcurrency: number
  progressEvery: number
  needsPolyfill: boolean
}

export type WorkerInboundMessage =
  | WorkerStartMessage
  | { type: 'cancel'; searchId: number }

export type WorkerOutboundMessage =
  | { type: 'ready'; searchId: number }
  | { type: 'progress'; searchId: number; attempts: number }
  | {
      type: 'found'
      searchId: number
      publicKey: string
      privateKey: string
      secretKey: number[]
    }
  | { type: 'cancelled'; searchId: number }
  | { type: 'error'; searchId: number; message: string }
