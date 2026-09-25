/**
 * Reproducible vanity throughput benchmark (Node).
 *
 * Primary metric: attempts/second (never time-to-find).
 *
 * Audit baseline (Node v20, this machine family):
 * - web3.js Keypair.generate + toBase58: ~3,500/sec
 * - Kit grindKeyPair concurrency 32 (single worker): ~25,700/sec
 * - Kit sequential generateKeyPair + address: ~8,500/sec
 *
 * Usage: npm run bench
 */
import { generateKeyPair } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import os from 'node:os'

const HARDWARE = os.cpus().length

async function measureAttemptsPerSecond(options: {
  workers: number
  batchConcurrency: number
  seconds: number
}): Promise<number> {
  const endAt = performance.now() + options.seconds * 1000

  const worker = async () => {
    let attempts = 0
    while (performance.now() < endAt) {
      const batch = await Promise.all(
        Array.from({ length: options.batchConcurrency }, async () => {
          const keyPair = await generateKeyPair(false)
          const address = await getAddressFromPublicKey(keyPair.publicKey)
          return address
        })
      )
      attempts += batch.length
      // Never-match filter to keep the loop honest.
      if (batch.some((address) => address.startsWith('____'))) {
        break
      }
    }
    return attempts
  }

  const totals = await Promise.all(
    Array.from({ length: options.workers }, () => worker())
  )
  const attempts = totals.reduce((sum, n) => sum + n, 0)
  return Math.round(attempts / options.seconds)
}

const AUDIT_BASELINE = {
  web3_approx: 3500,
  kit_grind_c32: 25700,
  kit_sequential: 8500,
}

async function main() {
  const seconds = 2.5
  const matrix = []

  for (const workers of [1, 2, 4, Math.max(1, Math.floor(HARDWARE / 2))]) {
    for (const batchConcurrency of [1, 2, 4, 8, 16, 32]) {
      // Skip extremely large total parallelism to keep the bench tractable.
      if (workers * batchConcurrency > HARDWARE * 4) continue

      const rate = await measureAttemptsPerSecond({
        workers,
        batchConcurrency,
        seconds,
      })
      matrix.push({ workers, batchConcurrency, attemptsPerSec: rate })
      console.log(
        `workers=${workers} concurrency=${batchConcurrency} -> ${rate.toLocaleString()} attempts/sec`
      )
    }
  }

  const autoWorkers = Math.max(1, Math.floor(HARDWARE / 2))
  const autoConcurrency = 2
  const autoRate = await measureAttemptsPerSecond({
    workers: autoWorkers,
    batchConcurrency: autoConcurrency,
    seconds,
  })

  const summary = {
    runtime: process.version,
    hardwareConcurrency: HARDWARE,
    auditBaselineAttemptsPerSec: AUDIT_BASELINE,
    autoPlan: {
      workers: autoWorkers,
      batchConcurrency: autoConcurrency,
      attemptsPerSec: autoRate,
    },
    matrix,
    note: 'Compare attempts/sec only. Vanity completion time is probabilistic and not a valid primary metric.',
  }

  console.log('\nSUMMARY')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
