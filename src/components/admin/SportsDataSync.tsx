'use client'

import { useState } from 'react'

interface SyncStatus {
  isLoading: boolean
  message: string
  success?: number
  failed?: number
  error?: string
}

export default function SportsDataSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    message: ''
  })
  
  const [selectedTeam, setSelectedTeam] = useState('')
  const [apiStatus, setApiStatus] = useState<any>(null)

  const nflTeams = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 
    'LAS', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 
    'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
  ]

  const handleSync = async (action: string, team?: string) => {
    setSyncStatus({ isLoading: true, message: 'Starting sync...' })
    
    try {
      const payload: any = { action }
      if (team) payload.team = team

      const response = await fetch('/api/sync-sportsdata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer astral2025'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed')
      }

      setSyncStatus({
        isLoading: false,
        message: result.message || 'Sync completed successfully',
        success: result.success,
        failed: result.failed
      })
    } catch (error: any) {
      setSyncStatus({
        isLoading: false,
        message: 'Sync failed',
        error: error.message
      })
    }
  }

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/sync-sportsdata')
      const result = await response.json()
      setApiStatus(result)
    } catch (error) {
      console.error('Failed to check API status:', error)
    }
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">SportsData.io Integration</h2>
      
      {/* API Status Check */}
      <div className="mb-6">
        <button
          onClick={checkApiStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Check API Status
        </button>
        
        {apiStatus && (
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-green-400 font-semibold">{apiStatus.status}</p>
            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="text-gray-400">Season:</span>{' '}
                <span className="text-white">{apiStatus.currentSeason}</span>
              </div>
              <div>
                <span className="text-gray-400">Week:</span>{' '}
                <span className="text-white">{apiStatus.currentWeek}</span>
              </div>
              <div>
                <span className="text-gray-400">Games Active:</span>{' '}
                <span className={apiStatus.gamesInProgress ? 'text-green-400' : 'text-red-400'}>
                  {apiStatus.gamesInProgress ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sync All Players */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Sync All NFL Players</h3>
        <p className="text-gray-400 text-sm mb-4">
          This will sync all available NFL players from SportsData.io to your database.
          This may take several minutes.
        </p>
        <button
          onClick={() => handleSync('sync-all-players')}
          disabled={syncStatus.isLoading}
          className={`px-6 py-3 rounded font-semibold ${
            syncStatus.isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {syncStatus.isLoading ? 'Syncing...' : 'Sync All Players'}
        </button>
      </div>

      {/* Sync Team Players */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Sync Team Players</h3>
        <p className="text-gray-400 text-sm mb-4">
          Sync players from a specific NFL team.
        </p>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
            >
              <option value="">Select a team...</option>
              {nflTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleSync('sync-team-players', selectedTeam)}
            disabled={syncStatus.isLoading || !selectedTeam}
            className={`px-6 py-3 rounded font-semibold ${
              syncStatus.isLoading || !selectedTeam
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncStatus.isLoading ? 'Syncing...' : 'Sync Team'}
          </button>
        </div>
      </div>

      {/* Status Display */}
      {syncStatus.message && (
        <div className={`p-4 rounded mb-4 ${
          syncStatus.error 
            ? 'bg-red-900/20 border border-red-500 text-red-400'
            : syncStatus.success !== undefined
            ? 'bg-green-900/20 border border-green-500 text-green-400'
            : 'bg-blue-900/20 border border-blue-500 text-blue-400'
        }`}>
          <div className="font-semibold">{syncStatus.message}</div>
          {syncStatus.success !== undefined && (
            <div className="text-sm mt-2">
              ✅ Success: {syncStatus.success} players | ❌ Failed: {syncStatus.failed} players
            </div>
          )}
          {syncStatus.error && (
            <div className="text-sm mt-2">Error: {syncStatus.error}</div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {syncStatus.isLoading && (
        <div className="flex items-center gap-3 text-blue-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          <span>Processing... This may take a while for large syncs.</span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500 rounded">
        <h4 className="text-yellow-400 font-semibold mb-2">Usage Instructions:</h4>
        <ul className="text-yellow-200 text-sm space-y-1">
          <li>• Use "Sync All Players" for initial setup or full refresh</li>
          <li>• Use "Sync Team Players" for targeted updates</li>
          <li>• Run sync operations during off-peak hours for best performance</li>
          <li>• Check API status to see current NFL season/week information</li>
        </ul>
      </div>
    </div>
  )
}