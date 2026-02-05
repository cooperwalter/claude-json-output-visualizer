import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MessageDetail } from './MessageDetail.tsx'
import type { ConversationTurn, AssistantRecord, UserRecord } from '@/model/types.ts'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}))

function makeAssistantRecord(overrides: Partial<AssistantRecord> = {}): AssistantRecord {
  return {
    type: 'assistant',
    uuid: 'uuid-1',
    session_id: 'session-1',
    parent_tool_use_id: null,
    message: {
      model: 'claude-opus-4-5-20251101',
      id: 'msg-1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello world' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 10,
        cache_read_input_tokens: 20,
        service_tier: 'standard',
      },
      context_management: null,
    },
    ...overrides,
  }
}

function makeAssistantTurn(overrides: Partial<ConversationTurn> = {}): ConversationTurn {
  const record = makeAssistantRecord()
  return {
    messageId: 'msg-1',
    role: 'assistant',
    records: [record],
    contentBlocks: [{ type: 'text', text: 'Hello world' }],
    parentToolUseId: null,
    sessionId: 'session-1',
    ...overrides,
  }
}

function makeUserTurn(): ConversationTurn {
  const record: UserRecord = {
    type: 'user',
    uuid: 'uuid-2',
    session_id: 'session-1',
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [{ tool_use_id: 'tu-1', type: 'tool_result', content: 'Tool result text' }],
    },
    tool_use_result: { type: 'text' },
  }
  return {
    messageId: 'uuid-2',
    role: 'user',
    records: [record],
    contentBlocks: [],
    parentToolUseId: null,
    sessionId: 'session-1',
  }
}

describe('MessageDetail', () => {
  it('renders text content blocks as markdown', () => {
    render(<MessageDetail turn={makeAssistantTurn()} />)
    expect(screen.getByTestId('markdown')).toHaveTextContent('Hello world')
  })

  it('renders user tool result content when contentBlocks is empty', () => {
    render(<MessageDetail turn={makeUserTurn()} />)
    expect(screen.getByText('Tool result text')).toBeInTheDocument()
  })

  describe('Raw JSON toggle', () => {
    it('is collapsed by default', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      expect(screen.getByText('Show Raw JSON')).toBeInTheDocument()
      expect(screen.queryByText('Hide Raw JSON')).not.toBeInTheDocument()
    })

    it('expands when clicked and shows expandable JSON tree', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      fireEvent.click(screen.getByText('Show Raw JSON'))
      expect(screen.getByText('Hide Raw JSON')).toBeInTheDocument()
      expect(screen.getAllByLabelText(/Collapse|Expand/).length).toBeGreaterThan(0)
    })

    it('collapses when clicked again', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      fireEvent.click(screen.getByText('Show Raw JSON'))
      fireEvent.click(screen.getByText('Hide Raw JSON'))
      expect(screen.getByText('Show Raw JSON')).toBeInTheDocument()
    })
  })

  describe('Metadata toggle', () => {
    it('is collapsed by default', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      expect(screen.getByText('Show Metadata')).toBeInTheDocument()
    })

    it('shows UUID, Message ID, Model, Session ID, Stop Reason, and Parent Tool Use ID when expanded', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      fireEvent.click(screen.getByText('Show Metadata'))
      expect(screen.getByText(/UUID: uuid-1/)).toBeInTheDocument()
      expect(screen.getByText(/Message ID: msg-1/)).toBeInTheDocument()
      expect(screen.getByText(/Model: claude-opus-4-5-20251101/)).toBeInTheDocument()
      expect(screen.getByText(/Session ID: session-1/)).toBeInTheDocument()
      expect(screen.getByText(/Stop Reason: end_turn/)).toBeInTheDocument()
      expect(screen.getByText(/Parent Tool Use ID: None/)).toBeInTheDocument()
    })

    it('shows parent tool use ID when present', () => {
      const turn = makeAssistantTurn({ parentToolUseId: 'tu_parent_123' })
      render(<MessageDetail turn={turn} />)
      fireEvent.click(screen.getByText('Show Metadata'))
      expect(screen.getByText(/Parent Tool Use ID: tu_parent_123/)).toBeInTheDocument()
    })
  })

  describe('Token Usage toggle', () => {
    it('is collapsed by default for assistant turns', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      expect(screen.getByText('Show Token Usage')).toBeInTheDocument()
    })

    it('is not rendered for user turns (no usage data)', () => {
      render(<MessageDetail turn={makeUserTurn()} />)
      expect(screen.queryByText('Show Token Usage')).not.toBeInTheDocument()
    })

    it('shows token usage details when expanded', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      fireEvent.click(screen.getByText('Show Token Usage'))
      expect(screen.getByText('Hide Token Usage')).toBeInTheDocument()
    })
  })

  describe('Copy text button', () => {
    it('renders a copy text button with proper aria label', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      expect(screen.getByLabelText('Copy message text')).toBeInTheDocument()
    })

    it('copies text content to clipboard when clicked', () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })
      render(<MessageDetail turn={makeAssistantTurn()} />)
      fireEvent.click(screen.getByLabelText('Copy message text'))
      expect(writeText).toHaveBeenCalledWith('Hello world')
    })
  })

  describe('aria-expanded attributes', () => {
    it('sets aria-expanded=false on collapsed toggles and true on expanded ones', () => {
      render(<MessageDetail turn={makeAssistantTurn()} />)
      const rawJsonBtn = screen.getByText('Show Raw JSON')
      expect(rawJsonBtn).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(rawJsonBtn)
      expect(screen.getByText('Hide Raw JSON')).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('tool_use content blocks', () => {
    it('renders ToolCallView for tool_use blocks', () => {
      const toolRecord = makeAssistantRecord({
        message: {
          ...makeAssistantRecord().message,
          content: [
            { type: 'tool_use', id: 'tu-1', name: 'Read', input: { file_path: '/tmp/test.ts' } },
          ],
        },
      })
      const turn: ConversationTurn = {
        messageId: 'msg-1',
        role: 'assistant',
        records: [toolRecord],
        contentBlocks: [
          { type: 'tool_use', id: 'tu-1', name: 'Read', input: { file_path: '/tmp/test.ts' } },
        ],
        parentToolUseId: null,
        sessionId: 'session-1',
      }
      render(<MessageDetail turn={turn} />)
      expect(screen.getByText('Read')).toBeInTheDocument()
    })
  })
})
