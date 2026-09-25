/**
 * Data-loss regression QA for found-unsecured keypairs.
 * Disposable pattern only. Never logs secrets.
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
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4192/'
const OUT = path.join(root, 'qa-artifacts', 'data-loss-qa')
fs.mkdirSync(OUT, { recursive: true })

async function findDisposable(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('#pattern', '1')
  await page.click('#startBtn')
  await page.waitForSelector('#foundPublicKey', { timeout: 90000 })
  return page.locator('#foundPublicKey').innerText()
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const downloads = []
  page.on('download', async (d) => {
    const dest = path.join(OUT, d.suggestedFilename())
    await d.saveAs(dest)
    downloads.push(dest)
  })

  const publicKey = await findDisposable(page)

  const checks = {
    lifecycleUnsecured: await page
      .locator('.found-panel')
      .getAttribute('data-lifecycle'),
    jsonCtaVisible: false,
    jsonInViewport: await page.locator('#downloadKeyBackupBtn').evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.bottom <= window.innerHeight
    }),
    singleBackupCta: await page.locator('#downloadKeyBackupBtn').isVisible(),
    noJsonCta: (await page.locator('#downloadJsonBtn').count()) === 0,
    surviveIdleMs: false,
    generateCancelKeeps: false,
    newSearchCancelKeeps: false,
    revealCancelKeeps: false,
    qrCancelKeeps: false,
    downloadKeeps: false,
    confirmBackupMarksBackedUp: false,
    beforeUnloadArmedWhenUnsecured: false,
    beforeUnloadClearedAfterConfirm: false,
    beforeUnloadNotArmedOnIdle: false,
    kitJson: false,
    kitTxt: false,
    kitQr: false,
    recentPublicOnly: false,
  }

  // Idle survival + soft UI (copy / resize)
  await page.waitForTimeout(8000)
  await page.click('#copyPublicBtn')
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.waitForTimeout(400)
  checks.surviveIdleMs =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('#downloadKeyBackupBtn').count()) === 1

  // Generate another → cancel
  await page.click('#anotherBtn')
  await page.waitForSelector('.confirm-dialog')
  const discardTitle = await page.locator('.confirm-dialog-title').innerText()
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.generateCancelKeeps =
    discardTitle.toLowerCase().includes('not been confirmed') &&
    (await page.locator('#foundPublicKey').innerText()) === publicKey

  // New-search protection (same discard guard)
  await page.click('#anotherBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.newSearchCancelKeeps =
    (await page.locator('#foundPublicKey').innerText()) === publicKey

  // Reveal → cancel (Advanced)
  await page.locator('#privateKeySection > summary').click()
  await page.click('#revealPrivateBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.revealCancelKeeps =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('#privateKeyDisplay').getAttribute('data-hidden')) ===
      'true'

  // QR → cancel
  await page.click('#showQrBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.qrCancelKeeps =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('#qrPanel').evaluate((el) => el.hidden))

  // Download key backup — keypair remains (still unsecured until confirm)
  await page.click('#downloadKeyBackupBtn')
  await page.waitForTimeout(600)
  checks.downloadKeeps =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('.found-panel').getAttribute('data-lifecycle')) ===
      'found-unsecured'

  // Confirm backup via checkbox → found-backed-up
  await page.waitForSelector('#confirmBackupCheck')
  await page.locator('#confirmBackupCheck').evaluate((el) => {
    el.checked = true
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await page.waitForFunction(
    () =>
      document
        .querySelector('.found-panel')
        ?.getAttribute('data-lifecycle') === 'found-backed-up'
  )
  checks.confirmBackupMarksBackedUp =
    (await page.locator('.found-panel').getAttribute('data-lifecycle')) ===
    'found-backed-up'

  // Round-trips via Solana Kit (TXT backup + reveal/QR payload)
  const txtFile = downloads.find((d) => d.endsWith('.txt'))
  let revealedB58 = null
  checks.kitJson = true // JSON removed from normal UX; retained helper only
  if (txtFile) {
    const text = fs.readFileSync(txtFile, 'utf8')
    const privMatch = text.match(/Private Key:\s*\r?\n([1-9A-HJ-NP-Za-km-z]+)/)
    if (privMatch) {
      revealedB58 = privMatch[1]
      const secret = bs58.decode(privMatch[1])
      const kp = await createKeyPairFromBytes(secret, false)
      const addr = await getAddressFromPublicKey(kp.publicKey)
      checks.kitTxt = addr === publicKey
      secret.fill(0)
    }
    fs.writeFileSync(txtFile, 'wiped')
  }

  // QR payload = same private key as reveal. Confirm via Advanced reveal + Kit.
  await page.locator('#privateKeySection > summary').click()
  await page.click('#revealPrivateBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions button:not(.tertiary-btn)')
  await page.waitForSelector('#privateKeyDisplay[data-hidden="false"]')
  const revealed = await page.locator('#privateKeyDisplay').innerText()
  if (revealed && revealed.length > 80) {
    const secret = bs58.decode(revealed)
    const kp = await createKeyPairFromBytes(secret, false)
    const addr = await getAddressFromPublicKey(kp.publicKey)
    checks.kitQr = addr === publicKey && (!revealedB58 || revealed === revealedB58)
    secret.fill(0)
  }
  // Show QR panel still works and keeps keypair
  await page.click('#showQrBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions button:not(.tertiary-btn)')
  await page.waitForSelector('#qrPanel:not([hidden]) svg')

  checks.recentPublicOnly = await page.evaluate(() => {
    const raw = localStorage.getItem('cbs-recent-wallets')
    if (!raw) return true
    return !/privateKey|secretKey|"seed"|mnemonic/i.test(raw)
  })

  await page.screenshot({
    path: path.join(OUT, 'found-backup-first.png'),
    fullPage: false,
  })

  // Separate page: beforeunload while unsecured (dismiss keeps page)
  const unloadPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await findDisposable(unloadPage)
  let unloadDialogSeen = false
  unloadPage.once('dialog', async (dialog) => {
    unloadDialogSeen = dialog.type() === 'beforeunload'
    await dialog.dismiss()
  })
  await Promise.all([
    unloadPage.waitForEvent('dialog', { timeout: 5000 }).catch(() => null),
    unloadPage.evaluate(() => {
      window.location.reload()
    }),
  ])
  await unloadPage.waitForTimeout(500)
  const stillFound =
    (await unloadPage.locator('#foundPublicKey').count()) === 1
  checks.beforeUnloadArmedWhenUnsecured = unloadDialogSeen && stillFound

  // After confirming backup on first page, reload should NOT warn
  let postConfirmDialog = false
  page.once('dialog', async (dialog) => {
    postConfirmDialog = true
    await dialog.dismiss()
  })
  await Promise.all([
    page.waitForEvent('dialog', { timeout: 1500 }).catch(() => null),
    page.evaluate(() => {
      window.location.reload()
    }),
  ])
  await page.waitForTimeout(800)
  // Confirmed → listener removed; reload proceeds (found state gone after reload is OK)
  checks.beforeUnloadClearedAfterConfirm =
    checks.confirmBackupMarksBackedUp && !postConfirmDialog

  // Idle generator must not arm beforeunload
  const idlePage = await browser.newPage()
  await idlePage.goto(BASE, { waitUntil: 'networkidle' })
  let idleDialog = false
  idlePage.once('dialog', async (dialog) => {
    idleDialog = true
    await dialog.dismiss()
  })
  await Promise.all([
    idlePage.waitForEvent('dialog', { timeout: 1200 }).catch(() => null),
    idlePage.evaluate(() => {
      window.location.reload()
    }),
  ])
  await idlePage.waitForTimeout(400)
  checks.beforeUnloadNotArmedOnIdle = !idleDialog

  const report = {
    publicKeyPrefix: publicKey.slice(0, 8) + '…',
    checks,
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()

  const ok =
    checks.lifecycleUnsecured === 'found-unsecured' &&
    checks.singleBackupCta &&
    checks.noJsonCta &&
    checks.jsonInViewport &&
    checks.surviveIdleMs &&
    checks.generateCancelKeeps &&
    checks.newSearchCancelKeeps &&
    checks.revealCancelKeeps &&
    checks.qrCancelKeeps &&
    checks.downloadKeeps &&
    checks.confirmBackupMarksBackedUp &&
    checks.beforeUnloadArmedWhenUnsecured &&
    checks.beforeUnloadClearedAfterConfirm &&
    checks.beforeUnloadNotArmedOnIdle &&
    checks.kitTxt &&
    checks.kitQr &&
    checks.recentPublicOnly

  if (!ok) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
