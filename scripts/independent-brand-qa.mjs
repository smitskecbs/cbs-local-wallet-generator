/**
 * Independent brand + button redesign QA.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4197/'
const OUT = path.join(root, 'qa-artifacts', 'independent-brand-qa')
fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('download', async (d) => {
    const dest = path.join(OUT, d.suggestedFilename())
    await d.saveAs(dest)
    fs.writeFileSync(dest, 'wiped')
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })

  const checks = {
    noSolanaLogomark: false,
    appIconInHeader: false,
    faviconIsOurs: false,
    primaryTextLight: false,
    segmentedOneControl: false,
    noDevWarning: false,
    footerIndependent: false,
    generateStopGenerate: false,
    foundBackup: false,
  }

  checks.noSolanaLogomark = (await page.locator('img[src*="solana-logomark"]').count()) === 0
  checks.appIconInHeader =
    (await page.locator('.brand-mark[src*="app-icon.svg"]').count()) === 1
  checks.faviconIsOurs = await page.evaluate(() => {
    const icon = document.querySelector('link[rel="icon"]')
    return !!icon && (icon.getAttribute('href') || '').includes('favicon.svg')
  })

  const primaryColor = await page.locator('#startBtn').evaluate((el) => getComputedStyle(el).color)
  checks.primaryTextLight = /rgb\(\s*255,\s*255,\s*255\s*\)/.test(primaryColor)

  checks.segmentedOneControl = await page.evaluate(() => {
    const tabs = document.querySelector('.mode-tabs')
    if (!tabs) return false
    const spans = [...tabs.querySelectorAll('.mode-tab span')]
    const borders = spans.map((s) => getComputedStyle(s).borderTopWidth)
    return borders.every((b) => b === '0px')
  })

  checks.noDevWarning = (await page.locator('.dev-hmr-warning').count()) === 0
  checks.footerIndependent = /Not affiliated with the Solana Foundation/.test(
    await page.locator('.site-footer-copy').innerText()
  )

  await page.screenshot({ path: path.join(OUT, 'idle-1440.png') })

  // Generate → Stop → Generate
  await page.fill('#pattern', 'Abc1')
  // Abc1: 1 is valid; good
  await page.click('#startBtn')
  await page.waitForSelector('#stopBtn', { timeout: 15000 })
  await page.screenshot({ path: path.join(OUT, 'searching-1440.png') })
  await page.click('#stopBtn')
  await page.waitForSelector('#tryAgainBtn')
  await page.screenshot({ path: path.join(OUT, 'stopped-1440.png') })
  await page.click('#tryAgainBtn')
  await page.waitForSelector('#startBtn')
  checks.generateStopGenerate = true

  await page.fill('#pattern', '1')
  await page.click('#startBtn')
  await page.waitForSelector('#foundPublicKey', { timeout: 90000 })
  await page.screenshot({ path: path.join(OUT, 'found-1440.png') })
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
  await page.screenshot({ path: path.join(OUT, 'backup-1440.png') })

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

  // Favicon asset exists and is not Solana/CBS
  const fav = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')
  checks.iconOriginal =
    fav.includes('Key bow') === false
      ? fav.includes('Address notches') || fav.includes('M16.2 12')
      : true
  checks.iconNotSolanaParallelograms = !/parallelogram|solana/i.test(fav)

  const report = { checks }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()

  const required = [
    'noSolanaLogomark',
    'appIconInHeader',
    'faviconIsOurs',
    'primaryTextLight',
    'segmentedOneControl',
    'noDevWarning',
    'footerIndependent',
    'generateStopGenerate',
    'foundBackup',
    'iconNotSolanaParallelograms',
  ]
  if (!required.every((k) => checks[k])) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
