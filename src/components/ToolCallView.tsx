import { useState } from 'react'
import type { ToolResultBlock, ToolUseContentBlock, ToolUseResultMeta } from '@/model/types.ts'
import { HighlightedText } from './TurnCard.tsx'
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
  searchQuery?: string
}

export function ToolCallView({ toolUse, toolResult, toolResultMeta, searchQuery }: ToolCallViewProps) {
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
        aria-expanded={expanded}
        aria-label={`${toolUse.name} tool call${isError ? ', error' : ''}${isPending ? ', awaiting result' : ''}`}
        className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t"
      >
        <span className="text-xs text-gray-400">{expanded ? '▼' : '▶'}</span>
        <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9.4 5.2L10.8 3.8a1.5 1.5 0 112.1 2.1L11.5 7.3M6.6 10.8L5.2 12.2a1.5 1.5 0 11-2.1-2.1L4.5 8.7M6 10L10 6" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {toolUse.name}
        </span>
        {!expanded && toolUse.name === 'Task' && typeof toolUse.input.subagent_type === 'string' && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">
            {searchQuery
              ? <HighlightedText text={toolUse.input.subagent_type as string} query={searchQuery} />
              : toolUse.input.subagent_type as string}
            {typeof toolUse.input.description === 'string' && (
              <span className="ml-1 text-gray-400 dark:text-gray-500">
                — {searchQuery
                  ? <HighlightedText text={(toolUse.input.description as string).length > 80 ? (toolUse.input.description as string).slice(0, 80) + '...' : toolUse.input.description as string} query={searchQuery} />
                  : ((toolUse.input.description as string).length > 80 ? (toolUse.input.description as string).slice(0, 80) + '...' : toolUse.input.description as string)}
              </span>
            )}
          </span>
        )}
        {!expanded && typeof toolUse.input.file_path === 'string' && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0 font-mono">
            {searchQuery ? <HighlightedText text={toolUse.input.file_path as string} query={searchQuery} /> : toolUse.input.file_path as string}
            {toolResultMeta?.file && toolResultMeta.file.totalLines > 0 && (
              <span className="text-gray-400 dark:text-gray-500 ml-1">
                ({toolResultMeta.file.numLines === toolResultMeta.file.totalLines
                  ? `${toolResultMeta.file.totalLines} lines`
                  : `${toolResultMeta.file.numLines} of ${toolResultMeta.file.totalLines} lines`})
              </span>
            )}
          </span>
        )}
        {!expanded && typeof toolUse.input.command === 'string' && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0 font-mono">
            {searchQuery
              ? <>$ <HighlightedText text={(toolUse.input.command as string).length > 60 ? (toolUse.input.command as string).slice(0, 60) + '...' : toolUse.input.command as string} query={searchQuery} /></>
              : <>$ {(toolUse.input.command as string).length > 60 ? (toolUse.input.command as string).slice(0, 60) + '...' : toolUse.input.command as string}</>}
          </span>
        )}
        {isError && (
          <>
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              Error
            </span>
            {!expanded && toolResult && (
              <span className="text-xs text-red-600 dark:text-red-400 truncate min-w-0">
                {searchQuery
                  ? <HighlightedText text={toolResult.content.length > 80 ? toolResult.content.slice(0, 80) + '...' : toolResult.content} query={searchQuery} />
                  : (toolResult.content.length > 80 ? toolResult.content.slice(0, 80) + '...' : toolResult.content)}
              </span>
            )}
          </>
        )}
        {isPending && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="6" strokeOpacity="0.25" />
              <path d="M14 8a6 6 0 00-6-6" strokeOpacity="0.75" strokeLinecap="round" />
            </svg>
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
            <div className="relative group/input">
              <pre className="mt-1 font-mono bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto text-gray-700 dark:text-gray-300">
                {searchQuery
                  ? <HighlightedText text={JSON.stringify(toolUse.input, null, 2)} query={searchQuery} />
                  : JSON.stringify(toolUse.input, null, 2)}
              </pre>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(JSON.stringify(toolUse.input, null, 2))
                }}
                aria-label="Copy input parameters"
                title="Copy input"
                className="absolute top-2 right-2 opacity-0 group-hover/input:opacity-100 focus:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 p-1 rounded border border-gray-200 dark:border-gray-600"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="9" height="9" rx="1" /><path d="M5 11H3.5A1.5 1.5 0 012 9.5v-7A1.5 1.5 0 013.5 1h7A1.5 1.5 0 0112 2.5V5" /></svg>
              </button>
            </div>
          </details>

          {toolResult && (
            <div className="relative group/result">
              <ToolResultRenderer
                toolName={toolUse.name}
                toolUse={toolUse}
                toolResult={toolResult}
                meta={toolResultMeta}
                searchQuery={searchQuery}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(toolResult.content)
                }}
                aria-label="Copy tool result"
                title="Copy result"
                className="absolute top-0 right-0 opacity-0 group-hover/result:opacity-100 focus:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 p-1 rounded border border-gray-200 dark:border-gray-600"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="9" height="9" rx="1" /><path d="M5 11H3.5A1.5 1.5 0 012 9.5v-7A1.5 1.5 0 013.5 1h7A1.5 1.5 0 0112 2.5V5" /></svg>
              </button>
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
  searchQuery,
}: {
  toolName: string
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  meta?: ToolUseResultMeta
  searchQuery?: string
}) {
  switch (toolName) {
    case 'Read':
      return <ReadResult toolUse={toolUse} toolResult={toolResult} meta={meta} searchQuery={searchQuery} />
    case 'Bash':
      return <BashResult toolUse={toolUse} toolResult={toolResult} searchQuery={searchQuery} />
    case 'Edit':
      return <EditResult toolUse={toolUse} toolResult={toolResult} searchQuery={searchQuery} />
    case 'Grep':
      return <GrepResult toolUse={toolUse} toolResult={toolResult} searchQuery={searchQuery} />
    case 'Glob':
      return <GlobResult toolResult={toolResult} searchQuery={searchQuery} />
    case 'Write':
      return <WriteResult toolUse={toolUse} toolResult={toolResult} searchQuery={searchQuery} />
    case 'Task':
      return <TaskResult toolUse={toolUse} toolResult={toolResult} meta={meta} searchQuery={searchQuery} />
    case 'TodoWrite':
      return <TodoWriteResult meta={meta} searchQuery={searchQuery} />
    case 'WebFetch':
      return <WebFetchResult toolUse={toolUse} toolResult={toolResult} searchQuery={searchQuery} />
    default:
      return <DefaultResult toolUse={toolUse} toolResult={toolResult} searchQuery={searchQuery} />
  }
}
