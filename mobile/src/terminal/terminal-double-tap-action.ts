import { TERMINAL_ACCESSORY_KEYS } from './terminal-accessory-keys'
import type { TerminalLiveAccessoryInput } from './terminal-live-accessory-input'
import type { TerminalSurfaceTap } from './terminal-webview-contract'

export const TERMINAL_DOUBLE_TAP_MAX_DELAY_MS = 300
export const TERMINAL_DOUBLE_TAP_MAX_DISTANCE_PX = 48

const TERMINAL_DOUBLE_TAP_KEY_IDS = [
  'tab',
  'shiftTab',
  'escape',
  'enter',
  'ctrlC',
  'ctrlL'
] as const

export const TERMINAL_DOUBLE_TAP_ACTION_IDS = ['off', ...TERMINAL_DOUBLE_TAP_KEY_IDS] as const

export type TerminalDoubleTapActionId = (typeof TERMINAL_DOUBLE_TAP_ACTION_IDS)[number]

export type TerminalDoubleTapAction = {
  readonly id: TerminalDoubleTapActionId
  readonly label: string
  readonly description: string
  readonly bytes: string | null
}

export type TerminalTapRecord = TerminalSurfaceTap & {
  readonly handle: string
  readonly at: number
}

export type TerminalDoubleTapActionResult = {
  readonly bytes: string | null
  readonly nextTap: TerminalTapRecord | null
}

const ACTION_COPY: Record<
  (typeof TERMINAL_DOUBLE_TAP_KEY_IDS)[number],
  { label: string; description: string }
> = {
  tab: { label: 'Send Tab', description: 'Send the standard terminal Tab key.' },
  shiftTab: {
    label: 'Send Shift+Tab',
    description: 'Send the reverse-tab terminal sequence.'
  },
  escape: { label: 'Send Escape', description: 'Send Escape to the active terminal.' },
  enter: { label: 'Send Enter', description: 'Submit the current terminal input.' },
  ctrlC: { label: 'Send Ctrl+C', description: 'Interrupt the active terminal process.' },
  ctrlL: { label: 'Send Ctrl+L', description: 'Request a terminal screen clear.' }
}

export const TERMINAL_DOUBLE_TAP_ACTIONS: readonly TerminalDoubleTapAction[] = [
  {
    id: 'off',
    label: 'Off',
    description: 'Double-tap only focuses the terminal.',
    bytes: null
  },
  ...TERMINAL_DOUBLE_TAP_KEY_IDS.map((id) => {
    const key = TERMINAL_ACCESSORY_KEYS.find((candidate) => candidate.id === id)
    if (!key) {
      throw new Error(`Unknown terminal accessory key: ${id}`)
    }
    return { id, ...ACTION_COPY[id], bytes: key.bytes }
  })
]

export function isTerminalDoubleTapActionId(value: unknown): value is TerminalDoubleTapActionId {
  return (
    typeof value === 'string' &&
    TERMINAL_DOUBLE_TAP_ACTION_IDS.includes(value as TerminalDoubleTapActionId)
  )
}

export function terminalDoubleTapActionLabel(actionId: TerminalDoubleTapActionId): string {
  return TERMINAL_DOUBLE_TAP_ACTIONS.find((action) => action.id === actionId)?.label ?? 'Off'
}

export function sendDoubleTapAction(
  bytes: string | null,
  send: (input: TerminalLiveAccessoryInput) => unknown
): void {
  if (bytes !== null) {
    void send({ bytes })
  }
}

export function resolveTerminalDoubleTapAction({
  actionId,
  handle,
  lastTap,
  now,
  tap
}: {
  actionId: TerminalDoubleTapActionId
  handle: string
  lastTap: TerminalTapRecord | null
  now: number
  tap: TerminalSurfaceTap
}): TerminalDoubleTapActionResult {
  const action = TERMINAL_DOUBLE_TAP_ACTIONS.find((candidate) => candidate.id === actionId)
  if (!action?.bytes) {
    return { bytes: null, nextTap: null }
  }

  const elapsed = lastTap?.handle === handle ? now - lastTap.at : null
  const distance = lastTap ? Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) : null
  if (
    elapsed !== null &&
    elapsed >= 0 &&
    elapsed <= TERMINAL_DOUBLE_TAP_MAX_DELAY_MS &&
    lastTap !== null &&
    tap.sequence === lastTap.sequence + 1 &&
    distance !== null &&
    distance <= TERMINAL_DOUBLE_TAP_MAX_DISTANCE_PX
  ) {
    return { bytes: action.bytes, nextTap: null }
  }

  return { bytes: null, nextTap: { handle, at: now, ...tap } }
}
