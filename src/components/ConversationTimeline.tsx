import { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ConversationTurn } from '@/model/types.ts'
import { TurnCard } from './TurnCard.tsx'

const VIRTUALIZATION_THRESHOLD = 100

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
  const useVirtual = turns.length >= VIRTUALIZATION_THRESHOLD

  useEffect(() => {
    if (isStreaming && !useVirtual) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [turns.length, isStreaming, useVirtual])

  useEffect(() => {
    if (currentMatchId && !useVirtual) {
      const el = document.getElementById(`turn-${currentMatchId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentMatchId, useVirtual])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        if (useVirtual) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
      if (e.key === 'End') {
        e.preventDefault()
        if (useVirtual) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        } else {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    [useVirtual],
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

  if (useVirtual) {
    return (
      <VirtualizedTimeline
        turns={turns}
        isStreaming={isStreaming}
        searchMatchIds={searchMatchIds}
        currentMatchId={currentMatchId}
        searchQuery={searchQuery}
      />
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

function VirtualizedTimeline({
  turns,
  isStreaming,
  searchMatchIds,
  currentMatchId,
  searchQuery,
}: {
  turns: ConversationTurn[]
  isStreaming: boolean
  searchMatchIds?: Set<string>
  currentMatchId?: string
  searchQuery?: string
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const prevTurnCountRef = useRef(turns.length)

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: turns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
    gap: 12,
  })

  useEffect(() => {
    if (isStreaming && turns.length > prevTurnCountRef.current) {
      virtualizer.scrollToIndex(turns.length - 1, { align: 'end', behavior: 'smooth' })
    }
    prevTurnCountRef.current = turns.length
  }, [turns.length, isStreaming, virtualizer])

  useEffect(() => {
    if (currentMatchId) {
      const idx = turns.findIndex((t) => t.messageId === currentMatchId)
      if (idx >= 0) {
        virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' })
      }
    }
  }, [currentMatchId, turns, virtualizer])

  return (
    <div
      ref={parentRef}
      className="max-w-4xl mx-auto px-4"
      style={{ height: 'calc(100vh - 180px)', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const turn = turns[virtualRow.index]
          return (
            <div
              key={turn.messageId}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TurnCard
                turn={turn}
                index={virtualRow.index}
                forceExpanded={searchMatchIds?.has(turn.messageId)}
                isCurrentMatch={turn.messageId === currentMatchId}
                searchQuery={searchQuery}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
