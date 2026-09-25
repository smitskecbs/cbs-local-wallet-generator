/**
 * Stop Search regression test in real Chromium.
 * Usage: node scripts/phase5-stop-regression.mjs
 */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/'
const OUT = path.join(__dirname, '..', 'qa-artifacts')
fs.mkdirSync(OUT, { recursive: true })

async function runOnce(page, label) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('#pattern', 'ZZZZZ')
  await page.getByRole('button', { name: /generate address/i }).click()
  await page.getByText('Searching for address').waitFor({ timeout: 5000 })

  // Wait until attempts move.
  let attemptsBefore = 0
  for (let i = 0; i < 30; i++) {
    const text = await page.locator('#metricAttempts').innerText()
    attemptsBefore = Number(text.replace(/,/g, '')) || 0
    if (attemptsBefore > 1000) break
    await page.waitForTimeout(200)
  }

  const elapsedBefore = await page.locator('#metricElapsed').innerText()
  await page.getByRole('button', { name: /stop search/i }).click()
  await page.getByText('Search stopped').waitFor({ timeout: 5000 })

  const attemptsAtStop = attemptsBefore
  await page.waitForTimeout(3500)

  const stillSearching = await page.getByText('Searching for address').count()
  const stoppedVisible = await page.getByText('Search stopped').count()

  // Try again → form restored → generate again
  await page.getByRole('button', { name: /try again/i }).click()
  await page.getByRole('button', { name: /generate address/i }).waitFor()
  const patternValue = await page.locator('#pattern').inputValue()
  await page.getByRole('button', { name: /generate address/i }).click()
  await page.getByText('Searching for address').waitFor({ timeout: 5000 })
  await page.waitForTimeout(800)
  const attemptsSecond = Number(
    (await page.locator('#metricAttempts').innerText()).replace(/,/g, '')
  )
  await page.getByRole('button', { name: /stop search/i }).click()
  await page.getByText('Search stopped').waitFor({ timeout: 5000 })

  return {
    label,
    attemptsAtStop,
    elapsedBefore,
    stillSearchingAfterWait: stillSearching,
    stoppedVisible,
    patternPreserved: patternValue === 'ZZZZZ',
    secondSearchAttemptsGrew: attemptsSecond > 0,
  }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const results = []
for (let i = 1; i <= 3; i++) {
  results.push(await runOnce(page, `run-${i}`))
  console.log(results[i - 1])
}

const report = {
  base: BASE,
  results,
  allPassed: results.every(
    (r) =>
      r.attemptsAtStop > 0 &&
      r.stillSearchingAfterWait === 0 &&
      r.stoppedVisible > 0 &&
      r.patternPreserved &&
      r.secondSearchAttemptsGrew
  ),
}

fs.writeFileSync(
  path.join(OUT, 'stop-regression.json'),
  JSON.stringify(report, null, 2)
)
console.log(JSON.stringify(report, null, 2))
await browser.close()
process.exitCode = report.allPassed ? 0 : 1
