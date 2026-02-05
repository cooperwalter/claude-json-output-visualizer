import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilters } from './useFilters.ts'
import type { ConversationTurn, IndexMaps, ToolCallPair, AssistantRecord, UserRecord } from '@/model/types.ts'

function makeAssistantTurn(overrides: Partial<ConversationTurn> = {}): ConversationTurn {
  return {
    messageId: 'msg_001',
    role: 'assistant',
    records: [{
      type: 'assistant',
      message: {
        model: 'claude-opus-4-5-20251101',
        id: 'msg_001',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello' }],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 5, service_tier: 'standard' },
        context_management: null,
      },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: 'uuid_001',
    } satisfies AssistantRecord],
    contentBlocks: [{ type: 'text', text: 'Hello' }],
    parentToolUseId: null,
    sessionId: 'sess_001',
    ...overrides,
  }
}

function makeUserTurn(overrides: Partial<ConversationTurn> = {}): ConversationTurn {
  return {
    messageId: 'uuid_002',
    role: 'user',
    records: [{
      type: 'user',
      message: { role: 'user', content: [{ tool_use_id: 'tu_001', type: 'tool_result', content: 'result' }] },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: 'uuid_002',
      tool_use_result: { type: 'text' },
    } satisfies UserRecord],
    contentBlocks: [],
    parentToolUseId: null,
    sessionId: 'sess_001',
    ...overrides,
  }
}

function makeToolUseTurn(toolName: string, toolUseId: string): ConversationTurn {
  return makeAssistantTurn({
    messageId: `msg_${toolName}`,
    records: [{
      type: 'assistant',
      message: {
        model: 'claude-opus-4-5-20251101',
        id: `msg_${toolName}`,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'tool_use', id: toolUseId, name: toolName, input: {} }],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 5, service_tier: 'standard' },
        context_management: null,
      },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: `uuid_${toolName}`,
    }],
    contentBlocks: [{ type: 'tool_use', id: toolUseId, name: toolName, input: {} }],
  })
}

function makeErrorTurn(): ConversationTurn {
  return makeUserTurn({
    messageId: 'uuid_err',
    records: [{
      type: 'user',
      message: {
        role: 'user',
        content: [{ tool_use_id: 'tu_err', type: 'tool_result', content: 'error occurred', is_error: true }],
      },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: 'uuid_err',
      tool_use_result: { type: 'text' },
    }],
  })
}

function emptyIndexes(): IndexMaps {
  return {
    byUuid: new Map(),
    byMessageId: new Map(),
    byToolUseId: new Map(),
    byParentToolUseId: new Map(),
  }
}

