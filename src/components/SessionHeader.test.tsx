import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SessionHeader } from '@/components/SessionHeader.tsx'
import type { SessionMeta, AppStatus } from '@/hooks/useAppState.ts'

vi.mock('@/components/DarkModeToggle.tsx', () => ({
  DarkModeToggle: () => <div data-testid="dark-mode-toggle" />,
}))

function makeSessionMeta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    fileName: 'conversation.jsonl',
    fileSize: 1024,
    sessionId: 'session-1',
    loadedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('SessionHeader', () => {
  it('displays file name in header', () => {
    const meta = makeSessionMeta({ fileName: 'test-file.jsonl' })
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('test-file.jsonl')
  })

  it('displays record count', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={42}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByText(/42 records/)).toBeInTheDocument()
  })

  it('shows loading indicator when status is loading', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="loading"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('does not show loading indicator when status is active', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.queryByText('...')).not.toBeInTheDocument()
  })

  it('shows skipped lines count when skippedLines is greater than zero', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={5}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByText('5 skipped')).toBeInTheDocument()
  })

  it('does not show skipped lines indicator when skippedLines is zero', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.queryByText(/skipped/)).not.toBeInTheDocument()
  })

  it('shows Stop button when status is loading', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="loading"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('calls onStop when Stop button is clicked', () => {
    const meta = makeSessionMeta()
    const onStop = vi.fn()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="loading"
        onStop={onStop}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('shows Resume button when status is paused', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="paused"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
  })

  it('calls onResume when Resume button is clicked', () => {
    const meta = makeSessionMeta()
    const onResume = vi.fn()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="paused"
        onStop={vi.fn()}
        onResume={onResume}
        onReset={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(onResume).toHaveBeenCalledOnce()
  })

  it('does not show Stop or Resume buttons when status is active', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resume' })).not.toBeInTheDocument()
  })

  it('always shows Load new file button', () => {
    const meta = makeSessionMeta()
    const statuses: AppStatus[] = ['empty', 'loading', 'paused', 'active']

    statuses.forEach((status) => {
      const { unmount } = render(
        <SessionHeader
          meta={meta}
          recordCount={10}
          skippedLines={0}
          status={status}
          onStop={vi.fn()}
          onResume={vi.fn()}
          onReset={vi.fn()}
        />
      )
      expect(screen.getByRole('button', { name: 'Load new file' })).toBeInTheDocument()
      unmount()
    })
  })

  it('calls onReset when Load new file button is clicked', () => {
    const meta = makeSessionMeta()
    const onReset = vi.fn()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={onReset}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Load new file' }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('renders DarkModeToggle component', () => {
    const meta = makeSessionMeta()
    render(
      <SessionHeader
        meta={meta}
        recordCount={10}
        skippedLines={0}
        status="active"
        onStop={vi.fn()}
        onResume={vi.fn()}
        onReset={vi.fn()}
      />
    )
    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument()
  })
})
