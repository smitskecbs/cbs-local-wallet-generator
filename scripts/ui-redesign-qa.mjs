/**
 * UI redesign visual QA — Chromium screenshots + Stop regression checks.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/'
const OUT = path.join(root, 'qa-artifacts', 'ui-redesign')

fs.mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('shot', name)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const report = {
    measuredAt: new Date().toISOString(),
    base: BASE,
    checks: {},
  }

  // Desktop idle
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('#startBtn')

    const cbsInHeader = await page.locator('.site-header').innerText()
    const footer = await page.locator('.site-footer').innerText()
    const logo = await page.locator('.brand-mark').getAttribute('src')
    const bg = await page.evaluate(() => {
      const el = document.querySelector('.page-bg')
      if (!el) return null
      const s = getComputedStyle(el)
      return {
        image: s.backgroundImage,
        size: s.backgroundSize,
        position: s.backgroundPosition,
      }
    })

    report.checks.desktopIdle = {
      title: await page.title(),
      headerText: cbsInHeader,
      headerHasCbs: /CBS/i.test(cbsInHeader),
      footerText: footer.trim(),
      footerHasBuiltByCbs: /Built by\s+CBS Tools/i.test(footer),
      logoSrc: logo,
      background: bg,
      overflowX: await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1
      ),
    }

    await shot(page, 'desktop-1440-idle')

    // Advanced open
    await page.locator('details.advanced-block summary').click()
    await shot(page, 'desktop-1440-advanced')

    // Searching — use improbable pattern so Stop can be tested
    await page.fill('#pattern', 'ZZZZZ')
    await page.click('#startBtn')
    await page.waitForSelector('#stopBtn', { timeout: 15000 })
    await page.waitForSelector('#metricAttempts', { timeout: 15000 })
    await page.waitForTimeout(1500)
    await shot(page, 'desktop-1440-searching')

    // Stop regression
    const attempts1 = await page.locator('#metricAttempts').innerText()
    await page.click('#stopBtn')
    await page.waitForSelector('#tryAgainBtn', { timeout: 15000 })
    await page.waitForTimeout(3500)
    const afterStopMode = await page.locator('#generatorBody').innerText()
    const staleSearching = /Searching for address/i.test(afterStopMode)
    const hasTryAgain = await page.locator('#tryAgainBtn').count()

    report.checks.stopRegression = {
      attemptsBeforeStop: attempts1,
      staleSearchingAfterWait: staleSearching,
      tryAgainVisible: hasTryAgain === 1,
      bodySnippet: afterStopMode.slice(0, 160),
    }

    await shot(page, 'desktop-1440-stopped')
    await page.click('#tryAgainBtn')
    await page.waitForSelector('#startBtn')
    await page.fill('#pattern', 'YYYYY')
    await page.click('#startBtn')
    await page.waitForSelector('#stopBtn', { timeout: 15000 })
    report.checks.stopRegression.generateAfterTryAgain = true
    await page.click('#stopBtn')
    await page.waitForSelector('#tryAgainBtn', { timeout: 15000 })

    await page.close()
  }

  // Mobile idle + searching
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('#startBtn')
    report.checks.mobileIdle = {
      overflowX: await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1
      ),
      brandVisible: (await page.locator('.brand-mark').boundingBox()) != null,
      startBtnWidth: (await page.locator('#startBtn').boundingBox())?.width,
    }
    await shot(page, 'mobile-390-idle')
    await page.fill('#pattern', 'ZZZZZ')
    await page.click('#startBtn')
    await page.waitForSelector('#stopBtn', { timeout: 15000 })
    await page.waitForTimeout(1000)
    await shot(page, 'mobile-390-searching')
    await page.close()
  }

  // Found state (easy pattern)
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('#startBtn')
    await page.fill('#pattern', '1')
    await page.click('#startBtn')
    await page.waitForSelector('#foundPublicKey', { timeout: 60000 })
    await shot(page, 'desktop-1440-found')
    await page.close()
  }

  // 1920 + 1366 crops
  for (const [w, h, name] of [
    [1920, 1080, 'desktop-1920-idle'],
    [1366, 768, 'desktop-1366-idle'],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('#startBtn')
    await shot(page, name)
    await page.close()
  }

  fs.writeFileSync(
    path.join(OUT, 'report.json'),
    JSON.stringify(report, null, 2)
  )
  console.log(JSON.stringify(report, null, 2))
  await browser.close()

  if (
    report.checks.desktopIdle.headerHasCbs ||
    !report.checks.desktopIdle.footerHasBuiltByCbs ||
    report.checks.stopRegression.staleSearchingAfterWait ||
    !report.checks.stopRegression.tryAgainVisible ||
    report.checks.desktopIdle.overflowX ||
    report.checks.mobileIdle.overflowX
  ) {
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
