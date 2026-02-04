import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

type BashResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function BashResult({ toolUse, toolResult }: BashResultProps) {
  const command = toolUse.input.command as string | undefined

  return (
    <div className="space-y-2">
      {command && (
        <pre className="text-xs font-mono bg-gray-900 text-green-400 rounded p-3 overflow-x-auto">
          <span className="text-gray-500">$ </span>
          {command}
        </pre>
      )}
      <pre
        className={`text-xs font-mono rounded p-3 overflow-x-auto max-h-96 ${
          toolResult.is_error
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
        }`}
      >
        {toolResult.content}
      </pre>
    </div>
  )
}
