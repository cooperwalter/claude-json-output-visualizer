import type { ToolResultBlock } from '@/model/types.ts'

type GrepResultProps = {
  toolResult: ToolResultBlock
}

export function GrepResult({ toolResult }: GrepResultProps) {
  return (
    <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96 leading-relaxed">
      {toolResult.content}
    </pre>
  )
}
