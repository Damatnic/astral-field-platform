'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error
    resetError: () => void
    retry?: () => void
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  isolate?: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId?: NodeJS.Timeout

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          retry={() => {
            this.resetError()
            // Force a re-render by updating state
            this.forceUpdate()
          }}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  resetError: () => void
  retry?: () => void
}

function DefaultErrorFallback({ error, resetError, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <div className="text-red-800">
        <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
        <p className="text-sm text-red-600 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="space-x-2">
          <button
            onClick={retry || resetError}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                View Error Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {error?.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

// Optimistic UI specific error fallback
export function OptimisticUIErrorFallback({ error, resetError, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="text-yellow-800">
        <h4 className="font-medium mb-2">Action Failed</h4>
        <p className="text-sm text-yellow-600 mb-3">
          {error?.message || 'The optimistic update failed and has been reverted'}
        </p>
        <div className="space-x-2">
          <button
            onClick={retry || resetError}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
          >
            Retry Action
          </button>
          <button
            onClick={resetError}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for programmatic error boundary usage
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    setError(errorObj)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError,
    hasError: !!error
  }
}

export default ErrorBoundary