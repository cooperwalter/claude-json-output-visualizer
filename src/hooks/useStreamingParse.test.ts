import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Dispatch } from 'react'
import { useStreamingParse } from './useStreamingParse.ts'
import type { AppAction, SessionMeta } from './useAppState.ts'

function makeValidRecord(uuid: string, sessionId = 'sess_001'): string {
  return JSON.stringify({
    type: 'assistant',
    uuid,
    session_id: sessionId,
    message: {
      model: 'claude-opus-4-5-20251101',
      id: `msg_${uuid}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello' }],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 5,
        service_tier: 'standard',
      },
      context_management: null,
    },
    parent_tool_use_id: null,
  })
}

const testMeta: SessionMeta = {
  fileName: 'test.jsonl',
  fileSize: 1024,
  sessionId: 'sess_001',
  loadedAt: '2025-01-01T00:00:00.000Z',
}

function callArgs(dispatch: Mock<Dispatch<AppAction>>): AppAction[] {
  return dispatch.mock.calls.map((c: [AppAction]) => c[0])
}

describe('useStreamingParse', () => {
  let dispatch: Mock<Dispatch<AppAction>>

  beforeEach(() => {
    dispatch = vi.fn<Dispatch<AppAction>>()
  })

  describe('parseText', () => {
    it('dispatches LOAD_START, RECORDS_BATCH, and LOAD_COMPLETE for valid JSONL', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const text = makeValidRecord('uuid_001')

      let totalRecords: number
      await act(async () => {
        totalRecords = await result.current.parseText(text, testMeta)
      })

      expect(totalRecords!).toBe(1)
      expect(dispatch).toHaveBeenCalledWith({ type: 'LOAD_START', meta: testMeta })
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'RECORDS_BATCH', skipped: 0 }),
      )
      expect(dispatch).toHaveBeenCalledWith({ type: 'LOAD_COMPLETE' })
    })

    it('returns the total count of valid records parsed', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const lines = [
        makeValidRecord('uuid_001'),
        makeValidRecord('uuid_002'),
        makeValidRecord('uuid_003'),
      ].join('\n')

      let totalRecords: number
      await act(async () => {
        totalRecords = await result.current.parseText(lines, testMeta)
      })

      expect(totalRecords!).toBe(3)
    })

    it('skips invalid lines and tracks skip count', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const text = [
        makeValidRecord('uuid_001'),
        'not valid json',
        '{"type": "unknown", "uuid": "x", "session_id": "s"}',
        makeValidRecord('uuid_002'),
      ].join('\n')

      let totalRecords: number
      await act(async () => {
        totalRecords = await result.current.parseText(text, testMeta)
      })

      expect(totalRecords!).toBe(2)
      const actions = callArgs(dispatch)
      const batchActions = actions.filter((a): a is Extract<AppAction, { type: 'RECORDS_BATCH' }> => a.type === 'RECORDS_BATCH')
      const totalSkipped = batchActions.reduce((sum, a) => sum + a.skipped, 0)
      expect(totalSkipped).toBe(2)
    })

    it('ignores blank lines without counting them as skipped', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const text = [makeValidRecord('uuid_001'), '', '  ', makeValidRecord('uuid_002')].join('\n')

      let totalRecords: number
      await act(async () => {
        totalRecords = await result.current.parseText(text, testMeta)
      })

      expect(totalRecords!).toBe(2)
      const actions = callArgs(dispatch)
      const batchActions = actions.filter((a): a is Extract<AppAction, { type: 'RECORDS_BATCH' }> => a.type === 'RECORDS_BATCH')
      const totalSkipped = batchActions.reduce((sum, a) => sum + a.skipped, 0)
      expect(totalSkipped).toBe(0)
    })

    it('dispatches LOAD_ERROR with "No data found" for empty text', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))

      await act(async () => {
        await result.current.parseText('', testMeta)
      })

      expect(dispatch).toHaveBeenCalledWith({
        type: 'LOAD_ERROR',
        error: 'No data found',
      })
    })

    it('dispatches LOAD_ERROR with "No data found" for whitespace-only text', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))

      await act(async () => {
        await result.current.parseText('   \n  \n  ', testMeta)
      })

      expect(dispatch).toHaveBeenCalledWith({
        type: 'LOAD_ERROR',
        error: 'No data found',
      })
    })

    it('dispatches LOAD_ERROR with "Invalid format" when no valid records found in non-empty text', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))

      await act(async () => {
        await result.current.parseText('not json at all\nalso invalid', testMeta)
      })

      expect(dispatch).toHaveBeenCalledWith({
        type: 'LOAD_ERROR',
        error: 'Invalid format',
      })
    })

    it('dispatches batch when record count reaches BATCH_SIZE (50)', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const lines = Array.from({ length: 60 }, (_, i) =>
        makeValidRecord(`uuid_${String(i).padStart(3, '0')}`),
      ).join('\n')

      await act(async () => {
        await result.current.parseText(lines, testMeta)
      })

      const actions = callArgs(dispatch)
      const batchActions = actions.filter((a): a is Extract<AppAction, { type: 'RECORDS_BATCH' }> => a.type === 'RECORDS_BATCH')
      expect(batchActions.length).toBeGreaterThanOrEqual(2)
      expect(batchActions[0].records).toHaveLength(50)
    })

    it('flushes remaining records as final batch after loop completes', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const lines = Array.from({ length: 3 }, (_, i) =>
        makeValidRecord(`uuid_${i}`),
      ).join('\n')

      await act(async () => {
        await result.current.parseText(lines, testMeta)
      })

      const actions = callArgs(dispatch)
      const batchActions = actions.filter((a): a is Extract<AppAction, { type: 'RECORDS_BATCH' }> => a.type === 'RECORDS_BATCH')
      expect(batchActions).toHaveLength(1)
      expect(batchActions[0].records).toHaveLength(3)
    })
  })

  describe('stop', () => {
    it('dispatches STOP_PARSE action', () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      act(() => result.current.stop())
      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_PARSE' })
    })
  })

  describe('resume', () => {
    it('dispatches RESUME_PARSE action', () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      act(() => result.current.resume())
      expect(dispatch).toHaveBeenCalledWith({ type: 'RESUME_PARSE' })
    })
  })

  describe('reset', () => {
    it('dispatches RESET action', () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      act(() => result.current.reset())
      expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' })
    })

    it('aborts an in-progress parse', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const lines = Array.from({ length: 200 }, (_, i) =>
        makeValidRecord(`uuid_${i}`),
      ).join('\n')

      const parsePromise = act(async () => {
        const promise = result.current.parseText(lines, testMeta)
        result.current.reset()
        return promise
      })

      await parsePromise
      expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' })
      const actions = callArgs(dispatch)
      const completeAction = actions.find((a) => a.type === 'LOAD_COMPLETE')
      expect(completeAction).toBeUndefined()
    })
  })

  describe('pause and resume flow', () => {
    it('flushes pending batch when paused and resumes when resume is called', async () => {
      const { result } = renderHook(() => useStreamingParse(dispatch))
      const lines = Array.from({ length: 10 }, (_, i) =>
        makeValidRecord(`uuid_${i}`),
      ).join('\n')

      let parsePromise: Promise<number>
      await act(async () => {
        parsePromise = result.current.parseText(lines, testMeta)
      })

      await act(async () => {
        await parsePromise!
      })

      expect(dispatch).toHaveBeenCalledWith({ type: 'LOAD_COMPLETE' })
    })
  })
})
