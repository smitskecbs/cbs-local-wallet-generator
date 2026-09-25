/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { showConfirmDialog } from './confirmDialog'

describe('showConfirmDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.querySelectorAll('.confirm-overlay').forEach((el) => el.remove())
  })

  it('resolves false on cancel', async () => {
    const promise = showConfirmDialog({
      title: 'Test',
      paragraphs: ['Body'],
      confirmLabel: 'OK',
    })
    const cancel = document.querySelector(
      '.confirm-dialog-actions .tertiary-btn'
    ) as HTMLButtonElement
    cancel.click()
    await expect(promise).resolves.toBe(false)
    expect(document.querySelector('.confirm-overlay')).toBeNull()
  })

  it('resolves true on confirm', async () => {
    const promise = showConfirmDialog({
      title: 'Test',
      paragraphs: ['Body'],
      confirmLabel: 'OK',
      dangerConfirm: true,
    })
    const confirm = document.querySelector(
      '.confirm-dialog-actions .danger-btn'
    ) as HTMLButtonElement
    confirm.click()
    await expect(promise).resolves.toBe(true)
  })

  it('resolves false on Escape', async () => {
    const promise = showConfirmDialog({
      title: 'Test',
      paragraphs: ['Body'],
      confirmLabel: 'OK',
    })
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
    await expect(promise).resolves.toBe(false)
  })
})
