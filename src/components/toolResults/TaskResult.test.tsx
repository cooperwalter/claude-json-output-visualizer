import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskResult } from './TaskResult.tsx'
import { ConversationContext } from '@/hooks/conversationContextValue.ts'
import type { ConversationContextValue } from '@/hooks/conversationContextValue.ts'
import type {
  ToolUseContentBlock,
  ToolResultBlock,
  ToolUseResultMeta,
  RawRecord,
  IndexMaps,
} from '@/model/types.ts'
import type { AppState } from '@/hooks/useAppState.ts'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}))

function makeToolUse(input: Record<string, unknown>): ToolUseContentBlock {
  return { type: 'tool_use', id: 'tu_task_1', name: 'Task', input }
}

function makeToolResult(content: string): ToolResultBlock {
  return { tool_use_id: 'tu_task_1', type: 'tool_result', content }
}

function makeEmptyIndexes(): IndexMaps {
  return {
    byUuid: new Map(),
    byMessageId: new Map(),
    byToolUseId: new Map(),
    byParentToolUseId: new Map(),
  }
}

function makeSubAgentRecord(parentToolUseId: string): RawRecord {
  return {
    type: 'assistant',
    message: {
      model: 'claude-sonnet-4-20250514',
      id: 'msg_sub_1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Sub-agent response' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
        output_tokens: 50,
        service_tier: 'standard',
      },
      context_management: null,
    },
    parent_tool_use_id: parentToolUseId,
    session_id: 'session_1',
    uuid: 'uuid_sub_1',
  }
}

function renderWithContext(
  ui: React.ReactElement,
  indexOverrides?: Partial<IndexMaps>,
) {
  const indexes = { ...makeEmptyIndexes(), ...indexOverrides }
  const state: AppState = {
    status: 'active',
    records: [],
    turns: [],
    indexes,
    sessionMeta: null,
    error: null,
    skippedLines: 0,
  }
  const ctx: ConversationContextValue = { state, dispatch: vi.fn() }
  return render(
    <ConversationContext.Provider value={ctx}>
      {ui}
    </ConversationContext.Provider>,
  )
}

describe('TaskResult', () => {
  it('renders subagent type badge and description', () => {
    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'Bash', description: 'Run build commands' })}
        toolResult={makeToolResult('Task completed')}
      />,
    )
    expect(screen.getByText('Bash')).toBeInTheDocument()
    expect(screen.getByText('Run build commands')).toBeInTheDocument()
  })

  it('renders raw result text when no sub-agent records exist', () => {
    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'Explore' })}
        toolResult={makeToolResult('Agent found 3 files')}
      />,
    )
    expect(screen.getByText('Agent found 3 files')).toBeInTheDocument()
  })

  it('renders nested sub-agent timeline when sub-agent records exist and expanded', async () => {
    const user = userEvent.setup()
    const subRecord = makeSubAgentRecord('tu_task_1')
    const byParentToolUseId = new Map([['tu_task_1', [subRecord]]])

    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'general-purpose' })}
        toolResult={makeToolResult('done')}
      />,
      { byParentToolUseId },
    )
    expect(screen.getByText(/sub-agent conversation/)).toBeInTheDocument()
    expect(screen.queryByText('Sub-agent response')).not.toBeInTheDocument()

    await user.click(screen.getByText(/Show sub-agent conversation/))
    expect(screen.getByText('Sub-agent response')).toBeInTheDocument()
  })

  it('defaults sub-agent timeline to collapsed per progressive disclosure spec', () => {
    const subRecord = makeSubAgentRecord('tu_task_1')
    const byParentToolUseId = new Map([['tu_task_1', [subRecord]]])

    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'Explore' })}
        toolResult={makeToolResult('done')}
      />,
      { byParentToolUseId },
    )
    expect(screen.getByText(/Show sub-agent conversation/)).toBeInTheDocument()
    expect(screen.queryByText('Sub-agent response')).not.toBeInTheDocument()
  })

  it('renders metadata chips when meta has duration, tokens, tool count, and status', async () => {
    const user = userEvent.setup()
    const meta: ToolUseResultMeta = {
      type: 'text',
      totalDurationMs: 5000,
      totalTokens: 1234,
      totalToolUseCount: 7,
      status: 'completed',
    }

    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'Bash' })}
        toolResult={makeToolResult('done')}
        meta={meta}
      />,
    )

    await user.click(screen.getByText('Show metadata'))
    expect(screen.getByText('5.0s')).toBeInTheDocument()
    expect(screen.getByText('1,234 tokens')).toBeInTheDocument()
    expect(screen.getByText('7 tool calls')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('toggles metadata visibility on button click', async () => {
    const user = userEvent.setup()
    const meta: ToolUseResultMeta = {
      type: 'text',
      totalDurationMs: 3000,
    }

    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'Bash' })}
        toolResult={makeToolResult('done')}
        meta={meta}
      />,
    )

    expect(screen.getByText('Show metadata')).toBeInTheDocument()
    await user.click(screen.getByText('Show metadata'))
    expect(screen.getByText('Hide metadata')).toBeInTheDocument()
    expect(screen.getByText('3.0s')).toBeInTheDocument()
  })

  it('highlights search matches in description', () => {
    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({ subagent_type: 'Explore', description: 'Search for config files' })}
        toolResult={makeToolResult('found')}
        searchQuery="config"
      />,
    )
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThanOrEqual(1)
    expect(marks[0].textContent).toBe('config')
  })

  it('renders without subagent type or description when not provided', () => {
    renderWithContext(
      <TaskResult
        toolUse={makeToolUse({})}
        toolResult={makeToolResult('output')}
      />,
    )
    expect(screen.getByText('output')).toBeInTheDocument()
  })
})
