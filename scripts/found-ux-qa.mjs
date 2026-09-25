/**
 * Simplified found-UX + data-loss regression QA.
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
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4193/'
const OUT = path.join(root, 'qa-artifacts', 'found-ux-qa')
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
    downloads.push({ name: d.suggestedFilename(), dest })
  })

  const publicKey = await findDisposable(page)

  const checks = {
    lifecycleUnsecured: await page
      .locator('.found-panel')
      .getAttribute('data-lifecycle'),
    singleBackupCta: (await page.locator('#downloadKeyBackupBtn').count()) === 1,
    noJsonCta: (await page.locator('#downloadJsonBtn').count()) === 0,
    noTxtFormatCta: (await page.locator('#downloadTxtBtn').count()) === 0,
    backupInViewport: await page
      .locator('#downloadKeyBackupBtn')
      .evaluate((el) => {
        const r = el.getBoundingClientRect()
        return r.top >= 0 && r.bottom <= window.innerHeight
      }),
    advancedCollapsed:
      (await page.locator('#privateKeySection').getAttribute('open')) === null,
    generateCancelKeeps: false,
    downloadKeepsProtected: false,
    confirmMarksBackedUp: false,
    kitTxtRoundTrip: false,
    humanReadableBackup: false,
    filenameFormat: false,
    qrCancelKeeps: false,
    qrShowHide: false,
    revealCancelKeeps: false,
    revealHide: false,
    beforeUnloadArmed: false,
    recentPublicOnly: false,
    mobileBackupPrimary: false,
  }

  // Generate another while unsecured → cancel
  await page.click('#anotherBtn')
  await page.waitForSelector('.confirm-dialog')
  const discardTitle = await page.locator('.confirm-dialog-title').innerText()
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.generateCancelKeeps =
    discardTitle.toLowerCase().includes('not been confirmed') &&
    (await page.locator('#foundPublicKey').innerText()) === publicKey

  // QR → cancel
  await page.click('#showQrBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.qrCancelKeeps =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('#qrPanel').evaluate((el) => el.hidden))

  // QR → show → hide
  await page.click('#showQrBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions button:not(.tertiary-btn)')
  await page.waitForSelector('#qrPanel:not([hidden]) svg')
  await page.click('#hideQrBtn')
  await page.waitForFunction(() => {
    const panel = document.querySelector('#qrPanel')
    return panel instanceof HTMLElement && panel.hidden
  })
  checks.qrShowHide =
    (await page.locator('#foundPublicKey').innerText()) === publicKey

  // Advanced reveal → cancel
  await page.locator('#privateKeySection > summary').click()
  await page.click('#revealPrivateBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions .tertiary-btn')
  await page.waitForSelector('.confirm-overlay', { state: 'detached' })
  checks.revealCancelKeeps =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('#privateKeyDisplay').getAttribute('data-hidden')) ===
      'true'

  // Reveal → hide
  await page.click('#revealPrivateBtn')
  await page.waitForSelector('.confirm-dialog')
  await page.click('.confirm-dialog-actions button:not(.tertiary-btn)')
  await page.waitForSelector('#privateKeyDisplay[data-hidden="false"]')
  await page.click('#hidePrivateBtn')
  await page.waitForFunction(() => {
    const el = document.querySelector('#privateKeyDisplay')
    return (
      el instanceof HTMLElement &&
      el.getAttribute('data-hidden') === 'true' &&
      el.hidden
    )
  })
  checks.revealHide =
    (await page.locator('#foundPublicKey').innerText()) === publicKey

  // Download key backup
  await page.click('#downloadKeyBackupBtn')
  await page.waitForTimeout(700)
  checks.downloadKeepsProtected =
    (await page.locator('#foundPublicKey').innerText()) === publicKey &&
    (await page.locator('.found-panel').getAttribute('data-lifecycle')) ===
      'found-unsecured' &&
    (await page.locator('#backupStatus').innerText()).includes('downloaded')

  const txt = downloads.find((d) => d.name.endsWith('.txt'))
  if (txt) {
    checks.filenameFormat = /^solana-address-backup-[1-9A-HJ-NP-Za-km-z]+\.txt$/.test(
      txt.name
    )
    const text = fs.readFileSync(txt.dest, 'utf8')
    checks.humanReadableBackup =
      text.includes('SOLANA ADDRESS BACKUP') &&
      text.includes('Public Address:') &&
      text.includes('Private Key:') &&
      text.includes('encrypted USB drive') &&
      !/JSON|64-byte|Ed25519|seed \|\|/i.test(text)

    const pubMatch = text.match(/Public Address:\s*\r?\n([1-9A-HJ-NP-Za-km-z]+)/)
    const privMatch = text.match(/Private Key:\s*\r?\n([1-9A-HJ-NP-Za-km-z]+)/)
    if (pubMatch && privMatch && pubMatch[1] === publicKey) {
      const secret = bs58.decode(privMatch[1])
      const kp = await createKeyPairFromBytes(secret, false)
      const addr = await getAddressFromPublicKey(kp.publicKey)
      checks.kitTxtRoundTrip = addr === publicKey
      secret.fill(0)
    }
    // Redact artifact
    fs.writeFileSync(txt.dest, text.replace(privMatch?.[1] || '', '[REDACTED]'))
  }

  // Confirm checkbox
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
  checks.confirmMarksBackedUp =
    (await page.locator('.found-panel').getAttribute('data-lifecycle')) ===
    'found-backed-up'

  checks.recentPublicOnly = await page.evaluate(() => {
    const raw = localStorage.getItem('cbs-recent-wallets')
    if (!raw) return true
    return !/privateKey|secretKey|"seed"|mnemonic/i.test(raw)
  })

  await page.screenshot({
    path: path.join(OUT, 'found-desktop.png'),
    fullPage: false,
  })

  // beforeunload while unsecured (separate page)
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
  await unloadPage.waitForTimeout(400)
  checks.beforeUnloadArmed =
    unloadDialogSeen &&
    (await unloadPage.locator('#foundPublicKey').count()) === 1

  // Mobile viewport
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  })
  const mobileDownloads = []
  mobile.on('download', async (d) => {
    const dest = path.join(OUT, 'mobile-' + d.suggestedFilename())
    await d.saveAs(dest)
    mobileDownloads.push(dest)
  })
  await findDisposable(mobile)
  checks.mobileBackupPrimary = await mobile
    .locator('#downloadKeyBackupBtn')
    .evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0
    })
  const overflow = await mobile.evaluate(() => {
    const key = document.querySelector('#foundPublicKey')
    if (!key) return true
    return key.scrollWidth > key.clientWidth + 2
  })
  checks.mobileNoOverflow = !overflow
  await mobile.screenshot({
    path: path.join(OUT, 'found-mobile.png'),
    fullPage: false,
  })

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
    checks.noTxtFormatCta &&
    checks.backupInViewport &&
    checks.advancedCollapsed &&
    checks.generateCancelKeeps &&
    checks.downloadKeepsProtected &&
    checks.confirmMarksBackedUp &&
    checks.kitTxtRoundTrip &&
    checks.humanReadableBackup &&
    checks.filenameFormat &&
    checks.qrCancelKeeps &&
    checks.qrShowHide &&
    checks.revealCancelKeeps &&
    checks.revealHide &&
    checks.beforeUnloadArmed &&
    checks.recentPublicOnly &&
    checks.mobileBackupPrimary &&
    checks.mobileNoOverflow

  if (!ok) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
