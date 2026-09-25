import './style.css'
import {
  estimateDifficulty,
  formatEstimatedTime,
} from './vanity/difficulty'
import { ensureEd25519Support } from './vanity/ed25519'
import {
  buildKeyBackupFilename,
  buildWalletBackupText,
  downloadTextFile,
  wipeSecretMaterial,
} from './vanity/export'
import { showConfirmDialog } from './vanity/confirmDialog'
import { renderPrivateKeyQrSvg } from './vanity/privateKeyQr'
import {
  type FoundBackupStatus,
  lifecycleFromBackupStatus,
  markConfirmed,
  markDownloaded,
  requiresDiscardWarning,
} from './vanity/foundSession'
import {
  type SearchPosition,
  UX_MAX_VANITY_CHARS,
  getPatternFieldFeedback,
  validateSearchPatterns,
} from './vanity/matching'
import {
  clearRecentWallets,
  loadRecentWallets,
  saveRecentWallet,
  type RecentWallet,
} from './vanity/recentWallets'
import {
  describeSearchTarget,
  formatElapsed,
  SearchController,
  type FoundWallet,
  type SearchProgress,
} from './vanity/searchController'
import {
  detectMobile,
  resolveWorkerPlan,
  type PerformancePreset,
} from './vanity/workers'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('App element not found')
}

const donationWallet = 'ManGofryUWC5VWk7t4ATP32qJtGVBBNoVi2AQ9HyR9J'

type UiMode = 'idle' | 'searching' | 'stopped' | 'found' | 'error'

type SessionWallet = FoundWallet & {
  revealed: boolean
  qrVisible: boolean
  backupStatus: FoundBackupStatus
}

type FormSnapshot = {
  positionPrimary: 'prefix' | 'suffix' | 'anywhere'
  positionAdvanced: '' | 'both' | 'bothEnds'
  pattern: string
  endPattern: string
  caseSensitive: boolean
  performance: PerformancePreset
  advancedOpen: boolean
}

type ActiveSearchView = {
  searchId: number
  pattern: string
  endPattern: string
  position: SearchPosition
  caseSensitive: boolean
  performance: PerformancePreset
}

let uiMode: UiMode = 'idle'
let lastMeasuredSpeed = 0
let needsPolyfill = false
let sessionWallet: SessionWallet | null = null
let ed25519Ready = false
let formSnapshot: FormSnapshot = {
  positionPrimary: 'prefix',
  positionAdvanced: '',
  pattern: '',
  endPattern: '',
  caseSensitive: false,
  performance: 'auto',
  advancedOpen: false,
}
let activeSearchView: ActiveSearchView | null = null
let searchingShellReady = false
let beforeUnloadArmed = false

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!sessionWallet || !requiresDiscardWarning(sessionWallet.backupStatus)) {
    return
  }
  event.preventDefault()
  event.returnValue = ''
}

function syncBeforeUnloadProtection(): void {
  const needsProtection =
    !!sessionWallet && requiresDiscardWarning(sessionWallet.backupStatus)

  if (needsProtection && !beforeUnloadArmed) {
    window.addEventListener('beforeunload', onBeforeUnload)
    beforeUnloadArmed = true
    return
  }

  if (!needsProtection && beforeUnloadArmed) {
    window.removeEventListener('beforeunload', onBeforeUnload)
    beforeUnloadArmed = false
  }
}

