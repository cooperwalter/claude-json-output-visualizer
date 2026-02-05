import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './useSearch.ts'
import type { ConversationTurn, RawRecord, IndexMaps, ContentBlock, Usage } from '@/model/types.ts'

function makeEmptyIndexes(): IndexMaps {
  return {
    byUuid: new Map(),
    byMessageId: new Map(),
    byToolUseId: new Map(),
    byParentToolUseId: new Map(),
  }
}

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

const defaultUsage: Usage = {
  input_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
  output_tokens: 0,
  service_tier: 'standard',
}

function makeAssistantRecord(
  messageId: string,
  contentBlocks: ContentBlock[],
  parentToolUseId: string | null = null,
): RawRecord {
  return {
    type: 'assistant',
    message: {
      model: 'claude-sonnet',
      id: messageId,
      type: 'message',
      role: 'assistant',
      content: contentBlocks,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: defaultUsage,
      context_management: null,
    },
    parent_tool_use_id: parentToolUseId,
    session_id: 'sess_1',
    uuid: `uuid_${messageId}`,
  }
}

function makeSubAgentIndexes(parentToolUseId: string, subRecords: RawRecord[]): IndexMaps {
  const indexes = makeEmptyIndexes()
  indexes.byParentToolUseId.set(parentToolUseId, subRecords)
  return indexes
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
    act(() => { result.current.setQuery('file not found') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
  })

  it('returns no matches for empty query', () => {
    const turns = [
      makeTurn({ messageId: 'msg_1', contentBlocks: [{ type: 'text', text: 'Hello' }] }),
    ]
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
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
    const { result } = renderHook(() => useSearch(turns, makeEmptyIndexes()))
    act(() => { result.current.setQuery('hello') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)

    act(() => { result.current.clearSearch() })
    expect(result.current.query).toBe('')
    expect(result.current.matchCount).toBe(0)
    expect(result.current.isActive).toBe(false)
  })
})

describe('useSearch sub-agent search', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('matches parent turn when sub-agent text content matches the query', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} }],
      }),
    ]
    const indexes = makeSubAgentIndexes('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'text', text: 'sub-agent unique text' }], 'tu_task_1'),
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('sub-agent unique') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
    expect(result.current.matchingTurnIds.has('msg_1')).toBe(true)
  })

  it('matches parent turn when sub-agent tool name matches the query', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} }],
      }),
    ]
    const indexes = makeSubAgentIndexes('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'tool_use', id: 'tu_bash', name: 'Bash', input: { command: 'ls' } }], 'tu_task_1'),
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('bash') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
  })

  it('does not match parent turn when sub-agent content does not match', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} }],
      }),
    ]
    const indexes = makeSubAgentIndexes('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'text', text: 'nothing relevant here' }], 'tu_task_1'),
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('nonexistent') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(0)
  })

  it('matches parent turn when nested sub-agent content matches at depth 2', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} }],
      }),
    ]
    const indexes = makeEmptyIndexes()
    indexes.byParentToolUseId.set('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'tool_use', id: 'tu_task_2', name: 'Task', input: {} }], 'tu_task_1'),
    ])
    indexes.byParentToolUseId.set('tu_task_2', [
      makeAssistantRecord('deep_msg', [{ type: 'text', text: 'deeply nested content' }], 'tu_task_2'),
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('deeply nested') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
    expect(result.current.matchingTurnIds.has('msg_1')).toBe(true)
  })

  it('matches parent turn when sub-agent tool input matches the query', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} }],
      }),
    ]
    const indexes = makeSubAgentIndexes('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'tool_use', id: 'tu_bash', name: 'Bash', input: { command: 'npm test' } }], 'tu_task_1'),
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('npm test') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
  })

  it('matches parent turn when sub-agent tool result content matches the query', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [{ type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} }],
      }),
    ]
    const subUserRecord: RawRecord = {
      type: 'user',
      message: {
        role: 'user',
        content: [{ tool_use_id: 'tu_bash', type: 'tool_result', content: 'Error: permission denied' }],
      },
      parent_tool_use_id: 'tu_task_1',
      session_id: 'sess_1',
      uuid: 'uuid_sub_user',
      tool_use_result: { type: 'text' },
    }
    const indexes = makeSubAgentIndexes('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'tool_use', id: 'tu_bash', name: 'Bash', input: {} }], 'tu_task_1'),
      subUserRecord,
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('permission denied') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
    expect(result.current.matchingTurnIds.has('msg_1')).toBe(true)
  })

  it('does not double-count when both parent and sub-agent content match', () => {
    const turns = [
      makeTurn({
        messageId: 'msg_1',
        contentBlocks: [
          { type: 'text', text: 'hello from parent' },
          { type: 'tool_use', id: 'tu_task_1', name: 'Task', input: {} },
        ],
      }),
    ]
    const indexes = makeSubAgentIndexes('tu_task_1', [
      makeAssistantRecord('sub_msg_1', [{ type: 'text', text: 'hello from sub-agent' }], 'tu_task_1'),
    ])
    const { result } = renderHook(() => useSearch(turns, indexes))
    act(() => { result.current.setQuery('hello') })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.matchCount).toBe(1)
  })
})
