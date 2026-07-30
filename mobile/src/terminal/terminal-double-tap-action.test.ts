import { describe, expect, it } from 'vitest'
import {
  TERMINAL_DOUBLE_TAP_ACTIONS,
  TERMINAL_DOUBLE_TAP_MAX_DELAY_MS,
  TERMINAL_DOUBLE_TAP_MAX_DISTANCE_PX,
  resolveTerminalDoubleTapAction,
  type TerminalDoubleTapActionId
} from './terminal-double-tap-action'

const FIRST_TAP = { sequence: 1, x: 100, y: 200 }
const SECOND_TAP = { sequence: 2, x: 100, y: 200 }

function resolveSecondTap(
  actionId: TerminalDoubleTapActionId,
  overrides: Partial<Parameters<typeof resolveTerminalDoubleTapAction>[0]> = {}
) {
  return resolveTerminalDoubleTapAction({
    actionId,
    handle: 'term-1',
    lastTap: { handle: 'term-1', at: 100, ...FIRST_TAP },
    now: 100 + TERMINAL_DOUBLE_TAP_MAX_DELAY_MS,
    tap: SECOND_TAP,
    ...overrides
  })
}

describe('terminal double-tap action', () => {
  it.each(TERMINAL_DOUBLE_TAP_ACTIONS.filter((action) => action.bytes !== null))(
    'emits $label bytes for a nearby second tap',
    (action) => {
      expect(resolveSecondTap(action.id)).toEqual({ bytes: action.bytes, nextTap: null })
    }
  )

  it('stays inactive and clears the sequence when set to off', () => {
    expect(resolveSecondTap('off')).toEqual({ bytes: null, nextTap: null })
  })

  it('starts a new sequence after the time window expires', () => {
    expect(resolveSecondTap('tab', { now: 101 + TERMINAL_DOUBLE_TAP_MAX_DELAY_MS })).toEqual({
      bytes: null,
      nextTap: {
        handle: 'term-1',
        at: 101 + TERMINAL_DOUBLE_TAP_MAX_DELAY_MS,
        ...SECOND_TAP
      }
    })
  })

  it('does not combine taps across terminals, intervening gestures, distant points, or clock reversal', () => {
    expect(resolveSecondTap('tab', { handle: 'term-2' }).bytes).toBeNull()
    expect(resolveSecondTap('tab', { tap: { ...SECOND_TAP, sequence: 3 } }).bytes).toBeNull()
    expect(
      resolveSecondTap('tab', {
        tap: {
          ...SECOND_TAP,
          x: SECOND_TAP.x + TERMINAL_DOUBLE_TAP_MAX_DISTANCE_PX + 1
        }
      }).bytes
    ).toBeNull()
    expect(resolveSecondTap('tab', { now: 99 }).bytes).toBeNull()
  })
})
