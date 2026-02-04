import type { ToolUseContentBlock, ToolResultBlock, ToolUseResultMeta } from '@/model/types.ts'
import { CodeBlock } from '@/components/CodeBlock.tsx'
import { FilePathHeader } from '@/components/FilePathHeader.tsx'
import { langFromFilePath } from '@/utils/highlighter.ts'

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
  const lang = filePath ? langFromFilePath(filePath) : undefined

  return (
    <div className="space-y-2">
      {filePath && (
        <FilePathHeader
          filePath={filePath}
          suffix={totalLines !== undefined && numLines !== undefined && numLines < totalLines ? (
            <span className="text-gray-400 dark:text-gray-500 shrink-0">
              (lines {startLine}-{startLine + numLines - 1} of {totalLines})
            </span>
          ) : undefined}
        />
      )}
      <CodeBlock code={toolResult.content} lang={lang} />
    </div>
  )
}
