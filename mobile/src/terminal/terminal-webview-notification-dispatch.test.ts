import { describe, expect, it, vi } from 'vitest'
import { dispatchTerminalWebViewNotification } from './terminal-webview-notification-dispatch'

describe('terminal WebView tap notifications', () => {
  it('forwards a valid gesture sequence and finite tap coordinates', () => {
    const onTerminalTap = vi.fn()

    dispatchTerminalWebViewNotification(
      { type: 'terminal-tap', sequence: 7, x: 12, y: 34 },
      { onTerminalTap, reportEngineError: vi.fn() }
    )

    expect(onTerminalTap).toHaveBeenCalledWith({ sequence: 7, x: 12, y: 34 })
  })

  it.each([
    { type: 'terminal-tap', sequence: 1, x: '12', y: 34 },
    { type: 'terminal-tap', sequence: 1, x: Number.NaN, y: 34 },
    { type: 'terminal-tap', sequence: 1, x: 12, y: Number.POSITIVE_INFINITY },
    { type: 'terminal-tap', x: 12, y: 34 },
    { type: 'terminal-tap', sequence: 0, x: 12, y: 34 },
    { type: 'terminal-tap', sequence: 1.5, x: 12, y: 34 }
  ])('drops an invalid tap notification', (message) => {
    const onTerminalTap = vi.fn()

    dispatchTerminalWebViewNotification(message, {
      onTerminalTap,
      reportEngineError: vi.fn()
    })

    expect(onTerminalTap).not.toHaveBeenCalled()
  })
})
