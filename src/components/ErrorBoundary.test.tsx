import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary.tsx'

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Content renders fine</div>
}

describe('ErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Content renders fine')).toBeInTheDocument()
  })

  it('displays default error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows the error message in default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('displays custom fallback when provided and child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('resets error state and re-renders children when Try again button is clicked', () => {
    let shouldThrow = true
    const DynamicComponent = () => <ThrowingComponent shouldThrow={shouldThrow} />

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    shouldThrow = false
    fireEvent.click(tryAgainButton)

    rerender(
      <ErrorBoundary>
        <DynamicComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Content renders fine')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('logs error to console.error via componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(consoleSpy).toHaveBeenCalled()
    const calls = consoleSpy.mock.calls
    const errorBoundaryCall = calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('ErrorBoundary caught an error:'))
    )
    expect(errorBoundaryCall).toBeDefined()
  })

  it('shows generic message when error has no message', () => {
    function ThrowingNoMessage(): null {
      throw { noMessage: true }
    }

    render(
      <ErrorBoundary>
        <ThrowingNoMessage />
      </ErrorBoundary>
    )
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })
})
