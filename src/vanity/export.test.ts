import { describe, expect, it } from 'vitest'
import {
  buildKeyBackupFilename,
  buildWalletBackupText,
  generateAndExportRoundTrip,
  parseKeyBackupText,
  verifySecretMatchesAddress,
} from './export'
import { createKeyPairFromBytes } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import bs58 from 'bs58'

describe('export round-trip (Solana Kit)', () => {
  it('exported 64-byte secret reconstructs the same address', async () => {
    const result = await generateAndExportRoundTrip()

    expect(result.secretKey.byteLength).toBe(64)
    expect(result.verified).toBe(true)
    expect(result.privateKeyBase58.length).toBeGreaterThan(80)

    const again = await verifySecretMatchesAddress(
      result.secretKey,
      result.address
    )
    expect(again).toBe(true)
  })
})

describe('human-readable key backup', () => {
  it('filename uses a safe truncated public-address prefix', () => {
    const name = buildKeyBackupFilename(
      'SMiTs5cA9EVB7dkHjpCzdjWfLDSx65quVabcdef'
    )
    expect(name).toBe('solana-address-backup-SMiTs5cA9EVB.txt')
  })

  it('backup text is human-readable and Kit-round-trips', async () => {
    const result = await generateAndExportRoundTrip()
    const text = buildWalletBackupText(
      result.address,
      result.privateKeyBase58,
      new Date('2026-01-15T12:00:00')
    )

    expect(text).toContain('SOLANA ADDRESS BACKUP')
    expect(text).toContain('Public Address:')
    expect(text).toContain('Private Key:')
    expect(text).toContain('RECOMMENDED STORAGE')
    expect(text).toContain('encrypted USB drive')
    expect(text).not.toMatch(/JSON|Base58|64-byte|Ed25519|seed \|\|/i)

    const parsed = parseKeyBackupText(text)
    expect(parsed).not.toBeNull()
    expect(parsed!.publicAddress).toBe(result.address)
    expect(parsed!.privateKey).toBe(result.privateKeyBase58)

    // Private key must be a single contiguous line in the file.
    const privateLine = text
      .split(/\r?\n/)
      .find(
        (_line, i, lines) =>
          i > 0 && lines[i - 1].trim() === 'Private Key:' && lines[i].trim()
      )
    expect(privateLine?.trim()).toBe(result.privateKeyBase58)

    const secret = bs58.decode(parsed!.privateKey)
    const kp = await createKeyPairFromBytes(secret, false)
    const addr = await getAddressFromPublicKey(kp.publicKey)
    expect(addr).toBe(result.address)
    secret.fill(0)
  })
})
