import { useRef, useCallback, type Dispatch } from 'react'
import { parseLine } from '@/model/parser.ts'
import type { RawRecord } from '@/model/types.ts'
import type { AppAction } from './useAppState.ts'
import type { SessionMeta } from './useAppState.ts'

const BATCH_SIZE = 50

export function useStreamingParse(dispatch: Dispatch<AppAction>) {
  const abortRef = useRef(false)
  const pausedRef = useRef(false)
  const resumeResolveRef = useRef<(() => void) | null>(null)

  const parseText = useCallback(
    async (text: string, meta: SessionMeta): Promise<number> => {
      abortRef.current = false
      pausedRef.current = false

      dispatch({ type: 'LOAD_START', meta })

      const lines = text.split('\n')
      let hasValidRecord = false
      let batch: RawRecord[] = []
      let skippedInBatch = 0
      let totalRecords = 0

      for (const line of lines) {
        if (abortRef.current) break

        if (pausedRef.current) {
          if (batch.length > 0 || skippedInBatch > 0) {
            dispatch({ type: 'RECORDS_BATCH', records: batch, skipped: skippedInBatch })
            batch = []
            skippedInBatch = 0
          }
          await new Promise<void>((resolve) => {
            resumeResolveRef.current = resolve
          })
          resumeResolveRef.current = null
          if (abortRef.current) break
        }

        const record = parseLine(line)
        if (record) {
          hasValidRecord = true
          batch.push(record)
          totalRecords++
        } else if (line.trim() !== '') {
          skippedInBatch++
        }

        if (batch.length >= BATCH_SIZE) {
          dispatch({ type: 'RECORDS_BATCH', records: batch, skipped: skippedInBatch })
          batch = []
          skippedInBatch = 0
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      if (batch.length > 0 || skippedInBatch > 0) {
        dispatch({ type: 'RECORDS_BATCH', records: batch, skipped: skippedInBatch })
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

      return totalRecords
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
