import './style.css'
import banner from './assets/banner.png'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App element not found')
}

let isSearching = false
let attempts = 0
let workers: Worker[] = []
let startTime = 0
let lastMeasuredSpeed = 0

const blockedCharacters = ['0', 'O', 'I', 'l']
const recentWalletsKey = 'cbs-recent-wallets'

type RecentWallet = {
  publicKey: string
  pattern: string
  position: string
  attempts: number
  speed: number
  createdAt: string
}

app.innerHTML = `
  <div class="container">
    <div class="hero">
      <img src="${banner}" alt="CBS Wallet Generator Banner" />
    </div>

    <div class="card">
      <label>Pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />

      <div class="checkbox-row">
  <input id="ignoreCase" type="checkbox" />

  <label for="ignoreCase">
    Ignore letter casing
  </label>
</div>

      <p>Invalid characters: 0 O I l</p>

      <div id="estimateBox" class="import-box">
        Enter a pattern to see estimated difficulty.
      </div>

      <br>

      <label>Match position</label>
      <select id="position">
        <option value="prefix">Start of wallet</option>
        <option value="suffix">End of wallet</option>
      </select>

      <br><br>

      <label>Workers</label>
      <select id="workerCount">
        <option value="auto" selected>Auto Recommended</option>
        <option value="1">1 Worker</option>
        <option value="2">2 Workers</option>
        <option value="4">4 Workers</option>
        <option value="8">8 Workers</option>
        <option value="max">Max Device Threads</option>
      </select>

      <br><br>

      <button id="startBtn">Start Search</button>
      <button id="stopBtn">Stop Search</button>
    </div>

    <div class="card">
      <h2>Status</h2>
      <div id="status">Waiting...</div>
    </div>

    <div class="card">
      <h2>Recent Found Wallets</h2>
      <div id="recentWallets">No recent wallets yet.</div>
      <button id="clearRecentBtn">Clear Recent Wallets</button>
    </div>
  </div>
`

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const status = document.getElementById('status')
const patternInput = document.getElementById('pattern') as HTMLInputElement
const ignoreCaseInput = document.getElementById('ignoreCase') as HTMLInputElement
const positionSelect = document.getElementById('position') as HTMLSelectElement
const workerCountSelect = document.getElementById('workerCount') as HTMLSelectElement
const recentWallets = document.getElementById('recentWallets')
const clearRecentBtn = document.getElementById('clearRecentBtn')
const estimateBox = document.getElementById('estimateBox')

function stopWorkers() {
  isSearching = false
  workers.forEach((worker) => worker.terminate())
  workers = []
}

function hasBlockedCharacters(value: string) {
  return blockedCharacters.some((character) => value.includes(character))
}

function getBlockedCharacters(value: string) {
  return blockedCharacters.filter((character) => value.includes(character))
}

function getSpeed() {
  const seconds = (Date.now() - startTime) / 1000
  if (seconds <= 0) return 0

  const speed = Math.round(attempts / seconds)
  if (speed > 0) lastMeasuredSpeed = speed

  return speed
}

