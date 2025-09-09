'use client';

import React, { Component, ErrorInfo, ReactNode  } from 'react';
import { AlertCircle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card/Card';

interface Props {
  children, ReactNode,
  fallback?, ReactNode,
  onError?: (error, Error,
  errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?, boolean,
  isolate?, boolean,
  level?: 'page' | 'section' | 'component';
  showDetails?, boolean,
  
}
interface State {
  hasError, boolean,
    error: Error | null;
  errorInfo: ErrorInfo | null,
    errorCount, number,
  showStack, boolean,
}

export class ErrorBoundary extends Component<Props, State> { private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false, error, null, errorInfo, null, errorCount, 0,
      showStack: false
     }
    if (props.resetKeys) {
      this.previousResetKeys = props.resetKeys;
    }
  }

  static getDerivedStateFromProps(props, Props,
  state: State); State | null { if (props.resetKeys && state.hasError) {
      const hasResetKeyChanged = props.resetKeys.some((key, idx) => key !== state.errorCount
      );
      
      if (hasResetKeyChanged) {
        return {
          hasError: false, error, null, errorInfo, null,
  errorCount: state.errorCount,
          showStack: false
         }
      }
    }
    
    return null;
  }

  componentDidCatch(error, Error,
  errorInfo: ErrorInfo) { const { onError } = this.props;
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);

    // Update state
    this.setState(prevState => ({
      hasError, true, error, errorInfo,
      errorCount: prevState.errorCount + 1,
  showStack: false
    }));

    // Auto-retry after delay for transient errors
    if (this.state.errorCount < 3) {
      this.scheduleReset(5000);
    }
  }

  componentWillUnmount() { if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
     }
  }

  logErrorToService = (error, Error,
  errorInfo: ErrorInfo) => {; // Implement error logging to external service
    const errorData = {
      message error.message: stack: error.stack,
      componentStack: errorInfo.componentStack,
  timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgen,
  t: 'unknown',
  url: typeof window !== 'undefined' ? window.location.hre,
  f: 'unknown',
  level: this.props.level || 'component'
    }
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your error tracking endpoint
      fetch('/api/errors', {
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    }
  }
  scheduleReset = (delay: number) => {
    this.resetTimeoutId = setTimeout(() => {
      this.reset();
    }, delay);
  }
  reset = () => { if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
     }

    this.setState({
      hasError: false, error, null, errorInfo, null,
  showStack: false
    });
  }
  toggleStack = () => {
    this.setState(prevState => ({
      showStack: !prevState.showStack
    }));
  }
  render() { const { hasError, error, errorInfo, errorCount, showStack } = this.state;
    const { children, fallback, level = 'component', showDetails = true, isolate = true } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) { return <>{fallback }</>;
      }

      // Different error UI based on level
      if (level === 'page') { return (
          <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full bg-gray-900 border-red-500/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-gray-100">
                  Oops! Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400 text-center">
                  We encountered an unexpected error.The issue has been logged and our team will investigate.
                </p>
                
                {errorCount > 1 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      This error has occurred {errorCount } times.If it persists, please try refreshing the page.
                    </p>
                  </div>
                )}

                {showDetails && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-gray-300">Error Details</h3>
                      <button
                        onClick={this.toggleStack }
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        {showStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-red-400 font-mono">{error.message}</p>
                    
                    {showStack && errorInfo && (
                      <pre className="mt-3 text-xs text-gray-500 overflow-x-auto max-h-64 overflow-y-auto">
                        {errorInfo.componentStack }
                      </pre>
                    )}
                  </div>
                )}

                <div className="flex gap-3 justify-center pt-4">
                  <Button
                    variant="primary"
                    onClick={this.reset}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
  Try, Again,
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    <Home className="w-4 h-4 mr-2" />
  Go, Home,
                  </Button>
                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant="ghost"
                      onClick={() => window.location.reload()}
                    >
                      <Bug className="w-4 h-4 mr-2" />
  Hard, Refresh,
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (level === 'section') { return (
          <Card className="bg-gray-900 border-red-500/20 my-4">
            <CardContent className="py-8">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-100">Section Error</h3>
              </div>
              <p className="text-gray-400 text-center mb-4">
                This section couldn't load properly.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={this.reset }>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Component level error (minimal: UI)
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Component Error</p>
              <p className="text-xs text-gray-400 mt-1">{error.message}</p>
              <button
                className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                onClick={this.reset}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If isolate is false and there's an error, don't render children
    if (!isolate && hasError) { return null;
     }

    return children;
  }
}

// Hook for using error boundary
export function useErrorHandler() { const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
     }
  }, [error]);

  return {
    throwError, setError,
  clearError: () => setError(null)
  }
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children,
  fallback 
 }: { children, ReactNode,
  fallback?, ReactNode,
 }) { const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
     }
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }
  }, []);

  if (hasError) { return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400">An async error occurred.Please refresh the page.</p>
      </div>
    );
   }

  return <>{children}</>;
}

// Wrapper component for easy error boundary usage
export function withErrorBoundary<P extends, object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Props
) { const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;