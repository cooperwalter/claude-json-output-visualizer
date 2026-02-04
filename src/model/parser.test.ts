import { describe, it, expect } from 'vitest'
import { parseLine } from './parser.ts'

function makeAssistantLine(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
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
  })
}

function makeUserLine(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
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
  })
}

describe('parseLine', () => {
  it('parses a valid assistant record', () => {
    const result = parseLine(makeAssistantLine())
    expect(result).not.toBeNull()
    expect(result!.type).toBe('assistant')
    expect(result!.uuid).toBe('uuid_001')
    expect(result!.session_id).toBe('sess_001')
  })

  it('parses a valid user record', () => {
    const result = parseLine(makeUserLine())
    expect(result).not.toBeNull()
    expect(result!.type).toBe('user')
    expect(result!.uuid).toBe('uuid_002')
  })

  it('returns null for empty string', () => {
    expect(parseLine('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseLine('   ')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseLine('not json')).toBeNull()
  })

  it('returns null for JSON without type field', () => {
    expect(parseLine(JSON.stringify({ uuid: 'u', session_id: 's' }))).toBeNull()
  })

  it('returns null for JSON with invalid type field', () => {
    expect(parseLine(JSON.stringify({ type: 'system', uuid: 'u', session_id: 's' }))).toBeNull()
  })

  it('returns null for JSON without uuid field', () => {
    expect(parseLine(JSON.stringify({ type: 'assistant', session_id: 's' }))).toBeNull()
  })

  it('returns null for JSON without session_id field', () => {
    expect(parseLine(JSON.stringify({ type: 'assistant', uuid: 'u' }))).toBeNull()
  })

  it('returns null for non-object JSON values like arrays', () => {
    expect(parseLine('[1, 2, 3]')).toBeNull()
  })

  it('returns null for non-object JSON values like strings', () => {
    expect(parseLine('"hello"')).toBeNull()
  })

  it('returns null for null JSON', () => {
    expect(parseLine('null')).toBeNull()
  })

  it('trims whitespace before parsing', () => {
    const line = '  ' + makeAssistantLine() + '  '
    const result = parseLine(line)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('assistant')
  })
})
