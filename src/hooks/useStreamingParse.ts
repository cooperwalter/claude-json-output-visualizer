import { useRef, useCallback, type Dispatch } from 'react'
import { parseLine } from '@/model/parser.ts'
import type { AppAction } from './useAppState.ts'
import type { SessionMeta } from './useAppState.ts'

export function useStreamingParse(dispatch: Dispatch<AppAction>) {
  const abortRef = useRef(false)
  const pausedRef = useRef(false)
  const resumeResolveRef = useRef<(() => void) | null>(null)

  const parseText = useCallback(
    async (text: string, meta: SessionMeta) => {
      abortRef.current = false
      pausedRef.current = false

      dispatch({ type: 'LOAD_START', meta })

      const lines = text.split('\n')
      let hasValidRecord = false

      for (const line of lines) {
        if (abortRef.current) break

        if (pausedRef.current) {
          await new Promise<void>((resolve) => {
            resumeResolveRef.current = resolve
          })
          resumeResolveRef.current = null
          if (abortRef.current) break
        }

        const record = parseLine(line)
        if (record) {
          hasValidRecord = true
          dispatch({ type: 'RECORD_ADDED', record })
        } else if (line.trim() !== '') {
          dispatch({ type: 'LINE_SKIPPED' })
        }

        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      if (!hasValidRecord && !abortRef.current) {
        if (text.trim() === '') {
          dispatch({ type: 'LOAD_ERROR', error: 'No data found' })
        } else {
          dispatch({ type: 'LOAD_ERROR', error: 'Invalid format' })
        }
      } else if (!abortRef.current) {
        dispatch({ type: 'LOAD_COMPLETE' })
      }
    },
    [dispatch],
  )

  const stop = useCallback(() => {
    pausedRef.current = true
    dispatch({ type: 'STOP_PARSE' })
  }, [dispatch])

  const resume = useCallback(() => {
    pausedRef.current = false
    dispatch({ type: 'RESUME_PARSE' })
    resumeResolveRef.current?.()
  }, [dispatch])

  const reset = useCallback(() => {
    abortRef.current = true
    pausedRef.current = false
    resumeResolveRef.current?.()
    dispatch({ type: 'RESET' })
  }, [dispatch])

  return { parseText, stop, resume, reset }
}
