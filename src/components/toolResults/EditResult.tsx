import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'
import { CodeBlock } from '@/components/CodeBlock.tsx'
import { langFromFilePath } from '@/utils/highlighter.ts'

type EditResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function EditResult({ toolUse, toolResult }: EditResultProps) {
  const filePath = toolUse.input.file_path as string | undefined
  const oldString = toolUse.input.old_string as string | undefined
  const newString = toolUse.input.new_string as string | undefined
  const lang = filePath ? langFromFilePath(filePath) : undefined

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
          <div className="border-l-2 border-red-400 dark:border-red-600">
            <CodeBlock code={oldString} lang={lang} />
          </div>
          <div className="text-xs font-medium text-green-600 dark:text-green-400">Added:</div>
          <div className="border-l-2 border-green-400 dark:border-green-600">
            <CodeBlock code={newString} lang={lang} />
          </div>
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
