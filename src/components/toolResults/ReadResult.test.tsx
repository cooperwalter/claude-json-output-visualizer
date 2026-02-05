import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReadResult } from './ReadResult.tsx'
import type { ToolUseContentBlock, ToolResultBlock, ToolUseResultMeta } from '@/model/types.ts'

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code, showLineNumbers, startLine }: { code: string; showLineNumbers?: boolean; startLine?: number }) => (
    <pre data-testid="code-block" data-show-line-numbers={showLineNumbers ? 'true' : undefined} data-start-line={startLine}>
      {code}
    </pre>
  ),
}))

vi.mock('@/utils/highlighter.ts', () => ({
  langFromFilePath: (path: string) => {
    if (path.endsWith('.ts')) return 'typescript'
    if (path.endsWith('.py')) return 'python'
    return undefined
  },
}))

function makeToolUse(input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_1', name: 'Read', input }
}

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('ReadResult', () => {
  it('renders file path header and code content', () => {
    render(
      <ReadResult
        toolUse={makeToolUse({ file_path: '/src/main.ts' })}
        toolResult={makeToolResult('const x = 1')}
      />,
    )
    expect(screen.getByText('/src/main.ts')).toBeInTheDocument()
    expect(screen.getByTestId('code-block')).toHaveTextContent('const x = 1')
  })

  it('shows truncation indicator when numLines < totalLines', () => {
    const meta: ToolUseResultMeta = {
      type: 'text',
      file: { filePath: '/src/app.ts', content: 'code', numLines: 20, startLine: 10, totalLines: 100 },
    }
    render(
      <ReadResult
        toolUse={makeToolUse({ file_path: '/src/app.ts' })}
        toolResult={makeToolResult('code')}
        meta={meta}
      />,
    )
    expect(screen.getByText(/lines 10-29 of 100/)).toBeInTheDocument()
  })

  it('does not show truncation indicator when all lines are shown', () => {
    const meta: ToolUseResultMeta = {
      type: 'text',
      file: { filePath: '/src/app.ts', content: 'code', numLines: 50, startLine: 1, totalLines: 50 },
    }
    const { container } = render(
      <ReadResult
        toolUse={makeToolUse({ file_path: '/src/app.ts' })}
        toolResult={makeToolResult('code')}
        meta={meta}
      />,
    )
    expect(container.querySelector('span')?.textContent).not.toMatch(/lines.*of/)
  })

  it('falls back to plain text with search highlighting when searchQuery is provided', () => {
    render(
      <ReadResult
        toolUse={makeToolUse({ file_path: '/src/main.ts' })}
        toolResult={makeToolResult('const hello = "world"')}
        searchQuery="hello"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBe(1)
    expect(marks[0].textContent).toBe('hello')
  })

  it('renders without file path when file_path is absent', () => {
    const { container } = render(
      <ReadResult
        toolUse={makeToolUse({})}
        toolResult={makeToolResult('some content')}
      />,
    )
    expect(container.querySelector('button')).toBeNull()
    expect(screen.getByTestId('code-block')).toHaveTextContent('some content')
  })

  it('uses meta.file.filePath as fallback when tool input file_path is absent', () => {
    const meta: ToolUseResultMeta = {
      type: 'text',
      file: { filePath: '/fallback/path.ts', content: 'code', numLines: 10, startLine: 1, totalLines: 10 },
    }
    render(
      <ReadResult
        toolUse={makeToolUse({})}
        toolResult={makeToolResult('code')}
        meta={meta}
      />,
    )
    expect(screen.getByText('/fallback/path.ts')).toBeInTheDocument()
  })

  it('passes showLineNumbers and startLine to CodeBlock', () => {
    render(
      <ReadResult
        toolUse={makeToolUse({ file_path: '/src/main.ts' })}
        toolResult={makeToolResult('line one\nline two')}
      />,
    )
    const codeBlock = screen.getByTestId('code-block')
    expect(codeBlock).toHaveAttribute('data-show-line-numbers', 'true')
    expect(codeBlock).toHaveAttribute('data-start-line', '1')
  })

  it('passes correct startLine from meta to CodeBlock', () => {
    const meta: ToolUseResultMeta = {
      type: 'text',
      file: { filePath: '/src/app.ts', content: 'code', numLines: 20, startLine: 50, totalLines: 100 },
    }
    render(
      <ReadResult
        toolUse={makeToolUse({ file_path: '/src/app.ts' })}
        toolResult={makeToolResult('code')}
        meta={meta}
      />,
    )
    const codeBlock = screen.getByTestId('code-block')
    expect(codeBlock).toHaveAttribute('data-show-line-numbers', 'true')
    expect(codeBlock).toHaveAttribute('data-start-line', '50')
  })
})
