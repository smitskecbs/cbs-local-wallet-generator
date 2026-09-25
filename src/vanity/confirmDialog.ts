export type ConfirmDialogOptions = {
  title: string
  /** Plain-text paragraphs (escaped by caller or passed as safe text). */
  paragraphs: string[]
  confirmLabel: string
  cancelLabel?: string
  /** Extra emphasis class on confirm button */
  dangerConfirm?: boolean
}

/**
 * Accessible in-page confirmation. Resolves true on confirm, false on cancel/Escape.
 * Does not use window.alert / confirm.
 */
export function showConfirmDialog(
  options: ConfirmDialogOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const overlay = document.createElement('div')
    overlay.className = 'confirm-overlay'
    overlay.setAttribute('role', 'presentation')

    const dialog = document.createElement('div')
    dialog.className = 'confirm-dialog'
    dialog.setAttribute('role', 'alertdialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-labelledby', 'confirmDialogTitle')
    dialog.setAttribute('aria-describedby', 'confirmDialogBody')

    const title = document.createElement('h2')
    title.id = 'confirmDialogTitle'
    title.className = 'confirm-dialog-title'
    title.textContent = options.title

    const body = document.createElement('div')
    body.id = 'confirmDialogBody'
    body.className = 'confirm-dialog-body'
    for (const paragraph of options.paragraphs) {
      const p = document.createElement('p')
      p.textContent = paragraph
      body.appendChild(p)
    }

    const actions = document.createElement('div')
    actions.className = 'confirm-dialog-actions'

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'tertiary-btn'
    cancelBtn.textContent = options.cancelLabel ?? 'Cancel'

    const confirmBtn = document.createElement('button')
    confirmBtn.type = 'button'
    confirmBtn.className = options.dangerConfirm ? 'danger-btn' : 'primary-btn'
    confirmBtn.textContent = options.confirmLabel

    actions.append(cancelBtn, confirmBtn)
    dialog.append(title, body, actions)
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)

    const focusable = [cancelBtn, confirmBtn]
    let closed = false

    const cleanup = (result: boolean) => {
      if (closed) return
      closed = true
      document.removeEventListener('keydown', onKeyDown, true)
      overlay.remove()
      previousFocus?.focus()
      resolve(result)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cleanup(false)
        return
      }

      if (event.key !== 'Tab') return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    cancelBtn.addEventListener('click', () => cleanup(false))
    confirmBtn.addEventListener('click', () => cleanup(true))
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) cleanup(false)
    })

    document.addEventListener('keydown', onKeyDown, true)
    cancelBtn.focus()
  })
}
