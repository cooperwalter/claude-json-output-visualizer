import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WebFetchResult } from './WebFetchResult.tsx'
import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

function makeToolUse(input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_1', name: 'WebFetch', input }
}

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('WebFetchResult', () => {
  it('renders URL prominently and extracted content below', () => {
    render(
      <WebFetchResult
        toolUse={makeToolUse({ url: 'https://example.com/api' })}
        toolResult={makeToolResult('Page content here')}
      />,
    )
    expect(screen.getByText('https://example.com/api')).toBeInTheDocument()
    expect(screen.getByText('Page content here')).toBeInTheDocument()
  })

  it('renders without URL display when url input is absent', () => {
    render(
      <WebFetchResult
        toolUse={makeToolUse({})}
        toolResult={makeToolResult('content')}
      />,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('highlights search matches in URL and content', () => {
    render(
      <WebFetchResult
        toolUse={makeToolUse({ url: 'https://example.com' })}
        toolResult={makeToolResult('example response data')}
        searchQuery="example"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBe(2)
  })
})
