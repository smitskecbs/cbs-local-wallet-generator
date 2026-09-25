import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const logs = []
page.on('console', (m) => logs.push(m.text()))

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

const info = await page.evaluate(() => ({
  hint: document.querySelector('#threadHint')?.textContent?.replace(/\s+/g, ' ').trim(),
  difficulty: document.querySelector('#difficultyPanel')?.textContent?.replace(/\s+/g, ' ').trim(),
  csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '',
}))

await page.fill('#pattern', 'Man')
await page.waitForTimeout(100)
info.difficultyAfter = (
  await page.locator('#difficultyPanel').innerText()
).replace(/\s+/g, ' ').trim()

const frameAncestorsNoise = logs.filter((t) => /frame-ancestors/i.test(t))
console.log(
  JSON.stringify(
    {
      info,
      frameAncestorsNoise: frameAncestorsNoise.length,
      uniqueLogs: [...new Set(logs)],
    },
    null,
    2
  )
)
await browser.close()
