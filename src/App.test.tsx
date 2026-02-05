import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App.tsx'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('@/components/CodeBlock.tsx', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}))

vi.mock('@/components/DarkModeToggle.tsx', () => ({
  DarkModeToggle: () => <button data-testid="dark-mode-toggle">Toggle</button>,
}))

beforeEach(() => {
  localStorage.clear()
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
})

function makeAssistantLine(id: string, text = 'Hello') {
  return JSON.stringify({
    type: 'assistant',
    uuid: `uuid_${id}`,
    session_id: 'sess_001',
    parent_tool_use_id: null,
    message: {
      model: 'claude-sonnet-4-20250514',
      id: `msg_${id}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text }],
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
  })
}

function makeUserLine(id: string, toolUseId: string, content = 'result text') {
  return JSON.stringify({
    type: 'user',
    uuid: `uuid_user_${id}`,
    session_id: 'sess_001',
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUseId, content }],
    },
    tool_use_result: { type: 'text' },
  })
}

function makeJsonl(...lines: string[]) {
  return lines.join('\n')
}

describe('App', () => {
  describe('landing page', () => {
    it('renders the landing page when no session is loaded', () => {
      render(<App />)
      expect(screen.getByText('Claude Code Conversation Visualizer')).toBeInTheDocument()
    })

    it('renders the file drop zone', () => {
      render(<App />)
      expect(screen.getByText('Drop a .jsonl file here or click to browse')).toBeInTheDocument()
    })

    it('renders the paste JSONL button', () => {
      render(<App />)
      expect(screen.getByText('Paste JSONL')).toBeInTheDocument()
    })

    it('renders the dark mode toggle on landing page', () => {
      render(<App />)
      expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument()
    })
  })

  describe('loading a file via paste', () => {
    it('transitions from landing page to active session after pasting valid JSONL', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const textarea = screen.getByPlaceholderText('Paste JSONL content here...')
      const jsonl = makeJsonl(makeAssistantLine('1', 'Hello from Claude'))
      fireEvent.change(textarea, { target: { value: jsonl } })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('pasted-content.jsonl')).toBeInTheDocument()
      })

      expect(screen.queryByText('Claude Code Conversation Visualizer')).not.toBeInTheDocument()
    })

    it('shows the record count in the session header', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1'), makeAssistantLine('2'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('2 records')).toBeInTheDocument()
      })
    })

    it('renders conversation turns in the timeline after loading', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1', 'First turn content'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('First turn content')).toBeInTheDocument()
      })
    })

    it('shows token summary panel after loading', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText(/Input/)).toBeInTheDocument()
        expect(screen.getByText(/Output/)).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('disables Load button when paste content is only whitespace', () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: '   ' },
      })

      expect(screen.getByText('Load')).toBeDisabled()
    })

    it('shows "Invalid format" for non-JSONL content', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: 'this is not json at all' },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('Invalid format')).toBeInTheDocument()
      })
    })

    it('handles partial valid data with skipped lines indicator', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(
        makeAssistantLine('1', 'Valid line'),
        'not valid json',
        'also not valid',
      )
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('Valid line')).toBeInTheDocument()
        expect(screen.getByText('2 skipped')).toBeInTheDocument()
      })
    })
  })

  describe('session management', () => {
    it('returns to landing page when "Load new file" is clicked', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('pasted-content.jsonl')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Load new file'))

      expect(screen.getByText('Claude Code Conversation Visualizer')).toBeInTheDocument()
      expect(screen.queryByText('Load new file')).not.toBeInTheDocument()
    })

    it('saves session to recent sessions after successful load', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('pasted-content.jsonl')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Load new file'))

      await waitFor(() => {
        expect(screen.getByText('Recent Sessions')).toBeInTheDocument()
        expect(screen.getByText('pasted-content.jsonl')).toBeInTheDocument()
      })
    })

    it('shows "Clear history" button and clears when clicked', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('pasted-content.jsonl')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Load new file'))

      await waitFor(() => {
        expect(screen.getByText('Recent Sessions')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Clear history'))
      expect(screen.queryByText('Recent Sessions')).not.toBeInTheDocument()
    })
  })

  describe('search', () => {
    it('renders the search bar when a session is active', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(
        makeAssistantLine('1', 'Hello world'),
        makeAssistantLine('2', 'Goodbye world'),
      )
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search messages... (/ or Ctrl+F)')).toBeInTheDocument()
      })
    })
  })

  describe('filters', () => {
    it('renders the filter bar when a session is active', async () => {
      render(<App />)

      fireEvent.click(screen.getByText('Paste JSONL'))
      const jsonl = makeJsonl(makeAssistantLine('1'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText(/Filters/)).toBeInTheDocument()
      })
    })
  })

  describe('multiple turns with tool use', () => {
    it('renders assistant turn followed by user tool result turn', async () => {
      const assistantWithTool = JSON.stringify({
        type: 'assistant',
        uuid: 'uuid_a1',
        session_id: 'sess_001',
        parent_tool_use_id: null,
        message: {
          model: 'claude-sonnet-4-20250514',
          id: 'msg_a1',
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me read that file.' },
            { type: 'tool_use', id: 'tu_1', name: 'Read', input: { file_path: '/tmp/test.txt' } },
          ],
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            service_tier: 'standard',
          },
          context_management: null,
        },
      })
      const userResult = makeUserLine('u1', 'tu_1', 'file contents here')
      const jsonl = makeJsonl(assistantWithTool, userResult)

      render(<App />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: jsonl },
      })
      fireEvent.click(screen.getByText('Load'))

      await waitFor(() => {
        expect(screen.getByText('Let me read that file.')).toBeInTheDocument()
      })
      expect(screen.getByText('2 records')).toBeInTheDocument()
    })
  })
})
