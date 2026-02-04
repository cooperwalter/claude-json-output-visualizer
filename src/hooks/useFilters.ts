import { useState, useMemo, useCallback } from 'react'
import type { ConversationTurn } from '@/model/types.ts'

export type RoleFilter = 'all' | 'assistant' | 'user'
export type StatusFilter = 'all' | 'errors' | 'subagent' | 'text'

export type FilterState = {
  role: RoleFilter
  toolNames: Set<string>
  status: StatusFilter
  model: string
}

const initialFilterState: FilterState = {
  role: 'all',
  toolNames: new Set(),
  status: 'all',
  model: '',
}

export function useFilters(turns: ConversationTurn[]) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState)

  const availableToolNames = useMemo(() => {
    const names = new Set<string>()
    for (const turn of turns) {
      for (const block of turn.contentBlocks) {
        if (block.type === 'tool_use') {
          names.add(block.name)
        }
      }
    }
    return Array.from(names).sort()
  }, [turns])

  const availableModels = useMemo(() => {
    const models = new Set<string>()
    for (const turn of turns) {
      for (const record of turn.records) {
        if (record.type === 'assistant') {
          models.add(record.message.model)
        }
      }
    }
    return Array.from(models).sort()
  }, [turns])

  const filteredTurns = useMemo(() => {
    return turns.filter((turn) => matchesFilters(turn, filters))
  }, [turns, filters])

  const setRole = useCallback((role: RoleFilter) => {
    setFilters((prev) => ({ ...prev, role }))
  }, [])

  const toggleToolName = useCallback((name: string) => {
    setFilters((prev) => {
      const next = new Set(prev.toolNames)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return { ...prev, toolNames: next }
    })
  }, [])

  const setStatus = useCallback((status: StatusFilter) => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  const setModel = useCallback((model: string) => {
    setFilters((prev) => ({ ...prev, model }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState)
  }, [])

  const isActive = filters.role !== 'all'
    || filters.toolNames.size > 0
    || filters.status !== 'all'
    || filters.model !== ''

  return {
    filters,
    filteredTurns,
    availableToolNames,
    availableModels,
    setRole,
    toggleToolName,
    setStatus,
    setModel,
    clearFilters,
    isActive,
  }
}

function matchesFilters(turn: ConversationTurn, filters: FilterState): boolean {
  if (filters.role !== 'all' && turn.role !== filters.role) return false

  if (filters.toolNames.size > 0) {
    const turnToolNames = turn.contentBlocks
      .filter((b): b is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } => b.type === 'tool_use')
      .map((b) => b.name)
    if (!turnToolNames.some((n) => filters.toolNames.has(n))) return false
  }

  if (filters.status === 'errors') {
    const hasError = turn.records.some(
      (r) => r.type === 'user' && r.message.content.some((b) => b.is_error),
    )
    if (!hasError) return false
  }
  if (filters.status === 'subagent') {
    const hasTaskToolUse = turn.contentBlocks.some(
      (b) => b.type === 'tool_use' && b.name === 'Task',
    )
    if (!hasTaskToolUse) return false
  }
  if (filters.status === 'text') {
    if (!turn.contentBlocks.some((b) => b.type === 'text')) return false
  }

  if (filters.model) {
    const turnModels = turn.records
      .filter((r): r is Extract<typeof r, { type: 'assistant' }> => r.type === 'assistant')
      .map((r) => r.message.model)
    if (!turnModels.includes(filters.model)) return false
  }

  return true
}
