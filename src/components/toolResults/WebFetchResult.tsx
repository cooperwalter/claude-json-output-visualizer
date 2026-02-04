import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

type WebFetchResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function WebFetchResult({ toolUse, toolResult }: WebFetchResultProps) {
  const url = toolUse.input.url as string | undefined

  return (
    <div className="space-y-2">
      {url && (
        <div className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate">
          {url}
        </div>
      )}
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
        {toolResult.content}
      </pre>
    </div>
  )
}
