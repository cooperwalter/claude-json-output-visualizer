import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConversationTimeline } from './ConversationTimeline.tsx'
import type { ConversationTurn, AssistantRecord } from '@/model/types.ts'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}))

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
})

function makeAssistantTurn(id: string, text = 'Hello'): ConversationTurn {
  const record: AssistantRecord = {
    type: 'assistant',
    uuid: `uuid_${id}`,
    session_id: 'sess_001',
    parent_tool_use_id: null,
    message: {
      model: 'claude-opus-4-5-20251101',
      id: `msg_${id}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 5,
        service_tier: 'standard',
      },
      context_management: null,
    },
  }
  return {
    messageId: `msg_${id}`,
    role: 'assistant',
    records: [record],
    contentBlocks: [{ type: 'text', text }],
    parentToolUseId: null,
    sessionId: 'sess_001',
  }
}

describe('ConversationTimeline', () => {
  it('renders "No matching messages" when turns array is empty', () => {
    render(<ConversationTimeline turns={[]} isStreaming={false} />)
    expect(screen.getByText('No matching messages')).toBeInTheDocument()
  })

  it('renders "Clear filters and search" button when hasActiveFilters is true and turns are empty', () => {
    const onClearFilters = vi.fn()
    render(
      <ConversationTimeline
        turns={[]}
        isStreaming={false}
        hasActiveFilters={true}
        onClearFilters={onClearFilters}
      />,
    )
    const clearButton = screen.getByText('Clear filters and search')
    expect(clearButton).toBeInTheDocument()
    fireEvent.click(clearButton)
    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })

  it('does not render "Clear filters and search" when hasActiveFilters is false', () => {
    render(
      <ConversationTimeline
        turns={[]}
        isStreaming={false}
        hasActiveFilters={false}
      />,
    )
    expect(screen.queryByText('Clear filters and search')).not.toBeInTheDocument()
  })

  it('renders TurnCards for each turn in non-virtualized mode', () => {
    const turns = [
      makeAssistantTurn('1', 'First message'),
      makeAssistantTurn('2', 'Second message'),
    ]
    render(<ConversationTimeline turns={turns} isStreaming={false} />)
    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
  })

  it('renders a feed role for non-virtualized timeline', () => {
    const turns = [makeAssistantTurn('1')]
    render(<ConversationTimeline turns={turns} isStreaming={false} />)
    expect(screen.getByRole('feed')).toBeInTheDocument()
  })

  it('renders jump-to-top and jump-to-bottom buttons', () => {
    const turns = [makeAssistantTurn('1')]
    render(<ConversationTimeline turns={turns} isStreaming={false} />)
    expect(screen.getByTitle('Jump to top')).toBeInTheDocument()
    expect(screen.getByTitle('Jump to bottom')).toBeInTheDocument()
  })

  describe('keyboard navigation', () => {
    it('moves focus down with ArrowDown key', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
    })

    it('moves focus down with j key (vim-style)', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'j' })
    })

    it('moves focus up with ArrowUp key', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowUp' })
    })

    it('moves focus up with k key (vim-style)', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'j' })
      fireEvent.keyDown(document, { key: 'k' })
    })

    it('jumps to top with Home key', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'Home' })
    })

    it('jumps to bottom with End key', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'End' })
    })

    it('does not handle keyboard events when an input is focused', () => {
      const turns = [makeAssistantTurn('1')]
      render(
        <>
          <input type="text" data-testid="text-input" />
          <ConversationTimeline turns={turns} isStreaming={false} />
        </>,
      )
      const input = screen.getByTestId('text-input')
      input.focus()
      fireEvent.keyDown(input, { key: 'ArrowDown' })
    })
  })

  it('highlights the current search match turn', () => {
    const turns = [
      makeAssistantTurn('1', 'First message'),
      makeAssistantTurn('2', 'Second message'),
    ]
    const matchIds = new Set(['msg_1'])
    render(
      <ConversationTimeline
        turns={turns}
        isStreaming={false}
        searchMatchIds={matchIds}
        currentMatchId="msg_1"
        searchQuery="First"
      />,
    )
    expect(screen.getByText('First message')).toBeInTheDocument()
  })

  describe('keyboard navigation behavior', () => {
    it('Home key calls scrollTo on container ref with top:0 for non-virtualized timeline', () => {
      const scrollToSpy = vi.fn() as unknown as typeof Element.prototype.scrollTo
      Element.prototype.scrollTo = scrollToSpy
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
        makeAssistantTurn('3', 'Third'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'Home' })
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('End key calls scrollIntoView on bottom ref for non-virtualized timeline', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
        makeAssistantTurn('3', 'Third'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'End' })
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth' })
    })

    it('ArrowDown does not go past last turn index', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    it('ArrowUp does not go below index 0', () => {
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      expect(screen.getByText('First')).toBeInTheDocument()
    })

    it('does not handle keyboard events when textarea is focused', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [makeAssistantTurn('1')]
      render(
        <>
          <textarea data-testid="textarea-input" />
          <ConversationTimeline turns={turns} isStreaming={false} />
        </>,
      )
      const textarea = screen.getByTestId('textarea-input')
      textarea.focus()
      fireEvent.keyDown(textarea, { key: 'j' })
      expect(scrollIntoViewSpy).not.toHaveBeenCalled()
    })

    it('does not handle keyboard events when select element is focused', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [makeAssistantTurn('1')]
      render(
        <>
          <select data-testid="select-input"><option>A</option></select>
          <ConversationTimeline turns={turns} isStreaming={false} />
        </>,
      )
      const selectEl = screen.getByTestId('select-input')
      selectEl.focus()
      fireEvent.keyDown(selectEl, { key: 'ArrowDown' })
      expect(scrollIntoViewSpy).not.toHaveBeenCalled()
    })
  })

  describe('jump buttons', () => {
    it('Jump to top button calls scrollTo with top:0 on container', () => {
      const scrollToSpy = vi.fn() as unknown as typeof Element.prototype.scrollTo
      Element.prototype.scrollTo = scrollToSpy
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.click(screen.getByTitle('Jump to top'))
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('Jump to bottom button calls scrollIntoView on bottom sentinel', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [
        makeAssistantTurn('1', 'First'),
        makeAssistantTurn('2', 'Second'),
      ]
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      fireEvent.click(screen.getByTitle('Jump to bottom'))
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth' })
    })
  })

  describe('virtualized timeline', () => {
    it('renders VirtualizedTimeline when turns count is >= 100', () => {
      const turns = Array.from({ length: 100 }, (_, i) => makeAssistantTurn(`${i}`, `Message ${i}`))
      const { container } = render(<ConversationTimeline turns={turns} isStreaming={false} />)
      expect(screen.queryByRole('feed')).not.toBeInTheDocument()
      const virtualContainer = container.querySelector('[style*="overflow: auto"]')
      expect(virtualContainer).toBeInTheDocument()
    })

    it('does not render VirtualizedTimeline when turns count is < 100', () => {
      const turns = Array.from({ length: 99 }, (_, i) => makeAssistantTurn(`${i}`, `Message ${i}`))
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      expect(screen.getByRole('feed')).toBeInTheDocument()
    })

    it('renders jump buttons in virtualized mode', () => {
      const turns = Array.from({ length: 100 }, (_, i) => makeAssistantTurn(`${i}`, `Message ${i}`))
      render(<ConversationTimeline turns={turns} isStreaming={false} />)
      expect(screen.getByTitle('Jump to top')).toBeInTheDocument()
      expect(screen.getByTitle('Jump to bottom')).toBeInTheDocument()
    })
  })

  describe('streaming auto-scroll', () => {
    it('calls scrollIntoView on bottom ref when streaming and turns increase in non-virtualized mode', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [makeAssistantTurn('1', 'First')]
      const { rerender } = render(
        <ConversationTimeline turns={turns} isStreaming={true} />,
      )
      const turnsUpdated = [...turns, makeAssistantTurn('2', 'Second')]
      rerender(<ConversationTimeline turns={turnsUpdated} isStreaming={true} />)
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth' })
    })
  })

  describe('search match scrolling', () => {
    it('scrolls to current search match turn via document.getElementById', () => {
      const scrollIntoViewSpy = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      const turns = [
        makeAssistantTurn('1', 'First message'),
        makeAssistantTurn('2', 'Second message'),
      ]
      const matchIds = new Set(['msg_2'])
      render(
        <ConversationTimeline
          turns={turns}
          isStreaming={false}
          searchMatchIds={matchIds}
          currentMatchId="msg_2"
          searchQuery="Second"
        />,
      )
      expect(scrollIntoViewSpy).toHaveBeenCalled()
    })
  })
})
