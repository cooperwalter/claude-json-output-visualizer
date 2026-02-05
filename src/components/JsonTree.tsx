import { useState, useCallback } from 'react'

type JsonValue = unknown

type JsonTreeProps = {
  data: JsonValue
  defaultExpandDepth?: number
  searchQuery?: string
}

export function JsonTree({ data, defaultExpandDepth = 1, searchQuery }: JsonTreeProps) {
  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto bg-white dark:bg-gray-900 rounded p-3">
      <JsonNode value={data} depth={0} defaultExpandDepth={defaultExpandDepth} searchQuery={searchQuery} />
    </div>
  )
}

type JsonNodeProps = {
  keyName?: string
  value: JsonValue
  depth: number
  defaultExpandDepth: number
  isLast?: boolean
  searchQuery?: string
}

function JsonNode({ keyName, value, depth, defaultExpandDepth, isLast = true, searchQuery }: JsonNodeProps) {
  const isExpandable = value !== null && typeof value === 'object'
  const [expanded, setExpanded] = useState(depth < defaultExpandDepth)

  const toggle = useCallback(() => setExpanded((prev) => !prev), [])

  if (isExpandable) {
    return (
      <CollapsibleNode
        keyName={keyName}
        value={value}
        depth={depth}
        defaultExpandDepth={defaultExpandDepth}
        expanded={expanded}
        onToggle={toggle}
        isLast={isLast}
        searchQuery={searchQuery}
      />
    )
  }

  return (
    <div className="flex">
      {keyName !== undefined && (
        <>
          <span className="text-purple-700 dark:text-purple-400">
            {searchQuery ? <HighlightedJsonText text={`"${keyName}"`} query={searchQuery} /> : `"${keyName}"`}
          </span>
          <span className="text-gray-500 dark:text-gray-400">{': '}</span>
        </>
      )}
      <PrimitiveValue value={value} searchQuery={searchQuery} />
      {!isLast && <span className="text-gray-500 dark:text-gray-400">,</span>}
    </div>
  )
}

type CollapsibleNodeProps = {
  keyName?: string
  value: object
  depth: number
  defaultExpandDepth: number
  expanded: boolean
  onToggle: () => void
  isLast: boolean
  searchQuery?: string
}

function CollapsibleNode({ keyName, value, depth, defaultExpandDepth, expanded, onToggle, isLast, searchQuery }: CollapsibleNodeProps) {
  const isArray = Array.isArray(value)
  const entries = isArray ? (value as unknown[]) : Object.entries(value as Record<string, unknown>)
  const count = isArray ? (value as unknown[]).length : Object.keys(value as Record<string, unknown>).length
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'

  if (count === 0) {
    return (
      <div className="flex">
        {keyName !== undefined && (
          <>
            <span className="text-purple-700 dark:text-purple-400">
              {searchQuery ? <HighlightedJsonText text={`"${keyName}"`} query={searchQuery} /> : `"${keyName}"`}
            </span>
            <span className="text-gray-500 dark:text-gray-400">{': '}</span>
          </>
        )}
        <span className="text-gray-500 dark:text-gray-400">{openBracket}{closeBracket}</span>
        {!isLast && <span className="text-gray-500 dark:text-gray-400">,</span>}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start">
        <button
          onClick={onToggle}
          className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 -ml-0.5 mr-0.5"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${isArray ? 'array' : 'object'}${keyName !== undefined ? ` "${keyName}"` : ''}`}
        >
          <span className="text-[10px] leading-none">{expanded ? '▼' : '▶'}</span>
        </button>
        {keyName !== undefined && (
          <>
            <span className="text-purple-700 dark:text-purple-400">
              {searchQuery ? <HighlightedJsonText text={`"${keyName}"`} query={searchQuery} /> : `"${keyName}"`}
            </span>
            <span className="text-gray-500 dark:text-gray-400">{': '}</span>
          </>
        )}
        <span className="text-gray-500 dark:text-gray-400">{openBracket}</span>
        {!expanded && (
          <>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mx-1"
              aria-label={`Expand ${count} items`}
            >
              <span className="text-xs italic">{count} {count === 1 ? 'item' : 'items'}</span>
            </button>
            <span className="text-gray-500 dark:text-gray-400">{closeBracket}</span>
            {!isLast && <span className="text-gray-500 dark:text-gray-400">,</span>}
          </>
        )}
      </div>

      {expanded && (
        <>
          <div className="pl-5 border-l border-gray-200 dark:border-gray-700 ml-1.5">
            {isArray
              ? (entries as unknown[]).map((item, i) => (
                  <JsonNode
                    key={i}
                    value={item}
                    depth={depth + 1}
                    defaultExpandDepth={defaultExpandDepth}
                    isLast={i === count - 1}
                    searchQuery={searchQuery}
                  />
                ))
              : (entries as [string, unknown][]).map(([key, val], i) => (
                  <JsonNode
                    key={key}
                    keyName={key}
                    value={val}
                    depth={depth + 1}
                    defaultExpandDepth={defaultExpandDepth}
                    isLast={i === count - 1}
                    searchQuery={searchQuery}
                  />
                ))}
          </div>
          <div className="flex">
            <span className="text-gray-500 dark:text-gray-400 ml-1.5">{closeBracket}</span>
            {!isLast && <span className="text-gray-500 dark:text-gray-400">,</span>}
          </div>
        </>
      )}
    </div>
  )
}

function PrimitiveValue({ value, searchQuery }: { value: JsonValue; searchQuery?: string }) {
  if (value === null) {
    return <span className="text-gray-500 dark:text-gray-400 italic">null</span>
  }
  if (typeof value === 'boolean') {
    return <span className="text-blue-700 dark:text-blue-400">{String(value)}</span>
  }
  if (typeof value === 'number') {
    return <span className="text-green-700 dark:text-green-400">{String(value)}</span>
  }
  if (typeof value === 'string') {
    const displayed = `"${value}"`
    return (
      <span className="text-amber-700 dark:text-amber-400 break-all">
        {searchQuery ? <HighlightedJsonText text={displayed} query={searchQuery} /> : displayed}
      </span>
    )
  }
  return <span>{String(value)}</span>
}

function HighlightedJsonText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: { text: string; highlight: boolean }[] = []
  let lastIndex = 0

  let idx = lowerText.indexOf(lowerQuery, lastIndex)
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), highlight: false })
    }
    parts.push({ text: text.slice(idx, idx + query.length), highlight: true })
    lastIndex = idx + query.length
    idx = lowerText.indexOf(lowerQuery, lastIndex)
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false })
  }

  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}
