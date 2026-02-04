import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './useSearch.ts'
import type { ConversationTurn, RawRecord } from '@/model/types.ts'

function makeTurn(overrides: Partial<ConversationTurn> & { messageId: string }): ConversationTurn {
  return {
    role: 'assistant',
    records: [],
    contentBlocks: [],
    parentToolUseId: null,
    sessionId: 'sess_1',
    ...overrides,
  }
}

function makeUserRecord(filePath: string): RawRecord {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: [{ tool_use_id: 'tu_1', type: 'tool_result', content: 'some content' }],
    },
    parent_tool_use_id: null,
    session_id: 'sess_1',
    uuid: 'uuid_1',
    tool_use_result: {
      type: 'text',
      file: {
        filePath,
        content: 'file content',
        numLines: 10,
        startLine: 1,
        totalLines: 10,
      },
    },
  }
}

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('matches turns containing text content blocks', () => {
    const turns = [
      makeTurn({ messageId: 'msg_1', contentBlocks: [{ type: 'text', text: 'Hello world' }] }),
      makeTurn({ messageId: 'msg_2', contentBlocks: [{ type: 'text', text: 'Goodbye' }] }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('hello') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
    expect(result.current.matchingTurnIds.has('msg_1')).toBe(true)
  })

  it('matches turns containing tool_use names', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_1', name: 'Read', input: {} }],
      }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('read') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
  })

  it('matches turns by tool result metadata file path', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        records: [makeUserRecord('/src/components/MyComponent.tsx')],
      }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('mycomponent') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
    expect(result.current.matchingTurnIds.has('msg_1')).toBe(true)
  })

  it('does not match turns when file path does not contain query', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        records: [makeUserRecord('/src/components/MyComponent.tsx')],
      }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('nonexistent') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(0)
  })

  it('matches turns by tool result content', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        records: [{
          type: 'user',
          message: {
            role: 'user',
            content: [{ tool_use_id: 'tu_1', type: 'tool_result', content: 'Error: file not found' }],
          },
          parent_tool_use_id: null,
          session_id: 'sess_1',
          uuid: 'uuid_1',
          tool_use_result: { type: 'text' },
        }],
      }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('file not found') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
  })

  it('returns no matches for empty query', () => {
    const turns = [
      makeTurn({ messageId: 'msg_1', contentBlocks: [{ type: 'text', text: 'Hello' }] }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(0)
    expect(result.current.isActive).toBe(false)
  })

  it('navigates between matches with nextMatch and prevMatch', () => {
    const turns = [
      makeTurn({ messageId: 'msg_1', contentBlocks: [{ type: 'text', text: 'Hello' }] }),
      makeTurn({ messageId: 'msg_2', contentBlocks: [{ type: 'text', text: 'Hello again' }] }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('hello') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(2)
    expect(result.current.currentMatchIndex).toBe(0)
    expect(result.current.currentMatchTurnId).toBe('msg_1')

    act(() => { result.current.nextMatch() })
    expect(result.current.currentMatchIndex).toBe(1)
    expect(result.current.currentMatchTurnId).toBe('msg_2')

    act(() => { result.current.nextMatch() })
    expect(result.current.currentMatchIndex).toBe(0)

    act(() => { result.current.prevMatch() })
    expect(result.current.currentMatchIndex).toBe(1)
  })

  it('clears search state completely with clearSearch', () => {
    const turns = [
      makeTurn({ messageId: 'msg_1', contentBlocks: [{ type: 'text', text: 'Hello' }] }),
    ]
    const { result } = renderHook(() => useSearch(turns))
    act(() => { result.current.setQuery('hello') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)

    act(() => { result.current.clearSearch() })
    expect(result.current.query).toBe('')
    expect(result.current.matchCount).toBe(0)
    expect(result.current.isActive).toBe(false)
  })
})
