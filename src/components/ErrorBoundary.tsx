import { Component, type ReactNode, type ErrorInfo } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg m-4">
          <h2 className="text-sm font-medium text-red-700 dark:text-red-300">
            Something went wrong
          </h2>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