const searchController = new SearchController({
  onProgress: (progress) => {
    if (progress.speed > 0) {
      lastMeasuredSpeed = progress.speed
    }
    updateSearchingMetrics(progress)
  },
  onFound: (wallet, searchId) => {
    if (activeSearchView && searchId !== activeSearchView.searchId) return
    // Assign the new result first — do not wipe via clearSessionWallet before
    // the new keypair is held (clear only previous if any).
    if (sessionWallet) {
      wipeSecretMaterial(sessionWallet)
    }
    sessionWallet = {
      ...wallet,
      revealed: false,
      qrVisible: false,
      backupStatus: 'unsecured',
    }
    syncBeforeUnloadProtection()
    if (activeSearchView) {
      saveRecentWallet({
        publicKey: wallet.publicKey,
        pattern: describeSearchTarget(
          activeSearchView.pattern,
          activeSearchView.endPattern,
          activeSearchView.position
        ),
        position: activeSearchView.position,
        createdAt: new Date().toLocaleString(),
      })
      renderRecentWallets()
    }
    setMode('found')
    renderFound()
  },
  onError: (message, searchId) => {
    if (activeSearchView && searchId !== activeSearchView.searchId) return
    setMode('error')
    renderError(message)
  },
  onStopped: (searchId) => {
    if (activeSearchView && searchId !== activeSearchView.searchId) return
    setMode('stopped')
    renderStopped()
  },
})

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function clearSessionWallet(): void {
  if (!sessionWallet) return
  hidePrivateKeyQr()
  wipeSecretMaterial(sessionWallet)
  sessionWallet = null
  syncBeforeUnloadProtection()
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function setMode(mode: UiMode): void {
  uiMode = mode
  document.querySelector('#generatorCard')?.setAttribute('data-mode', mode)
  if (mode !== 'searching') {
    searchingShellReady = false
  }
}

function captureFormSnapshot(): FormSnapshot {
  const primary =
    document.querySelector<HTMLInputElement>(
      'input[name="positionPrimary"]:checked'
    )?.value || formSnapshot.positionPrimary
  const advancedRaw =
    document.querySelector<HTMLInputElement>(
      'input[name="positionAdvanced"]:checked'
    )?.value ?? formSnapshot.positionAdvanced
  const performance =
    (document.querySelector<HTMLSelectElement>('#performance')?.value as
      | PerformancePreset
      | undefined) || formSnapshot.performance

  return {
    positionPrimary:
      primary === 'suffix' || primary === 'anywhere' ? primary : 'prefix',
    positionAdvanced:
      advancedRaw === 'both' || advancedRaw === 'bothEnds' ? advancedRaw : '',
    pattern:
      document.querySelector<HTMLInputElement>('#pattern')?.value.trim() ||
      formSnapshot.pattern,
    endPattern:
      document.querySelector<HTMLInputElement>('#endPattern')?.value.trim() ||
      formSnapshot.endPattern,
    caseSensitive:
      document.querySelector<HTMLInputElement>('#caseSensitive')?.checked ??
      formSnapshot.caseSensitive,
    performance:
      performance === 'low' ||
      performance === 'balanced' ||
      performance === 'maximum' ||
      performance === 'auto'
        ? performance
        : 'auto',
    advancedOpen:
      document.querySelector<HTMLDetailsElement>('details.advanced-block')
        ?.open ?? formSnapshot.advancedOpen,
  }
}

function getPositionFromSnapshot(snapshot: FormSnapshot): SearchPosition {
  if (snapshot.positionAdvanced === 'both' || snapshot.positionAdvanced === 'bothEnds') {
    return snapshot.positionAdvanced
  }
  return snapshot.positionPrimary
}

function updateDifficultyPanel(): void {
  const panel = document.querySelector('#difficultyPanel')
  if (!panel) return

  const snapshot = captureFormSnapshot()
  formSnapshot = snapshot
  const position = getPositionFromSnapshot(snapshot)

  if (!snapshot.pattern) {
    panel.innerHTML = `<div class="difficulty-label muted">Enter text to see difficulty.</div>`
    return
  }

  const validation = validateSearchPatterns(
    snapshot.pattern,
    snapshot.endPattern,
    position
  )
  if (!validation.ok) {
    panel.innerHTML = `<div class="difficulty-label danger">${escapeHtml(validation.message)}</div>`
    return
  }

  const estimate = estimateDifficulty({
    pattern: snapshot.pattern,
    endPattern: snapshot.endPattern,
    position,
    caseSensitive: snapshot.caseSensitive,
    measuredSpeed: lastMeasuredSpeed > 0 ? lastMeasuredSpeed : null,
  })

  const eta =
    estimate.estimatedSeconds != null
      ? ` · ETA ~${formatEstimatedTime(estimate.estimatedSeconds)}`
      : ''

  panel.innerHTML = `
    <div class="difficulty-row">
      <span class="difficulty-kicker">How hard is this address to find?</span>
      <span class="difficulty-label">${escapeHtml(estimate.label)}</span>
      <span class="difficulty-meta">~${formatNumber(estimate.expectedAttempts)} attempts${escapeHtml(eta)}</span>
    </div>
    <details class="help-details">
      <summary>What does this mean?</summary>
      <p class="field-hint">
        Longer patterns take much longer on average. Estimates use the Base58 alphabet and your recent speed.
        Vanity search is probabilistic — a match can appear much sooner or later than the ETA.
      </p>
    </details>
  `
}

function renderPatternFields(): void {
  const host = document.querySelector('#patternFields')
  if (!host) return

  const position = getPositionFromSnapshot(formSnapshot)
  const placeholder = 'Type your text…'
  const rule =
    'Maximum 5 characters · Base58 only'

  if (position === 'bothEnds') {
    host.innerHTML = `
      <label for="pattern">Starts with</label>
      <input id="pattern" autocomplete="off" spellcheck="false" placeholder="${placeholder}" value="${escapeHtml(formSnapshot.pattern)}" />
      <p class="field-rule">${rule}</p>
      <p class="field-feedback" id="patternFeedback" hidden aria-live="polite"></p>
      <label for="endPattern">Ends with</label>
      <input id="endPattern" autocomplete="off" spellcheck="false" placeholder="${placeholder}" value="${escapeHtml(formSnapshot.endPattern)}" />
      <p class="field-rule">${rule}</p>
      <p class="field-feedback" id="endPatternFeedback" hidden aria-live="polite"></p>
    `
  } else {
    host.innerHTML = `
      <label for="pattern">Custom text</label>
      <input id="pattern" autocomplete="off" spellcheck="false" placeholder="${placeholder}" value="${escapeHtml(formSnapshot.pattern)}" />
      <p class="field-rule">${rule}</p>
      <p class="field-feedback" id="patternFeedback" hidden aria-live="polite"></p>
    `
  }

  bindPatternInput('pattern', 'patternFeedback')
  bindPatternInput('endPattern', 'endPatternFeedback')
  updateDifficultyPanel()
}

function bindPatternInput(inputId: string, feedbackId: string): void {
  const input = document.querySelector<HTMLInputElement>(`#${inputId}`)
  if (!input) return

  const syncFeedback = () => {
    const feedback = document.querySelector<HTMLElement>(`#${feedbackId}`)
    const message = getPatternFieldFeedback(input.value)
    if (feedback) {
      if (message) {
        feedback.hidden = false
        feedback.textContent = message
        input.classList.add('input-invalid')
      } else {
        feedback.hidden = true
        feedback.textContent = ''
        input.classList.remove('input-invalid')
      }
    }
    formSnapshot = captureFormSnapshot()
    updateDifficultyPanel()
  }

  input.addEventListener('beforeinput', (event) => {
    const e = event as InputEvent
    if (e.isComposing) return
    if (e.inputType === 'insertText' && typeof e.data === 'string') {
      const next =
        input.value.slice(0, input.selectionStart ?? input.value.length) +
        e.data +
        input.value.slice(input.selectionEnd ?? input.value.length)
      if (next.length > UX_MAX_VANITY_CHARS) {
        e.preventDefault()
        const feedback = document.querySelector<HTMLElement>(`#${feedbackId}`)
        if (feedback) {
          feedback.hidden = false
          feedback.textContent = 'Maximum 5 characters.'
        }
        input.classList.add('input-invalid')
      }
    }
  })

  input.addEventListener('paste', (event) => {
    event.preventDefault()
    const text = event.clipboardData?.getData('text') ?? ''
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const next = input.value.slice(0, start) + text + input.value.slice(end)
    if (next.length > UX_MAX_VANITY_CHARS) {
      const feedback = document.querySelector<HTMLElement>(`#${feedbackId}`)
      if (feedback) {
        feedback.hidden = false
        feedback.textContent = 'Maximum 5 characters.'
      }
      input.classList.add('input-invalid')
      return
    }
    input.setRangeText(text, start, end, 'end')
    syncFeedback()
  })

  input.addEventListener('input', syncFeedback)
  syncFeedback()
}

function ensureSearchingShell(view: ActiveSearchView): void {
  const host = document.querySelector('#generatorBody')
  if (!host) return

  if (searchingShellReady && uiMode === 'searching') {
    const target = document.querySelector('#searchTarget')
    if (target) {
      target.textContent = `${describeSearchTarget(view.pattern, view.endPattern, view.position)}...`
    }
    return
  }

  host.innerHTML = `
    <div class="search-live" aria-live="polite">
      <p class="live-kicker search-pulse">Searching for address</p>
      <p class="live-target"><strong id="searchTarget">${escapeHtml(describeSearchTarget(view.pattern, view.endPattern, view.position))}...</strong></p>

      <div class="stat-grid stat-grid--live">
        <div class="stat-box">
          <div class="stat-title">Speed</div>
          <div class="stat-value" id="metricSpeed">0/sec</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Attempts</div>
          <div class="stat-value" id="metricAttempts">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Elapsed</div>
          <div class="stat-value" id="metricElapsed">00:00</div>
        </div>
      </div>

      <p class="field-hint" id="searchPerfHint">Performance: ${escapeHtml(view.performance.toUpperCase())}</p>

      <button type="button" class="stop-btn" id="stopBtn">Stop search</button>
    </div>
  `

  document.querySelector('#stopBtn')?.addEventListener('click', () => {
    searchController.stop()
  })

  searchingShellReady = true
}

function updateSearchingMetrics(progress: SearchProgress): void {
  if (uiMode !== 'searching' || !activeSearchView) return
  if (progress.searchId !== activeSearchView.searchId) return

  ensureSearchingShell(activeSearchView)

  const attempts = document.querySelector('#metricAttempts')
  const speed = document.querySelector('#metricSpeed')
  const elapsed = document.querySelector('#metricElapsed')

  if (attempts) attempts.textContent = formatNumber(progress.attempts)
  if (speed) speed.textContent = `${formatNumber(progress.speed)}/sec`
  if (elapsed) elapsed.textContent = formatElapsed(progress.elapsedMs)
}

function renderStopped(): void {
  const host = document.querySelector('#generatorBody')
  if (!host) return

  host.innerHTML = `
    <div class="stopped-panel">
      <p class="live-kicker">Search stopped</p>
      <p class="error-text">No address was generated.</p>
      <div class="action-row">
        <button type="button" class="secondary-btn" id="tryAgainBtn">Try again</button>
      </div>
    </div>
  `

  document.querySelector('#tryAgainBtn')?.addEventListener('click', () => {
    setMode('idle')
    renderIdleForm()
  })
}

function renderFound(): void {
  const host = document.querySelector('#generatorBody')
  if (!host || !sessionWallet) return

  const wallet = sessionWallet
  const masked = '•'.repeat(64)
  const lifecycle = lifecycleFromBackupStatus(wallet.backupStatus)

  host.innerHTML = `
    <div class="found-panel" data-lifecycle="${lifecycle}">
      <p class="live-kicker success">Address found</p>

      <div class="wallet-box">
        <div class="wallet-key" id="foundPublicKey">${escapeHtml(wallet.publicKey)}</div>
        <div class="action-row">
          <button type="button" class="secondary-btn" id="copyPublicBtn">Copy address</button>
        </div>
      </div>

      <div class="wallet-box wallet-box--secure" id="backupUrgent">
        <div class="wallet-title">Secure your key</div>
        <p class="found-lead">
          This is the only key that controls this address.
          Save your backup before leaving this page.
        </p>
        <p class="keep-private-note">
          <strong>Keep this backup private.</strong>
          Anyone with this private key can control this wallet and its funds.
          Never send it through chat, email, or social media.
        </p>
        ${
          import.meta.env.DEV
            ? `<p class="dev-hmr-warning">Development mode: editing JavaScript source can reload this page and destroy the in-memory key. Finish backup before changing code.</p>`
            : ''
        }
        <div class="action-row">
          <button type="button" class="backup-btn" id="downloadKeyBackupBtn">Download key backup</button>
        </div>
        <p class="offline-hint">
          Recommended: store the backup offline in a secure location, for example on an encrypted USB drive.
        </p>
        <div id="backupConfirmArea" class="backup-confirm-area"></div>
      </div>

      <div class="wallet-box wallet-box--transfer" id="transferSection">
        <div class="wallet-title">Import on another device</div>
        <p class="found-lead">
          Optionally show a private-key QR to import into a wallet on another device.
        </p>
        <div class="action-row" id="qrActions">
          <button type="button" class="secondary-btn" id="showQrBtn">Show private-key QR</button>
        </div>
        <p class="field-hint">Scan only with a wallet or device you trust.</p>
        <div id="qrPanel" class="qr-panel" hidden></div>
      </div>

      <details class="found-advanced" id="privateKeySection">
        <summary>Advanced</summary>
        <div class="found-advanced-body">
          <p class="private-key-warning" id="privateWarning">
            Reveal only if you need to copy the private key manually.
            Anyone who sees it can control this wallet.
          </p>
          <div
            class="wallet-key wallet-key--private"
            id="privateKeyDisplay"
            data-hidden="true"
            aria-label="Private key hidden"
            hidden
          >${masked}</div>
          <div class="action-row" id="privateActions">
            <button type="button" class="secondary-btn" id="revealPrivateBtn">Reveal private key</button>
          </div>
          <p class="copy-feedback" id="privateFeedback" hidden aria-live="polite"></p>
        </div>
      </details>

      <div class="action-row">
        <button type="button" class="secondary-btn danger-outline-btn" id="anotherBtn">Generate another address</button>
      </div>
    </div>
  `

  updateBackupBanner()

  document.querySelector('#generatorCard')?.scrollIntoView({
    block: 'start',
    behavior: 'smooth',
  })

  bindFoundActions()
}

function bindFoundActions(): void {
  if (!sessionWallet) return
  const wallet = sessionWallet

  document.querySelector('#copyPublicBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(wallet.publicKey)
    } catch {
      // Ignore.
    }
  })

  document.querySelector('#downloadKeyBackupBtn')?.addEventListener('click', () => {
    if (!sessionWallet) return
    downloadTextFile(
      buildKeyBackupFilename(sessionWallet.publicKey),
      buildWalletBackupText(sessionWallet.publicKey, sessionWallet.privateKey)
    )
    noteBackupDownloaded()
  })

  document.querySelector('#revealPrivateBtn')?.addEventListener('click', () => {
    void requestRevealPrivateKey()
  })

  document.querySelector('#showQrBtn')?.addEventListener('click', () => {
    void requestShowPrivateKeyQr()
  })

  document.querySelector('#anotherBtn')?.addEventListener('click', () => {
    void requestGenerateAnother()
  })
}

