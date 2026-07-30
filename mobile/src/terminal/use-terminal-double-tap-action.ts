import { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { loadTerminalDoubleTapAction } from '../storage/preferences'
import {
  resolveTerminalDoubleTapAction,
  type TerminalDoubleTapActionId,
  type TerminalTapRecord
} from './terminal-double-tap-action'
import type { TerminalSurfaceTap } from './terminal-webview-contract'

export function useTerminalDoubleTapAction(): (
  handle: string,
  tap: TerminalSurfaceTap
) => string | null {
  const actionIdRef = useRef<TerminalDoubleTapActionId>('off')
  const lastTapRef = useRef<TerminalTapRecord | null>(null)

  useFocusEffect(
    useCallback(() => {
      let active = true
      actionIdRef.current = 'off'
      lastTapRef.current = null
      void loadTerminalDoubleTapAction().then((actionId) => {
        if (active) {
          actionIdRef.current = actionId
        }
      })
      return () => {
        active = false
        actionIdRef.current = 'off'
        lastTapRef.current = null
      }
    }, [])
  )

  return useCallback((handle: string, tap: TerminalSurfaceTap) => {
    const resolution = resolveTerminalDoubleTapAction({
      actionId: actionIdRef.current,
      handle,
      lastTap: lastTapRef.current,
      now: Date.now(),
      tap
    })
    lastTapRef.current = resolution.nextTap
    return resolution.bytes
  }, [])
}
