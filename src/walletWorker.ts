import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

self.onmessage = (event) => {
  const pattern = event.data.pattern
  const position = event.data.position
  const ignoreCase = event.data.ignoreCase

  const searchPattern =
    ignoreCase ? pattern.toLowerCase() : pattern

  while (true) {
    const keypair = Keypair.generate()

    const publicKey = keypair.publicKey.toBase58()
    const privateKey = bs58.encode(keypair.secretKey)

    const searchablePublicKey =
      ignoreCase ? publicKey.toLowerCase() : publicKey

    const matchesPrefix =
      position === 'prefix' &&
      searchablePublicKey.startsWith(searchPattern)

    const matchesSuffix =
      position === 'suffix' &&
      searchablePublicKey.endsWith(searchPattern)

    if (matchesPrefix || matchesSuffix) {
      self.postMessage({
        type: 'found',
        publicKey,
        privateKey,
        secretKey: Array.from(keypair.secretKey),
      })

      break
    }

    self.postMessage({
      type: 'attempt',
    })
  }
}