export const RECENT_WALLETS_KEY = 'cbs-recent-wallets'

export type RecentWallet = {
  publicKey: string
  pattern: string
  position: string
  createdAt: string
}

const SECRET_FIELD_NAMES = [
  'privateKey',
  'secretKey',
  'seed',
  'seedPhrase',
  'mnemonic',
  'pkcs8',
  'secret',
  'rawSecret',
  'private',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Strip any recoverable secret fields from a stored wallet entry.
 * Never logs or returns the removed secret values.
 */
export function sanitizeRecentWalletEntry(raw: unknown): RecentWallet | null {
  if (!isRecord(raw)) return null

  const publicKey = raw.publicKey
  if (typeof publicKey !== 'string' || !publicKey) return null

  const pattern = typeof raw.pattern === 'string' ? raw.pattern : ''
  const position = typeof raw.position === 'string' ? raw.position : ''
  const createdAt =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : new Date().toLocaleString()

  return { publicKey, pattern, position, createdAt }
}

export function migrateRecentWalletsJson(rawJson: string | null): {
  wallets: RecentWallet[]
  removedSecretFields: boolean
} {
  if (!rawJson) {
    return { wallets: [], removedSecretFields: false }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return { wallets: [], removedSecretFields: false }
  }

  if (!Array.isArray(parsed)) {
    return { wallets: [], removedSecretFields: false }
  }

  let removedSecretFields = false
  const wallets: RecentWallet[] = []

  for (const entry of parsed) {
    if (isRecord(entry)) {
      for (const field of SECRET_FIELD_NAMES) {
        if (field in entry && entry[field] != null && entry[field] !== '') {
          removedSecretFields = true
        }
      }
    }

    const cleaned = sanitizeRecentWalletEntry(entry)
    if (cleaned) {
      wallets.push(cleaned)
    }
  }

  return { wallets: wallets.slice(0, 10), removedSecretFields }
}

export function loadRecentWallets(
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage
): RecentWallet[] {
  const { wallets, removedSecretFields } = migrateRecentWalletsJson(
    storage.getItem(RECENT_WALLETS_KEY)
  )

  if (removedSecretFields || wallets.length >= 0) {
    // Always rewrite so any secret fields are purged from disk.
    storage.setItem(RECENT_WALLETS_KEY, JSON.stringify(wallets))
  }

  return wallets
}

export function saveRecentWallet(
  wallet: RecentWallet,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage
): RecentWallet[] {
  const publicOnly = sanitizeRecentWalletEntry(wallet)
  if (!publicOnly) return loadRecentWallets(storage)

  const existing = loadRecentWallets(storage).filter(
    (entry) => entry.publicKey !== publicOnly.publicKey
  )
  const wallets = [publicOnly, ...existing].slice(0, 10)
  storage.setItem(RECENT_WALLETS_KEY, JSON.stringify(wallets))
  return wallets
}

export function clearRecentWallets(
  storage: Pick<Storage, 'removeItem'> = localStorage
): void {
  storage.removeItem(RECENT_WALLETS_KEY)
}

export function recentWalletHasNoSecrets(raw: unknown): boolean {
  if (!isRecord(raw)) return false

  for (const field of SECRET_FIELD_NAMES) {
    if (field in raw && raw[field] != null && raw[field] !== '') {
      return false
    }
  }

  return typeof raw.publicKey === 'string'
}
