import type { ToolResultBlock } from '@/model/types.ts'
import { HighlightedText } from '@/components/TurnCard.tsx'

type DefaultResultProps = {
  toolResult: ToolResultBlock
  searchQuery?: string
}

export function DefaultResult({ toolResult, searchQuery }: DefaultResultProps) {
  return (
    <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96">
      {searchQuery
        ? <HighlightedText text={toolResult.content} query={searchQuery} />
        : toolResult.content}
    </pre>
  )
}
