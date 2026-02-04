import { describe, it, expect } from 'vitest'
import { groupIntoTurns } from './grouper.ts'
import type { AssistantRecord, UserRecord, RawRecord } from './types.ts'

function makeAssistantRecord(id: string, uuid: string, msgId: string): AssistantRecord {
  return {
    type: 'assistant',
    message: {
      model: 'claude-opus-4-5-20251101',
      id: msgId,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: `text-${id}` }],
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
    uuid,
  }
}

function makeUserRecord(uuid: string): UserRecord {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: [{ tool_use_id: 'tu_001', type: 'tool_result', content: 'result' }],
    },
    parent_tool_use_id: null,
    session_id: 'sess_001',
    uuid,
    tool_use_result: { type: 'text' },
  }
}

describe('groupIntoTurns', () => {
  it('groups assistant records with the same message.id into one turn', () => {
    const rec1 = makeAssistantRecord('a', 'uuid_1', 'msg_1')
    const rec2 = makeAssistantRecord('b', 'uuid_2', 'msg_1')
    const turns = groupIntoTurns([rec1, rec2])
    expect(turns.length).toBe(1)
    expect(turns[0].messageId).toBe('msg_1')
    expect(turns[0].records.length).toBe(2)
    expect(turns[0].contentBlocks.length).toBe(2)
  })

  it('creates separate turns for records with different message.ids', () => {
    const rec1 = makeAssistantRecord('a', 'uuid_1', 'msg_1')
    const rec2 = makeAssistantRecord('b', 'uuid_2', 'msg_2')
    const turns = groupIntoTurns([rec1, rec2])
    expect(turns.length).toBe(2)
    expect(turns[0].messageId).toBe('msg_1')
    expect(turns[1].messageId).toBe('msg_2')
  })

  it('uses uuid as key for user records', () => {
    const user = makeUserRecord('uuid_user')
    const turns = groupIntoTurns([user])
    expect(turns.length).toBe(1)
    expect(turns[0].messageId).toBe('uuid_user')
    expect(turns[0].role).toBe('user')
  })

  it('preserves insertion order of groups', () => {
    const records: RawRecord[] = [
      makeAssistantRecord('a', 'uuid_1', 'msg_1'),
      makeUserRecord('uuid_2'),
      makeAssistantRecord('b', 'uuid_3', 'msg_2'),
    ]
    const turns = groupIntoTurns(records)
    expect(turns.length).toBe(3)
    expect(turns[0].role).toBe('assistant')
    expect(turns[1].role).toBe('user')
    expect(turns[2].role).toBe('assistant')
  })

  it('sets parentToolUseId from first record in group', () => {
    const rec = makeAssistantRecord('a', 'uuid_1', 'msg_1')
    rec.parent_tool_use_id = 'parent_tu'
    const turns = groupIntoTurns([rec])
    expect(turns[0].parentToolUseId).toBe('parent_tu')
  })

  it('returns empty array for empty input', () => {
    expect(groupIntoTurns([])).toEqual([])
  })

  it('collects contentBlocks from all assistant records in a group', () => {
    const rec1 = makeAssistantRecord('a', 'uuid_1', 'msg_1')
    rec1.message.content = [
      { type: 'text', text: 'first' },
      { type: 'tool_use', id: 'tu_1', name: 'Read', input: {} },
    ]
    const rec2 = makeAssistantRecord('b', 'uuid_2', 'msg_1')
    rec2.message.content = [{ type: 'text', text: 'second' }]
    const turns = groupIntoTurns([rec1, rec2])
    expect(turns[0].contentBlocks.length).toBe(3)
  })
})
