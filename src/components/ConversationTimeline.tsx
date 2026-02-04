import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [focusedIndex, setFocusedIndex] = useState(-1)
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

  const scrollToTurn = useCallback((index: number) => {
    const turnId = turns[index]?.messageId
    if (!turnId) return
    const el = document.getElementById(`turn-${turnId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [turns])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        const next = Math.min(focusedIndex + 1, turns.length - 1)
        setFocusedIndex(next)
        scrollToTurn(next)
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        const prev = Math.max(focusedIndex - 1, 0)
        setFocusedIndex(prev)
        scrollToTurn(prev)
      }
      if (e.key === 'Home') {
        e.preventDefault()
        setFocusedIndex(0)
        if (useVirtual) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
      if (e.key === 'End') {
        e.preventDefault()
        setFocusedIndex(turns.length - 1)
        if (useVirtual) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        } else {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    [useVirtual, focusedIndex, turns.length, scrollToTurn],
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
        focusedIndex={focusedIndex}
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
          isFocused={index === focusedIndex}
          searchQuery={searchQuery}
        />
      ))}
      <div ref={bottomRef} />
      <JumpButtons
        onJumpTop={() => {
          setFocusedIndex(0)
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onJumpBottom={() => {
          setFocusedIndex(turns.length - 1)
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
    </div>
  )
}

function JumpButtons({ onJumpTop, onJumpBottom }: { onJumpTop: () => void; onJumpBottom: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-20">
      <button
        onClick={onJumpTop}
        className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Jump to top"
        aria-label="Jump to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <button
        onClick={onJumpBottom}
        className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Jump to bottom"
        aria-label="Jump to bottom"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
  )
}

function VirtualizedTimeline({
  turns,
  isStreaming,
  searchMatchIds,
  currentMatchId,
  searchQuery,
  focusedIndex,
}: {
  turns: ConversationTurn[]
  isStreaming: boolean
  searchMatchIds?: Set<string>
  currentMatchId?: string
  searchQuery?: string
  focusedIndex: number
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

  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'center', behavior: 'smooth' })
    }
  }, [focusedIndex, virtualizer])

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
                isFocused={virtualRow.index === focusedIndex}
                searchQuery={searchQuery}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