function noteBackupDownloaded(): void {
  if (!sessionWallet) return
  sessionWallet.backupStatus = markDownloaded(sessionWallet.backupStatus)
  syncBeforeUnloadProtection()
  updateBackupBanner()
}

function confirmBackupStatus(): void {
  if (!sessionWallet) return
  sessionWallet.backupStatus = markConfirmed()
  syncBeforeUnloadProtection()
  syncFoundLifecycleAttribute()
  updateBackupBanner()
}

function syncFoundLifecycleAttribute(): void {
  if (!sessionWallet) return
  const panel = document.querySelector('.found-panel')
  if (!panel) return
  panel.setAttribute(
    'data-lifecycle',
    lifecycleFromBackupStatus(sessionWallet.backupStatus)
  )
}

function updateBackupBanner(): void {
  if (!sessionWallet) return
  const area = document.querySelector('#backupConfirmArea')
  if (!area) return

  area.innerHTML = ''
  syncFoundLifecycleAttribute()

  if (sessionWallet.backupStatus === 'confirmed') {
    const p = document.createElement('p')
    p.className = 'backup-status backup-status--ok'
    p.id = 'backupStatus'
    p.textContent =
      'Backup confirmed. You can safely continue. The private key stays only in this tab until you leave.'
    area.appendChild(p)
    return
  }

  if (sessionWallet.backupStatus === 'downloaded') {
    const status = document.createElement('p')
    status.className = 'backup-status backup-status--ok'
    status.id = 'backupStatus'
    status.textContent = 'Backup downloaded'
    const hint = document.createElement('p')
    hint.className = 'offline-hint'
    hint.textContent =
      'Before confirming, store the file somewhere safe and preferably offline.'
    const label = document.createElement('label')
    label.className = 'backup-confirm-label'
    label.htmlFor = 'confirmBackupCheck'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = 'confirmBackupCheck'
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) confirmBackupStatus()
    })
    const span = document.createElement('span')
    span.textContent = 'I have safely stored my backup'
    label.append(checkbox, span)
    area.append(status, hint, label)
  }
}

