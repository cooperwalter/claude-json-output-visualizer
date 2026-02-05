import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditResult } from './EditResult.tsx'
import type { ToolUseContentBlock, ToolResultBlock } from '@/model/types.ts'

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}))

vi.mock('@/utils/highlighter.ts', () => ({
  langFromFilePath: () => 'typescript',
}))

function makeToolUse(input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_1', name: 'Edit', input }
}

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_1', type: 'tool_result', content }
}

describe('EditResult', () => {
  it('renders file path, removed section, and added section for a diff', () => {
    render(
      <EditResult
        toolUse={makeToolUse({
          file_path: '/src/utils.ts',
          old_string: 'const a = 1',
          new_string: 'const a = 2',
        })}
        toolResult={makeToolResult('File edited successfully')}
      />,
    )
    expect(screen.getByText('/src/utils.ts')).toBeInTheDocument()
    expect(screen.getByText('Removed:')).toBeInTheDocument()
    expect(screen.getByText('Added:')).toBeInTheDocument()
    expect(screen.getAllByTestId('code-block')).toHaveLength(2)
    expect(screen.getByText('File edited successfully')).toBeInTheDocument()
  })

  it('does not render diff sections when old_string and new_string are absent', () => {
    render(
      <EditResult
        toolUse={makeToolUse({ file_path: '/src/utils.ts' })}
        toolResult={makeToolResult('File edited')}
      />,
    )
    expect(screen.queryByText('Removed:')).not.toBeInTheDocument()
    expect(screen.queryByText('Added:')).not.toBeInTheDocument()
  })

  it('renders without file path when file_path is absent', () => {
    const { container } = render(
      <EditResult
        toolUse={makeToolUse({ old_string: 'a', new_string: 'b' })}
        toolResult={makeToolResult('Done')}
      />,
    )
    expect(container.querySelector('button')).toBeNull()
    expect(screen.getByText('Removed:')).toBeInTheDocument()
  })

  it('highlights search matches in old and new strings', () => {
    render(
      <EditResult
        toolUse={makeToolUse({
          file_path: '/src/app.ts',
          old_string: 'hello world',
          new_string: 'hello universe',
        })}
        toolResult={makeToolResult('OK')}
        searchQuery="hello"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThanOrEqual(2)
  })

  it('does not render result content pre when toolResult.content is empty', () => {
    render(
      <EditResult
        toolUse={makeToolUse({ file_path: '/f.ts', old_string: 'a', new_string: 'b' })}
        toolResult={makeToolResult('')}
      />,
    )
    const codeBlocks = screen.getAllByTestId('code-block')
    expect(codeBlocks).toHaveLength(2)
    const allPres = document.querySelectorAll('pre:not([data-testid])')
    expect(allPres.length).toBe(0)
  })
})
