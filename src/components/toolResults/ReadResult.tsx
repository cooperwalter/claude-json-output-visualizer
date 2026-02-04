import type { ToolUseContentBlock, ToolResultBlock, ToolUseResultMeta } from '@/model/types.ts'

type ReadResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  meta?: ToolUseResultMeta
}

export function ReadResult({ toolUse, toolResult, meta }: ReadResultProps) {
  const filePath = (toolUse.input.file_path as string) ?? meta?.file?.filePath ?? ''
  const startLine = meta?.file?.startLine ?? 1
  const totalLines = meta?.file?.totalLines
  const numLines = meta?.file?.numLines

  return (
    <div className="space-y-2">
      {filePath && (
        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {filePath}
          {totalLines !== undefined && numLines !== undefined && numLines < totalLines && (
            <span className="ml-2 text-gray-400 dark:text-gray-500">
              (lines {startLine}-{startLine + numLines - 1} of {totalLines})
            </span>
          )}
        </div>
      )}
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 rounded p-3 overflow-x-auto max-h-96 text-gray-700 dark:text-gray-300 leading-relaxed">
        {toolResult.content}
      </pre>
    </div>
  )
}
