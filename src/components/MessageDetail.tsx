import { useState } from 'react'
import type { ConversationTurn, ContentBlock, ToolResultBlock } from '@/model/types.ts'
import { ToolCallView } from './ToolCallView.tsx'

type MessageDetailProps = {
  turn: ConversationTurn
}

export function MessageDetail({ turn }: MessageDetailProps) {
  const [showRawJson, setShowRawJson] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)

  const model = turn.records[0]?.type === 'assistant' ? turn.records[0].message.model : undefined
  const usage = turn.records[0]?.type === 'assistant' ? turn.records[0].message.usage : undefined
  const stopReason = turn.records[0]?.type === 'assistant' ? turn.records[0].message.stop_reason : undefined

  const toolResults = new Map<string, ToolResultBlock>()
  const toolResultMetas = new Map<string, ConversationTurn['records'][number]>()
  for (const record of turn.records) {
    if (record.type === 'user') {
      for (const block of record.message.content) {
        toolResults.set(block.tool_use_id, block)
        toolResultMetas.set(block.tool_use_id, record)
      }
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {turn.contentBlocks.map((block, i) => (
        <ContentBlockView
          key={i}
          block={block}
          toolResult={block.type === 'tool_use' ? toolResults.get(block.id) : undefined}
          toolResultRecord={block.type === 'tool_use' ? toolResultMetas.get(block.id) : undefined}
        />
      ))}

      {turn.role === 'user' && turn.records[0]?.type === 'user' && turn.contentBlocks.length === 0 && (
        <div className="space-y-2">
          {turn.records[0].message.content.map((block, i) => (
            <div key={i} className="text-sm text-gray-700 dark:text-gray-300">
              <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto">
                {block.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {usage && (
        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Token Usage
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 pl-4">
            <span>Input tokens:</span><span>{usage.input_tokens.toLocaleString()}</span>
            <span>Output tokens:</span><span>{usage.output_tokens.toLocaleString()}</span>
            <span>Cache creation:</span><span>{usage.cache_creation_input_tokens.toLocaleString()}</span>
            <span>Cache read:</span><span>{usage.cache_read_input_tokens.toLocaleString()}</span>
            {usage.service_tier !== 'standard' && (
              <><span>Service tier:</span><span>{usage.service_tier}</span></>
            )}
          </div>
        </details>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showMetadata ? 'Hide' : 'Show'} Metadata
        </button>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showRawJson ? 'Hide' : 'Show'} Raw JSON
        </button>
        <button
          onClick={() => {
            const text = turn.contentBlocks
              .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
              .map((b) => b.text)
              .join('\n')
            navigator.clipboard.writeText(text)
          }}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Copy text
        </button>
      </div>

      {showMetadata && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pl-4">
          {turn.records.map((r) => (
            <div key={r.uuid}>UUID: {r.uuid}</div>
          ))}
          <div>Message ID: {turn.messageId}</div>
          {model && <div>Model: {model}</div>}
          <div>Session ID: {turn.sessionId}</div>
          {stopReason && <div>Stop Reason: {stopReason}</div>}
          {turn.parentToolUseId && <div>Parent Tool Use ID: {turn.parentToolUseId}</div>}
        </div>
      )}

      {showRawJson && (
        <div className="relative">
          <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto max-h-96">
            {JSON.stringify(turn.records, null, 2)}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(turn.records, null, 2))}
            className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  )
}

function ContentBlockView({
  block,
  toolResult,
  toolResultRecord,
}: {
  block: ContentBlock
  toolResult?: ToolResultBlock
  toolResultRecord?: ConversationTurn['records'][number]
}) {
  if (block.type === 'text') {
    return (
      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {block.text}
      </div>
    )
  }

  if (block.type === 'tool_use') {
    const meta = toolResultRecord?.type === 'user' ? toolResultRecord.tool_use_result : undefined
    return (
      <ToolCallView
        toolUse={block}
        toolResult={toolResult}
        toolResultMeta={meta}
      />
    )
  }

  return null
}
