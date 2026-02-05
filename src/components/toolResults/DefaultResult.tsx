import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'
import { HighlightedText } from '@/components/TurnCard.tsx'
import { JsonTree } from '@/components/JsonTree.tsx'

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
        <div className="mt-1">
          <JsonTree data={toolUse.input} defaultExpandDepth={2} searchQuery={searchQuery} />
        </div>
      </details>
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
        {searchQuery
          ? <HighlightedText text={toolResult.content} query={searchQuery} />
          : toolResult.content}
      </pre>
    </div>
  )
}
