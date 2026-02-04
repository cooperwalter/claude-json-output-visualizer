import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

type WriteResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function WriteResult({ toolUse, toolResult }: WriteResultProps) {
  const filePath = toolUse.input.file_path as string | undefined

  return (
    <div className="space-y-2">
      {filePath && (
        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {filePath}
        </div>
      )}
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-2 overflow-x-auto">
        {toolResult.content}
      </pre>
    </div>
  )
}
