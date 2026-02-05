import { useState, useCallback } from 'react'
import type { RecentSession } from '@/model/types.ts'

const STORAGE_KEY = 'claude-visualizer-recent-sessions'
const MAX_SESSIONS = 10

function isRecentSession(value: unknown): value is RecentSession {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.fileName === 'string' &&
    typeof obj.fileSize === 'number' &&
    typeof obj.loadedAt === 'string' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.recordCount === 'number'
  )
}

function loadSessions(): RecentSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecentSession)
  } catch {
    return []
  }
}

function saveSessions(sessions: RecentSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useRecentSessions() {
  const [sessions, setSessions] = useState<RecentSession[]>(loadSessions)

  const addSession = useCallback((session: RecentSession) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.sessionId !== session.sessionId)
      const updated = [session, ...filtered].slice(0, MAX_SESSIONS)
      saveSessions(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSessions([])
  }, [])

  return { sessions, addSession, clearHistory }
}
