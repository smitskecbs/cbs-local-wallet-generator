/**
 * Local private-key QR helpers.
 *
 * QR payload = the same Base58 string used by "Copy private key" and TXT backup
 * (bs58 of the full 64-byte Solana secret: seed || pubkey).
 *
 * Generation uses `uqr` entirely in-process (SVG string). No network.
 */
import { renderSVG } from 'uqr'
import bs58 from 'bs58'
import {
  verifySecretMatchesAddress,
} from './export'

export const PRIVATE_KEY_QR_FORMAT =
  'solana-secret-key-base58-64byte' as const

/**
 * Exact string encoded into the private-key QR.
 * Must match Copy private key / TXT "Private Key:" field.
 */
export function buildPrivateKeyQrPayload(privateKeyBase58: string): string {
  if (!privateKeyBase58 || typeof privateKeyBase58 !== 'string') {
    throw new Error('Private key payload is required.')
  }
  return privateKeyBase58
}

/**
 * Render a local SVG QR for the given payload. Pure client-side.
 */
export function renderPrivateKeyQrSvg(privateKeyBase58: string): string {
  const payload = buildPrivateKeyQrPayload(privateKeyBase58)
  return renderSVG(payload, {
    ecc: 'M',
    border: 2,
    pixelSize: 4,
    blackColor: '#041018',
    whiteColor: '#ffffff',
  })
}

/**
 * Decode a QR payload string (Base58 secret) and verify it matches an address.
 * Used by tests — does not involve scanning images.
 */
export async function verifyPrivateKeyQrPayload(
  payload: string,
  expectedAddress: string
): Promise<boolean> {
  let secretKey: Uint8Array
  try {
    secretKey = bs58.decode(payload)
  } catch {
    return false
  }

  if (secretKey.byteLength !== 64) {
    return false
  }

  try {
    return await verifySecretMatchesAddress(secretKey, expectedAddress)
  } finally {
    secretKey.fill(0)
  }
}
