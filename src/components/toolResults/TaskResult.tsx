import type { ToolUseContentBlock, ToolResultBlock, ToolUseResultMeta } from '@/model/types.ts'

type TaskResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  meta?: ToolUseResultMeta
}

export function TaskResult({ toolUse, toolResult, meta }: TaskResultProps) {
  const subagentType = toolUse.input.subagent_type as string | undefined
  const description = toolUse.input.description as string | undefined

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
            {description}
          </span>
        )}
      </div>

      {meta && (
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {meta.totalDurationMs !== undefined && (
            <span>{(meta.totalDurationMs / 1000).toFixed(1)}s</span>
          )}
          {meta.totalTokens !== undefined && (
            <span>{meta.totalTokens.toLocaleString()} tokens</span>
          )}
          {meta.totalToolUseCount !== undefined && (
            <span>{meta.totalToolUseCount} tool calls</span>
          )}
          {meta.status && (
            <span className={meta.status === 'completed' ? 'text-green-600 dark:text-green-400' : ''}>
              {meta.status}
            </span>
          )}
        </div>
      )}

      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
        {toolResult.content}
      </pre>
    </div>
  )
}
