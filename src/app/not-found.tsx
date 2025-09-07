import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <div className="space-y-3">
          <Link href="/" className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Go Home
          </Link>
          <Link href="/dashboard" className="block px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-900 rounded-lg transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

