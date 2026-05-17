import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

self.onmessage = (event) => {
  const pattern = event.data.pattern
  const endPattern = event.data.endPattern
  const position = event.data.position
  const ignoreCase = event.data.ignoreCase

  const searchPattern =
    ignoreCase ? pattern.toLowerCase() : pattern

  const searchEndPattern =
    ignoreCase ? endPattern.toLowerCase() : endPattern

  while (true) {
    const keypair = Keypair.generate()

    const publicKey = keypair.publicKey.toBase58()
    const privateKey = bs58.encode(keypair.secretKey)

    const searchablePublicKey =
      ignoreCase ? publicKey.toLowerCase() : publicKey

    const matchesPrefix =
      (position === 'prefix' || position === 'both') &&
      searchablePublicKey.startsWith(searchPattern)

    const matchesSuffix =
      (position === 'suffix' || position === 'both') &&
      searchablePublicKey.endsWith(searchPattern)

    const matchesBothEnds =
      position === 'bothEnds' &&
      searchablePublicKey.startsWith(searchPattern) &&
      searchablePublicKey.endsWith(searchEndPattern)

    if (matchesPrefix || matchesSuffix || matchesBothEnds) {
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