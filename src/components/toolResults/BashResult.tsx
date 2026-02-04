import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'
import { CodeBlock } from '@/components/CodeBlock.tsx'

type BashResultProps = {
  toolUse: ToolUseContentBlock
  toolResult: ToolResultBlock
}

export function BashResult({ toolUse, toolResult }: BashResultProps) {
  const command = toolUse.input.command as string | undefined

  return (
    <div className="space-y-2">
      {command && (
        <CodeBlock code={`$ ${command}`} lang="bash" />
      )}
      {toolResult.is_error ? (
        <pre className="text-xs font-mono rounded p-3 overflow-x-auto max-h-96 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {toolResult.content}
        </pre>
      ) : (
        <CodeBlock code={toolResult.content} lang="bash" />
      )}
    </div>
  )
}
