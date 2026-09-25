/**
 * Header + product mark QA (icon sizes + viewports).
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4198/'
const OUT = path.join(root, 'qa-artifacts', 'header-mark-qa')
fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })

  const svg = fs.readFileSync(path.join(root, 'public/assets/app-icon.svg'), 'utf8')
  const fav = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')

  const checks = {
    brandIsH1: (await page.locator('h1.brand-name').innerText()) === 'Solana Address Generator',
    taglineText: (await page.locator('.brand-tagline').innerText()).includes(
      'Create a custom address for Solana'
    ),
    noGreenPill: (await page.locator('.trust-chip').count()) === 0,
    trustLineItems: (await page.locator('.trust-line li').count()) === 3,
    oneAccentDot: (await page.locator('.trust-dot--accent').count()) === 1,
    noKeyBow: !svg.includes('M16.2 12h10.3') && !svg.toLowerCase().includes('key'),
    twoSegments: (svg.match(/path d=/g) || []).length === 2,
    twoNodes: (svg.match(/<circle /g) || []).length === 2,
    hasFrame: svg.includes('<rect '),
    faviconSynced: fav.includes('Emerging') || fav.includes('h8.5') || fav.includes('circle cx='),
    appIconHeader: (await page.locator('.brand-mark[src*="app-icon.svg"]').count()) === 1,
    faviconOurs: await page.evaluate(() => {
      const href = document.querySelector('link[rel="icon"]')?.getAttribute('href') || ''
      return href.includes('favicon.svg')
    }),
    noSolanaLogo: (await page.locator('img[src*="solana-logomark"]').count()) === 0,
    generatorStillPrimary: await page.locator('#startBtn').isVisible(),
  }

  // Icon size renders — fixed pad so clip is reliable
  for (const size of [16, 32, 30]) {
    const pad = 24
    const box = size + pad * 2
    await page.setContent(`<!doctype html><html><head><style>
      html,body{margin:0;background:#060b16;width:${box}px;height:${box}px}
      img{display:block;margin:${pad}px;width:${size}px;height:${size}px}
    </style></head><body>
      <img src="${BASE}assets/app-icon.svg?v=${Date.now()}" width="${size}" height="${size}" />
    </body></html>`)
    await page.setViewportSize({ width: box, height: box })
    await page.waitForTimeout(80)
    await page.screenshot({ path: path.join(OUT, `icon-${size}.png`) })
  }

  // Favicon with plate
  await page.setContent(`<!doctype html><html><head><style>
    html,body{margin:0;background:#888;width:64px;height:64px}
    img{display:block;margin:16px;width:32px;height:32px}
  </style></head><body>
    <img src="${BASE}favicon.svg?v=${Date.now()}" width="32" height="32" />
  </body></html>`)
  await page.setViewportSize({ width: 64, height: 64 })
  await page.waitForTimeout(80)
  await page.screenshot({ path: path.join(OUT, 'favicon-32.png') })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(OUT, 'idle-1440.png') })

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

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ checks }, null, 2))
  console.log(JSON.stringify({ checks }, null, 2))
  await browser.close()

  if (!Object.values(checks).every(Boolean)) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
