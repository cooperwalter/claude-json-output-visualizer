import { useState } from 'react'
import type { ConversationTurn, ContentBlock, ToolResultBlock } from '@/model/types.ts'
import { MessageDetail } from './MessageDetail.tsx'

type TurnCardProps = {
  turn: ConversationTurn
  index: number
  forceExpanded?: boolean
  isCurrentMatch?: boolean
  searchQuery?: string
}

export function TurnCard({ turn, index, forceExpanded, isCurrentMatch, searchQuery }: TurnCardProps) {
  const [userExpanded, setUserExpanded] = useState(false)
  const expanded = userExpanded || (forceExpanded ?? false)

  const isAssistant = turn.role === 'assistant'
  const hasError = turn.records.some(
    (r) =>
      r.type === 'user' && r.message.content.some((b: ToolResultBlock) => b.is_error),
  )
  const isSubAgent = turn.parentToolUseId !== null

  const model =
    turn.records[0]?.type === 'assistant' ? turn.records[0].message.model : undefined

  return (
    <div
      id={`turn-${turn.messageId}`}
      className={`rounded-lg border transition-colors cursor-pointer ${
        isAssistant
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-700 ml-8'
      } ${hasError ? 'border-red-300 dark:border-red-700' : ''} ${isCurrentMatch ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
      onClick={() => setUserExpanded(!userExpanded)}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-6 shrink-0 text-right">
          {index + 1}
        </span>

        <span
          className={`px-2 py-0.5 text-xs font-medium rounded shrink-0 ${
            isAssistant
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          }`}
        >
          {isAssistant ? 'Assistant' : 'User'}
        </span>

        {isSubAgent && (
          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shrink-0">
            Sub-agent
          </span>
        )}

        {hasError && (
          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 shrink-0">
            Error
          </span>
        )}

        <div className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
          {searchQuery ? (
            <HighlightedText text={getSummary(turn)} query={searchQuery} />
          ) : (
            getSummary(turn)
          )}
        </div>

        {model && (
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:inline">
            {formatModel(model)}
          </span>
        )}

        <ContentTypeIcons blocks={turn.contentBlocks} />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
          <MessageDetail turn={turn} />
        </div>
      )}
    </div>
  )
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: { text: string; highlight: boolean }[] = []
  let lastIndex = 0

  let idx = lowerText.indexOf(lowerQuery, lastIndex)
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), highlight: false })
    }
    parts.push({ text: text.slice(idx, idx + query.length), highlight: true })
    lastIndex = idx + query.length
    idx = lowerText.indexOf(lowerQuery, lastIndex)
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false })
  }

  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}

function getSummary(turn: ConversationTurn): string {
  if (turn.role === 'assistant') {
    for (const block of turn.contentBlocks) {
      if (block.type === 'text') {
        const text = block.text.trim()
        return text.length > 120 ? text.slice(0, 120) + '...' : text
      }
      if (block.type === 'tool_use') {
        return `${block.name}()`
      }
    }
  }
  if (turn.role === 'user') {
    const first = turn.records[0]
    if (first?.type === 'user') {
      const block = first.message.content[0]
      if (block) {
        const content = block.content
        return content.length > 120 ? content.slice(0, 120) + '...' : content
      }
    }
  }
  return ''
}

function formatModel(model: string): string {
  const parts = model.split('-')
  if (parts.length >= 2) {
    return parts.slice(0, -1).join('-')
  }
  return model
}

function ContentTypeIcons({ blocks }: { blocks: ContentBlock[] }) {
  const hasText = blocks.some((b) => b.type === 'text')
  const toolCount = blocks.filter((b) => b.type === 'tool_use').length

  return (
    <div className="flex items-center gap-1 shrink-0">
      {hasText && (
        <span className="text-xs text-gray-400 dark:text-gray-500" title="Text content">
          T
        </span>
      )}
      {toolCount > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500" title={`${toolCount} tool call(s)`}>
          {toolCount > 1 ? `${toolCount}x` : ''}⚙
        </span>
      )}
    </div>
  )
}
