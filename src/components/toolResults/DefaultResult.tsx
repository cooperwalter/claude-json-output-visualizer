import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

type DefaultResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function DefaultResult({ toolUse, toolResult }: DefaultResultProps) {
  return (
    <div className="space-y-2">
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          Input ({toolUse.name})
        </summary>
        <pre className="mt-1 font-mono bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto text-gray-700 dark:text-gray-300">
          {JSON.stringify(toolUse.input, null, 2)}
        </pre>
      </details>
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
        {toolResult.content}
      </pre>
    </div>
  )
}
