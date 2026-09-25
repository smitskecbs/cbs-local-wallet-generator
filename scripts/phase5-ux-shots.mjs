import { chromium, devices } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'qa-artifacts')
const BASE = 'http://127.0.0.1:4175/'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.screenshot({ path: path.join(OUT, 'ux-simplified-desktop.png'), fullPage: true })

const mobile = await browser.newContext({ ...devices['iPhone 12'] })
const mpage = await mobile.newPage()
await mpage.goto(BASE, { waitUntil: 'networkidle' })
await mpage.screenshot({ path: path.join(OUT, 'ux-simplified-mobile.png'), fullPage: true })

const overflow = await mpage.evaluate(() => ({
  horizontalOverflow:
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  hasContain: !!document.body.innerText.match(/Contain/),
  hasStartWith: !!document.body.innerText.match(/Start with/),
  performanceHidden: !document.body.innerText.includes('Performance\nAUTO') ||
    document.querySelector('details.advanced-block')?.open === false,
}))

console.log(JSON.stringify(overflow, null, 2))
await browser.close()
