import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecentSessions } from './useRecentSessions.ts'
import type { RecentSession } from '@/model/types.ts'

function makeSession(overrides: Partial<RecentSession> = {}): RecentSession {
  return {
    fileName: 'test.jsonl',
    fileSize: 1024,
    loadedAt: '2025-01-01T00:00:00.000Z',
    sessionId: 'sess_001',
    recordCount: 42,
    ...overrides,
  }
}

const STORAGE_KEY = 'claude-visualizer-recent-sessions'

describe('useRecentSessions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty sessions when localStorage has no data', () => {
    const { result } = renderHook(() => useRecentSessions())
    expect(result.current.sessions).toEqual([])
  })

  it('loads existing sessions from localStorage on mount', () => {
    const session = makeSession()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([session]))
    const { result } = renderHook(() => useRecentSessions())
    expect(result.current.sessions).toHaveLength(1)
    expect(result.current.sessions[0].sessionId).toBe('sess_001')
  })

  describe('addSession', () => {
    it('adds a new session to the front of the list', () => {
      const { result } = renderHook(() => useRecentSessions())
      act(() => result.current.addSession(makeSession({ sessionId: 'sess_A' })))
      act(() => result.current.addSession(makeSession({ sessionId: 'sess_B' })))
      expect(result.current.sessions).toHaveLength(2)
      expect(result.current.sessions[0].sessionId).toBe('sess_B')
      expect(result.current.sessions[1].sessionId).toBe('sess_A')
    })

    it('deduplicates by sessionId, moving existing session to front', () => {
      const { result } = renderHook(() => useRecentSessions())
      act(() => result.current.addSession(makeSession({ sessionId: 'sess_A', recordCount: 10 })))
      act(() => result.current.addSession(makeSession({ sessionId: 'sess_B' })))
      act(() => result.current.addSession(makeSession({ sessionId: 'sess_A', recordCount: 20 })))
      expect(result.current.sessions).toHaveLength(2)
      expect(result.current.sessions[0].sessionId).toBe('sess_A')
      expect(result.current.sessions[0].recordCount).toBe(20)
    })

    it('limits stored sessions to 10 (MAX_SESSIONS)', () => {
      const { result } = renderHook(() => useRecentSessions())
      for (let i = 0; i < 12; i++) {
        act(() =>
          result.current.addSession(
            makeSession({ sessionId: `sess_${String(i).padStart(2, '0')}` }),
          ),
        )
      }
      expect(result.current.sessions).toHaveLength(10)
      expect(result.current.sessions[0].sessionId).toBe('sess_11')
    })

    it('persists sessions to localStorage', () => {
      const { result } = renderHook(() => useRecentSessions())
      act(() => result.current.addSession(makeSession()))
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as unknown[]
      expect(stored).toHaveLength(1)
    })
  })

  describe('clearHistory', () => {
    it('removes all sessions from state and localStorage', () => {
      const { result } = renderHook(() => useRecentSessions())
      act(() => result.current.addSession(makeSession()))
      expect(result.current.sessions).toHaveLength(1)
      act(() => result.current.clearHistory())
      expect(result.current.sessions).toEqual([])
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('resilience', () => {
    it('returns empty array when localStorage contains invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not json')
      const { result } = renderHook(() => useRecentSessions())
      expect(result.current.sessions).toEqual([])
    })

    it('returns empty array when localStorage contains a non-array value', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notAnArray: true }))
      const { result } = renderHook(() => useRecentSessions())
      expect(result.current.sessions).toEqual([])
    })

    it('filters out malformed session objects from localStorage', () => {
      const valid = makeSession()
      const invalid = { fileName: 'test.jsonl' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([valid, invalid]))
      const { result } = renderHook(() => useRecentSessions())
      expect(result.current.sessions).toHaveLength(1)
      expect(result.current.sessions[0].sessionId).toBe('sess_001')
    })

    it('silently handles localStorage write failures', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const { result } = renderHook(() => useRecentSessions())
      expect(() => {
        act(() => result.current.addSession(makeSession()))
      }).not.toThrow()
      expect(result.current.sessions).toHaveLength(1)
      setItemSpy.mockRestore()
    })
  })
})
