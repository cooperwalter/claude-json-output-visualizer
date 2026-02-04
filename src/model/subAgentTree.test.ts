import { describe, it, expect } from 'vitest'
import { buildSubAgentTree } from './subAgentTree.ts'
import type { AssistantRecord, RawRecord } from './types.ts'

function makeAssistantRecord(
  uuid: string,
  msgId: string,
  content: AssistantRecord['message']['content'],
  parentToolUseId: string | null = null,
): AssistantRecord {
  return {
    type: 'assistant',
    message: {
      model: 'claude-opus-4-5-20251101',
      id: msgId,
      type: 'message',
      role: 'assistant',
      content,
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
    parent_tool_use_id: parentToolUseId,
    session_id: 'sess_001',
    uuid,
  }
}

describe('buildSubAgentTree', () => {
  it('returns empty array when no sub-agents exist', () => {
    const rec = makeAssistantRecord('uuid_1', 'msg_1', [{ type: 'text', text: 'hi' }])
    expect(buildSubAgentTree([rec])).toEqual([])
  })

  it('builds a single-level sub-agent node', () => {
    const parent = makeAssistantRecord('uuid_1', 'msg_1', [
      { type: 'tool_use', id: 'task_tu_1', name: 'Task', input: { description: 'test' } },
    ])
    const child = makeAssistantRecord(
      'uuid_2',
      'msg_2',
      [{ type: 'text', text: 'sub-agent response' }],
      'task_tu_1',
    )

    const tree = buildSubAgentTree([parent, child])
    expect(tree.length).toBe(1)
    expect(tree[0].parentToolUseId).toBe('task_tu_1')
    expect(tree[0].records.length).toBe(1)
    expect(tree[0].records[0].uuid).toBe('uuid_2')
    expect(tree[0].children.length).toBe(0)
  })

  it('builds nested sub-agent tree with two levels', () => {
    const records: RawRecord[] = [
      makeAssistantRecord('uuid_1', 'msg_1', [
        { type: 'tool_use', id: 'task_tu_1', name: 'Task', input: {} },
      ]),
      makeAssistantRecord(
        'uuid_2',
        'msg_2',
        [{ type: 'tool_use', id: 'task_tu_2', name: 'Task', input: {} }],
        'task_tu_1',
      ),
      makeAssistantRecord(
        'uuid_3',
        'msg_3',
        [{ type: 'text', text: 'deep child' }],
        'task_tu_2',
      ),
    ]

    const tree = buildSubAgentTree(records)
    expect(tree.length).toBe(1)
    expect(tree[0].parentToolUseId).toBe('task_tu_1')
    expect(tree[0].children.length).toBe(1)
    expect(tree[0].children[0].parentToolUseId).toBe('task_tu_2')
    expect(tree[0].children[0].records[0].uuid).toBe('uuid_3')
  })

  it('handles multiple root-level sub-agents', () => {
    const records: RawRecord[] = [
      makeAssistantRecord('uuid_1', 'msg_1', [
        { type: 'tool_use', id: 'task_tu_1', name: 'Task', input: {} },
        { type: 'tool_use', id: 'task_tu_2', name: 'Task', input: {} },
      ]),
      makeAssistantRecord('uuid_2', 'msg_2', [{ type: 'text', text: 'child 1' }], 'task_tu_1'),
      makeAssistantRecord('uuid_3', 'msg_3', [{ type: 'text', text: 'child 2' }], 'task_tu_2'),
    ]

    const tree = buildSubAgentTree(records)
    expect(tree.length).toBe(2)
  })

  it('returns empty array for empty input', () => {
    expect(buildSubAgentTree([])).toEqual([])
  })

  it('ignores Task tool_use blocks that have no child records', () => {
    const rec = makeAssistantRecord('uuid_1', 'msg_1', [
      { type: 'tool_use', id: 'task_tu_1', name: 'Task', input: {} },
    ])
    const tree = buildSubAgentTree([rec])
    expect(tree.length).toBe(0)
  })
})
