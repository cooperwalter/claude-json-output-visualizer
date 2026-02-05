import { useMemo } from 'react'
import type { ToolResultBlock, ToolUseContentBlock } from '@/model/types.ts'
import { FilePathHeader } from '@/components/FilePathHeader.tsx'
import { HighlightedText } from '@/components/TurnCard.tsx'

type GrepResultProps = {
  toolUse?: ToolUseContentBlock
  toolResult: ToolResultBlock
  searchQuery?: string
}

type GrepLine = {
  type: 'file_header' | 'match' | 'context' | 'separator' | 'plain'
  filePath?: string
  lineNumber?: number
  text: string
  showFileHeader?: boolean
}

function parseGrepOutput(content: string): GrepLine[] {
  const lines = content.split('\n')
  const parsed: GrepLine[] = []
  let currentFile: string | undefined

  for (const line of lines) {
    if (line === '--') {
      parsed.push({ type: 'separator', text: line })
      continue
    }

    if (line === '') continue

    const matchWithLine = line.match(/^(.+?):(\d+)[:：](.*)$/)
    if (matchWithLine) {
      const filePath = matchWithLine[1]
      const showFileHeader = filePath !== currentFile
      if (showFileHeader) currentFile = filePath
      parsed.push({
        type: 'match',
        filePath,
        lineNumber: parseInt(matchWithLine[2], 10),
        text: matchWithLine[3],
        showFileHeader,
      })
      continue
    }

    const matchFilePath = line.match(/^(.+\.\w+)$/)
    if (matchFilePath && !line.includes(' ')) {
      currentFile = matchFilePath[1]
      parsed.push({ type: 'file_header', filePath: matchFilePath[1], text: line })
      continue
    }

    parsed.push({ type: 'plain', text: line })
  }

  return parsed
}

export function GrepResult({ toolResult, searchQuery }: GrepResultProps) {
  const parsedLines = useMemo(() => parseGrepOutput(toolResult.content), [toolResult.content])

  const hasStructuredOutput = parsedLines.some((l) => l.type === 'match' || l.type === 'file_header')

  if (!hasStructuredOutput) {
    return (
      <pre className="text-xs font-mono bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-x-auto max-h-96 leading-relaxed">
        {searchQuery
          ? <HighlightedText text={toolResult.content} query={searchQuery} />
          : toolResult.content}
      </pre>
    )
  }

  return (
    <div className="text-xs font-mono bg-white dark:bg-gray-900 rounded p-3 overflow-x-auto max-h-96 space-y-0">
      {parsedLines.map((line, i) => {
        if (line.type === 'file_header') {
          return (
            <div key={i} className="pt-2 first:pt-0">
              <FilePathHeader filePath={line.filePath ?? ''} />
            </div>
          )
        }

        if (line.type === 'match') {
          return (
            <div key={i}>
              {line.showFileHeader && (
                <div className="pt-2">
                  <FilePathHeader filePath={line.filePath ?? ''} />
                </div>
              )}
              <div className="flex hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className="w-10 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
                  {line.lineNumber}
                </span>
                <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                  {searchQuery
                    ? <HighlightedText text={line.text} query={searchQuery} />
                    : line.text}
                </span>
              </div>
            </div>
          )
        }

        if (line.type === 'separator') {
          return (
            <div key={i} className="text-gray-300 dark:text-gray-600 py-0.5 select-none">
              ···
            </div>
          )
        }

        return (
          <div key={i} className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {searchQuery
              ? <HighlightedText text={line.text} query={searchQuery} />
              : line.text}
          </div>
        )
      })}
    </div>
  )
}
