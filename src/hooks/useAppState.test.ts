import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './useAppState.ts'
import type { AppState } from './useAppState.ts'
import type { AssistantRecord, UserRecord } from '@/model/types.ts'

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
        output_tokens: 5,
        service_tier: 'standard',
      },
      context_management: null,
    },
    parent_tool_use_id: null,
    session_id: 'sess_001',
    uuid: 'uuid_001',
    ...overrides,
  }
}

function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    type: 'user',
    message: {
      role: 'user',
      content: [{ tool_use_id: 'tu_001', type: 'tool_result', content: 'result', is_error: false }],
    },
    parent_tool_use_id: null,
    session_id: 'sess_001',
    uuid: 'uuid_002',
    tool_use_result: { type: 'text' },
    ...overrides,
  }
}

const testMeta = {
  fileName: 'test.jsonl',
  fileSize: 1024,
  sessionId: 'sess_001',
  loadedAt: '2025-01-01T00:00:00.000Z',
}

describe('appReducer', () => {
  describe('LOAD_START', () => {
    it('resets state and sets status to loading with session metadata', () => {
      const state = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      expect(state.status).toBe('loading')
      expect(state.sessionMeta).toEqual(testMeta)
      expect(state.records).toEqual([])
      expect(state.turns).toEqual([])
      expect(state.error).toBeNull()
      expect(state.skippedLines).toBe(0)
    })

    it('clears previous session data when starting a new load', () => {
      const populated: AppState = {
        ...initialState,
        status: 'active',
        records: [makeAssistantRecord()],
        skippedLines: 5,
        error: 'previous error',
      }
      const state = appReducer(populated, { type: 'LOAD_START', meta: testMeta })
      expect(state.records).toEqual([])
      expect(state.skippedLines).toBe(0)
      expect(state.error).toBeNull()
    })
  })

  describe('RECORDS_BATCH', () => {
    it('appends records and rebuilds turns and indexes', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const record = makeAssistantRecord()
      const state = appReducer(loadingState, { type: 'RECORDS_BATCH', records: [record], skipped: 0 })
      expect(state.records).toHaveLength(1)
      expect(state.turns).toHaveLength(1)
      expect(state.turns[0].messageId).toBe('msg_001')
      expect(state.indexes.byUuid.has('uuid_001')).toBe(true)
    })

    it('accumulates skipped line counts across batches', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state1 = appReducer(loadingState, { type: 'RECORDS_BATCH', records: [], skipped: 3 })
      expect(state1.skippedLines).toBe(3)
      const state2 = appReducer(state1, { type: 'RECORDS_BATCH', records: [], skipped: 2 })
      expect(state2.skippedLines).toBe(5)
    })

    it('filters sub-agent records out of top-level turns', () => {
      const topLevel = makeAssistantRecord({ uuid: 'uuid_top', parent_tool_use_id: null })
      const subAgent = makeAssistantRecord({
        uuid: 'uuid_sub',
        parent_tool_use_id: 'tu_parent',
        message: {
          ...makeAssistantRecord().message,
          id: 'msg_sub',
        },
      })
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, {
        type: 'RECORDS_BATCH',
        records: [topLevel, subAgent],
        skipped: 0,
      })
      expect(state.records).toHaveLength(2)
      expect(state.turns).toHaveLength(1)
      expect(state.turns[0].messageId).toBe('msg_001')
    })

    it('indexes sub-agent records by parent_tool_use_id', () => {
      const subAgent = makeAssistantRecord({
        uuid: 'uuid_sub',
        parent_tool_use_id: 'tu_parent',
        message: { ...makeAssistantRecord().message, id: 'msg_sub' },
      })
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, {
        type: 'RECORDS_BATCH',
        records: [subAgent],
        skipped: 0,
      })
      expect(state.indexes.byParentToolUseId.has('tu_parent')).toBe(true)
      expect(state.indexes.byParentToolUseId.get('tu_parent')).toHaveLength(1)
    })
  })

  describe('RECORD_ADDED', () => {
    it('appends a single record and rebuilds derived state', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const record = makeAssistantRecord()
      const state = appReducer(loadingState, { type: 'RECORD_ADDED', record })
      expect(state.records).toHaveLength(1)
      expect(state.turns).toHaveLength(1)
    })
  })

  describe('LINE_SKIPPED', () => {
    it('increments skippedLines by 1', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, { type: 'LINE_SKIPPED' })
      expect(state.skippedLines).toBe(1)
    })
  })

  describe('LOAD_COMPLETE', () => {
    it('sets status to active', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, { type: 'LOAD_COMPLETE' })
      expect(state.status).toBe('active')
    })
  })

  describe('LOAD_ERROR', () => {
    it('sets status to active and stores error message', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, { type: 'LOAD_ERROR', error: 'Invalid format' })
      expect(state.status).toBe('active')
      expect(state.error).toBe('Invalid format')
    })
  })

  describe('STOP_PARSE', () => {
    it('sets status to paused', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, { type: 'STOP_PARSE' })
      expect(state.status).toBe('paused')
    })
  })

  describe('RESUME_PARSE', () => {
    it('sets status back to loading', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const paused = appReducer(loadingState, { type: 'STOP_PARSE' })
      const state = appReducer(paused, { type: 'RESUME_PARSE' })
      expect(state.status).toBe('loading')
    })
  })

  describe('RESET', () => {
    it('returns to initial empty state', () => {
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const withRecords = appReducer(loadingState, {
        type: 'RECORDS_BATCH',
        records: [makeAssistantRecord()],
        skipped: 2,
      })
      const state = appReducer(withRecords, { type: 'RESET' })
      expect(state.status).toBe('empty')
      expect(state.records).toEqual([])
      expect(state.turns).toEqual([])
      expect(state.sessionMeta).toBeNull()
      expect(state.error).toBeNull()
      expect(state.skippedLines).toBe(0)
    })
  })

  describe('tool call pairing via indexes', () => {
    it('pairs tool_use with tool_result in byToolUseId index', () => {
      const assistant = makeAssistantRecord({
        uuid: 'uuid_a',
        message: {
          ...makeAssistantRecord().message,
          content: [{ type: 'tool_use', id: 'tu_001', name: 'Read', input: { file_path: '/tmp/x' } }],
        },
      })
      const user = makeUserRecord({
        uuid: 'uuid_u',
        message: {
          role: 'user',
          content: [{ tool_use_id: 'tu_001', type: 'tool_result', content: 'file contents', is_error: false }],
        },
        tool_use_result: { type: 'text', file: { filePath: '/tmp/x', content: 'data', numLines: 1, startLine: 1, totalLines: 1 } },
      })
      const loadingState = appReducer(initialState, { type: 'LOAD_START', meta: testMeta })
      const state = appReducer(loadingState, {
        type: 'RECORDS_BATCH',
        records: [assistant, user],
        skipped: 0,
      })
      const pair = state.indexes.byToolUseId.get('tu_001')
      expect(pair).toBeDefined()
      expect(pair!.toolUse.name).toBe('Read')
      expect(pair!.toolResult).not.toBeNull()
      expect(pair!.toolResult!.content).toBe('file contents')
    })
  })
})
