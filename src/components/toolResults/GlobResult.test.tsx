import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GlobResult } from './GlobResult.tsx'
import type { ToolResultBlock } from '@/model/types.ts'

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('GlobResult', () => {
  it('renders a list of matched file paths', () => {
    render(
      <GlobResult
        toolResult={makeToolResult('src/main.ts\nsrc/App.tsx\nsrc/utils/helper.ts')}
      />,
    )
    expect(screen.getByText('src/main.ts')).toBeInTheDocument()
    expect(screen.getByText('src/App.tsx')).toBeInTheDocument()
    expect(screen.getByText('src/utils/helper.ts')).toBeInTheDocument()
  })

  it('shows "No matches" when content is empty', () => {
    render(<GlobResult toolResult={makeToolResult('')} />)
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('filters out blank lines from output', () => {
    render(
      <GlobResult
        toolResult={makeToolResult('src/a.ts\n\n\nsrc/b.ts\n')}
      />,
    )
    expect(screen.getByText('src/a.ts')).toBeInTheDocument()
    expect(screen.getByText('src/b.ts')).toBeInTheDocument()
    expect(screen.queryByText('No matches')).not.toBeInTheDocument()
  })

  it('highlights search matches in file paths', () => {
    render(
      <GlobResult
        toolResult={makeToolResult('src/components/App.tsx\nsrc/utils/format.ts')}
        searchQuery="src"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBe(2)
  })
})
