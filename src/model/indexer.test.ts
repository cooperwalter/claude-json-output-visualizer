import { describe, it, expect } from 'vitest'
import { buildIndexes } from './indexer.ts'
import type { AssistantRecord, UserRecord } from './types.ts'

function makeAssistantRecord(overrides: Partial<AssistantRecord> = {}): AssistantRecord {
  return {
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
    ...overrides,
  } as AssistantRecord
}

function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: [{ tool_use_id: 'tu_001', type: 'tool_result', content: 'result text' }],
    },
    parent_tool_use_id: null,
    session_id: 'sess_001',
    uuid: 'uuid_002',
    tool_use_result: { type: 'text' },
    ...overrides,
  } as UserRecord
}

describe('buildIndexes', () => {
  it('indexes records by uuid', () => {
    const rec = makeAssistantRecord()
    const indexes = buildIndexes([rec])
    expect(indexes.byUuid.get('uuid_001')).toBe(rec)
  })

  it('indexes assistant records by message id', () => {
    const rec = makeAssistantRecord()
    const indexes = buildIndexes([rec])
    expect(indexes.byMessageId.get('msg_001')).toEqual([rec])
  })

  it('groups multiple assistant records with same message id', () => {
    const rec1 = makeAssistantRecord({ uuid: 'uuid_001' })
    const rec2 = makeAssistantRecord({ uuid: 'uuid_003' })
    const indexes = buildIndexes([rec1, rec2])
    expect(indexes.byMessageId.get('msg_001')!.length).toBe(2)
  })

  it('creates ToolCallPair entries for tool_use blocks', () => {
    const rec = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'tool_use', id: 'tu_001', name: 'Read', input: { path: '/test' } }],
      },
    })
    const indexes = buildIndexes([rec])
    const pair = indexes.byToolUseId.get('tu_001')
    expect(pair).toBeDefined()
    expect(pair!.toolUse.name).toBe('Read')
    expect(pair!.toolResult).toBeNull()
  })

  it('pairs tool_use with tool_result when user record follows', () => {
    const assistant = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'tool_use', id: 'tu_001', name: 'Read', input: { path: '/test' } }],
      },
    })
    const user = makeUserRecord()
    const indexes = buildIndexes([assistant, user])
    const pair = indexes.byToolUseId.get('tu_001')
    expect(pair!.toolResult).not.toBeNull()
    expect(pair!.toolResult!.content).toBe('result text')
    expect(pair!.toolResult!.isError).toBe(false)
  })

  it('indexes records by parent_tool_use_id', () => {
    const rec = makeAssistantRecord({ parent_tool_use_id: 'parent_tu' })
    const indexes = buildIndexes([rec])
    expect(indexes.byParentToolUseId.get('parent_tu')).toEqual([rec])
  })

  it('does not add records with null parent_tool_use_id to byParentToolUseId', () => {
    const rec = makeAssistantRecord({ parent_tool_use_id: null })
    const indexes = buildIndexes([rec])
    expect(indexes.byParentToolUseId.size).toBe(0)
  })

  it('returns empty maps for empty input', () => {
    const indexes = buildIndexes([])
    expect(indexes.byUuid.size).toBe(0)
    expect(indexes.byMessageId.size).toBe(0)
    expect(indexes.byToolUseId.size).toBe(0)
    expect(indexes.byParentToolUseId.size).toBe(0)
  })

  it('marks tool result with is_error true when present', () => {
    const assistant = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'tool_use', id: 'tu_err', name: 'Bash', input: { command: 'fail' } }],
      },
    })
    const user: UserRecord = {
      type: 'user',
      message: {
        role: 'user',
        content: [{ tool_use_id: 'tu_err', type: 'tool_result', content: 'error!', is_error: true }],
      },
      parent_tool_use_id: null,
      session_id: 'sess_001',
      uuid: 'uuid_err',
      tool_use_result: { type: 'text' },
    }
    const indexes = buildIndexes([assistant, user])
    const pair = indexes.byToolUseId.get('tu_err')
    expect(pair!.toolResult!.isError).toBe(true)
  })
})