async function requestRevealPrivateKey(): Promise<void> {
  if (!sessionWallet) return

  const confirmed = await showConfirmDialog({
    title: 'Reveal private key?',
    paragraphs: [
      'Your private key gives full control of this address.',
      'Anyone who sees, copies, photographs or scans it can control the wallet and its funds.',
      'Only reveal it when nobody else can see your screen.',
    ],
    confirmLabel: 'I understand — reveal',
    cancelLabel: 'Cancel',
    dangerConfirm: true,
  })

  if (!confirmed || !sessionWallet) return
  revealPrivateKey()
}

async function requestShowPrivateKeyQr(): Promise<void> {
  if (!sessionWallet) return

  const confirmed = await showConfirmDialog({
    title: 'Show private-key QR?',
    paragraphs: [
      'This QR code contains your private key.',
      'Anyone who scans or photographs this QR code can control this wallet.',
      'Only show it when nobody else can see your screen, and only scan it with a wallet or device you trust.',
    ],
    confirmLabel: 'I understand — show QR',
    cancelLabel: 'Cancel',
    dangerConfirm: true,
  })

  if (!confirmed || !sessionWallet) return
  showPrivateKeyQr()
}

async function requestGenerateAnother(): Promise<void> {
  if (!sessionWallet) {
    setMode('idle')
    renderIdleForm()
    return
  }

  if (requiresDiscardWarning(sessionWallet.backupStatus)) {
    const confirmed = await showConfirmDialog({
      title: 'Your current private key has not been confirmed as backed up',
      paragraphs: [
        'If you continue, this private key will be removed from this page and may not be recoverable.',
        'Go back and download a backup first unless you are certain you no longer need this keypair.',
      ],
      confirmLabel: 'I understand — discard this key',
      cancelLabel: 'Go back and back it up',
      dangerConfirm: true,
    })
    if (!confirmed) return
  } else {
    const confirmed = await showConfirmDialog({
      title: 'Generate another address?',
      paragraphs: [
        'This will clear the current result from this tab.',
        'Continue only if you already stored your backup offline.',
      ],
      confirmLabel: 'Continue',
      cancelLabel: 'Cancel',
      dangerConfirm: true,
    })
    if (!confirmed) return
  }

  hidePrivateKeyQr()
  clearSessionWallet()
  activeSearchView = null
  setMode('idle')
  renderIdleForm()
}

