let polyfillInstalled = false

export type Ed25519SupportResult =
  | { ok: true; native: boolean; polyfilled: boolean }
  | { ok: false; reason: string }

async function tryGenerateEd25519(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey({ name: 'Ed25519' }, false, [
      'sign',
      'verify',
    ])
    return true
  } catch {
    return false
  }
}

/**
 * Feature-detect native Ed25519. Only dynamically import the official
 * Solana polyfill when native support is missing.
 */
export async function ensureEd25519Support(): Promise<Ed25519SupportResult> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return {
      ok: false,
      reason:
        'This browser does not provide Web Crypto. Address generation cannot run safely here.',
    }
  }

  if (await tryGenerateEd25519()) {
    return { ok: true, native: true, polyfilled: false }
  }

  try {
    if (!polyfillInstalled) {
      const { install } = await import('@solana/webcrypto-ed25519-polyfill')
      install()
      polyfillInstalled = true
    }
  } catch {
    return {
      ok: false,
      reason:
        'Ed25519 is not supported in this browser and the compatibility polyfill could not be loaded.',
    }
  }

  if (await tryGenerateEd25519()) {
    return { ok: true, native: false, polyfilled: true }
  }

  return {
    ok: false,
    reason:
      'Ed25519 key generation is not available in this browser. Please update Chrome, Firefox, Edge, or Safari and try again.',
  }
}
