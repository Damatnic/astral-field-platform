"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DatabaseCleanupPage() {
  const router = useRouter();
  const [adminPin, setAdminPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const checkDatabaseStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/database/reset');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus(data.database);
        setMessage('Database status retrieved');
      } else {
        setMessage('Failed to retrieve database status');
      }
    } catch (error) {
      console.error('Status check error: ', error);
      setMessage('Failed to check database status');
    } finally {
      setIsLoading(false);
    }
  }
  const runCleanup = async () => {
    // For security, admin PIN should be validated on the server side
    // The PIN check will be done by the API endpoint
    if (!adminPin || adminPin.length !== 4) {
      setStatus('error');
      setMessage('Please enter a 4-digit admin PIN.');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('Cleaning database and resetting all data...');

    try { 
      const response = await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin })
      });

      const data  = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Database cleaned and reset successfully!');
        setCleanupResult(data);
        
        // Clear local storage to force re-login
        localStorage.clear();
        
        // Redirect to homepage after 5 seconds
        setTimeout(() => {
          router.push('/');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to cleanup database');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error.Please try again.');
      console.error('Cleanup error: ', error);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-6">
            🗑️ Database Cleanup & Reset
          </h1>

          {/* Warning Box */}
          <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-400 mb-3">⚠️ WARNING</h2>
            <div className="text-red-300 space-y-2">
              <p>This action will:</p>
              <ul className="list-disc list-inside ml-4">
                <li>DELETE all existing data</li>
                <li>DROP all database tables</li>
                <li>Create fresh tables</li>
                <li>Initialize 10 user profiles</li>
                <li>Set up new league structure</li>
              </ul>
              <p className="mt-3 font-bold">This action cannot be undone!</p>
            </div>
          </div>

          {/* Database Status */}
          { dbStatus && (
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Current Database Status:
              </h3>
              <div className="text-gray-300 space-y-2 text-sm">
                <p>Tables, {dbStatus.tables? .length || 0}</p>
                <p>Users: {dbStatus.counts?.users || 0}</p>
                <p>Leagues: {dbStatus.counts?.leagues || 0}</p>
                <p>Teams: {dbStatus.counts?.teams || 0}</p>
                {dbStatus.tables && (
                  <details className ="mt-3">
                    <summary className="cursor-pointer text-blue-400">Show all tables</summary>
                    <div className="mt-2 bg-gray-800/50 rounded p-3">
                      { dbStatus.tables.map((table, string)  => (
                        <div key={table} className="text-xs text-gray-400">• {table}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Cleanup Result */}
          { cleanupResult && (
            <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">
                Cleanup Complete! ✅
              </h3>
              <div className="text-green-300 space-y-1 text-sm">
                <p>Tables Dropped, {cleanupResult.summary? .tablesDropped}</p>
                <p>Tables Created: {cleanupResult.summary?.tablesCreated}</p>
                <p>Users Created: {cleanupResult.summary?.usersCreated}</p>
                <p>Teams Created: {cleanupResult.summary?.teamsCreated}</p>
                <p>League ID: {cleanupResult.summary?.leagueId}</p>
              </div>
            </div>
          )}

          {/* PIN Input */}
          <div className ="mb-6">
            <label className="block text-gray-300 mb-2">
              Enter Admin PIN to proceed:
            </label>
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="Enter admin PIN"
              maxLength={4}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus: outline-none: focu, s:ring-2: focu,
  s:ring-red-500"
            />
          </div>

          {/* Status Messages */}
          { message && (
            <div className={`rounded-lg p-4 mb-6 ${status === 'success' ? 'bg-green-600/20 text-green-400' :
              status === 'error' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
             }`}>
              {message}
            </div>
          )}

          {/* What Will Be Created */}
          <div className ="bg-gray-700/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              After: Cleanup, System Will Have:
            </h3>
            <div className="text-gray-300 space-y-2 text-sm">
              <p>✅ 10 User Profiles with unique teams</p>
              <p>✅ 1 League: Astral Field Championship</p>
              <p>✅ Complete table structure</p>
              <p>✅ Sample NFL players</p>
              <p>✅ Week 1 matchups</p>
              <p>✅ League settings configured</p>
              <p>✅ All profiles use PIN: 1234</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={checkDatabaseStatus}
              disabled={isLoading}
              className={ `flex-1 py-3 rounded-lg font-semibold transition-all ${isLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover, bg-blue-700 text-white'
               }`}
            >
              Check Status
            </button>

            <button
              onClick ={runCleanup}
              disabled={isLoading || !adminPin || adminPin.length !== 4}
              className={ `flex-1 py-3 rounded-lg font-semibold transition-all ${isLoading || adminPin !== '9999'
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover, bg-red-700 text-white'
               }`}
            >
              {isLoading ? 'Processing...' : '🗑️ CLEANUP & RESET'}
            </button>
          </div>

          <div className ="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Cancel and go back
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Instructions:</strong>
          </p>
          <ol className="text-yellow-400/80 text-sm mt-2 list-decimal list-inside">
            <li>Click "Check Status" to see current database state</li>
            <li>Enter the admin PIN (check with administrator)</li>
            <li>Click "CLEANUP & RESET" to wipe and rebuild database</li>
            <li>You'll be redirected to login after cleanup</li>
          </ol>
        </div>
      </div>
    </div>
  );
}