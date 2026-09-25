/**
 * Found-result session lifecycle (memory-only secrets).
 *
 * found-unsecured  → keypair in memory, backup not confirmed
 * found-backed-up  → user explicitly confirmed they backed up (secret still in memory)
 * cleared          → secret wiped
 */
export type FoundBackupStatus = 'unsecured' | 'downloaded' | 'confirmed'

export type FoundLifecycle = 'found-unsecured' | 'found-backed-up' | 'cleared'

export function lifecycleFromBackupStatus(
  status: FoundBackupStatus | null
): FoundLifecycle {
  if (!status) return 'cleared'
  if (status === 'confirmed') return 'found-backed-up'
  return 'found-unsecured'
}

/** True when leaving/clearing requires a strong discard warning. */
export function requiresDiscardWarning(
  status: FoundBackupStatus | null
): boolean {
  return status === 'unsecured' || status === 'downloaded'
}

export function markDownloaded(
  status: FoundBackupStatus
): FoundBackupStatus {
  if (status === 'confirmed') return 'confirmed'
  return 'downloaded'
}

export function markConfirmed(): FoundBackupStatus {
  return 'confirmed'
}
