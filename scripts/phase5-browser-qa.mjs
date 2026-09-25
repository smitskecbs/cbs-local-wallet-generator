/**
 * Phase 5 browser QA harness (Playwright + Chromium).
 * Measures real Web Worker attempts/sec and validates UX/security flows.
 *
 * Usage: node scripts/phase5-browser-qa.mjs
 */
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'qa-artifacts')
const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/'
const WORKER_URL = new URL('./assets/kitWorker-CtlEtlWa.js', BASE).href

fs.mkdirSync(OUT, { recursive: true })

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

async function runWorkerBench(page, { workers, batchConcurrency, seconds }) {
  return page.evaluate(
    async ({ workerUrl, workers, batchConcurrency, seconds }) => {
      const endAt = performance.now() + seconds * 1000
      let attempts = 0
      const handles = []

      await new Promise((resolve, reject) => {
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          for (const w of handles) {
            try {
              w.postMessage({ type: 'cancel' })
            } catch {}
            w.terminate()
          }
          resolve()
        }

        for (let i = 0; i < workers; i++) {
          const worker = new Worker(workerUrl, { type: 'module' })
          handles.push(worker)
          worker.onmessage = (event) => {
            if (event.data?.type === 'progress') {
              attempts += event.data.attempts || 0
            }
            if (event.data?.type === 'found') {
              // Extremely unlikely with this pattern; count and stop.
              attempts += 1
              finish()
            }
            if (event.data?.type === 'error') {
              reject(new Error(event.data.message || 'worker error'))
            }
          }
          worker.onerror = (err) => {
            reject(err.error || new Error(err.message || 'worker crashed'))
          }
          worker.postMessage({
            type: 'start',
            pattern: 'ZZZZZ',
            endPattern: '',
            position: 'prefix',
            caseSensitive: true,
            batchConcurrency,
            progressEvery: 500,
            needsPolyfill: false,
          })
        }

        const poll = () => {
          if (performance.now() >= endAt) {
            finish()
            return
          }
          setTimeout(poll, 50)
        }
        poll()
      })

      return {
        attempts,
        seconds,
        attemptsPerSec: Math.round(attempts / seconds),
      }
    },
    { workerUrl: WORKER_URL, workers, batchConcurrency, seconds }
  )
}

async function measureStopLatency(page, { workers, batchConcurrency }) {
  return page.evaluate(
    async ({ workerUrl, workers, batchConcurrency }) => {
      const handles = []
      let attempts = 0
      for (let i = 0; i < workers; i++) {
        const worker = new Worker(workerUrl, { type: 'module' })
        handles.push(worker)
        worker.onmessage = (event) => {
          if (event.data?.type === 'progress') {
            attempts += event.data.attempts || 0
          }
        }
        worker.postMessage({
          type: 'start',
          pattern: 'YYYYY',
          endPattern: '',
          position: 'prefix',
          caseSensitive: true,
          batchConcurrency,
          progressEvery: 250,
          needsPolyfill: false,
        })
      }

      // Warm up briefly.
      await new Promise((r) => setTimeout(r, 800))
      const t0 = performance.now()
      for (const w of handles) {
        try {
          w.postMessage({ type: 'cancel' })
        } catch {}
        w.terminate()
      }
      const latencyMs = performance.now() - t0
      return { latencyMs, attemptsBeforeStop: attempts }
    },
    { workerUrl: WORKER_URL, workers, batchConcurrency }
  )
}

