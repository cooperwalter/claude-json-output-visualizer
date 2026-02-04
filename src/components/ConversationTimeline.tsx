import { useRef, useEffect } from 'react'
import type { ConversationTurn } from '@/model/types.ts'
import { TurnCard } from './TurnCard.tsx'

type ConversationTimelineProps = {
  turns: ConversationTurn[]
  isStreaming: boolean
}

export function ConversationTimeline({ turns, isStreaming }: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [turns.length, isStreaming])

  if (turns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No messages to display
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
      {turns.map((turn, index) => (
        <TurnCard key={turn.messageId} turn={turn} index={index} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
