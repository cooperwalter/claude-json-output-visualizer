import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { ConversationTurn, ContentBlock, ToolResultBlock } from '@/model/types.ts'

export function useSearch(turns: ConversationTurn[]) {
  const [query, setQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
      setCurrentMatchIndex(0)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const matchingTurnIds = useMemo(() => {
    if (!debouncedQuery.trim()) return new Set<string>()
    const q = debouncedQuery.toLowerCase()
    const ids = new Set<string>()

    for (const turn of turns) {
      if (turnMatchesSearch(turn, q)) {
        ids.add(turn.messageId)
      }
    }
    return ids
  }, [turns, debouncedQuery])

  const orderedMatchIds = useMemo(() => {
    return turns
      .filter((t) => matchingTurnIds.has(t.messageId))
      .map((t) => t.messageId)
  }, [turns, matchingTurnIds])

  const matchCount = matchingTurnIds.size

  const currentMatchTurnId = useMemo(() => {
    if (orderedMatchIds.length === 0) return undefined
    return orderedMatchIds[currentMatchIndex % orderedMatchIds.length]
  }, [orderedMatchIds, currentMatchIndex])

  const nextMatch = useCallback(() => {
    if (matchCount > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matchCount)
    }
  }, [matchCount])

  const prevMatch = useCallback(() => {
    if (matchCount > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matchCount) % matchCount)
    }
  }, [matchCount])

  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setCurrentMatchIndex(0)
  }, [])

  return {
    query,
    debouncedQuery,
    setQuery: handleQueryChange,
    matchingTurnIds,
    matchCount,
    currentMatchIndex,
    currentMatchTurnId,
    nextMatch,
    prevMatch,
    clearSearch,
    isActive: debouncedQuery.trim().length > 0,
  }
}

function turnMatchesSearch(turn: ConversationTurn, query: string): boolean {
  for (const block of turn.contentBlocks) {
    if (contentBlockMatchesSearch(block, query)) return true
  }

  for (const record of turn.records) {
    if (record.type === 'user') {
      for (const block of record.message.content) {
        if (toolResultBlockMatchesSearch(block, query)) return true
      }
      if (record.tool_use_result?.file?.filePath?.toLowerCase().includes(query)) return true
    }
  }

  return false
}

function contentBlockMatchesSearch(block: ContentBlock, query: string): boolean {
  if (block.type === 'text') {
    return block.text.toLowerCase().includes(query)
  }
  if (block.type === 'tool_use') {
    if (block.name.toLowerCase().includes(query)) return true
    const inputStr = JSON.stringify(block.input).toLowerCase()
    if (inputStr.includes(query)) return true
  }
  return false
}

function toolResultBlockMatchesSearch(block: ToolResultBlock, query: string): boolean {
  return block.content.toLowerCase().includes(query)
}
