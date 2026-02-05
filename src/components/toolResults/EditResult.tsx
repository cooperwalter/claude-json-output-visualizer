import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'
import { CodeBlock } from '@/components/CodeBlock.tsx'
import { FilePathHeader } from '@/components/FilePathHeader.tsx'
import { HighlightedText } from '@/components/TurnCard.tsx'
import { langFromFilePath } from '@/utils/highlighter.ts'

type EditResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
  searchQuery?: string
}

export function EditResult({ toolUse, toolResult, searchQuery }: EditResultProps) {
  const filePath = toolUse.input.file_path as string | undefined
  const oldString = toolUse.input.old_string as string | undefined
  const newString = toolUse.input.new_string as string | undefined
  const lang = filePath ? langFromFilePath(filePath) : undefined

  return (
    <div className="space-y-2">
      {filePath && <FilePathHeader filePath={filePath} />}
      {oldString !== undefined && newString !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-600 dark:text-red-400">Removed:</div>
          <div className="border-l-2 border-red-400 dark:border-red-600">
            {searchQuery
              ? <pre className="text-xs font-mono rounded p-3 overflow-x-auto bg-red-50/50 dark:bg-red-900/10 text-gray-700 dark:text-gray-300"><HighlightedText text={oldString} query={searchQuery} /></pre>
              : <CodeBlock code={oldString} lang={lang} />}
          </div>
          <div className="text-xs font-medium text-green-600 dark:text-green-400">Added:</div>
          <div className="border-l-2 border-green-400 dark:border-green-600">
            {searchQuery
              ? <pre className="text-xs font-mono rounded p-3 overflow-x-auto bg-green-50/50 dark:bg-green-900/10 text-gray-700 dark:text-gray-300"><HighlightedText text={newString} query={searchQuery} /></pre>
              : <CodeBlock code={newString} lang={lang} />}
          </div>
        </div>
      )}
      {toolResult.content && (
        <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-2 overflow-x-auto max-h-48">
          {searchQuery
            ? <HighlightedText text={toolResult.content} query={searchQuery} />
            : toolResult.content}
        </pre>
      )}
    </div>
  )
}
