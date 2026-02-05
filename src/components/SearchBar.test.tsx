import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchBar } from './SearchBar.tsx'

function makeProps(overrides: Partial<Parameters<typeof SearchBar>[0]> = {}) {
  return {
    query: '',
    onQueryChange: vi.fn(),
    matchCount: 0,
    currentMatchIndex: 0,
    onNextMatch: vi.fn(),
    onPrevMatch: vi.fn(),
    onClear: vi.fn(),
    isActive: false,
    ...overrides,
  }
}

describe('SearchBar', () => {
  it('renders a search input with placeholder', () => {
    render(<SearchBar {...makeProps()} />)
    expect(screen.getByPlaceholderText('Search messages... (/ or Ctrl+F)')).toBeInTheDocument()
  })

  it('renders with the current query value', () => {
    render(<SearchBar {...makeProps({ query: 'hello' })} />)
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
  })

  it('calls onQueryChange when user types in the input', () => {
    const onQueryChange = vi.fn()
    render(<SearchBar {...makeProps({ onQueryChange })} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } })
    expect(onQueryChange).toHaveBeenCalledWith('test')
  })

  describe('keyboard shortcuts', () => {
    it('focuses the input when "/" is pressed', () => {
      render(<SearchBar {...makeProps()} />)
      const input = screen.getByRole('searchbox')
      expect(document.activeElement).not.toBe(input)
      fireEvent.keyDown(document, { key: '/' })
      expect(document.activeElement).toBe(input)
    })

    it('focuses the input when Ctrl+F is pressed', () => {
      render(<SearchBar {...makeProps()} />)
      const input = screen.getByRole('searchbox')
      fireEvent.keyDown(document, { key: 'f', ctrlKey: true })
      expect(document.activeElement).toBe(input)
    })

    it('clears search and blurs input when Escape is pressed while active', () => {
      const onClear = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onClear })} />)
      const input = screen.getByRole('searchbox')
      input.focus()
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClear).toHaveBeenCalled()
    })

    it('does not call onClear on Escape when search is not active', () => {
      const onClear = vi.fn()
      render(<SearchBar {...makeProps({ onClear })} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClear).not.toHaveBeenCalled()
    })

    it('calls onNextMatch when Enter is pressed in the input', () => {
      const onNextMatch = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onNextMatch })} />)
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      expect(onNextMatch).toHaveBeenCalled()
    })

    it('calls onPrevMatch when Shift+Enter is pressed in the input', () => {
      const onPrevMatch = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onPrevMatch })} />)
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter', shiftKey: true })
      expect(onPrevMatch).toHaveBeenCalled()
    })

    it('calls onNextMatch when ArrowDown is pressed in the input', () => {
      const onNextMatch = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onNextMatch })} />)
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowDown' })
      expect(onNextMatch).toHaveBeenCalled()
    })

    it('calls onPrevMatch when ArrowUp is pressed in the input', () => {
      const onPrevMatch = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onPrevMatch })} />)
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowUp' })
      expect(onPrevMatch).toHaveBeenCalled()
    })
  })

  describe('match count display', () => {
    it('shows match count when search is active with matches', () => {
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', matchCount: 5, currentMatchIndex: 2 })} />)
      expect(screen.getByText('3 of 5 matches')).toBeInTheDocument()
    })

    it('shows "No matches" when search is active with zero matches', () => {
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', matchCount: 0 })} />)
      expect(screen.getByText('No matches')).toBeInTheDocument()
    })

    it('does not show match count when search is not active', () => {
      render(<SearchBar {...makeProps()} />)
      expect(screen.queryByText(/matches/)).not.toBeInTheDocument()
    })
  })

  describe('navigation buttons', () => {
    it('renders previous and next match buttons when active', () => {
      render(<SearchBar {...makeProps({ isActive: true, query: 'test' })} />)
      expect(screen.getByLabelText('Previous match')).toBeInTheDocument()
      expect(screen.getByLabelText('Next match')).toBeInTheDocument()
    })

    it('renders a clear button when active', () => {
      render(<SearchBar {...makeProps({ isActive: true, query: 'test' })} />)
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
    })

    it('does not render navigation buttons when not active', () => {
      render(<SearchBar {...makeProps()} />)
      expect(screen.queryByLabelText('Previous match')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Next match')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
    })

    it('calls onPrevMatch when previous button is clicked', () => {
      const onPrevMatch = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onPrevMatch })} />)
      fireEvent.click(screen.getByLabelText('Previous match'))
      expect(onPrevMatch).toHaveBeenCalled()
    })

    it('calls onNextMatch when next button is clicked', () => {
      const onNextMatch = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onNextMatch })} />)
      fireEvent.click(screen.getByLabelText('Next match'))
      expect(onNextMatch).toHaveBeenCalled()
    })

    it('calls onClear when clear button is clicked', () => {
      const onClear = vi.fn()
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', onClear })} />)
      fireEvent.click(screen.getByLabelText('Clear search'))
      expect(onClear).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has a search role on the container', () => {
      render(<SearchBar {...makeProps()} />)
      expect(screen.getByRole('search')).toBeInTheDocument()
    })

    it('has proper aria-label on the search input', () => {
      render(<SearchBar {...makeProps()} />)
      expect(screen.getByLabelText('Search conversation messages')).toBeInTheDocument()
    })

    it('sets aria-describedby to match count when active', () => {
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', matchCount: 3 })} />)
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('aria-describedby', 'search-match-count')
    })

    it('has aria-live polite on the match count for screen readers', () => {
      render(<SearchBar {...makeProps({ isActive: true, query: 'test', matchCount: 3 })} />)
      const matchCount = screen.getByText(/3 matches/)
      expect(matchCount).toHaveAttribute('aria-live', 'polite')
    })
  })
})
