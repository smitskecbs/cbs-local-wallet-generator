import { describe, expect, it } from 'vitest'
import {
  loadRecentWallets,
  migrateRecentWalletsJson,
  recentWalletHasNoSecrets,
  RECENT_WALLETS_KEY,
  saveRecentWallet,
  sanitizeRecentWalletEntry,
} from './recentWallets'

function memoryStorage(initial?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    raw: map,
  }
}

describe('recentWallets security', () => {
  it('strips secret fields during sanitize', () => {
    const cleaned = sanitizeRecentWalletEntry({
      publicKey: 'Pub123',
      pattern: 'Pub',
      position: 'prefix',
      createdAt: 'now',
      privateKey: 'SHOULD_NOT_PERSIST',
      secretKey: [1, 2, 3],
    })

    expect(cleaned).toEqual({
      publicKey: 'Pub123',
      pattern: 'Pub',
      position: 'prefix',
      createdAt: 'now',
    })
    expect(recentWalletHasNoSecrets(cleaned)).toBe(true)
  })

  it('migrates legacy localStorage entries and removes secrets', () => {
    const legacy = JSON.stringify([
      {
        publicKey: 'Addr1',
        pattern: 'Ad',
        position: 'prefix',
        privateKey: 'secret-material',
        createdAt: 'yesterday',
      },
    ])

    const { wallets, removedSecretFields } = migrateRecentWalletsJson(legacy)
    expect(removedSecretFields).toBe(true)
    expect(wallets[0]?.publicKey).toBe('Addr1')
    expect('privateKey' in (wallets[0] as object)).toBe(false)
  })

  it('persists public-only data on save/load', () => {
    const storage = memoryStorage({
      [RECENT_WALLETS_KEY]: JSON.stringify([
        {
          publicKey: 'Old',
          pattern: 'O',
          position: 'prefix',
          privateKey: 'leak',
          createdAt: 'old',
        },
      ]),
    })

    const loaded = loadRecentWallets(storage)
    expect(loaded).toHaveLength(1)
    expect(loaded[0]).not.toHaveProperty('privateKey')

    const persisted = JSON.parse(storage.raw.get(RECENT_WALLETS_KEY)!)
    expect(recentWalletHasNoSecrets(persisted[0])).toBe(true)

    saveRecentWallet(
      {
        publicKey: 'NewAddr',
        pattern: 'New',
        position: 'prefix',
        createdAt: 'now',
      },
      storage
    )

    const after = JSON.parse(storage.raw.get(RECENT_WALLETS_KEY)!) as Array<
      Record<string, unknown>
    >
    expect(after.every((wallet) => recentWalletHasNoSecrets(wallet))).toBe(true)
    expect(after[0]?.publicKey).toBe('NewAddr')
  })
})
