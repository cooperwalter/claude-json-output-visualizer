import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { ToolCallView } from './ToolCallView.tsx'
import type { ToolUseContentBlock, ToolResultBlock, ToolUseResultMeta } from '@/model/types.ts'

function makeToolUse(overrides: Partial<ToolUseContentBlock> = {}): ToolUseContentBlock {
  return {
    type: 'tool_use',
    id: 'tu-1',
    name: 'Read',
    input: { file_path: '/src/main.ts' },
    ...overrides,
  }
}

function makeToolResult(overrides: Partial<ToolResultBlock> = {}): ToolResultBlock {
  return {
    type: 'tool_result',
    tool_use_id: 'tu-1',
    content: 'File contents here',
    ...overrides,
  }
}

describe('ToolCallView', () => {
  it('should display tool name in collapsed state', () => {
    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} />)
    expect(screen.getByText('Read')).toBeInTheDocument()
  })

  it('should show OK badge for successful non-error tool results', () => {
    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} />)
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('should show Error badge and first 80 chars of error content when tool result is an error', () => {
    const errorContent = 'E'.repeat(100)
    const toolResult = makeToolResult({ is_error: true, content: errorContent })
    render(<ToolCallView toolUse={makeToolUse()} toolResult={toolResult} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('E'.repeat(80) + '...')).toBeInTheDocument()
  })

  it('should apply red border styling when tool result is an error', () => {
    const toolResult = makeToolResult({ is_error: true, content: 'Something failed' })
    const { container } = render(<ToolCallView toolUse={makeToolUse()} toolResult={toolResult} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('border-red')
  })

  it('should show spinning SVG and Awaiting result text when no tool result exists (pending)', () => {
    const { container } = render(<ToolCallView toolUse={makeToolUse()} />)
    expect(screen.getByText('Awaiting result...')).toBeInTheDocument()
    const spinner = container.querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show file path and line count in collapsed state for Read tool calls', () => {
    const meta: ToolUseResultMeta = {
      type: 'text',
      file: {
        filePath: '/src/main.ts',
        content: 'content',
        numLines: 50,
        startLine: 1,
        totalLines: 50,
      },
    }
    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} toolResultMeta={meta} />)
    expect(screen.getByText(/50 lines/)).toBeInTheDocument()
  })

  it('should show truncated line count when numLines differs from totalLines', () => {
    const meta: ToolUseResultMeta = {
      type: 'text',
      file: {
        filePath: '/src/main.ts',
        content: 'content',
        numLines: 100,
        startLine: 1,
        totalLines: 500,
      },
    }
    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} toolResultMeta={meta} />)
    expect(screen.getByText(/100 of 500 lines/)).toBeInTheDocument()
  })

  it('should show command preview for Bash tool calls in collapsed state', () => {
    const toolUse = makeToolUse({ name: 'Bash', input: { command: 'npm test' } })
    render(<ToolCallView toolUse={toolUse} toolResult={makeToolResult()} />)
    expect(screen.getByText('$ npm test')).toBeInTheDocument()
  })

  it('should truncate long command to 60 chars in collapsed state', () => {
    const longCommand = 'npm run build -- --flag-a --flag-b --flag-c --flag-d --very-long-command-option'
    const toolUse = makeToolUse({ name: 'Bash', input: { command: longCommand } })
    render(<ToolCallView toolUse={toolUse} toolResult={makeToolResult()} />)
    expect(screen.getByText(`$ ${longCommand.slice(0, 60)}...`)).toBeInTheDocument()
  })

  it('should render SVG tool icon instead of unicode gear character', () => {
    const { container } = render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain('⚙')
  })

  it('should show input parameters and result when expanded', async () => {
    const user = userEvent.setup()

    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} />)

    const button = screen.getByRole('button', { name: /Read/i })
    await user.click(button)

    expect(screen.getByText('Input Parameters')).toBeInTheDocument()
  })

  it('should show expand/collapse chevron indicator', () => {
    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} />)
    expect(screen.getByText('▶')).toBeInTheDocument()
  })

  it('should change chevron to down arrow when expanded', async () => {
    const user = userEvent.setup()
    render(<ToolCallView toolUse={makeToolUse()} toolResult={makeToolResult()} />)

    const button = screen.getByRole('button', { name: /Read/i })
    await user.click(button)

    expect(screen.getByText('▼')).toBeInTheDocument()
  })
})
