/**
 * Brand / UX polish Chromium QA.
 * Disposable patterns only. Never logs secrets.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4195/'
const OUT = path.join(root, 'qa-artifacts', 'brand-polish-qa')
fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const downloads = []
  page.on('download', async (d) => {
    const dest = path.join(OUT, d.suggestedFilename())
    await d.saveAs(dest)
    downloads.push(dest)
    fs.writeFileSync(dest, 'wiped')
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })

  const checks = {
    placeholderNeutral: false,
    noMangoSol: false,
    fieldRuleVisible: false,
    invalidBase58Message: false,
    max5Blocked: false,
    footerDisclosure: false,
    noDevWarning: false,
    noCbsFaviconLink: false,
    generatePrimary: false,
    modeSelectedNotFilledGradient: false,
    startEndContain: false,
    stopWorks: false,
    foundBackup: false,
  }

  const ph = await page.locator('#pattern').getAttribute('placeholder')
  checks.placeholderNeutral = ph === 'Type your text…'
  const bodyText = await page.locator('body').innerText()
  checks.noMangoSol =
    !/\bMango\b/.test(bodyText) &&
    !(await page.locator('#pattern').getAttribute('placeholder'))?.toLowerCase().includes('sol')
  checks.fieldRuleVisible = await page
    .locator('.field-rule')
    .first()
    .isVisible()
  checks.footerDisclosure = /Independent open-source tool for Solana/.test(
    bodyText
  ) && /Not affiliated with the Solana Foundation/.test(bodyText)
  checks.noDevWarning = (await page.locator('.dev-hmr-warning').count()) === 0
  checks.noCbsFaviconLink = await page.evaluate(() => {
    const links = [...document.querySelectorAll('link[rel~="icon"]')]
    return !links.some((l) => (l.getAttribute('href') || '').includes('icon-512'))
  })

  // Invalid Base58
  await page.fill('#pattern', '0')
  await page.waitForSelector('#patternFeedback:not([hidden])')
  const fb = await page.locator('#patternFeedback').innerText()
  checks.invalidBase58Message =
    fb.includes('not available in a Solana address') && fb.includes('0, O, I or l')

  // Max 5 — type beyond should be blocked
  await page.fill('#pattern', '')
  await page.type('#pattern', 'ABCDE')
  await page.keyboard.type('F')
  const val = await page.inputValue('#pattern')
  const maxFb = await page.locator('#patternFeedback').innerText()
  checks.max5Blocked = val === 'ABCDE' && /Maximum 5 characters/.test(maxFb)

  // Modes
  await page.locator('label.mode-tab:has-text("End with")').click()
  await page.locator('label.mode-tab:has-text("Contain")').click()
  await page.locator('label.mode-tab:has-text("Start with")').click()
  checks.startEndContain = true

  const selectedStyle = await page.locator('.mode-tab input:checked + span').evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      bgImage: cs.backgroundImage,
      bgColor: cs.backgroundColor,
      color: cs.color,
    }
  })
  // Selected stays dark/glass (not a bright filled gradient chip)
  checks.modeSelectedNotFilledGradient =
    selectedStyle.bgImage.includes('linear-gradient') &&
    !/rgb\(\s*0,\s*255,\s*163/.test(selectedStyle.bgColor) &&
    !selectedStyle.color.includes('4, 16, 24') // old dark-on-neon text

  checks.generatePrimary = await page.locator('#startBtn.primary-btn').isVisible()

  await page.screenshot({ path: path.join(OUT, 'idle-validation-1440.png') })

  // Valid generate → stop
  await page.fill('#pattern', 'Ab1')
  // Ab1 may be invalid if 1 ok - 1 is valid base58
  await page.fill('#pattern', 'AbCd')
  await page.click('#startBtn')
  await page.waitForSelector('#stopBtn', { timeout: 15000 })
  await page.screenshot({ path: path.join(OUT, 'searching-1440.png') })
  await page.click('#stopBtn')
  await page.waitForSelector('#tryAgainBtn')
  checks.stopWorks = true
  await page.click('#tryAgainBtn')

  // Found + backup
  await page.fill('#pattern', '1')
  await page.click('#startBtn')
  await page.waitForSelector('#foundPublicKey', { timeout: 90000 })
  await page.click('#downloadKeyBackupBtn')
  await page.waitForSelector('#confirmBackupCheck')
  await page.locator('#confirmBackupCheck').evaluate((el) => {
    el.checked = true
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await page.waitForFunction(
    () =>
      document.querySelector('.found-panel')?.getAttribute('data-lifecycle') ===
      'found-backed-up'
  )
  checks.foundBackup = true
  checks.noDevWarning =
    checks.noDevWarning && (await page.locator('.dev-hmr-warning').count()) === 0

  await page.screenshot({ path: path.join(OUT, 'found-1440.png') })

  for (const vp of [
    { name: '1920x1080', w: 1920, h: 1080 },
    { name: '1366x768', w: 1366, h: 768 },
    { name: '390x844', w: 390, h: 844, mobile: true },
  ]) {
    const p = await browser.newPage({
      viewport: { width: vp.w, height: vp.h },
      isMobile: !!vp.mobile,
    })
    await p.goto(BASE, { waitUntil: 'networkidle' })
    await p.screenshot({ path: path.join(OUT, `idle-${vp.name}.png`) })
    await p.close()
  }

  const report = { checks }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()

  const ok = Object.values(checks).every(Boolean)
  if (!ok) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
