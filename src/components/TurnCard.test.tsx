import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { TurnCard, HighlightedText } from './TurnCard.tsx'
import { formatModelShort } from '@/utils/formatModel.ts'
import type { ConversationTurn, AssistantRecord, UserRecord, ContentBlock } from '@/model/types.ts'

function makeAssistantRecord(overrides: Partial<AssistantRecord> = {}): AssistantRecord {
  return {
    type: 'assistant',
    uuid: 'uuid-1',
    session_id: 'session-1',
    parent_tool_use_id: null,
    message: {
      model: 'claude-sonnet-4-20250514',
      id: 'msg-1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello world' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
        service_tier: 'standard',
      },
      context_management: null,
    },
    ...overrides,
  }
}

function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    type: 'user',
    uuid: 'uuid-2',
    session_id: 'session-1',
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'tu-1', content: 'Tool result content' }],
    },
    tool_use_result: { type: 'text' },
    ...overrides,
  }
}

function makeTurn(
  records: (AssistantRecord | UserRecord)[],
  overrides: Partial<ConversationTurn> = {},
): ConversationTurn {
  const role = records[0].type === 'assistant' ? 'assistant' : 'user'
  const contentBlocks: ContentBlock[] =
    role === 'assistant' && records[0].type === 'assistant'
      ? records[0].message.content
      : []

  return {
    messageId: records[0].type === 'assistant' ? records[0].message.id : records[0].uuid,
    role: role as 'assistant' | 'user',
    records,
    contentBlocks,
    parentToolUseId: null,
    sessionId: 'session-1',
    ...overrides,
  }
}

describe('TurnCard', () => {
  it('should display turn index number starting from 1', () => {
    const turn = makeTurn([makeAssistantRecord()])
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should display Assistant role badge for assistant turns', () => {
    const turn = makeTurn([makeAssistantRecord()])
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('Assistant')).toBeInTheDocument()
  })

  it('should display User role badge for user turns', () => {
    const turn = makeTurn([makeUserRecord()], { role: 'user' })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should show first 120 chars of text content as summary with ellipsis for long text', () => {
    const longText = 'A'.repeat(150)
    const record = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'text', text: longText }],
      },
    })
    const turn = makeTurn([record], { contentBlocks: record.message.content })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('A'.repeat(120) + '...')).toBeInTheDocument()
  })

  it('should show full text when content is shorter than 120 chars', () => {
    const turn = makeTurn([makeAssistantRecord()])
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('should show tool name as summary when first content block is tool_use', () => {
    const record = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'tool_use', id: 'tu-1', name: 'Read', input: { file_path: '/foo' } }],
      },
    })
    const turn = makeTurn([record], { contentBlocks: record.message.content })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('Read()')).toBeInTheDocument()
  })

  it('should show Error badge when turn contains error tool results', () => {
    const record = makeUserRecord({
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'tu-1', content: 'Error!', is_error: true }],
      },
    })
    const turn = makeTurn([record], { role: 'user' })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('should show Sub-agent badge with type when turn has parentToolUseId and Task tool_use', () => {
    const record = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'tool_use', id: 'tu-1', name: 'Task', input: { subagent_type: 'Bash' } }],
      },
    })
    const turn = makeTurn([record], {
      parentToolUseId: 'parent-tu-1',
      contentBlocks: record.message.content,
    })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('Sub-agent: Bash')).toBeInTheDocument()
  })

  it('should render SVG text icon when turn has text content blocks', () => {
    const turn = makeTurn([makeAssistantRecord()])
    const { container } = render(<TurnCard turn={turn} index={0} />)
    const svgIcons = container.querySelectorAll('svg[aria-label="Text content"]')
    expect(svgIcons.length).toBe(1)
  })

  it('should render SVG tool icon when turn has tool_use content blocks', () => {
    const record = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [{ type: 'tool_use', id: 'tu-1', name: 'Read', input: {} }],
      },
    })
    const turn = makeTurn([record], { contentBlocks: record.message.content })
    const { container } = render(<TurnCard turn={turn} index={0} />)
    const toolIcons = container.querySelectorAll('svg')
    expect(toolIcons.length).toBeGreaterThan(0)
  })

  it('should show tool count multiplier when multiple tool_use blocks exist', () => {
    const record = makeAssistantRecord({
      message: {
        ...makeAssistantRecord().message,
        content: [
          { type: 'tool_use', id: 'tu-1', name: 'Read', input: {} },
          { type: 'tool_use', id: 'tu-2', name: 'Write', input: {} },
        ],
      },
    })
    const turn = makeTurn([record], { contentBlocks: record.message.content })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('2×')).toBeInTheDocument()
  })

  it('should expand on click to show MessageDetail', async () => {
    const user = userEvent.setup()
    const turn = makeTurn([makeAssistantRecord()])
    render(<TurnCard turn={turn} index={0} />)

    const card = screen.getByText('Hello world').closest('[id^="turn-"]')!
    await user.click(card)

    expect(screen.getByText('Token Usage')).toBeInTheDocument()
  })

  it('should display abbreviated model name badge on assistant turns in collapsed state', () => {
    const turn = makeTurn([makeAssistantRecord()])
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.getByText('sonnet-4')).toBeInTheDocument()
    expect(screen.getByTitle('claude-sonnet-4-20250514')).toBeInTheDocument()
  })

  it('should not display model badge on user turns', () => {
    const turn = makeTurn([makeUserRecord()], { role: 'user' })
    render(<TurnCard turn={turn} index={0} />)
    expect(screen.queryByTitle(/claude/)).not.toBeInTheDocument()
  })

  it('should display full model name in metadata section when expanded', async () => {
    const user = userEvent.setup()
    const turn = makeTurn([makeAssistantRecord()])
    render(<TurnCard turn={turn} index={0} />)

    const card = screen.getByText('Hello world').closest('[id^="turn-"]')!
    await user.click(card)
    await user.click(screen.getByText('Show Metadata'))

    expect(screen.getByText(/claude-sonnet-4-20250514/)).toBeInTheDocument()
  })

  it('should apply ring styling when isFocused is true', () => {
    const turn = makeTurn([makeAssistantRecord()])
    const { container } = render(<TurnCard turn={turn} index={0} isFocused={true} />)
    const card = container.querySelector('[id^="turn-"]')!
    expect(card.className).toContain('ring-indigo')
  })

  it('should apply blue ring styling when isCurrentMatch is true', () => {
    const turn = makeTurn([makeAssistantRecord()])
    const { container } = render(<TurnCard turn={turn} index={0} isCurrentMatch={true} />)
    const card = container.querySelector('[id^="turn-"]')!
    expect(card.className).toContain('ring-blue')
  })
})

