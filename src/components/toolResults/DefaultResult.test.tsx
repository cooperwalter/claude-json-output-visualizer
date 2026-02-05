import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DefaultResult } from './DefaultResult.tsx'
import type { ToolResultBlock } from '@/model/types.ts'

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('DefaultResult', () => {
  it('renders raw result text in a pre element', () => {
    render(<DefaultResult toolResult={makeToolResult('Tool output text')} />)
    expect(screen.getByText('Tool output text')).toBeInTheDocument()
    const pre = screen.getByText('Tool output text').closest('pre')
    expect(pre).not.toBeNull()
  })

  it('does not render a duplicate input section since ToolCallView already shows input parameters', () => {
    const { container } = render(
      <DefaultResult toolResult={makeToolResult('result')} />,
    )
    const details = container.querySelector('details')
    expect(details).toBeNull()
  })

  it('highlights search matches in result content with mark elements', () => {
    render(
      <DefaultResult
        toolResult={makeToolResult('Found hello in 3 files')}
        searchQuery="hello"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBe(1)
    expect(marks[0].textContent).toBe('hello')
  })
})