/**
 * Guard any transition that would wipe an unsecured found keypair.
 * Returns false if the user cancelled.
 */
async function confirmDiscardUnsecuredResult(): Promise<boolean> {
  if (!sessionWallet || !requiresDiscardWarning(sessionWallet.backupStatus)) {
    return true
  }

  return showConfirmDialog({
    title: 'Your current private key has not been confirmed as backed up',
    paragraphs: [
      'Starting a new search will remove this private key from this page and it may not be recoverable.',
      'Go back and download a backup first unless you are certain you no longer need this keypair.',
    ],
    confirmLabel: 'I understand — discard this key',
    cancelLabel: 'Go back and back it up',
    dangerConfirm: true,
  })
}

function revealPrivateKey(): void {
  if (!sessionWallet) return

  sessionWallet.revealed = true
  const display = document.querySelector<HTMLElement>('#privateKeyDisplay')
  const warning = document.querySelector('#privateWarning')
  const advanced = document.querySelector<HTMLDetailsElement>('#privateKeySection')
  if (advanced) advanced.open = true

  if (warning) {
    warning.textContent =
      'Never share your private key. Anyone with this key can control this wallet.'
  }

  if (display) {
    display.hidden = false
    display.textContent = sessionWallet.privateKey
    display.setAttribute('data-hidden', 'false')
    display.removeAttribute('aria-label')
  }

  renderPrivateActionButtons()
}

function hidePrivateKey(): void {
  if (!sessionWallet) return
  sessionWallet.revealed = false

  const display = document.querySelector<HTMLElement>('#privateKeyDisplay')
  const warning = document.querySelector('#privateWarning')

  if (warning) {
    warning.textContent =
      'Reveal only if you need to copy the private key manually. Anyone who sees it can control this wallet.'
  }

  if (display) {
    display.hidden = true
    display.textContent = '•'.repeat(64)
    display.setAttribute('data-hidden', 'true')
    display.setAttribute('aria-label', 'Private key hidden')
  }

  renderPrivateActionButtons()
}

function showPrivateKeyQr(): void {
  if (!sessionWallet) return

  const panel = document.querySelector<HTMLElement>('#qrPanel')
  if (!panel) return

  let svg: string
  try {
    svg = renderPrivateKeyQrSvg(sessionWallet.privateKey)
  } catch {
    const feedback = document.querySelector<HTMLElement>('#privateFeedback')
    if (feedback) {
      feedback.hidden = false
      feedback.textContent = 'Could not create the QR code in this browser.'
    }
    return
  }

  sessionWallet.qrVisible = true
  panel.hidden = false
  panel.innerHTML = `
    <div class="wallet-title">Private key QR</div>
    <div class="qr-frame" id="qrFrame" aria-label="Private key QR code">${svg}</div>
    <p class="private-key-warning">
      This QR code contains your private key.
      Scan it only with a wallet or device you trust.
    </p>
    <div class="action-row">
      <button type="button" class="tertiary-btn" id="hideQrBtn">Hide QR</button>
    </div>
  `

  document.querySelector('#hideQrBtn')?.addEventListener('click', () => {
    hidePrivateKeyQr()
  })

  renderQrActionButtons()
}

function hidePrivateKeyQr(): void {
  if (sessionWallet) {
    sessionWallet.qrVisible = false
  }

  const panel = document.querySelector<HTMLElement>('#qrPanel')
  if (panel) {
    panel.hidden = true
    panel.innerHTML = ''
  }

  renderQrActionButtons()
}

function renderQrActionButtons(): void {
  if (!sessionWallet) return
  const actions = document.querySelector('#qrActions')
  if (!actions) return

  if (sessionWallet.qrVisible) {
    actions.innerHTML = ''
    return
  }

  actions.innerHTML =
    '<button type="button" class="secondary-btn" id="showQrBtn">Show private-key QR</button>'
  document.querySelector('#showQrBtn')?.addEventListener('click', () => {
    void requestShowPrivateKeyQr()
  })
}

