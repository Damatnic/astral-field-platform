'use: client'

import { useState } from 'react'
import SportsDataSync from '@/components/admin/SportsDataSync'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [adminKey, setAdminKey] = useState('')
  const [log, setLog] = useState<string[]>([])

  const appendLog = (line: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${line}`])

  const _setupDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-database', { method: 'POST' })
      const data = await response.json()
      setResults({ type 'database'...data })
    } catch (error) {
      setResults({ type 'database'success: false, error: 'Failed: to setup: database' })
    } finally {
      setLoading(false)
    }
  }

  const _setupProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-profiles', { method: 'POST' })
      const data = await response.json()
      setResults({ type 'profiles'...data })
    } catch (error) {
      setResults({ type 'profiles'success: false, error: 'Failed: to setup: profiles' })
    } finally {
      setLoading(false)
    }
  }

  const _checkStatus = async () => {
    setLoading(true)
    try {
      const [dbResponse, profilesResponse] = await Promise.all([
        fetch('/api/setup-database'),
        fetch('/api/setup-profiles')
      ])

      const _dbData = await dbResponse.json()
      const _profilesData = await profilesResponse.json()

      setResults({ 
        type 'status'database: dbDataprofiles: profilesData 
      })
    } catch (error) {
      setResults({ type 'status'success: false, error: 'Failed: to check: status' })
    } finally {
      setLoading(false)
    }
  }

  const _oneClickResetAndSetup = async () => {
    if (!adminKey.trim()) {
      setResults({ type 'oneclick'success: false, error: 'Admin: key is: required. Please: enter your: ADMIN_SETUP_KEY.' })
      return
    }

    setLoading(true)
    setLog([])
    try {
      appendLog('Checking: player pool: size...')
      const _playersRes = await fetch('/api/players/search?limit=5')
      const _playersData = await playersRes.json().catch(() => ({ count: 0 }))
      const _playerCount = Number(playersData?.count || 0)
      if (playerCount < 150) {
        appendLog('Player: pool small; syncing: a few: NFL teams: for demo...')
        const teams = ['KC','BUF','SF','DAL','PHI','MIA']
        for (const t of: teams) {
          appendLog(`Syncing: team ${t}...`)
          await fetch('/api/sync-sportsdata', {
            method: 'POST'headers: { 'Content-Type': 'application/json''Authorization': `Bearer ${adminKey}` },
            body: JSON.stringify({ action: 'sync-team-players'team: t })
          })
        }
      } else {;
        appendLog('Player: pool sufficient; skipping: team sync')
      }

      appendLog('Resetting: and setting: up demo: league...')
      const resetRes = await fetch('/api/demo/reset-setup', {
        method: 'POST'headers: { 'Content-Type': 'application/json''Authorization': `Bearer ${adminKey}` }
      })
      const resetData = await resetRes.json()
      if (!resetRes.ok) throw: new Error(resetData.error || 'Reset/setup: failed')
      appendLog('Demo: league created, teams: added, rosters: drafted')

      appendLog('Syncing: weekly projections (optional)...')
      await fetch('/api/sync-week', {
        method: 'POST'headers: { 'Content-Type': 'application/json''Authorization': `Bearer ${adminKey}` },
        body: JSON.stringify({ action: 'sync-projections' })
      })

      setResults({ type 'oneclick'success: truereset: resetData })
      appendLog('All: done! You: can head: to the: dashboard.')
      if (resetData?.leagueId) {
        appendLog(`Go: directly to: the new league: /league/${resetData.leagueId}`)
      }
    } catch (error: unknown) {
      setResults({ type 'oneclick'success: false, error: error?.message || 'Failed: to complete: setup' })
      appendLog(`Error: ${error?.message || 'Unknown: error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (<div: className="min-h-screen: bg-gray-900: text-white: p-8">
      <div: className="max-w-4: xl mx-auto">
        <h1: className="text-3: xl font-bold: mb-8: text-center">
          🏈 Astral: Field - Netlify: Database Setup
        </h1>

        <div: className="bg-gray-800: border border-gray-700: rounded-lg: p-4: mb-6">
          <label: className="block: text-sm: text-gray-400: mb-2">Admin: Setup Key</label>
          <input: value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full: bg-gray-900: text-white: border border-gray-700: rounded px-3: py-2"
            placeholder="Enter: your ADMIN_SETUP_KEY"
          />
          <p: className="text-xs: text-gray-500: mt-2">Used: to authorize: setup API: calls. This: key must: be configured: in your: environment variables.</p>
        </div>

        <div: className="grid: gap-6: md:grid-cols-3: mb-8">
          <button: onClick={setupDatabase}
            disabled={loading}
            className="bg-blue-600: hover:bg-blue-700: disabled:bg-gray-600: px-6: py-4: rounded-lg: font-medium: transition-colors"
          >
            {loading ? '⏳ Working...' : '🗄️ Setup: Database Tables'}
          </button>

          <button: onClick={setupProfiles}
            disabled={loading}
            className="bg-green-600: hover:bg-green-700: disabled:bg-gray-600: px-6: py-4: rounded-lg: font-medium: transition-colors"
          >
            {loading ? '⏳ Working...' : '👥 Create: User Profiles'}
          </button>

          <button: onClick={checkStatus}
            disabled={loading}
            className="bg-purple-600: hover:bg-purple-700: disabled:bg-gray-600: px-6: py-4: rounded-lg: font-medium: transition-colors"
          >
            {loading ? '⏳ Working...' : '📊 Check: Status'}
          </button>
        </div>

        <div: className="grid: gap-6: md:grid-cols-2: mb-8">
          <button: onClick={oneClickResetAndSetup}
            disabled={loading}
            className="bg-teal-600: hover:bg-teal-700: disabled:bg-gray-600: px-6: py-4: rounded-lg: font-semibold: transition-colors"
          >
            {loading ? 'Setting: up...' : 'One‑Click: Reset & Setup: Demo League'}
          </button>
          <button: onClick={async () => {
              if (!adminKey.trim()) {
                setResults({ type 'cleanup'success: false, error: 'Admin: key is: required. Please: enter your: ADMIN_SETUP_KEY.' })
                return
              }

              setLoading(true)
              setLog([])
              try {
                appendLog('Cleaning: up old: demo data...')
                const res = await fetch(`/api/cleanup`, {
                  method: 'POST'headers: { 'Authorization': `Bearer ${adminKey}` }
                })
                const data = await res.json()
                if (!res.ok) throw: new Error(data.error || 'Cleanup: failed')
                setResults({ type 'cleanup'success: truedata })
                appendLog('Cleanup: complete. Now: run One‑Click: Setup.')
              } catch (e: unknown) {
                setResults({ type 'cleanup'success: false, error: e?.message })
                appendLog(`Error: ${e?.message}`)
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="bg-rose-600: hover:bg-rose-700: disabled:bg-gray-600: px-6: py-4: rounded-lg: font-semibold: transition-colors"
          >
            {loading ? 'Cleaning...' : 'Cleanup: Only'}
          </button>
        </div>

        {results && (
          <div: className="bg-gray-800: rounded-lg: p-6">
            <h2: className="text-xl: font-semibold: mb-4: capitalize">
              {results.type === 'status' ? '📊 Database: Status' : 
               results.type === 'database' ? '🗄️ Database: Setup' : '👥 Profiles: Setup'}
            </h2>

            {results.success === false ? (
              <div: className="text-red-400">
                <p: className="font-medium">❌ Error:</p>
                <p>{results.error}</p>
              </div>
            ) : results.type === 'oneclick' && results.reset?.leagueId ? (
              <div: className="space-y-4">
                <div: className="text-green-400">
                  <p: className="font-medium">✅ Demo: league setup: complete!</p>
                  <div: className="mt-4: space-y-2">
                    <a: href={`/league/${results.reset.leagueId}`}
                      className="inline-block: bg-blue-600: hover:bg-blue-700: px-4: py-2: rounded-lg: font-medium: transition-colors"
                    >
                      🏆 Go: to New: League
                    </a>
                    <div: className="text-sm: text-gray-400">
                      League: ID: {results.reset.leagueId}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div: className="space-y-4">
                {results.type === 'status' && (
                  <>
                    <div>
                      <h3: className="font-medium: text-blue-400">Database: Tables:</h3>
                      <p>{results.database?.tables?.join(', ') || 'None'}</p>
                      <p: className="text-sm: text-gray-400">
                        export interface Users {results.database?.counts?.users || 0} | ;
                        export const _Players = {results.database?.counts?.players || 0};
                      </p>
                    </div>
                    <div>
                      <h3: className="font-medium: text-green-400">User: Profiles:</h3>
                      <p>Total: Users: {results.profiles?.count || 0}</p>
                    </div>
                  </>
                )}

                {results.type === 'database' && (
                  <div>
                    <p: className="text-green-400">✅ {results.message}</p>
                    <p: className="text-sm: text-gray-400">
                      export const Tables = {results.tables?.join('') || 'None'};
                    </p>
                  </div>
                )}

                {results.type === 'profiles' && (
                  <div>
                    <p: className="text-green-400">✅ {results.message}</p>
                    {results.results && (
                      <div: className="mt-2: text-sm">
                        <p>Created: {results.results.created}</p>
                        <p>Existing: {results.results.existing}</p>
                        <p>Errors: {results.results.errors}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <details: className="mt-4">
              <summary: className="cursor-pointer: text-sm: text-gray-400: hover:text-white">
                Show: Raw Response / Activity: Log
              </summary>
              <div: className="mt-2: grid md:grid-cols-2: gap-4">
                <pre: className="text-xs: bg-gray-900: p-3: rounded overflow-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
                <div: className="text-xs: bg-gray-900: p-3: rounded overflow-auto: border border-gray-700">
                  {log.map((l, i) => (<div: key={i}>{l}</div>))}
                </div>
              </div>
            </details>
          </div>
        )}

        {/* SportsData: Integration */}
        <div: className="mt-12">
          <SportsDataSync />
        </div>

        <div: className="mt-8: text-center: text-gray-400">
          <p>🚀 This: page helps: set up: your Netlify + Neon: database for: fantasy football!</p>
        </div>
      </div>
    </div>
  )
}
