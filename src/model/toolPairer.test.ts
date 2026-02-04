import { describe, it, expect } from 'vitest'
import { pairToolCalls } from './toolPairer.ts'
import type { AssistantRecord, UserRecord, RawRecord } from './types.ts'

function makeAssistantWithTool(toolId: string, toolName: string): AssistantRecord {
  return {
    type: 'assistant',
    message: {
      model: 'claude-opus-4-5-20251101',
      id: 'msg_001',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'tool_use', id: toolId, name: toolName, input: { key: 'value' } }],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
        output_tokens: 5,
        service_tier: 'standard',
      },
      context_management: null,
    },
    parent_tool_use_id: null,
    session_id: 'sess_001',
    uuid: 'uuid_001',
  }
}

function makeUserWithResult(toolUseId: string, content: string, isError = false): UserRecord {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: [{ tool_use_id: toolUseId, type: 'tool_result', content, is_error: isError }],
    },
    parent_tool_use_id: null,
    session_id: 'sess_001',
    uuid: `uuid_result_${toolUseId}`,
    tool_use_result: { type: 'text' },
  }
}

describe('pairToolCalls', () => {
  it('pairs a tool_use with its corresponding tool_result', () => {
    const records: RawRecord[] = [
      makeAssistantWithTool('tu_001', 'Read'),
      makeUserWithResult('tu_001', 'file content'),
    ]
    const pairs = pairToolCalls(records)
    expect(pairs.length).toBe(1)
    expect(pairs[0].toolUse.name).toBe('Read')
    expect(pairs[0].toolResult!.content).toBe('file content')
    expect(pairs[0].toolResult!.isError).toBe(false)
  })

  it('returns toolResult as null when no matching result exists', () => {
    const records: RawRecord[] = [makeAssistantWithTool('tu_001', 'Read')]
    const pairs = pairToolCalls(records)
    expect(pairs.length).toBe(1)
    expect(pairs[0].toolResult).toBeNull()
  })

  it('handles multiple tool_use blocks in order', () => {
    const assistant: AssistantRecord = {
      type: 'assistant',
      message: {
        model: 'claude-opus-4-5-20251101',
        id: 'msg_001',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tu_001', name: 'Read', input: {} },
          { type: 'tool_use', id: 'tu_002', name: 'Write', input: {} },
        ],
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
          output_tokens: 5,
          service_tier: 'standard',
        },
        context_management: null,
      },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: 'uuid_001',
    }
    const records: RawRecord[] = [
      assistant,
      makeUserWithResult('tu_001', 'read result'),
      makeUserWithResult('tu_002', 'write result'),
    ]
    const pairs = pairToolCalls(records)
    expect(pairs.length).toBe(2)
    expect(pairs[0].toolUse.name).toBe('Read')
    expect(pairs[0].toolResult!.content).toBe('read result')
    expect(pairs[1].toolUse.name).toBe('Write')
    expect(pairs[1].toolResult!.content).toBe('write result')
  })

  it('marks error results correctly', () => {
    const records: RawRecord[] = [
      makeAssistantWithTool('tu_001', 'Bash'),
      makeUserWithResult('tu_001', 'command failed', true),
    ]
    const pairs = pairToolCalls(records)
    expect(pairs[0].toolResult!.isError).toBe(true)
  })

  it('returns empty array for records with no tool_use blocks', () => {
    const assistant: AssistantRecord = {
      type: 'assistant',
      message: {
        model: 'claude-opus-4-5-20251101',
        id: 'msg_001',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello' }],
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
          output_tokens: 5,
          service_tier: 'standard',
        },
        context_management: null,
      },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: 'uuid_001',
    }
    const pairs = pairToolCalls([assistant])
    expect(pairs.length).toBe(0)
  })

  it('returns empty array for empty input', () => {
    expect(pairToolCalls([])).toEqual([])
  })
})
