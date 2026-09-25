/**
 * Chromium QA for private-key QR + confirmation flows.
 * Uses disposable pattern "1". Never logs secrets.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createKeyPairFromBytes } from '@solana/keys'
import { getAddressFromPublicKey } from '@solana/addresses'
import bs58 from 'bs58'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4190/'
const OUT = path.join(root, 'qa-artifacts', 'private-qr-qa')
fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const externalRequests = []
  page.on('request', (req) => {
    const url = req.url()
    if (!url.startsWith(BASE) && !url.startsWith('data:')) {
      externalRequests.push(url)
    }
  })

  const downloads = []
  page.on('download', async (d) => {
    const dest = path.join(OUT, d.suggestedFilename())
    await d.saveAs(dest)
    downloads.push(dest)
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('#pattern', '1')
  await page.click('#startBtn')
  await page.waitForSelector('#foundPublicKey', { timeout: 90000 })
  const publicKey = await page.locator('#foundPublicKey').innerText()

  const checks = {
    hiddenInitially: await page.locator('#privateKeyDisplay').getAttribute('data-hidden'),
    copyAbsentInitially: (await page.locator('#copyPrivateBtn').count()) === 0,
    qrAbsentInitially: await page.locator('#qrPanel').evaluate((el) => el.hidden),
    revealCancelKeepsHidden: false,
    revealConfirmShowsSecret: false,
    hideRemovesSecret: false,
    qrCancelKeepsHidden: false,
    qrConfirmShows: false,
    hideQrRemoves: false,
    generateCancelKeepsResult: false,
    generateConfirmClears: false,
    kitRoundTrip: false,
    recentPublicOnly: false,
    externalDuringSecrets: [],
  }

  // Reveal → cancel
  await page.click('#revealPrivateBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.revealCancelKeepsHidden =
    (await page.locator('#privateKeyDisplay').getAttribute('data-hidden')) ===
      'true' && (await page.locator('#copyPrivateBtn').count()) === 0

  // Reveal → confirm
  await page.click('#revealPrivateBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .danger-btn')
  await page.waitForSelector('#copyPrivateBtn')
  checks.revealConfirmShowsSecret =
    (await page.locator('#privateKeyDisplay').getAttribute('data-hidden')) ===
    'false'

  const netBeforeHide = externalRequests.length
  await page.click('#hidePrivateBtn')
  checks.hideRemovesSecret =
    (await page.locator('#privateKeyDisplay').getAttribute('data-hidden')) ===
      'true' && (await page.locator('#copyPrivateBtn').count()) === 0

  // QR → cancel
  await page.click('#showQrBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.qrCancelKeepsHidden = await page
    .locator('#qrPanel')
    .evaluate((el) => el.hidden)

  // QR → confirm
  await page.click('#showQrBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .danger-btn')
  await page.waitForSelector('#qrFrame svg')
  checks.qrConfirmShows = !(await page
    .locator('#qrPanel')
    .evaluate((el) => el.hidden))
  const qrHasSvg = (await page.locator('#qrFrame svg').count()) === 1

  await page.click('#hideQrBtn')
  checks.hideQrRemoves =
    (await page.locator('#qrPanel').evaluate((el) => el.hidden)) &&
    (await page.locator('#qrFrame').count()) === 0

  // Downloads
  await page.click('#downloadTxtBtn')
  await page.click('#downloadJsonBtn')
  await page.waitForTimeout(600)

  const jsonFile = downloads.find((d) => d.endsWith('.json'))
  if (jsonFile) {
    const raw = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
    const secret = Uint8Array.from(raw)
    const keyPair = await createKeyPairFromBytes(secret, false)
    const address = await getAddressFromPublicKey(keyPair.publicKey)
    checks.kitRoundTrip = address === publicKey
    // Also verify base58 of same bytes would be QR payload
    const payload = bs58.encode(secret)
    const again = await createKeyPairFromBytes(bs58.decode(payload), false)
    const againAddr = await getAddressFromPublicKey(again.publicKey)
    checks.kitRoundTrip = checks.kitRoundTrip && againAddr === publicKey
    secret.fill(0)
    fs.writeFileSync(jsonFile, '[]')
  }

  for (const f of downloads.filter((d) => d.endsWith('.txt'))) {
    const text = fs.readFileSync(f, 'utf8')
    fs.writeFileSync(
      f,
      text.replace(
        /Private Key:\n[\s\S]*?\n\n==============================/,
        'Private Key:\n[REDACTED]\n\n=============================='
      )
    )
  }

  checks.externalDuringSecrets = externalRequests.slice(netBeforeHide)

  // Generate another → cancel
  await page.click('#anotherBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.generateCancelKeepsResult =
    (await page.locator('#foundPublicKey').count()) === 1

  // Generate another → confirm
  await page.click('#anotherBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .danger-btn')
  await page.waitForSelector('#startBtn')
  checks.generateConfirmClears =
    (await page.locator('#foundPublicKey').count()) === 0 &&
    (await page.locator('#startBtn').count()) === 1

  checks.recentPublicOnly = await page.evaluate(() => {
    const raw = localStorage.getItem('cbs-recent-wallets')
    if (!raw) return true
    return !/privateKey|secretKey|"seed"|mnemonic/i.test(raw)
  })

  await page.screenshot({
    path: path.join(OUT, 'found-after-flows.png'),
    fullPage: true,
  })

  const report = {
    publicKeyPrefix: publicKey.slice(0, 8) + '…',
    qrHasSvg,
    checks,
    externalRequestsTotal: externalRequests.length,
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))

  await browser.close()

  const ok =
    checks.hiddenInitially === 'true' &&
    checks.copyAbsentInitially &&
    checks.qrAbsentInitially &&
    checks.revealCancelKeepsHidden &&
    checks.revealConfirmShowsSecret &&
    checks.hideRemovesSecret &&
    checks.qrCancelKeepsHidden &&
    checks.qrConfirmShows &&
    qrHasSvg &&
    checks.hideQrRemoves &&
    checks.generateCancelKeepsResult &&
    checks.generateConfirmClears &&
    checks.kitRoundTrip &&
    checks.recentPublicOnly &&
    checks.externalDuringSecrets.length === 0

  if (!ok) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
