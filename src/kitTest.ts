import { grindKeyPair } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import bs58 from 'bs58'

export async function testKitGrind() {
  const keyPair = await grindKeyPair({
    matches: /^CBS/i,
    extractable: true,
  })

  const address = await getAddressFromPublicKey(keyPair.publicKey)

  const pkcs8Bytes = new Uint8Array(
    await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  )

  const publicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', keyPair.publicKey)
  )

  const privateSeedBytes = pkcs8Bytes.slice(-32)

  const secretKey64 = new Uint8Array(64)
  secretKey64.set(privateSeedBytes, 0)
  secretKey64.set(publicKeyBytes, 32)

  const phantomPrivateKey = bs58.encode(secretKey64)

  console.log('Kit address:', address)
  console.log('PKCS8 length:', pkcs8Bytes.length)
  console.log('Public key length:', publicKeyBytes.length)
  console.log('Secret key length:', secretKey64.length)
  console.log('Phantom private key:', phantomPrivateKey)

  return {
    address,
    phantomPrivateKey,
    secretKey64,
  }
}