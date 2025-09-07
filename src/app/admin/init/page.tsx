"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InitializeLeaguePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [leagueData, setLeagueData] = useState<any>(null);

  const initializeLeague = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('Initializing league...');

    try {
      const response = await fetch('/api/init-league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('League initialized successfully!');
        setLeagueData(data.data);
        
        // Redirect to homepage after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to initialize league');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
      console.error('Init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLeagueStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/init-league');
      const data = await response.json();
      
      if (data.initialized) {
        setMessage('League is already initialized!');
        setLeagueData(data.league);
        setStatus('success');
      } else {
        setMessage('League is not initialized. Click "Initialize League" to set it up.');
        setStatus('idle');
      }
    } catch (error) {
      setMessage('Failed to check league status');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-6">
            🏈 League Initialization
          </h1>

          <div className="space-y-6">
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Astral Field Championship League
              </h2>
              
              <div className="text-gray-300 space-y-2">
                <p>• 10 Players in Single League</p>
                <p>• PPR Scoring System</p>
                <p>• 14 Regular Season Weeks</p>
                <p>• 6 Teams Make Playoffs</p>
                <p>• $100 FAAB Waiver Budget</p>
                <p>• 16 Player Rosters</p>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                League Members & Teams:
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-300">1. Nicholas D'Amato - The Commanders</div>
                <div className="text-gray-300">2. Brittany Bergum - Purple Reign</div>
                <div className="text-gray-300">3. Cason Minor - Minor Threat</div>
                <div className="text-gray-300">4. David Jarvey - Jarvey's Giants</div>
                <div className="text-gray-300">5. Demo User 1 - Dynasty Builders</div>
                <div className="text-gray-300">6. Demo User 2 - Trophy Hunters</div>
                <div className="text-gray-300">7. Demo User 3 - Rocket Squad</div>
                <div className="text-gray-300">8. Demo User 4 - Fire Starters</div>
                <div className="text-gray-300">9. Demo User 5 - Diamond Dogs</div>
                <div className="text-gray-300">10. Admin User - Crown Royale (Commissioner)</div>
              </div>
            </div>

            {/* Status Messages */}
            {message && (
              <div className={`rounded-lg p-4 ${
                status === 'success' ? 'bg-green-600/20 text-green-400' :
                status === 'error' ? 'bg-red-600/20 text-red-400' :
                'bg-blue-600/20 text-blue-400'
              }`}>
                {message}
              </div>
            )}

            {/* League Data Display */}
            {leagueData && (
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  League Details:
                </h3>
                <div className="text-gray-300 space-y-1 text-sm">
                  <p>League ID: {leagueData.leagueId}</p>
                  <p>League Name: {leagueData.leagueName}</p>
                  <p>Season: {leagueData.season}</p>
                  <p>Total Teams: {leagueData.totalTeams}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={initializeLeague}
                disabled={isLoading || status === 'success'}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isLoading || status === 'success'
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoading ? 'Initializing...' : 'Initialize League'}
              </button>

              <button
                onClick={checkLeagueStatus}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isLoading
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Check Status
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Note:</strong> This will create the database tables and initialize all 10 players in a single league. 
            Run this only once to set up the league structure.
          </p>
        </div>
      </div>
    </div>
  );
}