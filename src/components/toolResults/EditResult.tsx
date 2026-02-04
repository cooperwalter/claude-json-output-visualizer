import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

type EditResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function EditResult({ toolUse, toolResult }: EditResultProps) {
  const filePath = toolUse.input.file_path as string | undefined
  const oldString = toolUse.input.old_string as string | undefined
  const newString = toolUse.input.new_string as string | undefined

  return (
    <div className="space-y-2">
      {filePath && (
        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {filePath}
        </div>
      )}
      {oldString !== undefined && newString !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-600 dark:text-red-400">Removed:</div>
          <pre className="text-xs font-mono bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded p-2 overflow-x-auto">
            {oldString}
          </pre>
          <div className="text-xs font-medium text-green-600 dark:text-green-400">Added:</div>
          <pre className="text-xs font-mono bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded p-2 overflow-x-auto">
            {newString}
          </pre>
        </div>
      )}
      {toolResult.content && (
        <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-2 overflow-x-auto max-h-48">
          {toolResult.content}
        </pre>
      )}
    </div>
  )
}