async function screenshot(page, name) {
  const file = path.join(OUT, name)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  })

  const report = {
    base: BASE,
    startedAt: new Date().toISOString(),
    hardwareConcurrency: null,
    userAgent: null,
    visual: {},
    beginnerUx: {},
    benchmarks: [],
    stopLatency: {},
    vanity: [],
    difficulty: [],
    security: {},
    migration: {},
    export: {},
    errors: {},
    mobile: {},
    console: [],
    cspViolations: [],
    recommendations: {},
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  page.on('console', (msg) => {
    report.console.push({ type: msg.type(), text: msg.text() })
  })
  page.on('pageerror', (err) => {
    report.console.push({ type: 'pageerror', text: String(err) })
  })
  page.on('requestfailed', (req) => {
    report.console.push({
      type: 'requestfailed',
      text: `${req.url()} :: ${req.failure()?.errorText || 'failed'}`,
    })
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  report.hardwareConcurrency = await page.evaluate(
    () => navigator.hardwareConcurrency
  )
  report.userAgent = await page.evaluate(() => navigator.userAgent)

  // ---- Visual QA viewports ----
  for (const [w, h, label] of [
    [1920, 1080, 'desktop-1920'],
    [1440, 900, 'desktop-1440'],
    [1366, 768, 'desktop-1366'],
  ]) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(200)
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      horizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    }))
    const shot = await screenshot(page, `${label}.png`)
    report.visual[label] = { ...overflow, screenshot: shot }
  }

  await page.setViewportSize({ width: 1440, height: 900 })

  // ---- Beginner UX checks ----
  const bodyText = await page.locator('body').innerText()
  report.beginnerUx = {
    explainsWhat: /custom Solana address/i.test(bodyText),
    explainsLocal: /locally on your device|generated locally/i.test(bodyText),
    hasCustomText: await page.locator('#pattern').count(),
    hasStartsEndsAnywhere:
      (await page.getByText('Starts with').count()) > 0 &&
      (await page.getByText('Ends with').count()) > 0 &&
      (await page.getByText('Anywhere').count()) > 0,
    hasCaseSensitive: (await page.getByText('Case sensitive').count()) > 0,
    hasDifficultyPanel: (await page.locator('#difficultyPanel').count()) > 0,
    hasGenerate: (await page.getByRole('button', { name: /generate address/i }).count()) > 0,
    advancedCollapsedByDefault: await page.evaluate(() => {
      const details = document.querySelector('details.advanced-block')
      return details ? !details.open : null
    }),
  }

  // ---- Difficulty QA ----
  async function readDifficulty() {
    return page.locator('#difficultyPanel').innerText()
  }

  for (const pattern of ['M', 'Ma', 'Man', 'Mang', 'Mango']) {
    await page.fill('#pattern', pattern)
    await page.waitForTimeout(50)
    const text = await readDifficulty()
    report.difficulty.push({
      pattern,
      caseSensitive: false,
      panel: text.replace(/\s+/g, ' ').trim(),
    })
  }

  await page.check('#caseSensitive')
  await page.fill('#pattern', 'Man')
  report.difficulty.push({
    pattern: 'Man',
    caseSensitive: true,
    panel: (await readDifficulty()).replace(/\s+/g, ' ').trim(),
  })
  await page.uncheck('#caseSensitive')

  // ---- Browser worker benchmarks ----
  const matrix = [
    [1, 1],
    [1, 2],
    [1, 4],
    [1, 8],
    [1, 16],
    [1, 32],
    [2, 1],
    [2, 2],
    [2, 4],
    [2, 8],
    [4, 1],
    [4, 2],
    [4, 4],
    [8, 1],
    [8, 2],
    [10, 2],
    [6, 4],
    [8, 4],
    [12, 2],
    [16, 2],
  ]

  for (const [workers, batchConcurrency] of matrix) {
    const runs = []
    for (let i = 0; i < 2; i++) {
      const result = await runWorkerBench(page, {
        workers,
        batchConcurrency,
        seconds: 3,
      })
      runs.push(result.attemptsPerSec)
      await page.waitForTimeout(150)
    }
    const entry = {
      workers,
      batchConcurrency,
      runs,
      medianAttemptsPerSec: median(runs),
    }
    report.benchmarks.push(entry)
    console.log(
      `bench w=${workers} c=${batchConcurrency} -> ${entry.medianAttemptsPerSec}/s (${runs.join(', ')})`
    )
  }

  const ranked = [...report.benchmarks].sort(
    (a, b) => b.medianAttemptsPerSec - a.medianAttemptsPerSec
  )
  const fastest = ranked[0]
  // Balanced: within 90% of fastest, minimize workers*concurrency product-ish, prefer lower workers
  const threshold = fastest.medianAttemptsPerSec * 0.9
  const balancedCandidates = ranked.filter(
    (b) => b.medianAttemptsPerSec >= threshold
  )
  const balanced = [...balancedCandidates].sort((a, b) => {
    const loadA = a.workers * a.batchConcurrency
    const loadB = b.workers * b.batchConcurrency
    if (loadA !== loadB) return loadA - loadB
    return a.workers - b.workers
  })[0]

  report.recommendations = {
    fastest,
    balanced,
    autoSuggested: balanced,
    maximumSuggested: fastest,
    lowSuggested: { workers: 1, batchConcurrency: 1 },
  }

  // Stop latency under heavy load
  report.stopLatency.fastest = await measureStopLatency(page, {
    workers: fastest.workers,
    batchConcurrency: fastest.batchConcurrency,
  })
  report.stopLatency.balanced = await measureStopLatency(page, {
    workers: balanced.workers,
    batchConcurrency: balanced.batchConcurrency,
  })
  report.stopLatency.currentAuto = await measureStopLatency(page, {
    workers: 10,
    batchConcurrency: 2,
  })

  // ---- Real vanity searches via UI ----
  async function runUiSearch({
    mode,
    pattern,
    endPattern,
    caseSensitive,
    timeoutMs,
  }) {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    if (mode === 'suffix') await page.getByText('End with', { exact: true }).click()
    if (mode === 'anywhere') await page.getByText('Contain', { exact: true }).click()
    if (mode === 'both' || mode === 'bothEnds') {
      await page.locator('details.advanced-block').evaluate((el) => {
        el.open = true
      })
      if (mode === 'both') await page.getByText('Start OR end', { exact: true }).click()
      if (mode === 'bothEnds')
        await page.getByText('Start AND end', { exact: true }).click()
    }
    if (caseSensitive) await page.check('#caseSensitive')
    else await page.uncheck('#caseSensitive')

    await page.fill('#pattern', pattern)
    if (endPattern) await page.fill('#endPattern', endPattern)

    await page.getByRole('button', { name: /generate address/i }).click()
    const found = page.getByText('Address found', { exact: false })
    const searching = page.getByText('Searching for address', { exact: false })
    await searching.waitFor({ timeout: 5000 })

    try {
      await found.waitFor({ timeout: timeoutMs })
    } catch {
      await page.getByRole('button', { name: /stop search/i }).click()
      return { ok: false, reason: 'timeout', mode, pattern }
    }

    const address = await page.locator('#foundPublicKey').innerText()
    const checks = {
      prefix: address.startsWith(pattern) || (!caseSensitive && address.toLowerCase().startsWith(pattern.toLowerCase())),
      suffix:
        address.endsWith(pattern) ||
        (!caseSensitive && address.toLowerCase().endsWith(pattern.toLowerCase())),
      anywhere:
        address.includes(pattern) ||
        (!caseSensitive && address.toLowerCase().includes(pattern.toLowerCase())),
      both:
        address.startsWith(pattern) ||
        address.endsWith(pattern) ||
        (!caseSensitive &&
          (address.toLowerCase().startsWith(pattern.toLowerCase()) ||
            address.toLowerCase().endsWith(pattern.toLowerCase()))),
      bothEnds:
        (address.startsWith(pattern) && address.endsWith(endPattern || '')) ||
        (!caseSensitive &&
          address.toLowerCase().startsWith(pattern.toLowerCase()) &&
          address.toLowerCase().endsWith((endPattern || '').toLowerCase())),
    }

    const position =
      mode === 'suffix'
        ? 'suffix'
        : mode === 'anywhere'
          ? 'anywhere'
          : mode === 'both'
            ? 'both'
            : mode === 'bothEnds'
              ? 'bothEnds'
              : 'prefix'

    return {
      ok: checks[position],
      address,
      mode,
      pattern,
      endPattern,
      caseSensitive,
    }
  }

  const vanityCases = [
    { mode: 'prefix', pattern: 'M', timeoutMs: 20000 },
    { mode: 'prefix', pattern: 'Man', timeoutMs: 120000 },
    { mode: 'suffix', pattern: 'Man', timeoutMs: 120000 },
    { mode: 'anywhere', pattern: 'Man', timeoutMs: 90000 },
    { mode: 'prefix', pattern: 'Man', caseSensitive: true, timeoutMs: 120000 },
    { mode: 'prefix', pattern: 'man', caseSensitive: false, timeoutMs: 120000 },
    { mode: 'both', pattern: 'M', timeoutMs: 20000 },
    { mode: 'bothEnds', pattern: 'A', endPattern: '1', timeoutMs: 180000 },
  ]

  for (const testCase of vanityCases) {
    console.log('vanity', testCase)
    const result = await runUiSearch({
      caseSensitive: false,
      endPattern: '',
      ...testCase,
    })
    report.vanity.push(result)
    console.log('vanity result', result.ok, result.address || result.reason)
  }

  // ---- Security QA ----
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('#pattern', 'M')
  await page.getByRole('button', { name: /generate address/i }).click()
  await page.getByText('Address found').waitFor({ timeout: 30000 })

  const beforeReveal = await page.evaluate(() => {
    const display = document.querySelector('#privateKeyDisplay')
    const copyBtn = document.querySelector('#copyPrivateBtn')
    const revealBtn = document.querySelector('#revealPrivateBtn')
    return {
      displayText: display?.textContent || '',
      hasCopyBeforeReveal: !!copyBtn,
      hasReveal: !!revealBtn,
      dataHidden: display?.getAttribute('data-hidden'),
    }
  })

  await page.getByRole('button', { name: /reveal private key/i }).click()
  const afterReveal = await page.evaluate(() => {
    const display = document.querySelector('#privateKeyDisplay')
    const copyBtn = document.querySelector('#copyPrivateBtn')
    const warning = document.querySelector('#privateWarning')?.textContent || ''
    return {
      displayText: display?.textContent || '',
      hasCopy: !!copyBtn,
      warning,
      dataHidden: display?.getAttribute('data-hidden'),
    }
  })

  const storageBeforeRefresh = await page.evaluate(() => {
    const raw = localStorage.getItem('cbs-recent-wallets')
    return raw ? JSON.parse(raw) : []
  })

  await page.reload({ waitUntil: 'networkidle' })
  const storageAfterRefresh = await page.evaluate(() => {
    const raw = localStorage.getItem('cbs-recent-wallets')
    return raw ? JSON.parse(raw) : []
  })

  const secretFieldNames = [
    'privateKey',
    'secretKey',
    'seed',
    'seedPhrase',
    'mnemonic',
    'pkcs8',
    'secret',
    'rawSecret',
    'private',
  ]
  const hasSecrets = (entries) =>
    entries.some((entry) =>
      secretFieldNames.some(
        (field) => entry?.[field] != null && entry[field] !== ''
      )
    )

  report.security = {
    beforeReveal,
    afterReveal: {
      hasCopy: afterReveal.hasCopy,
      warningPresent: /controls this wallet/i.test(afterReveal.warning),
      keyLooksRevealed:
        afterReveal.dataHidden === 'false' &&
        afterReveal.displayText.length > 40 &&
        !afterReveal.displayText.includes('•'),
      keyLength: afterReveal.displayText.length,
    },
    storageBeforeRefreshHasSecrets: hasSecrets(storageBeforeRefresh),
    storageAfterRefreshHasSecrets: hasSecrets(storageAfterRefresh),
    storageSampleKeys: Object.keys(storageAfterRefresh[0] || {}),
    consoleHasPrivateLeak: report.console.some((c) =>
      /privateKey|secretKey|pkcs8/i.test(c.text)
    ),
  }

  // ---- Migration test ----
  await page.evaluate(() => {
    localStorage.setItem(
      'cbs-recent-wallets',
      JSON.stringify([
        {
          publicKey: 'FakePublicAddress111111111111111111111111111',
          pattern: 'Fake',
          position: 'prefix',
          createdAt: 'migration-test',
          privateKey: 'FAKE_SECRET_DO_NOT_USE',
          secretKey: [9, 9, 9],
        },
      ])
    )
  })
  await page.reload({ waitUntil: 'networkidle' })
  const migrated = await page.evaluate(() => {
    const raw = localStorage.getItem('cbs-recent-wallets')
    return raw ? JSON.parse(raw) : []
  })
  const recentText = await page.locator('#recentWallets').innerText()
  report.migration = {
    preservedPublic: migrated[0]?.publicKey?.startsWith('FakePublic'),
    removedPrivateKey: !('privateKey' in (migrated[0] || {})),
    removedSecretKey: !('secretKey' in (migrated[0] || {})),
    uiShowsFakeSecret: /FAKE_SECRET_DO_NOT_USE/.test(recentText),
    migratedEntry: migrated[0],
  }

  // ---- Export + round-trip via page crypto/Kit path using downloaded content ----
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('#pattern', 'A')
  await page.getByRole('button', { name: /generate address/i }).click()
  await page.getByText('Address found').waitFor({ timeout: 60000 })
  const publicKey = await page.locator('#foundPublicKey').innerText()
  await page.getByRole('button', { name: /reveal private key/i }).click()

  const [jsonDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download keypair \(\.json\)/i }).click(),
  ])
  const jsonPath = path.join(OUT, await jsonDownload.suggestedFilename())
  await jsonDownload.saveAs(jsonPath)
  const secretArray = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

  const [txtDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download keypair backup \(\.txt\)/i }).click(),
  ])
  const txtPath = path.join(OUT, await txtDownload.suggestedFilename())
  await txtDownload.saveAs(txtPath)
  const txt = fs.readFileSync(txtPath, 'utf8')

  // Round-trip verification in browser using same packages if available via dynamic import from page is hard.
  // Use Node Kit verification instead (no web3.js).
  const { createKeyPairFromBytes } = await import('@solana/keys')
  const { getAddressFromPublicKey } = await import('@solana/addresses')
  const secretKey = Uint8Array.from(secretArray)
  const keyPair = await createKeyPairFromBytes(secretKey, false)
  const reconstructed = await getAddressFromPublicKey(keyPair.publicKey)

  report.export = {
    publicKey,
    jsonByteLength: secretArray.length,
    txtContainsPublic: txt.includes(publicKey),
    txtContainsPrivateLabel: /Private Key:/i.test(txt),
    reconstructed,
    roundTripMatch: reconstructed === publicKey,
  }

  // ---- Error QA ----
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const errorCases = []
  for (const bad of ['', '0', 'O', 'I', 'l', 'CB0']) {
    if (bad === '') {
      await page.fill('#pattern', '')
    } else {
      await page.fill('#pattern', bad)
    }
    await page.getByRole('button', { name: /generate address/i }).click()
    await page.waitForTimeout(200)
    const mode = await page.locator('#generatorCard').getAttribute('data-mode')
    const body = await page.locator('#generatorBody').innerText()
    errorCases.push({
      input: bad || '(empty)',
      mode,
      showsError: mode === 'error' || /please enter|invalid/i.test(body),
      snippet: body.slice(0, 120).replace(/\s+/g, ' '),
    })
    if (mode === 'error') {
      await page.getByRole('button', { name: /back/i }).click()
    }
  }

  // start/stop/start
  await page.fill('#pattern', 'ZZZZZ')
  await page.getByRole('button', { name: /generate address/i }).click()
  await page.getByText('Searching for address').waitFor({ timeout: 5000 })
  await page.getByRole('button', { name: /stop search/i }).click()
  await page.waitForTimeout(300)
  let modeAfterStop = await page.locator('#generatorCard').getAttribute('data-mode')
  // After cancel, UI returns to idle via onCancelled
  await page.fill('#pattern', 'M')
  await page.getByRole('button', { name: /generate address/i }).click()
  await page.getByText(/Searching for address|Address found/).waitFor({ timeout: 30000 })
  modeAfterStop = await page.locator('#generatorCard').getAttribute('data-mode')
  report.errors = { errorCases, modeAfterStopRestart: modeAfterStop }

  // ---- Mobile ----
  const mobile = await browser.newContext({
    ...devices['iPhone 12'],
  })
  const mpage = await mobile.newPage()
  await mpage.goto(BASE, { waitUntil: 'networkidle' })
  const mobileNote = await mpage.locator('.mobile-note').count()
  const mobileOverflow = await mpage.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    horizontalOverflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
    threadHint: document.querySelector('#threadHint')?.textContent || '',
  }))
  await mpage.screenshot({
    path: path.join(OUT, 'mobile-390.png'),
    fullPage: true,
  })
  report.mobile.iphone12 = { mobileNoteVisible: mobileNote > 0, ...mobileOverflow }

  const mobile2 = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  })
  const mpage2 = await mobile2.newPage()
  await mpage2.goto(BASE, { waitUntil: 'networkidle' })
  const mobileOverflow2 = await mpage2.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    horizontalOverflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  }))
  await mpage2.screenshot({
    path: path.join(OUT, 'mobile-375.png'),
    fullPage: true,
  })
  report.mobile.w375 = mobileOverflow2

  // CSP / console summary
  report.cspViolations = report.console.filter((c) =>
    /content security policy|csp/i.test(c.text)
  )
  report.consoleErrors = report.console.filter((c) =>
    ['error', 'pageerror', 'requestfailed'].includes(c.type)
  )

  const outFile = path.join(OUT, 'phase5-report.json')
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2))
  console.log('\nWrote', outFile)

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
