import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DefaultResult } from './DefaultResult.tsx'
import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

function makeToolUse(name: string, input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_1', name, input }
}

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('DefaultResult', () => {
  it('renders collapsible input section with tool name and raw result text', () => {
    render(
      <DefaultResult
        toolUse={makeToolUse('CustomTool', { key: 'value', count: 42 })}
        toolResult={makeToolResult('Tool output text')}
      />,
    )
    expect(screen.getByText('Input (CustomTool)')).toBeInTheDocument()
    expect(screen.getByText('Tool output text')).toBeInTheDocument()
  })

  it('shows expandable JSON tree input inside the collapsible details', () => {
    const { container } = render(
      <DefaultResult
        toolUse={makeToolUse('MyTool', { param: 'test' })}
        toolResult={makeToolResult('result')}
      />,
    )
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details?.textContent).toContain('"param"')
    expect(details?.textContent).toContain('"test"')
  })

  it('highlights search matches in both input JSON and result content', () => {
    render(
      <DefaultResult
        toolUse={makeToolUse('Search', { query: 'hello world' })}
        toolResult={makeToolResult('Found hello in 3 files')}
        searchQuery="hello"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThanOrEqual(2)
  })
})
