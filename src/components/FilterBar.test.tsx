import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FilterBar } from './FilterBar.tsx'
import type { FilterState } from '@/hooks/useFilters.ts'

function makeProps(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  return {
    filters: {
      role: 'all' as const,
      toolNames: new Set<string>(),
      status: 'all' as const,
      model: '',
    },
    availableToolNames: [],
    availableModels: [],
    onSetRole: vi.fn(),
    onToggleToolName: vi.fn(),
    onSetStatus: vi.fn(),
    onSetModel: vi.fn(),
    onClearFilters: vi.fn(),
    isActive: false,
    totalTurns: 10,
    filteredTurns: 10,
    ...overrides,
  }
}

describe('FilterBar', () => {
  describe('collapse/expand behavior', () => {
    it('renders collapsed by default with Filters button', () => {
      render(<FilterBar {...makeProps()} />)
      expect(screen.getByText(/Filters/)).toBeInTheDocument()
      expect(screen.queryByText('Role')).not.toBeInTheDocument()
    })

    it('expands filter panel when Filters button is clicked', () => {
      render(<FilterBar {...makeProps()} />)
      const button = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(button)
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('collapses filter panel when Filters button is clicked again', () => {
      render(<FilterBar {...makeProps()} />)
      const button = screen.getByRole('button', { name: /Filters/ })
      fireEvent.click(button)
      expect(screen.getByText('Role')).toBeInTheDocument()
      fireEvent.click(button)
      expect(screen.queryByText('Role')).not.toBeInTheDocument()
    })
  })

  describe('active filter indicators', () => {
    it('shows "Showing N of M turns" when filters are active', () => {
      render(<FilterBar {...makeProps({ isActive: true, filteredTurns: 5, totalTurns: 10 })} />)
      expect(screen.getByText('Showing 5 of 10 turns')).toBeInTheDocument()
    })

    it('shows "Clear filters" button when filters are active', () => {
      render(<FilterBar {...makeProps({ isActive: true })} />)
      expect(screen.getByText('Clear filters')).toBeInTheDocument()
    })

    it('calls onClearFilters when Clear filters button is clicked', () => {
      const onClearFilters = vi.fn()
      render(<FilterBar {...makeProps({ isActive: true, onClearFilters })} />)
      fireEvent.click(screen.getByText('Clear filters'))
      expect(onClearFilters).toHaveBeenCalled()
    })

    it('does not show count or clear button when filters are inactive', () => {
      render(<FilterBar {...makeProps({ isActive: false })} />)
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
    })
  })

  describe('role filter', () => {
    it('renders role filter buttons (All, Assistant, User) when expanded', () => {
      render(<FilterBar {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const roleRadiogroup = screen.getByRole('radiogroup', { name: 'Filter by role' })
      const buttons = roleRadiogroup.querySelectorAll('button')
      expect(buttons).toHaveLength(3)
      expect(buttons[0]).toHaveTextContent('All')
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
      expect(buttons[1]).toHaveTextContent('Assistant')
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
      expect(buttons[2]).toHaveTextContent('User')
      expect(buttons[2]).toHaveAttribute('aria-pressed', 'false')
    })

    it('marks the active role button as aria-pressed=true', () => {
      const filters: FilterState = {
        role: 'assistant',
        toolNames: new Set(),
        status: 'all',
        model: '',
      }
      render(<FilterBar {...makeProps({ filters })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const roleRadiogroup = screen.getByRole('radiogroup', { name: 'Filter by role' })
      const buttons = roleRadiogroup.querySelectorAll('button')
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
      expect(buttons[2]).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onSetRole when a role button is clicked', () => {
      const onSetRole = vi.fn()
      render(<FilterBar {...makeProps({ onSetRole })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Assistant' }))
      expect(onSetRole).toHaveBeenCalledWith('assistant')
    })
  })

  describe('status filter', () => {
    it('renders status filter buttons (All, Errors, Sub-agent, Text) when expanded', () => {
      render(<FilterBar {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const statusRadiogroup = screen.getByRole('radiogroup', { name: 'Filter by status' })
      const buttons = statusRadiogroup.querySelectorAll('button')
      expect(buttons).toHaveLength(4)
      expect(buttons[0]).toHaveTextContent('All')
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
      expect(buttons[1]).toHaveTextContent('Errors')
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
      expect(buttons[2]).toHaveTextContent('Sub-agent')
      expect(buttons[2]).toHaveAttribute('aria-pressed', 'false')
      expect(buttons[3]).toHaveTextContent('Text')
      expect(buttons[3]).toHaveAttribute('aria-pressed', 'false')
    })

    it('marks the active status button as aria-pressed=true', () => {
      const filters: FilterState = {
        role: 'all',
        toolNames: new Set(),
        status: 'errors',
        model: '',
      }
      render(<FilterBar {...makeProps({ filters })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const statusButtons = screen.getAllByRole('button', { pressed: true })
      const errorsButton = statusButtons.find(btn => btn.textContent === 'Errors')
      expect(errorsButton).toBeInTheDocument()
    })

    it('calls onSetStatus when a status button is clicked', () => {
      const onSetStatus = vi.fn()
      render(<FilterBar {...makeProps({ onSetStatus })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Errors' }))
      expect(onSetStatus).toHaveBeenCalledWith('errors')
    })
  })

  describe('tool name filter', () => {
    it('renders tool name buttons from availableToolNames when expanded', () => {
      const availableToolNames = ['Read', 'Write', 'Bash']
      render(<FilterBar {...makeProps({ availableToolNames })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      expect(screen.getByRole('button', { name: 'Read' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Write' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bash' })).toBeInTheDocument()
    })

    it('marks selected tool names as aria-pressed=true', () => {
      const availableToolNames = ['Read', 'Write', 'Bash']
      const filters: FilterState = {
        role: 'all',
        toolNames: new Set(['Read', 'Bash']),
        status: 'all',
        model: '',
      }
      render(<FilterBar {...makeProps({ availableToolNames, filters })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      expect(screen.getByRole('button', { name: 'Read', pressed: true })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Write', pressed: false })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bash', pressed: true })).toBeInTheDocument()
    })

    it('calls onToggleToolName when a tool button is clicked', () => {
      const onToggleToolName = vi.fn()
      const availableToolNames = ['Read', 'Write']
      render(<FilterBar {...makeProps({ availableToolNames, onToggleToolName })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Read' }))
      expect(onToggleToolName).toHaveBeenCalledWith('Read')
    })

    it('does not render tools fieldset when availableToolNames is empty', () => {
      render(<FilterBar {...makeProps({ availableToolNames: [] })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      expect(screen.queryByText('Tools')).not.toBeInTheDocument()
    })
  })

  describe('model filter', () => {
    it('renders model dropdown when availableModels has more than one model', () => {
      const availableModels = ['claude-3-opus', 'claude-3-sonnet']
      render(<FilterBar {...makeProps({ availableModels })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      expect(screen.getByLabelText('Filter by model')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'All models' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'claude-3-opus' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'claude-3-sonnet' })).toBeInTheDocument()
    })

    it('does not render model dropdown when availableModels has one or zero models', () => {
      render(<FilterBar {...makeProps({ availableModels: ['claude-3-opus'] })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      expect(screen.queryByLabelText('Filter by model')).not.toBeInTheDocument()
    })

    it('does not render model dropdown when availableModels is empty', () => {
      render(<FilterBar {...makeProps({ availableModels: [] })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      expect(screen.queryByLabelText('Filter by model')).not.toBeInTheDocument()
    })

    it('calls onSetModel when model dropdown value changes', () => {
      const onSetModel = vi.fn()
      const availableModels = ['claude-3-opus', 'claude-3-sonnet']
      render(<FilterBar {...makeProps({ availableModels, onSetModel })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const select = screen.getByLabelText('Filter by model')
      fireEvent.change(select, { target: { value: 'claude-3-opus' } })
      expect(onSetModel).toHaveBeenCalledWith('claude-3-opus')
    })

    it('sets the selected model value in the dropdown', () => {
      const availableModels = ['claude-3-opus', 'claude-3-sonnet']
      const filters: FilterState = {
        role: 'all',
        toolNames: new Set(),
        status: 'all',
        model: 'claude-3-opus',
      }
      render(<FilterBar {...makeProps({ availableModels, filters })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const select = screen.getByLabelText('Filter by model') as HTMLSelectElement
      expect(select.value).toBe('claude-3-opus')
    })
  })

  describe('accessibility', () => {
    it('filter panel has correct aria attributes (id, role, aria-label)', () => {
      render(<FilterBar {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const panel = screen.getByRole('group', { name: 'Conversation filters' })
      expect(panel).toHaveAttribute('id', 'filter-panel')
      expect(panel).toHaveAttribute('aria-label', 'Conversation filters')
    })

    it('expand button has correct aria-expanded attribute', () => {
      render(<FilterBar {...makeProps()} />)
      const button = screen.getByRole('button', { name: /Filters/ })
      expect(button).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('expand button has aria-controls pointing to filter-panel', () => {
      render(<FilterBar {...makeProps()} />)
      const button = screen.getByRole('button', { name: /Filters/ })
      expect(button).toHaveAttribute('aria-controls', 'filter-panel')
    })

    it('clear filters button has aria-label', () => {
      render(<FilterBar {...makeProps({ isActive: true })} />)
      const button = screen.getByLabelText('Clear all filters')
      expect(button).toBeInTheDocument()
    })

    it('turn count has aria-live=polite for screen reader announcements', () => {
      render(<FilterBar {...makeProps({ isActive: true, filteredTurns: 5, totalTurns: 10 })} />)
      const count = screen.getByText('Showing 5 of 10 turns')
      expect(count).toHaveAttribute('aria-live', 'polite')
    })

    it('role filter has radiogroup role with aria-label', () => {
      render(<FilterBar {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const radiogroup = screen.getByRole('radiogroup', { name: 'Filter by role' })
      expect(radiogroup).toBeInTheDocument()
    })

    it('status filter has radiogroup role with aria-label', () => {
      render(<FilterBar {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const radiogroup = screen.getByRole('radiogroup', { name: 'Filter by status' })
      expect(radiogroup).toBeInTheDocument()
    })

    it('tool filter has group role with aria-label', () => {
      render(<FilterBar {...makeProps({ availableToolNames: ['Read', 'Write'] })} />)
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
      const group = screen.getByRole('group', { name: 'Filter by tool name' })
      expect(group).toBeInTheDocument()
    })
  })
})
