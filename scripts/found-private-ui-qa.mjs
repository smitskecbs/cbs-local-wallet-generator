/**
 * Found-state UI regression (no secrets logged).
 * Exercises reveal gating + Kit round-trip on a fresh generated keypair.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createKeyPairFromBytes } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/'
const OUT = path.join(root, 'qa-artifacts', 'found-private-ui')

fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const downloads = []
  page.on('download', async (d) => {
    const dest = path.join(OUT, d.suggestedFilename())
    await d.saveAs(dest)
    downloads.push({ name: d.suggestedFilename(), dest })
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('#startBtn')
  await page.fill('#pattern', '1')
  await page.click('#startBtn')
  await page.waitForSelector('#foundPublicKey', { timeout: 90000 })

  const publicKey = await page.locator('#foundPublicKey').innerText()
  const revealVisible = await page.locator('#revealPrivateBtn').isVisible()
  const privateSectionVisible = await page.locator('#privateKeySection').isVisible()
  const copyPrivateBefore = await page.locator('#copyPrivateBtn').count()
  const hiddenAttr = await page
    .locator('#privateKeyDisplay')
    .getAttribute('data-hidden')
  const maskedText = await page.locator('#privateKeyDisplay').innerText()
  const looksMasked = maskedText.includes('•') && !maskedText.match(/[1-9A-HJ-NP-Za-km-z]{32,}/)

  await page.screenshot({
    path: path.join(OUT, 'found-before-reveal.png'),
    fullPage: true,
  })

  await page.click('#revealPrivateBtn')
  await page.waitForSelector('#copyPrivateBtn')
  const copyAfterReveal = await page.locator('#copyPrivateBtn').isVisible()
  const revealedAttr = await page
    .locator('#privateKeyDisplay')
    .getAttribute('data-hidden')
  // Do not read or log private key text.
  const revealedLength = await page.locator('#privateKeyDisplay').evaluate((el) =>
    (el.textContent || '').length
  )

  await page.click('#downloadTxtBtn')
  await page.click('#downloadJsonBtn')
  await page.waitForTimeout(800)

  const jsonDownload = downloads.find((d) => d.name.endsWith('.json'))
  let kitRoundTrip = false
  if (jsonDownload) {
    const raw = JSON.parse(fs.readFileSync(jsonDownload.dest, 'utf8'))
    if (Array.isArray(raw) && raw.length === 64) {
      const secret = Uint8Array.from(raw)
      const keyPair = await createKeyPairFromBytes(secret, false)
      const address = await getAddressFromPublicKey(keyPair.publicKey)
      kitRoundTrip = address === publicKey
      secret.fill(0)
    }
    // Wipe file contents after verify (do not leave secret on disk in report path ideally)
    fs.writeFileSync(jsonDownload.dest, '[]')
  }

  const txtDownload = downloads.find((d) => d.name.endsWith('.txt'))
  if (txtDownload) {
    // Redact any secret lines from the saved QA artifact
    const text = fs.readFileSync(txtDownload.dest, 'utf8')
    const redacted = text.replace(
      /Private Key:\n[\s\S]*?\n\n==============================/,
      'Private Key:\n[REDACTED]\n\n=============================='
    )
    fs.writeFileSync(txtDownload.dest, redacted)
  }

  // Persistence checks
  const localKeys = await page.evaluate(() => Object.keys(localStorage))
  const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage))
  const recentHasPrivate = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('cbs-recent-wallets')
      if (!raw) return false
      return /privateKey|secretKey|"seed"|mnemonic/i.test(raw)
    } catch {
      return false
    }
  })

  const report = {
    publicKeyPrefix: publicKey.slice(0, 8) + '…',
    privateSectionVisible,
    revealVisible,
    copyPrivateBeforeReveal: copyPrivateBefore,
    privateHiddenByDefault: hiddenAttr === 'true' && looksMasked,
    copyPrivateAfterReveal: copyAfterReveal,
    revealedDataHiddenFalse: revealedAttr === 'false',
    revealedLengthPositive: revealedLength > 40,
    downloads: downloads.map((d) => d.name),
    kitRoundTripJsonMatchesPublic: kitRoundTrip,
    localStorageKeys: localKeys,
    sessionStorageKeys: sessionKeys,
    recentHasPrivateMaterial: recentHasPrivate,
  }

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))

  await browser.close()

  const ok =
    report.privateSectionVisible &&
    report.revealVisible &&
    report.copyPrivateBeforeReveal === 0 &&
    report.privateHiddenByDefault &&
    report.copyPrivateAfterReveal &&
    report.kitRoundTripJsonMatchesPublic &&
    !report.recentHasPrivateMaterial

  if (!ok) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
