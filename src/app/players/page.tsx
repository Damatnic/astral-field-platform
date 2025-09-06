'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import EnhancedPlayerSearch from '@/components/features/players/EnhancedPlayerSearch'
import { Users, Database, Zap } from 'lucide-react'

export default function PlayersPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                Player Database
              </h1>
              <p className="text-gray-400 mt-2">
                Browse and search through NFL players with real-time stats and projections
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-1 text-green-400" />
                  <span>Live Data</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-yellow-400" />
                  <span>Updated Weekly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-400">
          <button 
            onClick={() => router.push('/dashboard')}
            className="hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-white">Players</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Search Players</h2>
          <EnhancedPlayerSearch 
            onPlayerSelect={(player) => console.log('Selected player:', player)}
            showFilters={true}
            maxResults={100}
          />
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Popular Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">🔥 Hot Pickups</div>
              <div className="text-sm opacity-90">Players gaining popularity</div>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">💎 Breakout Candidates</div>
              <div className="text-sm opacity-90">Potential sleepers</div>
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-lg font-semibold">📊 Top Performers</div>
              <div className="text-sm opacity-90">Highest projected points</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}