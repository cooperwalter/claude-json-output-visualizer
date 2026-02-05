import { useState } from 'react'
import Markdown from 'react-markdown'
import type { ConversationTurn, ContentBlock, ToolResultBlock } from '@/model/types.ts'
import { ToolCallView } from './ToolCallView.tsx'
import { CodeBlock } from './CodeBlock.tsx'
import { TokenUsageDetail } from './TokenUsageDetail.tsx'
import { HighlightedText } from './TurnCard.tsx'

type MessageDetailProps = {
  turn: ConversationTurn
  searchQuery?: string
}

export function MessageDetail({ turn, searchQuery }: MessageDetailProps) {
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
          searchQuery={searchQuery}
        />
      ))}

      {turn.role === 'user' && turn.records[0]?.type === 'user' && turn.contentBlocks.length === 0 && (
        <div className="space-y-2">
          {turn.records[0].message.content.map((block, i) => (
            <div key={i} className="text-sm text-gray-700 dark:text-gray-300">
              <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto">
                {searchQuery ? <HighlightedText text={block.content} query={searchQuery} /> : block.content}
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
          <TokenUsageDetail usage={usage} className="mt-2 gap-y-1 pl-4" />
        </details>
      )}

      <div className="group/actions flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          aria-expanded={showMetadata}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showMetadata ? 'Hide' : 'Show'} Metadata
        </button>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          aria-expanded={showRawJson}
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
          aria-label="Copy message text"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 opacity-0 group-hover/actions:opacity-100 focus:opacity-100 transition-opacity"
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
          <div>Parent Tool Use ID: {turn.parentToolUseId ?? 'None'}</div>
        </div>
      )}

      {showRawJson && (
        <div className="relative group/json">
          <CodeBlock code={JSON.stringify(turn.records, null, 2)} lang="json" />
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(turn.records, null, 2))}
            aria-label="Copy raw JSON"
            className="absolute top-2 right-2 z-10 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 opacity-0 group-hover/json:opacity-100 focus:opacity-100 transition-opacity"
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
  searchQuery,
}: {
  block: ContentBlock
  toolResult?: ToolResultBlock
  toolResultRecord?: ConversationTurn['records'][number]
  searchQuery?: string
}) {
  if (block.type === 'text') {
    if (searchQuery) {
      return (
        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:before:content-none prose-code:after:content-none">
          <Markdown components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className ?? '')
              const code = String(children).replace(/\n$/, '')
              if (match) {
                return <CodeBlock code={code} lang={match[1]} />
              }
              return <code className={className}>{children}</code>
            },
            pre({ children }) {
              return <>{children}</>
            },
            p({ children }) {
              return <p><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></p>
            },
            li({ children }) {
              return <li><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></li>
            },
            h1({ children }) {
              return <h1><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></h1>
            },
            h2({ children }) {
              return <h2><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></h2>
            },
            h3({ children }) {
              return <h3><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></h3>
            },
            h4({ children }) {
              return <h4><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></h4>
            },
            h5({ children }) {
              return <h5><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></h5>
            },
            h6({ children }) {
              return <h6><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></h6>
            },
            blockquote({ children }) {
              return <blockquote><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></blockquote>
            },
            td({ children }) {
              return <td><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></td>
            },
            th({ children }) {
              return <th><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></th>
            },
            strong({ children }) {
              return <strong><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></strong>
            },
            em({ children }) {
              return <em><HighlightedTextInChildren query={searchQuery}>{children}</HighlightedTextInChildren></em>
            },
          }}>{block.text}</Markdown>
        </div>
      )
    }
    return (
      <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:before:content-none prose-code:after:content-none">
        <Markdown components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const code = String(children).replace(/\n$/, '')
            if (match) {
              return <CodeBlock code={code} lang={match[1]} />
            }
            return <code className={className}>{children}</code>
          },
          pre({ children }) {
            return <>{children}</>
          },
        }}>{block.text}</Markdown>
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
        searchQuery={searchQuery}
      />
    )
  }

  return null
}

function HighlightedTextInChildren({ children, query }: { children: React.ReactNode; query: string }) {
  if (!children) return <>{children}</>
  if (typeof children === 'string') {
    return <HighlightedText text={children} query={query} />
  }
  if (Array.isArray(children)) {
    return <>{children.map((child, i) => {
      if (typeof child === 'string') {
        return <HighlightedText key={i} text={child} query={query} />
      }
      return <span key={i}>{child}</span>
    })}</>
  }
  return <>{children}</>
}
