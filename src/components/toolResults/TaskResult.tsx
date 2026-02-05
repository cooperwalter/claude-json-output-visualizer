import { useState, useMemo } from 'react'
import type { ToolUseContentBlock, ToolResultBlock, ToolUseResultMeta } from '@/model/types.ts'
import { groupIntoTurns } from '@/model/grouper.ts'
import { useConversation } from '@/hooks/useConversation.ts'
import { TurnCard } from '@/components/TurnCard.tsx'
import { HighlightedText } from '@/components/TurnCard.tsx'
import { TokenUsageDetail } from '@/components/TokenUsageDetail.tsx'

type TaskResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  meta?: ToolUseResultMeta
  searchQuery?: string
}

export function TaskResult({ toolUse, toolResult, meta, searchQuery }: TaskResultProps) {
  const { state } = useConversation()
  const [showTimeline, setShowTimeline] = useState(true)
  const [showMetadata, setShowMetadata] = useState(false)

  const subagentType = toolUse.input.subagent_type as string | undefined
  const description = toolUse.input.description as string | undefined

  const subAgentTurns = useMemo(() => {
    const records = state.indexes.byParentToolUseId.get(toolUse.id) ?? []
    return records.length > 0 ? groupIntoTurns(records) : []
  }, [state.indexes.byParentToolUseId, toolUse.id])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {subagentType && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            {subagentType}
          </span>
        )}
        {description && (
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {searchQuery ? <HighlightedText text={description} query={searchQuery} /> : description}
          </span>
        )}
      </div>

      {meta && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMetadata(!showMetadata)
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showMetadata ? 'Hide' : 'Show'} metadata
          </button>
          {showMetadata && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {meta.totalDurationMs !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {(meta.totalDurationMs / 1000).toFixed(1)}s
                  </span>
                )}
                {meta.totalTokens !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {meta.totalTokens.toLocaleString()} tokens
                  </span>
                )}
                {meta.totalToolUseCount !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {meta.totalToolUseCount} tool calls
                  </span>
                )}
                {meta.status && (
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                    meta.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {meta.status}
                  </span>
                )}
              </div>
              {meta.usage && (
                <TokenUsageDetail usage={meta.usage} showServiceTier={false} className="pl-2" />
              )}
            </div>
          )}
        </>
      )}

      {subAgentTurns.length > 0 ? (
        <div className="space-y-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowTimeline(!showTimeline)
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showTimeline ? 'Hide' : 'Show'} sub-agent conversation ({subAgentTurns.length} turns)
          </button>
          {showTimeline && (
            <div className="border-l-2 border-purple-300 dark:border-purple-700 pl-3 space-y-2">
              {subAgentTurns.map((turn, index) => (
                <TurnCard key={turn.messageId} turn={turn} index={index} searchQuery={searchQuery} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
          {searchQuery
            ? <HighlightedText text={toolResult.content} query={searchQuery} />
            : toolResult.content}
        </pre>
      )}
    </div>
  )
}
