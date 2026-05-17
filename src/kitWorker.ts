import { grindKeyPair } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import bs58 from 'bs58'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createMatchRegex(
  pattern: string,
  endPattern: string,
  position: string,
  ignoreCase: boolean
) {
  const flags = ignoreCase ? 'i' : ''
  const start = escapeRegex(pattern)
  const end = escapeRegex(endPattern)

  if (position === 'prefix') {
    return new RegExp('^' + start, flags)
  }

  if (position === 'suffix') {
    return new RegExp(start + '$', flags)
  }

  if (position === 'both') {
    return new RegExp('^' + start + '|' + start + '$', flags)
  }

  if (position === 'bothEnds') {
    return new RegExp('^' + start + '.*' + end + '$', flags)
  }

  return new RegExp('^' + start, flags)
}

self.onmessage = async (event) => {
  const pattern = event.data.pattern
  const endPattern = event.data.endPattern || ''
  const position = event.data.position
  const ignoreCase = event.data.ignoreCase

  const matches = createMatchRegex(
    pattern,
    endPattern,
    position,
    ignoreCase
  )

  const startTime = Date.now()

  self.postMessage({
    type: 'started',
  })

  const keyPair = await grindKeyPair({
    matches,
    extractable: true,
  })

  const seconds =
    (Date.now() - startTime) / 1000

  const publicKey = await getAddressFromPublicKey(
    keyPair.publicKey
  )

  const pkcs8Bytes = new Uint8Array(
    await crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    )
  )

  const publicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey(
      'raw',
      keyPair.publicKey
    )
  )

  const privateSeedBytes = pkcs8Bytes.slice(-32)

  const secretKey = new Uint8Array(64)

  secretKey.set(privateSeedBytes, 0)
  secretKey.set(publicKeyBytes, 32)

  const privateKey = bs58.encode(secretKey)

  self.postMessage({
    type: 'found',
    publicKey,
    privateKey,
    secretKey: Array.from(secretKey),
    seconds,
    engine: 'solana-kit',
  })
}