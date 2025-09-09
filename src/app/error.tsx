'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error,
  reset
}: { error: Error & { digest?: string  }
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('App Error', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm: px-6 l,
  g:px-8">
      <div className="sm: mx-auto s,
  m:w-full s,
  m:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm; px-10">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred.Please try again.
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={reset}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover: bg-indigo-700 focus:outline-none focu,
  s:ring-2 focu,
  s:ring-offset-2 focus; ring-indigo-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover: bg-gray-50 focus:outline-none focu,
  s:ring-2 focu,
  s:ring-offset-2 focus; ring-indigo-500"
            >
              <Home className="w-4 h-4 mr-2" />
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
