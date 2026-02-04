import type { ToolResultBlock } from '@/model/types.ts'

type GlobResultProps = {
  toolResult: ToolResultBlock
}

export function GlobResult({ toolResult }: GlobResultProps) {
  const paths = toolResult.content
    .split('\n')
    .filter((line) => line.trim() !== '')

  return (
    <div className="text-xs font-mono bg-white dark:bg-gray-900 rounded p-3 overflow-x-auto max-h-96">
      {paths.map((p, i) => (
        <div key={i} className="text-gray-700 dark:text-gray-300 py-0.5">
          {p}
        </div>
      ))}
      {paths.length === 0 && (
        <span className="text-gray-400 dark:text-gray-500">No matches</span>
      )}
    </div>
  )
}