function renderPrivateActionButtons(): void {
  if (!sessionWallet) return

  const actions = document.querySelector('#privateActions')
  if (!actions) return

  if (sessionWallet.revealed) {
    actions.innerHTML = `
      <button type="button" class="secondary-btn" id="copyPrivateBtn">Copy private key</button>
      <button type="button" class="tertiary-btn" id="hidePrivateBtn">Hide private key</button>
    `
  } else {
    actions.innerHTML = `
      <button type="button" class="secondary-btn" id="revealPrivateBtn">Reveal private key</button>
    `
  }

  document.querySelector('#revealPrivateBtn')?.addEventListener('click', () => {
    void requestRevealPrivateKey()
  })
  document.querySelector('#hidePrivateBtn')?.addEventListener('click', () => {
    hidePrivateKey()
  })
  document.querySelector('#copyPrivateBtn')?.addEventListener('click', async () => {
    if (!sessionWallet?.revealed) return
    const feedback = document.querySelector<HTMLElement>('#privateFeedback')
    try {
      await navigator.clipboard.writeText(sessionWallet.privateKey)
      if (feedback) {
        feedback.hidden = false
        feedback.textContent = 'Private key copied.'
        window.setTimeout(() => {
          feedback.hidden = true
        }, 2400)
      }
    } catch {
      if (feedback) {
        feedback.hidden = false
        feedback.textContent =
          'Copy failed. Select the private key and copy manually.'
      }
    }
  })
}

function renderError(message: string): void {
  const host = document.querySelector('#generatorBody')
  if (!host) return

  host.innerHTML = `
    <div class="error-panel">
      <p class="live-kicker danger">Unable to generate</p>
      <p class="error-text">${escapeHtml(message)}</p>
      <button type="button" class="secondary-btn" id="backBtn">Back</button>
    </div>
  `

  document.querySelector('#backBtn')?.addEventListener('click', () => {
    setMode('idle')
    renderIdleForm()
  })
}

function updateThreadHint(): void {
  const hint = document.querySelector('#threadHint')
  if (!hint) return

  const plan = resolveWorkerPlan({
    preset: formSnapshot.performance,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    isMobile: detectMobile(),
  })

  hint.textContent =
    `Detected: ${plan.hardwareConcurrency} CPU threads` +
    `${plan.isMobile ? ' · mobile device' : ''}` +
    ` · ${plan.preset.toUpperCase()} uses ${plan.workers} workers`
}

function renderIdleForm(): void {
  const host = document.querySelector('#generatorBody')
  if (!host) return

  const isMobile = detectMobile()
  const snap = formSnapshot

  host.innerHTML = `
    <p class="mode-label">Your address should:</p>
    <div class="mode-tabs" role="radiogroup" aria-label="Where the text should appear">
      <label class="mode-tab">
        <input type="radio" name="positionPrimary" value="prefix" ${snap.positionPrimary === 'prefix' ? 'checked' : ''} />
        <span>Start with</span>
      </label>
      <label class="mode-tab">
        <input type="radio" name="positionPrimary" value="suffix" ${snap.positionPrimary === 'suffix' ? 'checked' : ''} />
        <span>End with</span>
      </label>
      <label class="mode-tab">
        <input type="radio" name="positionPrimary" value="anywhere" ${snap.positionPrimary === 'anywhere' ? 'checked' : ''} />
        <span>Contain</span>
      </label>
    </div>

    <div id="patternFields"></div>

    <div class="toggle-row">
      <input id="caseSensitive" type="checkbox" ${snap.caseSensitive ? 'checked' : ''} />
      <label for="caseSensitive">Case sensitive</label>
    </div>

    <div id="difficultyPanel" class="difficulty-panel"></div>

    ${
      isMobile
        ? `<p class="mobile-note">Longer vanity searches are faster on desktop and may use significant battery on mobile.</p>`
        : ''
    }

    <details class="advanced-block" ${snap.advancedOpen ? 'open' : ''}>
      <summary>Advanced settings</summary>
      <div class="advanced-body">
        <p class="field-hint">Optional modes and performance for power users.</p>

        <p class="field-hint"><strong>Advanced search</strong></p>
        <label class="advanced-option">
          <input type="radio" name="positionAdvanced" value="" ${snap.positionAdvanced === '' ? 'checked' : ''} />
          Use primary mode above
        </label>
        <label class="advanced-option">
          <input type="radio" name="positionAdvanced" value="both" ${snap.positionAdvanced === 'both' ? 'checked' : ''} />
          Start OR end
        </label>
        <label class="advanced-option">
          <input type="radio" name="positionAdvanced" value="bothEnds" ${snap.positionAdvanced === 'bothEnds' ? 'checked' : ''} />
          Start AND end
        </label>
        <p class="field-hint warning-text">
          Start AND end is exponentially harder. Prefer short patterns.
        </p>

        <label for="performance">Performance</label>
        <div class="performance-radios" role="radiogroup" aria-label="Performance">
          <label class="advanced-option">
            <input type="radio" name="performanceChoice" value="low" ${snap.performance === 'low' ? 'checked' : ''} />
            Low
          </label>
          <label class="advanced-option">
            <input type="radio" name="performanceChoice" value="auto" ${snap.performance === 'auto' || snap.performance === 'balanced' ? 'checked' : ''} />
            Auto
          </label>
          <label class="advanced-option">
            <input type="radio" name="performanceChoice" value="maximum" ${snap.performance === 'maximum' ? 'checked' : ''} />
            Maximum
          </label>
        </div>
        <select id="performance" class="visually-hidden" aria-hidden="true" tabindex="-1">
          <option value="auto" ${snap.performance === 'auto' || snap.performance === 'balanced' ? 'selected' : ''}>AUTO</option>
          <option value="low" ${snap.performance === 'low' ? 'selected' : ''}>Low</option>
          <option value="maximum" ${snap.performance === 'maximum' ? 'selected' : ''}>Maximum</option>
        </select>
        <p class="field-hint" id="threadHint"></p>
      </div>
    </details>

    <div class="action-row">
      <button type="button" class="primary-btn" id="startBtn" ${ed25519Ready ? '' : 'disabled'}>
        Generate address
      </button>
    </div>
    <p class="support-status" id="cryptoStatus"></p>
  `

  bindIdleFormEvents()
  renderPatternFields()
  updateThreadHint()
  updateCryptoStatus()
}