describe('HighlightedText', () => {
  it('should highlight matching text with mark elements', () => {
    const { container } = render(<HighlightedText text="Hello world" query="world" />)
    const mark = container.querySelector('mark')
    expect(mark).toBeInTheDocument()
    expect(mark?.textContent).toBe('world')
  })

  it('should be case-insensitive when highlighting', () => {
    const { container } = render(<HighlightedText text="Hello World" query="world" />)
    const mark = container.querySelector('mark')
    expect(mark).toBeInTheDocument()
    expect(mark?.textContent).toBe('World')
  })

  it('should return plain text when query is empty', () => {
    const { container } = render(<HighlightedText text="Hello world" query="" />)
    expect(container.querySelector('mark')).not.toBeInTheDocument()
    expect(container.textContent).toBe('Hello world')
  })

  it('should highlight multiple occurrences of the query', () => {
    const { container } = render(<HighlightedText text="foo bar foo baz foo" query="foo" />)
    const marks = container.querySelectorAll('mark')
    expect(marks.length).toBe(3)
  })
})

describe('formatModelShort', () => {
  it('should strip claude- prefix and date suffix from standard model names', () => {
    expect(formatModelShort('claude-sonnet-4-20250514')).toBe('sonnet-4')
    expect(formatModelShort('claude-opus-4-5-20251101')).toBe('opus-4-5')
    expect(formatModelShort('claude-haiku-3-5-20241022')).toBe('haiku-3-5')
  })

  it('should handle older model name formats', () => {
    expect(formatModelShort('claude-3-5-sonnet-20241022')).toBe('3-5-sonnet')
  })

  it('should pass through non-Claude model names unchanged', () => {
    expect(formatModelShort('gpt-4')).toBe('gpt-4')
  })

  it('should handle model names without date suffix', () => {
    expect(formatModelShort('claude-sonnet-4')).toBe('sonnet-4')
  })
})
