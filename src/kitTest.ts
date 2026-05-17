import { grindKeyPair } from '@solana/keys'

export async function testKitGrind() {
  const keyPair = await grindKeyPair({
    matches: /^CBS/i,
    extractable: true,
  })

  console.log('Kit keypair:', keyPair)

  return keyPair
}