function updateCryptoStatus(): void {
  const status = document.querySelector('#cryptoStatus')
  const startBtn = document.querySelector<HTMLButtonElement>('#startBtn')
  if (!status) return

  if (!ed25519Ready) {
    status.textContent = 'Checking browser cryptography support…'
    startBtn && (startBtn.disabled = true)
    return
  }

  status.textContent = needsPolyfill
    ? 'Ed25519 compatibility mode enabled for this browser.'
    : 'Generated locally. Private keys are never stored on this site.'
  startBtn && (startBtn.disabled = false)
}

function syncPerformanceFromRadios(): void {
  const choice =
    document.querySelector<HTMLInputElement>(
      'input[name="performanceChoice"]:checked'
    )?.value || 'auto'
  const select = document.querySelector<HTMLSelectElement>('#performance')
  if (select) {
    select.value = choice === 'balanced' ? 'auto' : choice
  }
  formSnapshot = captureFormSnapshot()
  formSnapshot.performance =
    choice === 'low' || choice === 'maximum' ? choice : 'auto'
  updateThreadHint()
  updateDifficultyPanel()
}

function bindIdleFormEvents(): void {
  document
    .querySelectorAll('input[name="positionPrimary"]')
    .forEach((input) => {
      input.addEventListener('change', () => {
        const advancedNone = document.querySelector<HTMLInputElement>(
          'input[name="positionAdvanced"][value=""]'
        )
        if (advancedNone) advancedNone.checked = true
        formSnapshot = captureFormSnapshot()
        renderPatternFields()
      })
    })

  document
    .querySelectorAll('input[name="positionAdvanced"]')
    .forEach((input) => {
      input.addEventListener('change', () => {
        formSnapshot = captureFormSnapshot()
        renderPatternFields()
      })
    })

  document
    .querySelector('#caseSensitive')
    ?.addEventListener('change', () => {
      formSnapshot = captureFormSnapshot()
      updateDifficultyPanel()
    })

  document
    .querySelectorAll('input[name="performanceChoice"]')
    .forEach((input) => {
      input.addEventListener('change', syncPerformanceFromRadios)
    })

  document.querySelector('details.advanced-block')?.addEventListener('toggle', () => {
    formSnapshot = captureFormSnapshot()
  })

  document.querySelector('#startBtn')?.addEventListener('click', () => {
    void startSearch()
  })
}

async function startSearch(): Promise<void> {
  if (!ed25519Ready) {
    setMode('error')
    renderError(
      'Ed25519 is not available in this browser. Please update your browser and try again.'
    )
    return
  }

  formSnapshot = captureFormSnapshot()
  const pattern = formSnapshot.pattern
  const endPattern = formSnapshot.endPattern
  const position = getPositionFromSnapshot(formSnapshot)
  const caseSensitive = formSnapshot.caseSensitive
  const validation = validateSearchPatterns(pattern, endPattern, position)

  if (!validation.ok) {
    setMode('error')
    renderError(validation.message)
    return
  }

  if (!(await confirmDiscardUnsecuredResult())) {
    return
  }

  if (searchController.isSearching) {
    searchController.stop({ silent: true })
  }

  clearSessionWallet()

  const plan = resolveWorkerPlan({
    preset: formSnapshot.performance,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    isMobile: detectMobile(),
  })

  const searchId = searchController.start({
    match: {
      pattern,
      endPattern,
      position,
      caseSensitive,
    },
    plan,
    needsPolyfill,
    progressEvery: 1000,
  })

  activeSearchView = {
    searchId,
    pattern,
    endPattern,
    position,
    caseSensitive,
    performance: formSnapshot.performance,
  }

  setMode('searching')
  searchingShellReady = false
  ensureSearchingShell(activeSearchView)
  updateSearchingMetrics({
    searchId,
    attempts: 0,
    elapsedMs: 0,
    speed: 0,
    workers: plan.workers,
  })
}

function renderRecentWallets(): void {
  const host = document.querySelector('#recentWallets')
  if (!host) return

  const wallets = loadRecentWallets()
  if (wallets.length === 0) {
    host.innerHTML = `<p class="muted">No recent public addresses yet.</p>`
    return
  }

  host.innerHTML = wallets
    .map(
      (wallet: RecentWallet) => `
      <article class="recent-card" data-public-key="${escapeHtml(wallet.publicKey)}">
        <div class="wallet-title">${escapeHtml(wallet.pattern)} · ${escapeHtml(wallet.position)}</div>
        <div class="wallet-key">${escapeHtml(wallet.publicKey)}</div>
        <p class="recent-meta">${escapeHtml(wallet.createdAt)}</p>
        <button type="button" class="secondary-btn copy-recent-public">Copy address</button>
      </article>
    `
    )
    .join('')

  host.querySelectorAll<HTMLElement>('.recent-card').forEach((card) => {
    const publicKey = card.dataset.publicKey
    if (!publicKey) return
    card
      .querySelector('.copy-recent-public')
      ?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(publicKey)
        } catch {
          // Ignore.
        }
      })
  })
}

