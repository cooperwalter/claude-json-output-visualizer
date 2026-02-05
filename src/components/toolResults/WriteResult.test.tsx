import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WriteResult } from './WriteResult.tsx'
import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

function makeToolUse(input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_1', name: 'Write', input }
}

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('WriteResult', () => {
  it('renders file path header and confirmation content', () => {
    render(
      <WriteResult
        toolUse={makeToolUse({ file_path: '/src/new-file.ts' })}
        toolResult={makeToolResult('File written successfully')}
      />,
    )
    expect(screen.getByText('/src/new-file.ts')).toBeInTheDocument()
    expect(screen.getByText('File written successfully')).toBeInTheDocument()
  })

  it('renders without file path header when file_path is absent', () => {
    const { container } = render(
      <WriteResult
        toolUse={makeToolUse({})}
        toolResult={makeToolResult('Written')}
      />,
    )
    expect(container.querySelector('button')).toBeNull()
    expect(screen.getByText('Written')).toBeInTheDocument()
  })

  it('highlights search matches in result content', () => {
    render(
      <WriteResult
        toolUse={makeToolUse({ file_path: '/src/test.ts' })}
        toolResult={makeToolResult('File written successfully')}
        searchQuery="written"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBe(1)
    expect(marks[0].textContent).toBe('written')
  })
})
