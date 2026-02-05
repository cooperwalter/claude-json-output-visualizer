import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'
import { HighlightedText } from '@/components/TurnCard.tsx'

type DefaultResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  searchQuery?: string
}

export function DefaultResult({ toolUse, toolResult, searchQuery }: DefaultResultProps) {
  return (
    <div className="space-y-2">
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          Input ({toolUse.name})
        </summary>
        <pre className="mt-1 font-mono bg-white dark:bg-gray-900 rounded p-2 overflow-x-auto text-gray-700 dark:text-gray-300">
          {searchQuery
            ? <HighlightedText text={JSON.stringify(toolUse.input, null, 2)} query={searchQuery} />
            : JSON.stringify(toolUse.input, null, 2)}
        </pre>
      </details>
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
        {searchQuery
          ? <HighlightedText text={toolResult.content} query={searchQuery} />
          : toolResult.content}
      </pre>
    </div>
  )
}
