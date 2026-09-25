/**
 * Hero banner visual + functional sanity QA.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4199/'
const OUT = path.join(root, 'qa-artifacts', 'hero-banner-qa')
fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const bannerPath = path.join(root, 'public/assets/banner.png')
  const bannerExists = fs.existsSync(bannerPath)

  const browser = await chromium.launch({ headless: true })
  const results = { bannerExists, viewports: {}, functional: {}, checks: {} }

  for (const vp of [
    { name: '1920x1080', w: 1920, h: 1080 },
    { name: '1440x900', w: 1440, h: 900 },
    { name: '1366x768', w: 1366, h: 768 },
    { name: '390x844', w: 390, h: 844, mobile: true },
  ]) {
    const page = await browser.newPage({
      viewport: { width: vp.w, height: vp.h },
      isMobile: !!vp.mobile,
      deviceScaleFactor: 1,
    })
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#generatorCard', { timeout: 15000 })

    const metrics = await page.evaluate(() => {
      const banner = document.querySelector('.hero-banner')
      const img = document.querySelector('.hero-banner-img')
      const brand = document.querySelector('.brand-block')
      const bannerStyle = banner ? getComputedStyle(banner) : null
      const brandStyle = brand ? getComputedStyle(brand) : null
      const bannerVisible = !!banner && bannerStyle.display !== 'none'

      const brandRect = brand?.getBoundingClientRect()
      const brandVisuallyPresent =
        !!brand &&
        brandStyle.display !== 'none' &&
        brandStyle.position !== 'absolute' &&
        (brandRect?.width || 0) > 8 &&
        (brandRect?.height || 0) > 8

      const imgEl = img
      const natural = imgEl
        ? { w: imgEl.naturalWidth, h: imgEl.naturalHeight }
        : { w: 0, h: 0 }
      const imgRect = imgEl?.getBoundingClientRect()
      const display = imgRect
        ? { w: imgRect.width, h: imgRect.height }
        : { w: 0, h: 0 }
      const ratioNat = natural.h ? natural.w / natural.h : 0
      const ratioDisp = display.h ? display.w / display.h : 0
      const ratioOk = !bannerVisible || Math.abs(ratioNat - ratioDisp) < 0.05

      return {
        bannerVisible,
        brandVisuallyPresent,
        bothVisible: bannerVisible && brandVisuallyPresent,
        neitherVisible: !bannerVisible && !brandVisuallyPresent,
        ratioOk,
        natural,
        display,
        hasMark: !!document.querySelector('.brand-mark'),
        bannerSrc: imgEl?.getAttribute('src') || '',
      }
    })

    await page.screenshot({ path: path.join(OUT, `idle-${vp.name}.png`) })
    results.viewports[vp.name] = metrics
    await page.close()
  }

  // Functional sanity — hard pattern so Stop stays visible
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#startBtn', { timeout: 15000 })
  await page.fill('#pattern', 'ZZZZZ')
  await page.click('#startBtn')
  await page.waitForSelector('#stopBtn', { state: 'visible', timeout: 15000 })
  results.functional.started = true
  await page.click('#stopBtn')
  await page.waitForSelector('#tryAgainBtn', { state: 'visible', timeout: 15000 })
  results.functional.stopped = true
  await page.click('#tryAgainBtn')
  await page.waitForSelector('#startBtn', { state: 'visible', timeout: 15000 })
  await page.fill('#pattern', 'YYYYY')
  await page.click('#startBtn')
  await page.waitForSelector('#stopBtn', { state: 'visible', timeout: 15000 })
  results.functional.restarted = true
  await page.click('#stopBtn')
  await page.waitForSelector('#tryAgainBtn', { state: 'visible', timeout: 15000 })
  results.functional.idleAgain = true
  await page.screenshot({ path: path.join(OUT, 'functional-after-stop.png') })
  await page.close()

  const desktop = results.viewports['1440x900']
  const mobile = results.viewports['390x844']
  results.checks = {
    bannerFile: bannerExists,
    desktopBannerOnly:
      !!desktop?.bannerVisible && !desktop?.brandVisuallyPresent && !desktop?.bothVisible,
    mobileFallbackOnly:
      !mobile?.bannerVisible && !!mobile?.brandVisuallyPresent && !mobile?.bothVisible,
    noStretch1440: !!desktop?.ratioOk,
    noMark: !desktop?.hasMark && !mobile?.hasMark,
    bannerAsset: desktop?.bannerSrc?.includes('banner.png'),
    functionalOk: Object.values(results.functional).every(Boolean),
  }

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
  await browser.close()

  if (!Object.values(results.checks).every(Boolean)) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
