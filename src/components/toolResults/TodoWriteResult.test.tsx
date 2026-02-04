import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TodoWriteResult } from './TodoWriteResult.tsx'
import type { ToolUseResultMeta, Todo } from '@/model/types.ts'

function makeMeta(oldTodos: Todo[], newTodos: Todo[]): ToolUseResultMeta {
  return {
    type: 'text',
    oldTodos,
    newTodos,
  }
}

describe('TodoWriteResult', () => {
  it('should show "No todo data available" when meta has no todos', () => {
    render(<TodoWriteResult meta={{ type: 'text', oldTodos: [], newTodos: [] }} />)
    expect(screen.getByText('No todo data available')).toBeInTheDocument()
  })

  it('should show "No todo data available" when meta is undefined', () => {
    render(<TodoWriteResult />)
    expect(screen.getByText('No todo data available')).toBeInTheDocument()
  })

  it('should display added todos with + icon when new todos are added', () => {
    const meta = makeMeta(
      [],
      [{ content: 'Write tests', status: 'pending' }],
    )

    render(<TodoWriteResult meta={meta} />)

    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('[pending]')).toBeInTheDocument()
  })

  it('should display removed todos with - icon when todos are deleted', () => {
    const meta = makeMeta(
      [{ content: 'Old task', status: 'completed' }],
      [],
    )

    render(<TodoWriteResult meta={meta} />)

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('Old task')).toBeInTheDocument()
  })

  it('should display status changes with ~ icon and show old status', () => {
    const meta = makeMeta(
      [{ content: 'Fix bug', status: 'pending' }],
      [{ content: 'Fix bug', status: 'completed' }],
    )

    render(<TodoWriteResult meta={meta} />)

    expect(screen.getByText('~')).toBeInTheDocument()
    expect(screen.getByText('[completed]')).toBeInTheDocument()
    expect(screen.getByText('(was: pending)')).toBeInTheDocument()
  })

  it('should display unchanged todos without change icons', () => {
    const meta = makeMeta(
      [{ content: 'Unchanged task', status: 'in_progress' }],
      [{ content: 'Unchanged task', status: 'in_progress' }],
    )

    render(<TodoWriteResult meta={meta} />)

    expect(screen.getByText('Unchanged task')).toBeInTheDocument()
    expect(screen.getByText('[in_progress]')).toBeInTheDocument()
    expect(screen.queryByText('+')).not.toBeInTheDocument()
    expect(screen.queryByText('-')).not.toBeInTheDocument()
    expect(screen.queryByText('~')).not.toBeInTheDocument()
  })

  it('should handle mixed changes: additions, removals, status changes, and unchanged', () => {
    const meta = makeMeta(
      [
        { content: 'Keep same', status: 'pending' },
        { content: 'Remove this', status: 'pending' },
        { content: 'Change status', status: 'pending' },
      ],
      [
        { content: 'Keep same', status: 'pending' },
        { content: 'Change status', status: 'completed' },
        { content: 'Brand new', status: 'pending' },
      ],
    )

    render(<TodoWriteResult meta={meta} />)

    expect(screen.getByText('Keep same')).toBeInTheDocument()
    expect(screen.getByText('Remove this')).toBeInTheDocument()
    expect(screen.getByText('Change status')).toBeInTheDocument()
    expect(screen.getByText('Brand new')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('~')).toBeInTheDocument()
    expect(screen.getByText('(was: pending)')).toBeInTheDocument()
  })
})