function getRecentWallets(): RecentWallet[] {
  const saved = localStorage.getItem(recentWalletsKey)
  if (!saved) return []

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

function saveRecentWallet(wallet: RecentWallet) {
  const wallets = getRecentWallets()
  wallets.unshift(wallet)

  localStorage.setItem(
    recentWalletsKey,
    JSON.stringify(wallets.slice(0, 10))
  )

  renderRecentWallets()
}

function renderRecentWallets() {
  const wallets = getRecentWallets()

  if (wallets.length === 0) {
    recentWallets!.innerHTML = 'No recent wallets yet.'
    return
  }

  recentWallets!.innerHTML = wallets
    .map((wallet) => {
      return `
        <div class="wallet-box">
          <div class="wallet-title">
            ${wallet.pattern} / ${wallet.position}
          </div>

          <div class="wallet-key">
            ${wallet.publicKey}
          </div>

          <br>

          Attempts: ${wallet.attempts}<br>
          Speed: ${wallet.speed} wallets/sec<br>
          Date: ${wallet.createdAt}

          <br><br>

          <button class="copyRecentBtn" data-public-key="${wallet.publicKey}">
            Copy Public Key
          </button>
        </div>
      `
    })
    .join('')

  document.querySelectorAll('.copyRecentBtn').forEach((button) => {
    button.addEventListener('click', () => {
      const publicKey = button.getAttribute('data-public-key')
      if (!publicKey) return

      navigator.clipboard.writeText(publicKey)
      alert('Public key copied!')
    })
  })
}

function getDifficulty(averageAttempts: number) {
  if (averageAttempts < 500) return 'Very easy'
  if (averageAttempts < 10000) return 'Easy'
  if (averageAttempts < 500000) return 'Medium'
  if (averageAttempts < 20000000) return 'Hard'
  return 'Very hard'
}

function formatEstimatedTime(seconds: number) {
  if (seconds < 1) return 'less than 1 second'
  if (seconds < 60) return Math.round(seconds) + ' seconds'

  const minutes = seconds / 60
  if (minutes < 60) return Math.round(minutes) + ' minutes'

  const hours = minutes / 60
  if (hours < 24) return Math.round(hours * 10) / 10 + ' hours'

  const days = hours / 24
  return Math.round(days * 10) / 10 + ' days'
}

function getCaseMultiplier(pattern: string, ignoreCase: boolean) {
  if (!ignoreCase) return 1

  let multiplier = 1

  for (const character of pattern) {
    const lower = character.toLowerCase()
    const upper = character.toUpperCase()

    const lowerAllowed = !blockedCharacters.includes(lower)
    const upperAllowed = !blockedCharacters.includes(upper)

    if (
      lower !== upper &&
      lowerAllowed &&
      upperAllowed
    ) {
      multiplier *= 2
    }
  }

  return multiplier
}

function updateEstimate() {
  const pattern = patternInput.value.trim()
  const ignoreCase = ignoreCaseInput.checked

  if (!pattern) {
    estimateBox!.innerHTML =
      'Enter a pattern to see estimated difficulty.'
    return
  }

  if (hasBlockedCharacters(pattern)) {
    const invalidCharacters = getBlockedCharacters(pattern).join(', ')

    estimateBox!.innerHTML = `
      <strong>Invalid pattern</strong><br>
      Not allowed: ${invalidCharacters}
    `
    return
  }

  const exactAttempts = Math.pow(58, pattern.length)
  const caseMultiplier = getCaseMultiplier(pattern, ignoreCase)
  const averageAttempts = Math.round(exactAttempts / caseMultiplier)

  const speed = lastMeasuredSpeed > 0 ? lastMeasuredSpeed : 50000
  const estimatedSeconds = averageAttempts / speed
  const difficulty = getDifficulty(averageAttempts)

  estimateBox!.innerHTML = `
    <strong>Estimated difficulty:</strong> ${difficulty}<br>
    <strong>Average attempts:</strong> ${averageAttempts.toLocaleString()}<br>
    <strong>Estimated average time:</strong> ${formatEstimatedTime(estimatedSeconds)}<br>
    <small>This is an average estimate. It can be found much faster or much slower.</small>
  `
}

function updateStatus(workerCount: number) {
  const speed = getSpeed()

  status!.innerHTML = `
    <div class="status-searching">
      <strong>Searching...</strong>

      <br><br>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-title">Workers</div>
          <div class="stat-value">${workerCount}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Attempts</div>
          <div class="stat-value">${attempts}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Speed</div>
          <div class="stat-value">${speed}</div>
        </div>
      </div>

      wallets/sec
    </div>
  `

  updateEstimate()
}

function getWorkerCount() {
  const selectedWorkerCount = workerCountSelect.value
  const deviceThreads = navigator.hardwareConcurrency || 4

  if (selectedWorkerCount === 'auto') {
    return Math.max(1, Math.floor(deviceThreads / 2))
  }

  if (selectedWorkerCount === 'max') {
    return deviceThreads
  }

  return Number(selectedWorkerCount)
}

function downloadWalletBackup(publicKey: string, privateKey: string) {
  const content =
    'CBS Local Wallet Generator\n\n' +
    '==============================\n\n' +
    'Public Key:\n' +
    publicKey +
    '\n\n==============================\n\n' +
    'Private Key:\n' +
    privateKey +
    '\n\n==============================\n\n' +
    'IMPORT INSTRUCTIONS:\n' +
    '1. Open Phantom or Solflare.\n' +
    '2. Choose Add / Import Wallet.\n' +
    '3. Choose Private Key.\n' +
    '4. Paste the private key.\n' +
    '5. Save the wallet.\n\n' +
    'WARNING:\n' +
    'Never share your private key.\n' +
    'Anyone with this key has full access to your wallet.\n'

  const blob = new Blob([content], {
    type: 'text/plain',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = 'wallet-' + publicKey + '.txt'
  a.click()

  URL.revokeObjectURL(url)
}

function downloadJsonKeypair(secretKey: Uint8Array, publicKey: string) {
  const jsonArray = Array.from(secretKey)

  const blob = new Blob([JSON.stringify(jsonArray)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = 'wallet-' + publicKey + '.json'
  a.click()

  URL.revokeObjectURL(url)
}

patternInput.addEventListener('input', updateEstimate)
ignoreCaseInput.addEventListener('change', updateEstimate)
workerCountSelect.addEventListener('change', updateEstimate)

clearRecentBtn?.addEventListener('click', () => {
  localStorage.removeItem(recentWalletsKey)
  renderRecentWallets()
})

stopBtn?.addEventListener('click', () => {
  stopWorkers()

  status!.innerHTML = `
    <div class="status-searching">
      Search stopped.
    </div>
  `
})

startBtn?.addEventListener('click', () => {
  const pattern = patternInput.value.trim()
  const position = positionSelect.value
  const workerCount = getWorkerCount()
  const ignoreCase = ignoreCaseInput.checked

  if (!pattern) {
    status!.innerHTML = `
      <div class="status-searching">
        Please enter a pattern.
      </div>
    `
    return
  }

  if (hasBlockedCharacters(pattern)) {
    const invalidCharacters = getBlockedCharacters(pattern).join(', ')

    status!.innerHTML = `
      <div class="status-searching">
        <strong>Invalid pattern</strong><br><br>
        These characters are not allowed in Solana Base58 addresses:<br><br>
        <strong>${invalidCharacters}</strong><br><br>
        Please remove them and try again.
      </div>
    `
    return
  }

  stopWorkers()

  isSearching = true
  attempts = 0
  startTime = Date.now()

  status!.innerHTML = `
    <div class="status-searching">
      Starting search with ${workerCount} workers...
    </div>
  `

  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker(
      new URL('./walletWorker.ts', import.meta.url),
      {
        type: 'module',
      }
    )

    worker.onmessage = (event) => {
      if (!isSearching) return

      if (event.data.type === 'attempt') {
        attempts++

        if (attempts % 1000 === 0) {
          updateStatus(workerCount)
        }
      }

      if (event.data.type === 'found') {
        const publicKey = event.data.publicKey
        const privateKey = event.data.privateKey
        const secretKey = new Uint8Array(event.data.secretKey)

        stopWorkers()

        const speed = getSpeed()

        saveRecentWallet({
          publicKey,
          pattern,
          position,
          attempts,
          speed,
          createdAt: new Date().toLocaleString(),
        })

        status!.innerHTML = `
          <div class="status-found">
            <strong>MATCH FOUND</strong>

            <br><br>

            <div class="stat-grid">
              <div class="stat-box">
                <div class="stat-title">Workers</div>
                <div class="stat-value">${workerCount}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Attempts</div>
                <div class="stat-value">${attempts}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Speed</div>
                <div class="stat-value">${speed}</div>
              </div>
            </div>

            <div class="wallet-box">
              <div class="wallet-title">Public Key</div>
              <div class="wallet-key">${publicKey}</div>
              <button id="copyPublicBtn">Copy Public Key</button>
            </div>

            <div class="wallet-box">
              <div class="wallet-title">Private Key</div>
              <div class="wallet-key">${privateKey}</div>
              <button id="copyPrivateBtn">Copy Private Key</button>
            </div>

            <button id="downloadBtn">Download Wallet Backup (.txt)</button>
            <button id="downloadJsonBtn">Download JSON Keypair</button>

            <div class="import-box">
              <strong>Import into Phantom or Solflare</strong><br><br>
              1. Open Phantom or Solflare.<br>
              2. Choose Add / Import Wallet.<br>
              3. Choose Private Key.<br>
              4. Paste the private key.<br>
              5. Save the wallet.
            </div>

            <p class="danger">
              Keep this file offline. Never share your private key.
            </p>
          </div>
        `

        document.getElementById('copyPublicBtn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(publicKey)
          alert('Public key copied!')
        })

        document.getElementById('copyPrivateBtn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(privateKey)
          alert('Private key copied!')
        })

        document.getElementById('downloadBtn')?.addEventListener('click', () => {
          downloadWalletBackup(publicKey, privateKey)
        })

        document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
          downloadJsonKeypair(secretKey, publicKey)
        })
      }
    }

    worker.postMessage({
      pattern,
      position,
      ignoreCase,
    })

    workers.push(worker)
  }
})

renderRecentWallets()
updateEstimate()