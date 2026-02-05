import { useState, useRef, useEffect } from 'react'
import type { ConversationTurn, ContentBlock, ToolResultBlock } from '@/model/types.ts'
import { formatModelShort } from '@/utils/formatModel.ts'
import { ToolIcon } from './ToolIcon.tsx'
import { MessageDetail } from './MessageDetail.tsx'

type TurnCardProps = {
  turn: ConversationTurn
  index: number
  forceExpanded?: boolean
  isCurrentMatch?: boolean
  isFocused?: boolean
  searchQuery?: string
}

export function TurnCard({ turn, index, forceExpanded, isCurrentMatch, isFocused, searchQuery }: TurnCardProps) {
  const [userExpanded, setUserExpanded] = useState(false)
  const expanded = userExpanded || (forceExpanded ?? false)
  const cardRef = useRef<HTMLDivElement>(null)
  const prevExpanded = useRef(expanded)

  useEffect(() => {
    if (expanded && !prevExpanded.current && cardRef.current && typeof cardRef.current.scrollIntoView === 'function') {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevExpanded.current = expanded
  }, [expanded])

  const isAssistant = turn.role === 'assistant'
  const hasError = turn.records.some(
    (r) =>
      r.type === 'user' && r.message.content.some((b: ToolResultBlock) => b.is_error),
  )
  const isSubAgent = turn.parentToolUseId !== null

  const subAgentType = getSubAgentType(turn)
  const model = turn.role === 'assistant' && turn.records[0]?.type === 'assistant'
    ? turn.records[0].message.model
    : undefined

  return (
    <div
      ref={cardRef}
      id={`turn-${turn.messageId}`}
      role="article"
      aria-label={`${isAssistant ? 'Assistant' : 'User'} message ${index + 1}${hasError ? ', contains error' : ''}${isSubAgent ? ', sub-agent' : ''}`}
      aria-expanded={expanded}
      tabIndex={0}
      className={`rounded-lg border transition-colors cursor-pointer ${
        isAssistant
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-700 ml-8'
      } ${hasError ? 'border-red-300 dark:border-red-700' : ''} ${isCurrentMatch ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} ${isFocused ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}`}
      onClick={() => setUserExpanded(!userExpanded)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setUserExpanded(!userExpanded)
        }
      }}
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

        {model && expanded && (
          <span
            className="px-1.5 py-0.5 text-xs font-mono rounded bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 shrink-0"
            title={model}
          >
            {formatModelShort(model)}
          </span>
        )}

        {isSubAgent && (
          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shrink-0">
            Sub-agent{subAgentType ? `: ${subAgentType}` : ''}
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

        <ContentTypeIcons blocks={turn.contentBlocks} />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
          <MessageDetail turn={turn} searchQuery={searchQuery} />
        </div>
      )}
    </div>
  )
}

export function HighlightedText({ text, query }: { text: string; query: string }) {
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

function getSubAgentType(turn: ConversationTurn): string | undefined {
  for (const block of turn.contentBlocks) {
    if (block.type === 'tool_use' && block.name === 'Task') {
      const subType = block.input.subagent_type
      if (typeof subType === 'string') return subType
    }
  }
  return undefined
}

function ContentTypeIcons({ blocks }: { blocks: ContentBlock[] }) {
  const hasText = blocks.some((b) => b.type === 'text')
  const toolBlocks = blocks.filter((b) => b.type === 'tool_use')

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {hasText && (
        <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Text content">
          <path d="M3 4h10M3 8h7M3 12h9" />
        </svg>
      )}
      {toolBlocks.length > 0 && (
        <span className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500" title={`${toolBlocks.length} tool call(s)`}>
          {toolBlocks.length > 1 && <span className="text-xs">{toolBlocks.length}×</span>}
          <ToolIcon
            toolName={toolBlocks[0].type === 'tool_use' ? toolBlocks[0].name : ''}
            className="w-3.5 h-3.5"
          />
        </span>
      )}
    </div>
  )
}
