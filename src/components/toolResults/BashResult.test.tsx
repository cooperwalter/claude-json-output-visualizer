import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BashResult } from './BashResult.tsx'
import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}))

function makeToolUse(input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_1', name: 'Bash', input }
}

function makeToolResult(content: string, isError = false): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content, is_error: isError }
}

describe('BashResult', () => {
  it('renders command as code block prefixed with $ and output below', () => {
    render(
      <BashResult
        toolUse={makeToolUse({ command: 'ls -la' })}
        toolResult={makeToolResult('file1.txt\nfile2.txt')}
      />,
    )
    const codeBlocks = screen.getAllByTestId('code-block')
    expect(codeBlocks[0]).toHaveTextContent('$ ls -la')
    expect(codeBlocks[1]).toHaveTextContent('file1.txt')
  })

  it('renders error output with red styling when is_error is true', () => {
    const { container } = render(
      <BashResult
        toolUse={makeToolUse({ command: 'exit 1' })}
        toolResult={makeToolResult('command not found', true)}
      />,
    )
    const errorPre = container.querySelector('pre.bg-red-50')
      ?? container.querySelector('pre[class*="bg-red"]')
    expect(errorPre).not.toBeNull()
    expect(errorPre?.textContent).toBe('command not found')
  })

  it('renders without command block when command is absent', () => {
    render(
      <BashResult
        toolUse={makeToolUse({})}
        toolResult={makeToolResult('output')}
      />,
    )
    const codeBlocks = screen.getAllByTestId('code-block')
    expect(codeBlocks).toHaveLength(1)
    expect(codeBlocks[0]).toHaveTextContent('output')
  })

  it('highlights search matches in output when searchQuery is provided', () => {
    render(
      <BashResult
        toolUse={makeToolUse({ command: 'echo hello' })}
        toolResult={makeToolResult('hello world')}
        searchQuery="hello"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThanOrEqual(1)
    expect(marks[0].textContent).toBe('hello')
  })

  it('highlights search matches in error output', () => {
    render(
      <BashResult
        toolUse={makeToolUse({ command: 'bad-cmd' })}
        toolResult={makeToolResult('error: bad-cmd not found', true)}
        searchQuery="error"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThanOrEqual(1)
  })
})