function setupDonationCopy(): void {
  const copyBtn = document.querySelector('#donationCopyBtn')
  const confirm = document.querySelector('#donationConfirm')
  if (!copyBtn || !confirm) return

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(donationWallet)
      confirm.removeAttribute('hidden')
      confirm.textContent = 'Address copied.'
    } catch {
      confirm.removeAttribute('hidden')
      confirm.textContent =
        'Copy failed. Select the address above and copy manually.'
    }

    window.setTimeout(() => {
      confirm.setAttribute('hidden', '')
    }, 2400)
  })
}

app.innerHTML = `
  <main class="app-shell">
    <header class="site-header">
      <div class="hero-banner" aria-hidden="true">
        <img
          class="hero-banner-img"
          src="/assets/banner.png"
          width="2103"
          height="748"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
      </div>
      <div class="brand-block">
        <h1 class="brand-name">Solana Address Generator</h1>
        <p class="brand-tagline">
          Create a custom address for Solana — locally on your device.
        </p>
        <ul class="trust-line">
          <li><span class="trust-dot trust-dot--accent" aria-hidden="true"></span>Local generation</li>
          <li><span class="trust-dot" aria-hidden="true"></span>No wallet connection</li>
          <li><span class="trust-dot" aria-hidden="true"></span>Keys stay on this device</li>
        </ul>
      </div>
    </header>

    <section class="page-section card card--generator" id="generatorCard" data-mode="idle" aria-labelledby="generator-heading">
      <div class="card-header">
        <h2 id="generator-heading" class="visually-hidden">Generate address</h2>
      </div>
      <div id="generatorBody"></div>
    </section>

    <section class="page-section card card--secondary" aria-labelledby="recent-heading">
      <div class="card-header">
        <h2 id="recent-heading">Recent public addresses</h2>
        <p class="card-lede">Only public addresses are saved here. Private keys are never stored.</p>
      </div>
      <div id="recentWallets"></div>
      <button type="button" class="tertiary-btn" id="clearRecentBtn">Clear recent addresses</button>
    </section>

    <section class="support-section" aria-labelledby="support-title">
      <div class="support-card">
        <p class="support-title" id="support-title">Support development</p>
        <p class="support-text">Optional donations help keep this tool free.</p>
        <code class="support-wallet">${donationWallet}</code>
        <button type="button" class="secondary-btn" id="donationCopyBtn">Copy address</button>
        <p class="support-confirm" id="donationConfirm" hidden aria-live="polite">Address copied.</p>
      </div>
    </section>

    <footer class="site-footer">
      <p class="site-footer-copy">
        Independent open-source tool for Solana · Built by
        <a href="https://tools.cbs-coin.com" target="_blank" rel="noopener noreferrer">CBS Tools</a>
        · Not affiliated with the Solana Foundation
      </p>
    </footer>
  </main>
`

renderIdleForm()
renderRecentWallets()
setupDonationCopy()

document.querySelector('#clearRecentBtn')?.addEventListener('click', () => {
  clearRecentWallets()
  renderRecentWallets()
})

void (async () => {
  const support = await ensureEd25519Support()
  if (!support.ok) {
    ed25519Ready = false
    setMode('error')
    renderError(support.reason)
    return
  }

  ed25519Ready = true
  needsPolyfill = support.polyfilled
  if (uiMode === 'idle') {
    updateCryptoStatus()
  }

  try {
    const plan = resolveWorkerPlan({
      preset: 'auto',
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      isMobile: detectMobile(),
    })
    const calibrated = await new Promise<number>((resolve) => {
      let attempts = 0
      const workers: Worker[] = []
      const seconds = 1.25
      window.setTimeout(() => {
        for (const worker of workers) {
          try {
            worker.postMessage({ type: 'cancel', searchId: 0 })
          } catch {
            // ignore
          }
          worker.terminate()
        }
        resolve(Math.round(attempts / seconds))
      }, seconds * 1000)

      for (let i = 0; i < plan.workers; i++) {
        const worker = new Worker(new URL('./kitWorker.ts', import.meta.url), {
          type: 'module',
        })
        worker.onmessage = (event) => {
          if (event.data?.type === 'progress') {
            attempts += event.data.attempts || 0
          }
        }
        worker.postMessage({
          type: 'start',
          searchId: 0,
          pattern: 'ZZZZZ',
          endPattern: '',
          position: 'prefix',
          caseSensitive: true,
          batchConcurrency: plan.batchConcurrency,
          progressEvery: 500,
          needsPolyfill,
        })
        workers.push(worker)
      }
    })

    if (calibrated > 0) {
      lastMeasuredSpeed = calibrated
      if (uiMode === 'idle') updateDifficultyPanel()
    }
  } catch {
    // Calibration is best-effort only.
  }
})()

window.addEventListener('pagehide', () => {
  // Do NOT wipe sessionWallet here — pagehide also fires on tab hide / bfcache
  // and previously destroyed found keypairs before backup. Secrets are released
  // when the document is destroyed or when clearSessionWallet runs intentionally.
  searchController.stop({ silent: true })
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (sessionWallet && requiresDiscardWarning(sessionWallet.backupStatus)) {
      console.warn(
        '[CBS] Dev HMR is about to reload. An unsecured found keypair in this tab will be lost. Back up before editing JS sources.'
      )
    }
  })
}
