import { useState } from 'react'
import type { ToolResultBlock, ToolUseContentBlock, ToolUseResultMeta } from '@/model/types.ts'
import { ReadResult } from './toolResults/ReadResult.tsx'
import { BashResult } from './toolResults/BashResult.tsx'
import { EditResult } from './toolResults/EditResult.tsx'
import { GrepResult } from './toolResults/GrepResult.tsx'
import { GlobResult } from './toolResults/GlobResult.tsx'
import { WriteResult } from './toolResults/WriteResult.tsx'
import { TaskResult } from './toolResults/TaskResult.tsx'
import { TodoWriteResult } from './toolResults/TodoWriteResult.tsx'
import { WebFetchResult } from './toolResults/WebFetchResult.tsx'
import { DefaultResult } from './toolResults/DefaultResult.tsx'

type ToolCallViewProps = {
  toolUse: ToolUseContentBlock
  toolResult?: ToolResultBlock
  toolResultMeta?: ToolUseResultMeta
}

export function ToolCallView({ toolUse, toolResult, toolResultMeta }: ToolCallViewProps) {
  const [expanded, setExpanded] = useState(false)

  const isError = toolResult?.is_error ?? false
  const isPending = !toolResult

  return (
    <div
      className={`rounded border ${
        isError
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
        className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t"
      >
        <span className="text-xs text-gray-400">{expanded ? '▼' : '▶'}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">⚙</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {toolUse.name}
        </span>
        {isError && (
          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Error
          </span>
        )}
        {isPending && (
          <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
            Awaiting result...
          </span>
        )}
        {!isError && !isPending && (
          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            OK
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Input Parameters
            </summary>
            <pre className="mt-1 font-mono bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto text-gray-700 dark:text-gray-300">
              {JSON.stringify(toolUse.input, null, 2)}
            </pre>
          </details>

          {toolResult && (
            <div>
              <ToolResultRenderer
                toolName={toolUse.name}
                toolUse={toolUse}
                toolResult={toolResult}
                meta={toolResultMeta}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ToolResultRenderer({
  toolName,
  toolUse,
  toolResult,
  meta,
}: {
  toolName: string
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  meta?: ToolUseResultMeta
}) {
  switch (toolName) {
    case 'Read':
      return <ReadResult toolUse={toolUse} toolResult={toolResult} meta={meta} />
    case 'Bash':
      return <BashResult toolUse={toolUse} toolResult={toolResult} />
    case 'Edit':
      return <EditResult toolUse={toolUse} toolResult={toolResult} />
    case 'Grep':
      return <GrepResult toolResult={toolResult} />
    case 'Glob':
      return <GlobResult toolResult={toolResult} />
    case 'Write':
      return <WriteResult toolUse={toolUse} toolResult={toolResult} />
    case 'Task':
      return <TaskResult toolUse={toolUse} toolResult={toolResult} meta={meta} />
    case 'TodoWrite':
      return <TodoWriteResult meta={meta} />
    case 'WebFetch':
      return <WebFetchResult toolUse={toolUse} toolResult={toolResult} />
    default:
      return <DefaultResult toolUse={toolUse} toolResult={toolResult} />
  }
}
