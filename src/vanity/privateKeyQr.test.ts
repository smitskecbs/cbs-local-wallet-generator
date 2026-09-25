import { describe, expect, it } from 'vitest'
import { generateAndExportRoundTrip } from './export'
import {
  PRIVATE_KEY_QR_FORMAT,
  buildPrivateKeyQrPayload,
  renderPrivateKeyQrSvg,
  verifyPrivateKeyQrPayload,
} from './privateKeyQr'

describe('private-key QR payload', () => {
  it('uses the same Base58 secret as copy/TXT and round-trips via Solana Kit', async () => {
    const result = await generateAndExportRoundTrip()

    const payload = buildPrivateKeyQrPayload(result.privateKeyBase58)
    expect(payload).toBe(result.privateKeyBase58)
    expect(PRIVATE_KEY_QR_FORMAT).toBe('solana-secret-key-base58-64byte')

    const verified = await verifyPrivateKeyQrPayload(
      payload,
      result.address
    )
    expect(verified).toBe(true)

    const svg = renderPrivateKeyQrSvg(result.privateKeyBase58)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.includes('http://www.w3.org/2000/svg')).toBe(true)
    // SVG must not embed the secret as readable text content.
    expect(svg.includes(result.privateKeyBase58)).toBe(false)

    result.secretKey.fill(0)
  })

  it('rejects empty payload', () => {
    expect(() => buildPrivateKeyQrPayload('')).toThrow()
  })
})
