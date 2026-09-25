import {
  createKeyPairFromBytes,
  generateKeyPair,
} from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import bs58 from 'bs58'

/**
 * Assemble Solana's conventional 64-byte secret key:
 * 32-byte private seed + 32-byte public key.
 *
 * Uses the same PKCS8 layout approach as @solana/keys writeKeyPair
 * (private seed starts at byte offset 16 in PKCS8).
 */
export async function exportSolanaSecretKey(
  keyPair: CryptoKeyPair
): Promise<Uint8Array> {
  const [pkcs8, publicKeyRaw] = await Promise.all([
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    crypto.subtle.exportKey('raw', keyPair.publicKey),
  ])

  const pkcs8Bytes = new Uint8Array(pkcs8)
  const privateSeedBytes = pkcs8Bytes.slice(16)

  if (privateSeedBytes.byteLength !== 32) {
    throw new Error('Unexpected private key length after PKCS8 export.')
  }

  const publicKeyBytes = new Uint8Array(publicKeyRaw)
  if (publicKeyBytes.byteLength !== 32) {
    throw new Error('Unexpected public key length.')
  }

  const secretKey = new Uint8Array(64)
  secretKey.set(privateSeedBytes, 0)
  secretKey.set(publicKeyBytes, 32)
  return secretKey
}

export async function secretKeyToBase58(secretKey: Uint8Array): Promise<string> {
  return bs58.encode(secretKey)
}

export async function verifySecretMatchesAddress(
  secretKey: Uint8Array,
  expectedAddress: string
): Promise<boolean> {
  const keyPair = await createKeyPairFromBytes(secretKey, false)
  const address = await getAddressFromPublicKey(keyPair.publicKey)
  return address === expectedAddress
}

export async function generateAndExportRoundTrip(): Promise<{
  address: string
  secretKey: Uint8Array
  privateKeyBase58: string
  verified: boolean
}> {
  const keyPair = await generateKeyPair(true)
  const address = await getAddressFromPublicKey(keyPair.publicKey)
  const secretKey = await exportSolanaSecretKey(keyPair)
  const privateKeyBase58 = await secretKeyToBase58(secretKey)
  const verified = await verifySecretMatchesAddress(secretKey, address)

  return { address, secretKey, privateKeyBase58, verified }
}

/**
 * Human-readable single-file key backup (UTF-8 .txt).
 * Private key line uses the same Base58 64-byte secret verified by Kit round-trips.
 */
export function buildWalletBackupText(
  publicKey: string,
  privateKey: string,
  createdAt: Date = new Date()
): string {
  const created = createdAt.toLocaleString()
  return (
    'SOLANA ADDRESS BACKUP\n' +
    '=====================\n\n' +
    'Public Address:\n' +
    publicKey +
    '\n\n' +
    'Private Key:\n' +
    privateKey +
    '\n\n' +
    'Created:\n' +
    created +
    '\n\n' +
    'IMPORTANT\n' +
    '---------\n' +
    'This private key gives full control of this wallet.\n\n' +
    'Anyone with this private key can control the wallet and its funds.\n\n' +
    'Never share this file or private key with anyone.\n\n' +
    'RECOMMENDED STORAGE\n' +
    '-------------------\n' +
    '- Store this backup offline.\n' +
    '- An encrypted USB drive is one practical option.\n' +
    '- Consider keeping a second secure offline backup if the wallet will hold valuable assets.\n' +
    '- Avoid cloud storage, email, chat messages and screenshots.\n' +
    '- After verifying your backup, remove unnecessary copies from this computer.\n\n' +
    'VERIFY YOUR BACKUP\n' +
    '------------------\n' +
    'After importing the private key into a compatible Solana wallet, verify that the wallet shows this exact public address:\n\n' +
    publicKey +
    '\n'
  )
}

/** Safe download filename: solana-address-backup-<prefix>.txt */
export function buildKeyBackupFilename(publicKey: string): string {
  const safe = publicKey.replace(/[^1-9A-HJ-NP-Za-km-z]/g, '').slice(0, 12)
  const prefix = safe || 'address'
  return `solana-address-backup-${prefix}.txt`
}

/**
 * Parse the human-readable backup produced by buildWalletBackupText.
 * Returns null if Public Address / Private Key lines cannot be found.
 */
export function parseKeyBackupText(content: string): {
  publicAddress: string
  privateKey: string
} | null {
  const publicMatch = content.match(
    /Public Address:\s*\r?\n([1-9A-HJ-NP-Za-km-z]+)/
  )
  const privateMatch = content.match(
    /Private Key:\s*\r?\n([1-9A-HJ-NP-Za-km-z]+)/
  )
  if (!publicMatch || !privateMatch) return null
  return {
    publicAddress: publicMatch[1],
    privateKey: privateMatch[1],
  }
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * JSON byte-array export retained for tests / tooling only.
 * Not shown in the normal found UI.
 */
export function downloadJsonKeypair(
  secretKey: Uint8Array,
  publicKey: string
): void {
  const blob = new Blob([JSON.stringify(Array.from(secretKey))], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'wallet-' + publicKey + '.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Best-effort session wipe. JavaScript cannot guarantee secure zeroization.
 */
export function wipeSecretMaterial(material: {
  privateKey?: string
  secretKey?: Uint8Array | null
}): void {
  if (material.secretKey) {
    material.secretKey.fill(0)
  }
  if (typeof material.privateKey === 'string') {
    material.privateKey = ''
  }
}
