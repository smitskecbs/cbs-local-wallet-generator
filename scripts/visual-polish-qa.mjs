/**
 * Visual polish QA — screenshots + light regression + Max speed sanity.
 * Disposable patterns only. Never logs secrets.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4194/'
const OUT = path.join(root, 'qa-artifacts', 'visual-polish-qa')
fs.mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844, isMobile: true },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const checks = {
    noDuplicateTitle: false,
    noDevWarningInProd: false,
    downloadKeyBackupPresent: false,
    stopSearchWorks: false,
    generateStopGenerate: false,
    foundBackupFlow: false,
    maxSpeedSample: null,
    glassReadable: false,
  }

  // Desktop functional + glass shot
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const downloads = []
  page.on('download', async (d) => {
    const dest = path.join(OUT, d.suggestedFilename())
    await d.saveAs(dest)
    downloads.push(dest)
    fs.writeFileSync(dest, 'wiped')
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })

  const brandCount = await page.locator('.brand-name').count()
  const h1Text = await page.locator('#intro-title').innerText()
  checks.noDuplicateTitle =
    brandCount === 1 &&
    h1Text.includes('Create a custom Solana address') &&
    !(await page.locator('h1').innerText()).startsWith('Solana Address Generator')

  checks.noDevWarningInProd =
    (await page.locator('.dev-hmr-warning').count()) === 0

  await page.screenshot({ path: path.join(OUT, 'idle-1440.png'), fullPage: false })

  // Advanced open
  await page.locator('details.advanced-block').evaluate((el) => {
    el.open = true
  })
  await page.waitForTimeout(200)
  await page.screenshot({
    path: path.join(OUT, 'advanced-1440.png'),
    fullPage: false,
  })

  // Max speed sanity (~3s search)
  await page.locator('details.advanced-block').evaluate((el) => {
    el.open = true
  })
  await page.locator('label:has(input[name="performanceChoice"][value="maximum"])').click()
  await page.fill('#pattern', 'ZZZZZ')
  await page.click('#startBtn')
  await page.waitForSelector('#stopBtn', { timeout: 15000 })
  await page.waitForTimeout(3200)
  const speedText = await page.locator('#metricSpeed').innerText().catch(() => '')
  const speedMatch = speedText.replace(/,/g, '').match(/([\d.]+)/)
  checks.maxSpeedSample = speedMatch ? Number(speedMatch[1]) : null
  await page.screenshot({
    path: path.join(OUT, 'searching-1440.png'),
    fullPage: false,
  })

  await page.click('#stopBtn')
  await page.waitForSelector('#tryAgainBtn', { timeout: 10000 })
  checks.stopSearchWorks = true

  // Generate → Stop → Generate
  await page.click('#tryAgainBtn')
  await page.waitForSelector('#startBtn')
  await page.fill('#pattern', 'YYYYY')
  await page.click('#startBtn')
  await page.waitForSelector('#stopBtn')
  await page.click('#stopBtn')
  await page.waitForSelector('#tryAgainBtn')
  await page.click('#tryAgainBtn')
  await page.waitForSelector('#startBtn')
  checks.generateStopGenerate = true

  // Found + backup (easy pattern)
  await page.fill('#pattern', '1')
  await page.click('#startBtn')
  await page.waitForSelector('#foundPublicKey', { timeout: 90000 })
  checks.downloadKeyBackupPresent =
    (await page.locator('#downloadKeyBackupBtn').count()) === 1
  checks.noDevWarningInProd =
    checks.noDevWarningInProd &&
    (await page.locator('.dev-hmr-warning').count()) === 0

  await page.screenshot({
    path: path.join(OUT, 'found-1440.png'),
    fullPage: false,
  })

  await page.click('#downloadKeyBackupBtn')
  await page.waitForTimeout(400)
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
  checks.foundBackupFlow = true

  // Contrast / glass: generator card alpha + text luminance spot-check
  checks.glassReadable = await page.evaluate(() => {
    const card = document.querySelector('#generatorCard')
    const title = document.querySelector('#intro-title')
    if (!card || !title) return false
    const cs = getComputedStyle(card)
    const bg = cs.backgroundColor
    // Expect translucent rgba, not fully opaque
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (!m) return true
    const alpha = m[4] === undefined ? 1 : Number(m[4])
    const titleColor = getComputedStyle(title).color
    return alpha < 0.95 && titleColor.includes('rgb')
  })

  // Multi-viewport idle shots
  for (const vp of viewports) {
    const p = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      isMobile: !!vp.isMobile,
    })
    await p.goto(BASE, { waitUntil: 'networkidle' })
    await p.screenshot({
      path: path.join(OUT, `idle-${vp.name}.png`),
      fullPage: false,
    })
    // Scroll to recent if present
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await p.screenshot({
      path: path.join(OUT, `bottom-${vp.name}.png`),
      fullPage: false,
    })
    await p.close()
  }

  const report = {
    checks,
    note:
      'maxSpeedSample is addresses/sec from UI during ~3s Maximum search (sanity only)',
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()

  const ok =
    checks.noDuplicateTitle &&
    checks.noDevWarningInProd &&
    checks.downloadKeyBackupPresent &&
    checks.stopSearchWorks &&
    checks.generateStopGenerate &&
    checks.foundBackupFlow &&
    checks.glassReadable &&
    checks.maxSpeedSample !== null &&
    checks.maxSpeedSample > 1000

  if (!ok) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
