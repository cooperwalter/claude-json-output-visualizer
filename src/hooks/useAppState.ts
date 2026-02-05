import { useReducer } from 'react'
import type { RawRecord, ConversationTurn, IndexMaps } from '@/model/types.ts'
import { buildIndexes } from '@/model/indexer.ts'
import { groupIntoTurns } from '@/model/grouper.ts'

export type SessionMeta = {
  fileName: string
  fileSize: number
  sessionId: string
  loadedAt: string
}

export type AppStatus = 'empty' | 'loading' | 'paused' | 'active'

export type AppState = {
  status: AppStatus
  records: RawRecord[]
  turns: ConversationTurn[]
  indexes: IndexMaps
  sessionMeta: SessionMeta | null
  error: string | null
  skippedLines: number
}

export type AppAction =
  | { type: 'LOAD_START'; meta: SessionMeta }
  | { type: 'RECORD_ADDED'; record: RawRecord }
  | { type: 'RECORDS_BATCH'; records: RawRecord[]; skipped: number }
  | { type: 'LINE_SKIPPED' }
  | { type: 'LOAD_COMPLETE' }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'STOP_PARSE' }
  | { type: 'RESUME_PARSE' }

function emptyIndexes(): IndexMaps {
  return {
    byUuid: new Map(),
    byMessageId: new Map(),
    byToolUseId: new Map(),
    byParentToolUseId: new Map(),
  }
}

export const initialState: AppState = {
  status: 'empty',
  records: [],
  turns: [],
  indexes: emptyIndexes(),
  sessionMeta: null,
  error: null,
  skippedLines: 0,
}

function rebuildDerived(records: RawRecord[]): { turns: ConversationTurn[]; indexes: IndexMaps } {
  const topLevelRecords = records.filter((r) => r.parent_tool_use_id === null)
  return {
    turns: groupIntoTurns(topLevelRecords),
    indexes: buildIndexes(records),
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...initialState,
        status: 'loading',
        sessionMeta: action.meta,
      }

    case 'RECORD_ADDED': {
      const records = [...state.records, action.record]
      const derived = rebuildDerived(records)
      return {
        ...state,
        records,
        ...derived,
      }
    }

    case 'RECORDS_BATCH': {
      const records = [...state.records, ...action.records]
      const derived = rebuildDerived(records)
      return {
        ...state,
        records,
        ...derived,
        skippedLines: state.skippedLines + action.skipped,
      }
    }

    case 'LINE_SKIPPED':
      return {
        ...state,
        skippedLines: state.skippedLines + 1,
      }

    case 'LOAD_COMPLETE':
      return {
        ...state,
        status: 'active',
      }

    case 'LOAD_ERROR':
      return {
        ...state,
        status: 'active',
        error: action.error,
      }

    case 'RESET':
      return initialState

    case 'STOP_PARSE':
      return {
        ...state,
        status: 'paused',
      }

    case 'RESUME_PARSE':
      return {
        ...state,
        status: 'loading',
      }
  }
}

export function useAppState() {
  return useReducer(appReducer, initialState)
}
