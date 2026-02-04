import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GrepResult } from './GrepResult.tsx'

function makeToolResult(content: string) {
  return { tool_use_id: 'tu_1', type: 'tool_result' as const, content }
}

describe('GrepResult', () => {
  it('renders plain text when content has no structured grep output', () => {
    const { container } = render(
      <GrepResult toolResult={makeToolResult('some plain text output')} />,
    )
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.textContent).toBe('some plain text output')
  })

  it('renders structured output with file paths and line numbers for grep matches', () => {
    const content = 'src/main.ts:5:import React from "react"\nsrc/main.ts:10:export default App'
    render(<GrepResult toolResult={makeToolResult(content)} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('import React from "react"')).toBeInTheDocument()
    expect(screen.getByText('export default App')).toBeInTheDocument()
  })

  it('renders file path headers when output contains standalone file paths', () => {
    const content = 'src/components/App.tsx\nsrc/utils/helper.ts'
    render(<GrepResult toolResult={makeToolResult(content)} />)
    expect(screen.getByText('src/components/App.tsx')).toBeInTheDocument()
    expect(screen.getByText('src/utils/helper.ts')).toBeInTheDocument()
  })

  it('renders separator markers between groups of grep matches', () => {
    const content = 'file.ts:1:line one\n--\nfile.ts:5:line five'
    render(<GrepResult toolResult={makeToolResult(content)} />)
    expect(screen.getByText('···')).toBeInTheDocument()
  })

  it('shows file path header when file changes between match lines', () => {
    const content = 'src/a.ts:1:first\nsrc/b.ts:2:second'
    render(<GrepResult toolResult={makeToolResult(content)} />)
    expect(screen.getByText('src/a.ts')).toBeInTheDocument()
    expect(screen.getByText('src/b.ts')).toBeInTheDocument()
  })

  it('does not duplicate file header when consecutive lines are from the same file', () => {
    const content = 'src/a.ts:1:first\nsrc/a.ts:2:second'
    render(<GrepResult toolResult={makeToolResult(content)} />)
    const headers = screen.getAllByText('src/a.ts')
    expect(headers).toHaveLength(1)
  })
})
