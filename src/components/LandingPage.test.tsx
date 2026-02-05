import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LandingPage } from './LandingPage.tsx'
import type { RecentSession } from '@/model/types.ts'

vi.mock('@/components/DarkModeToggle.tsx', () => ({
  DarkModeToggle: () => <button data-testid="dark-mode-toggle">Toggle</button>,
}))

function makeSession(overrides: Partial<RecentSession> = {}): RecentSession {
  return {
    fileName: 'conversation.jsonl',
    fileSize: 2048,
    loadedAt: '2025-06-15T10:30:00.000Z',
    sessionId: 'sess_001',
    recordCount: 42,
    ...overrides,
  }
}

function makeProps(overrides: Partial<Parameters<typeof LandingPage>[0]> = {}) {
  return {
    recentSessions: [] as RecentSession[],
    onFileLoaded: vi.fn(),
    onClearHistory: vi.fn(),
    ...overrides,
  }
}

describe('LandingPage', () => {
  it('renders the application title', () => {
    render(<LandingPage {...makeProps()} />)
    expect(screen.getByText('Claude Code Conversation Visualizer')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<LandingPage {...makeProps()} />)
    expect(screen.getByText('Load a Claude Code JSONL output file to visualize the conversation')).toBeInTheDocument()
  })

  it('renders the dark mode toggle', () => {
    render(<LandingPage {...makeProps()} />)
    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument()
  })

  describe('file drop zone', () => {
    it('renders the drop zone with instructions', () => {
      render(<LandingPage {...makeProps()} />)
      expect(screen.getByText('Drop a .jsonl file here or click to browse')).toBeInTheDocument()
    })

    it('renders a hidden file input accepting .jsonl files', () => {
      render(<LandingPage {...makeProps()} />)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.accept).toBe('.jsonl')
      expect(input.className).toContain('hidden')
    })

    it('highlights drop zone when dragging over', () => {
      render(<LandingPage {...makeProps()} />)
      const dropZone = screen.getByText('Drop a .jsonl file here or click to browse').closest('div[class*="border-2"]')!
      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
      expect(dropZone.className).toContain('border-blue-500')
    })

    it('removes drag highlight when drag leaves', () => {
      render(<LandingPage {...makeProps()} />)
      const dropZone = screen.getByText('Drop a .jsonl file here or click to browse').closest('div[class*="border-2"]')!
      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
      fireEvent.dragLeave(dropZone)
      expect(dropZone.className).not.toContain('border-blue-500')
    })
  })

  describe('paste button', () => {
    it('renders "Paste JSONL" button', () => {
      render(<LandingPage {...makeProps()} />)
      expect(screen.getByText('Paste JSONL')).toBeInTheDocument()
    })

    it('opens paste modal when clicked', () => {
      render(<LandingPage {...makeProps()} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      expect(screen.getByText('Paste JSONL Content')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Paste JSONL content here...')).toBeInTheDocument()
    })

    it('renders Cancel and Load buttons in the paste modal', () => {
      render(<LandingPage {...makeProps()} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Load')).toBeInTheDocument()
    })

    it('disables Load button when paste content is empty', () => {
      render(<LandingPage {...makeProps()} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      expect(screen.getByText('Load')).toBeDisabled()
    })

    it('enables Load button when paste content is provided', () => {
      render(<LandingPage {...makeProps()} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: '{"type":"assistant"}' },
      })
      expect(screen.getByText('Load')).not.toBeDisabled()
    })

    it('calls onFileLoaded with pasted content when Load is clicked', () => {
      const onFileLoaded = vi.fn()
      render(<LandingPage {...makeProps({ onFileLoaded })} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: '{"type":"assistant"}' },
      })
      fireEvent.click(screen.getByText('Load'))
      expect(onFileLoaded).toHaveBeenCalledWith(
        '{"type":"assistant"}',
        'pasted-content.jsonl',
        expect.any(Number),
      )
    })

    it('closes the modal after loading pasted content', () => {
      render(<LandingPage {...makeProps()} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.change(screen.getByPlaceholderText('Paste JSONL content here...'), {
        target: { value: 'test' },
      })
      fireEvent.click(screen.getByText('Load'))
      expect(screen.queryByText('Paste JSONL Content')).not.toBeInTheDocument()
    })

    it('closes the modal when Cancel is clicked', () => {
      render(<LandingPage {...makeProps()} />)
      fireEvent.click(screen.getByText('Paste JSONL'))
      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByText('Paste JSONL Content')).not.toBeInTheDocument()
    })
  })

  describe('recent sessions', () => {
    it('does not render recent sessions section when list is empty', () => {
      render(<LandingPage {...makeProps()} />)
      expect(screen.queryByText('Recent Sessions')).not.toBeInTheDocument()
    })

    it('renders recent sessions list when sessions exist', () => {
      const sessions = [makeSession()]
      render(<LandingPage {...makeProps({ recentSessions: sessions })} />)
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument()
      expect(screen.getByText('conversation.jsonl')).toBeInTheDocument()
      expect(screen.getByText('42 records')).toBeInTheDocument()
    })

    it('renders reminder text about re-loading files', () => {
      const sessions = [makeSession()]
      render(<LandingPage {...makeProps({ recentSessions: sessions })} />)
      expect(screen.getByText('Re-load the file to view again')).toBeInTheDocument()
    })

    it('renders "Clear history" button and calls onClearHistory when clicked', () => {
      const onClearHistory = vi.fn()
      const sessions = [makeSession()]
      render(<LandingPage {...makeProps({ recentSessions: sessions, onClearHistory })} />)
      fireEvent.click(screen.getByText('Clear history'))
      expect(onClearHistory).toHaveBeenCalledTimes(1)
    })

    it('renders multiple sessions', () => {
      const sessions = [
        makeSession({ sessionId: 'sess_A', fileName: 'first.jsonl' }),
        makeSession({ sessionId: 'sess_B', fileName: 'second.jsonl' }),
      ]
      render(<LandingPage {...makeProps({ recentSessions: sessions })} />)
      expect(screen.getByText('first.jsonl')).toBeInTheDocument()
      expect(screen.getByText('second.jsonl')).toBeInTheDocument()
    })

    it('formats file sizes correctly (bytes, KB, MB)', () => {
      const sessions = [
        makeSession({ sessionId: 'sess_small', fileName: 'small.jsonl', fileSize: 512 }),
        makeSession({ sessionId: 'sess_medium', fileName: 'medium.jsonl', fileSize: 2048 }),
        makeSession({ sessionId: 'sess_large', fileName: 'large.jsonl', fileSize: 1500000 }),
      ]
      render(<LandingPage {...makeProps({ recentSessions: sessions })} />)
      expect(screen.getByText(/512 B/)).toBeInTheDocument()
      expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument()
      expect(screen.getByText(/1\.4 MB/)).toBeInTheDocument()
    })
  })
})
