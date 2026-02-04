import { useRef, useEffect, useCallback } from 'react'
import type { ConversationTurn } from '@/model/types.ts'
import { TurnCard } from './TurnCard.tsx'

type ConversationTimelineProps = {
  turns: ConversationTurn[]
  isStreaming: boolean
  searchMatchIds?: Set<string>
  currentMatchId?: string
  searchQuery?: string
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export function ConversationTimeline({
  turns,
  isStreaming,
  searchMatchIds,
  currentMatchId,
  searchQuery,
  hasActiveFilters,
  onClearFilters,
}: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [turns.length, isStreaming])

  useEffect(() => {
    if (currentMatchId) {
      const el = document.getElementById(`turn-${currentMatchId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentMatchId])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (e.key === 'End') {
        e.preventDefault()
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (turns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 gap-2">
        <span>No matching messages</span>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            Clear filters and search
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 py-6 space-y-3">
      {turns.map((turn, index) => (
        <TurnCard
          key={turn.messageId}
          turn={turn}
          index={index}
          forceExpanded={searchMatchIds?.has(turn.messageId)}
          isCurrentMatch={turn.messageId === currentMatchId}
          searchQuery={searchQuery}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