describe('useFilters', () => {
  it('returns all turns when no filters are active', () => {
    const turns = [makeAssistantTurn(), makeUserTurn()]
    const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
    expect(result.current.filteredTurns).toHaveLength(2)
    expect(result.current.isActive).toBe(false)
  })

  describe('role filter', () => {
    it('filters to assistant-only turns', () => {
      const turns = [makeAssistantTurn(), makeUserTurn()]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.setRole('assistant'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].role).toBe('assistant')
      expect(result.current.isActive).toBe(true)
    })

    it('filters to user-only turns', () => {
      const turns = [makeAssistantTurn(), makeUserTurn()]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.setRole('user'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].role).toBe('user')
    })
  })

  describe('tool name filter', () => {
    it('shows only turns containing the selected tool', () => {
      const turns = [
        makeAssistantTurn(),
        makeToolUseTurn('Read', 'tu_read'),
        makeToolUseTurn('Bash', 'tu_bash'),
      ]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.toggleToolName('Read'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].messageId).toBe('msg_Read')
      expect(result.current.isActive).toBe(true)
    })

    it('includes tool_result turns that match the selected tool via byToolUseId index', () => {
      const toolPair: ToolCallPair = {
        toolUse: { id: 'tu_read', name: 'Read', input: {} },
        toolResult: { content: 'file data', isError: false, meta: { type: 'text' } },
      }
      const indexes: IndexMaps = {
        ...emptyIndexes(),
        byToolUseId: new Map([['tu_read', toolPair]]),
      }
      const userTurn = makeUserTurn({
        messageId: 'uuid_read_result',
        records: [{
          type: 'user',
          message: { role: 'user', content: [{ tool_use_id: 'tu_read', type: 'tool_result', content: 'data' }] },
          parent_tool_use_id: null,
          session_id: 'sess_001',
          uuid: 'uuid_read_result',
          tool_use_result: { type: 'text' },
        }],
      })
      const turns = [makeToolUseTurn('Read', 'tu_read'), userTurn]
      const { result } = renderHook(() => useFilters(turns, indexes))
      act(() => result.current.toggleToolName('Read'))
      expect(result.current.filteredTurns).toHaveLength(2)
    })

    it('toggles tool name off when called again', () => {
      const turns = [makeToolUseTurn('Read', 'tu_read')]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.toggleToolName('Read'))
      expect(result.current.filteredTurns).toHaveLength(1)
      act(() => result.current.toggleToolName('Read'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('status filter', () => {
    it('filters to error turns only', () => {
      const turns = [makeAssistantTurn(), makeErrorTurn()]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.setStatus('errors'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].messageId).toBe('uuid_err')
    })

    it('filters to sub-agent (Task) turns only', () => {
      const taskTurn = makeToolUseTurn('Task', 'tu_task')
      const turns = [makeAssistantTurn(), taskTurn]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.setStatus('subagent'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].messageId).toBe('msg_Task')
    })

    it('filters to text-only turns', () => {
      const textTurn = makeAssistantTurn()
      const toolTurn = makeToolUseTurn('Read', 'tu_read')
      toolTurn.contentBlocks = [{ type: 'tool_use', id: 'tu_read', name: 'Read', input: {} }]
      const turns = [textTurn, toolTurn]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.setStatus('text'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].messageId).toBe('msg_001')
    })
  })

  describe('model filter', () => {
    it('filters to turns from a specific model', () => {
      const opusTurn = makeAssistantTurn()
      const sonnetTurn = makeAssistantTurn({
        messageId: 'msg_sonnet',
        records: [{
          type: 'assistant',
          message: {
            model: 'claude-3-5-sonnet-20241022',
            id: 'msg_sonnet',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi' }],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 5, service_tier: 'standard' },
            context_management: null,
          },
          parent_tool_use_id: null,
          session_id: 'sess_001',
          uuid: 'uuid_sonnet',
        }],
      })
      const turns = [opusTurn, sonnetTurn]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => result.current.setModel('claude-3-5-sonnet-20241022'))
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].messageId).toBe('msg_sonnet')
    })
  })

  describe('combined filters (AND logic)', () => {
    it('applies role and status filters together', () => {
      const turns = [makeAssistantTurn(), makeErrorTurn()]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => {
        result.current.setRole('user')
        result.current.setStatus('errors')
      })
      expect(result.current.filteredTurns).toHaveLength(1)
      expect(result.current.filteredTurns[0].messageId).toBe('uuid_err')
    })

    it('returns no turns when filters contradict', () => {
      const turns = [makeAssistantTurn(), makeErrorTurn()]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => {
        result.current.setRole('assistant')
        result.current.setStatus('errors')
      })
      expect(result.current.filteredTurns).toHaveLength(0)
    })
  })

  describe('clearFilters', () => {
    it('resets all filters to defaults', () => {
      const turns = [makeAssistantTurn()]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      act(() => {
        result.current.setRole('user')
        result.current.setStatus('errors')
        result.current.setModel('claude-opus-4-5-20251101')
      })
      expect(result.current.isActive).toBe(true)
      act(() => result.current.clearFilters())
      expect(result.current.isActive).toBe(false)
      expect(result.current.filteredTurns).toHaveLength(1)
    })
  })

  describe('availableToolNames', () => {
    it('extracts sorted unique tool names from turns', () => {
      const turns = [
        makeToolUseTurn('Read', 'tu_r'),
        makeToolUseTurn('Bash', 'tu_b'),
        makeToolUseTurn('Read', 'tu_r2'),
      ]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      expect(result.current.availableToolNames).toEqual(['Bash', 'Read'])
    })
  })

  describe('availableModels', () => {
    it('extracts sorted unique models from assistant turns', () => {
      const sonnetTurn = makeAssistantTurn({
        messageId: 'msg_s',
        records: [{
          type: 'assistant',
          message: {
            model: 'claude-3-5-sonnet-20241022',
            id: 'msg_s',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: '' }],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 1, service_tier: 'standard' },
            context_management: null,
          },
          parent_tool_use_id: null,
          session_id: 'sess_001',
          uuid: 'uuid_s',
        }],
      })
      const turns = [makeAssistantTurn(), sonnetTurn]
      const { result } = renderHook(() => useFilters(turns, emptyIndexes()))
      expect(result.current.availableModels).toEqual([
        'claude-3-5-sonnet-20241022',
        'claude-opus-4-5-20251101',
      ])
    })
  })
})
