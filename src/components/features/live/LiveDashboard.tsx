'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play,
  Pause,
  Clock,
  TrendingUp,
  Trophy,
  Zap,
  Target,
  Users,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Shield,
  Flame
} from 'lucide-react'
import { useLiveStore } from '@/stores/liveStore'
import { useLeagueStore } from '@/stores/leagueStore'
import { useAuthStore } from '@/stores/authStore'
import socketService from '@/services/websocket/socketService'
import type { LiveScoreUpdate } from '@/services/websocket/socketService'

interface LiveDashboardProps {
  leagueId: string
  week?: number
}

interface PlayerScore {
  playerId: string
  playerName: string
  position: string
  team: string
  currentScore: number
  projectedScore: number
  status: 'active' | 'inactive' | 'final'
  gameTime?: string
  lastUpdate?: string
  trend?: 'up' | 'down' | 'same'
}

interface TeamScore {
  teamId: string
  teamName: string
  ownerName: string
  totalScore: number
  projectedScore: number
  playersActive: number
  playersInactive: number
  playersComplete: number
  rank: number
  previousRank?: number
  scoreChange?: number
  topPerformer?: PlayerScore
  isWinning?: boolean
}

interface GameInfo {
  gameId: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  quarter: string
  timeRemaining: string
  status: 'scheduled' | 'active' | 'final'
  hasPlayersInvolved: boolean
}

export default function LiveDashboard({ leagueId, week = 1 }: LiveDashboardProps) {
  const { user } = useAuthStore()
  const { teams } = useLeagueStore()
  const { 
    isConnected,
    connectionStatus,
    connect,
    disconnect
  } = useLiveStore()
  
  // Enhanced state for real-time features
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [liveScores, setLiveScores] = useState<TeamScore[]>([])
  const [recentUpdates, setRecentUpdates] = useState<LiveScoreUpdate[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [viewMode, setViewMode] = useState<'leaderboard' | 'matchups' | 'my-team'>('leaderboard')
  const [isLiveActive, setIsLiveActive] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [games, setGames] = useState<GameInfo[]>([])
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null)

  const userTeam = teams.find(team => team.user_id === user?.id)

  // Initialize WebSocket connection
  useEffect(() => {
    if (leagueId && user?.id) {
      socketService.connect(user.id).then(() => {
        socketService.subscribeToLeague(leagueId)
        socketService.subscribeToLiveScoring()
        socketService.subscribeToBreakingNews()
      }).catch(console.error)

      return () => {
        socketService.disconnect()
      }
    }
  }, [leagueId, user?.id])

  // Handle real-time score updates
  useEffect(() => {
    const handleScoreUpdate = (event: any) => {
      const update = event.data as LiveScoreUpdate
      
      setRecentUpdates(prev => [update, ...prev.slice(0, 19)])
      setLastUpdateTime(new Date())
      
      // Play notification sound for big plays
      if (soundEnabled && update.stats.points > 5) {
        playNotificationSound('touchdown')
      }
      
      updateTeamScores(update)
    }

    const handleBreakingNews = (event: any) => {
      if (notificationsEnabled) {
        showNotification(event.data.title, event.data.content)
      }
    }

    socketService.on('player_scores', handleScoreUpdate)
    socketService.on('breaking_news', handleBreakingNews)
    
    return () => {
      socketService.off('player_scores', handleScoreUpdate)
      socketService.off('breaking_news', handleBreakingNews)
    }
  }, [soundEnabled, notificationsEnabled])

  // Update team scores based on player updates
  const updateTeamScores = useCallback((update: LiveScoreUpdate) => {
    // This would typically update the team scores based on the player update
    // For now, we'll simulate it
    console.log('Score update received:', update)
  }, [])

  // Play notification sound
  const playNotificationSound = (type: 'score-update' | 'touchdown' | 'game-end') => {
    if (!soundEnabled) return
    
    try {
      const audio = new Audio()
      const frequencies = {
        'score-update': 440,
        'touchdown': 660,
        'game-end': 880
      }
      
      // Use Web Audio API for simple beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequencies[type]
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  // Show browser notification
  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [notificationsEnabled])

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh && isLiveActive) {
      interval = setInterval(() => {
        // Refresh scores
        setLastUpdateTime(new Date())
      }, 30000) // Every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, isLiveActive])

  const handleToggleLive = () => {
    setIsLiveActive(!isLiveActive)
    if (!isLiveActive) {
      // Start live scoring
      connect()
    } else {
      // Stop live scoring
      disconnect()
    }
  }

  const handleRefresh = () => {
    setLastUpdateTime(new Date())
    // Trigger manual refresh of scores
  }

  const getScoreColor = (points: number) => {
    if (points >= 150) return 'text-green-400'
    if (points >= 120) return 'text-blue-400'
    if (points >= 100) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const getConnectionIcon = () => {
    if (connectionStatus === 'connecting') return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
    if (isConnected) return <Wifi className="h-4 w-4 text-green-500" />
    return <WifiOff className="h-4 w-4 text-red-500" />
  }

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }

  // Mock data for demonstration
  const mockTeamScores: TeamScore[] = [
    {
      teamId: '1',
      teamName: 'The Gridiron Gladiators',
      ownerName: 'Nicholas D\'Amato',
      totalScore: 125.5,
      projectedScore: 145.2,
      playersActive: 5,
      playersInactive: 4,
      playersComplete: 6,
      rank: 1,
      previousRank: 2,
      scoreChange: 12.5,
      isWinning: true
    },
    {
      teamId: '2',
      teamName: 'Touchdown Titans',
      ownerName: 'Kaity L',
      totalScore: 118.3,
      projectedScore: 138.7,
      playersActive: 6,
      playersInactive: 3,
      playersComplete: 6,
      rank: 2,
      previousRank: 1,
      scoreChange: -2.1,
      isWinning: false
    },
    {
      teamId: '3',
      teamName: 'Fantasy Phenoms',
      ownerName: 'Mike J',
      totalScore: 112.7,
      projectedScore: 132.4,
      playersActive: 4,
      playersInactive: 5,
      playersComplete: 6,
      rank: 3,
      previousRank: 3,
      scoreChange: 8.3,
      isWinning: true
    }
  ]

  const mockGames: GameInfo[] = [
    {
      gameId: '1',
      homeTeam: 'BUF',
      awayTeam: 'MIA',
      homeScore: 21,
      awayScore: 17,
      quarter: 'Q3',
      timeRemaining: '8:45',
      status: 'active',
      hasPlayersInvolved: true
    },
    {
      gameId: '2',
      homeTeam: 'DAL',
      awayTeam: 'PHI',
      homeScore: 14,
      awayScore: 14,
      quarter: 'Q2',
      timeRemaining: '2:15',
      status: 'active',
      hasPlayersInvolved: true
    }
  ]

  const displayScores = liveScores.length > 0 ? liveScores : mockTeamScores
  const displayGames = games.length > 0 ? games : mockGames

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Controls */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-yellow-500 mr-2" />
                <h1 className="text-2xl font-bold text-white">Live Scoring</h1>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                {getConnectionIcon()}
                <span className="text-gray-400 capitalize">{connectionStatus || 'disconnected'}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Updated {formatTimeAgo(lastUpdateTime)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Selector */}
              <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
                {(['leaderboard', 'matchups', 'my-team'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'text-green-400 bg-green-900/30' : 'text-gray-400 bg-gray-700'
                }`}
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  notificationsEnabled ? 'text-blue-400 bg-blue-900/30' : 'text-gray-400 bg-gray-700'
                }`}
                title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                <Bell className="h-4 w-4" />
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Refresh scores"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                onClick={handleToggleLive}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  isLiveActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLiveActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Live
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Live
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!isLiveActive ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900/30 rounded-full mb-6">
              <Zap className="h-10 w-10 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Live Scoring Inactive</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Start live scoring to track real-time player performance, game updates, and league activity. 
              Get instant notifications for touchdowns, big plays, and score changes.
            </p>
            <button
              onClick={handleToggleLive}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center mx-auto text-lg font-medium"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Live Scoring
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* View: Leaderboard */}
              {viewMode === 'leaderboard' && (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-white flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                        Live Leaderboard
                      </h2>
                      <span className="text-sm text-gray-400">Week {week}</span>
                    </div>

                    <div className="space-y-3">
                      {displayScores.map((team, index) => (
                        <motion.div
                          key={team.teamId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`bg-gray-800 rounded-lg border p-4 transition-all ${
                            team.teamId === userTeam?.id
                              ? 'border-blue-500 bg-blue-900/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Rank Badge */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                index === 1 ? 'bg-gray-300 text-gray-900' :
                                index === 2 ? 'bg-amber-600 text-amber-900' :
                                'bg-gray-700 text-white'
                              }`}>
                                {team.rank}
                                {team.previousRank && team.previousRank !== team.rank && (
                                  <span className="absolute -right-2 -top-2">
                                    {team.previousRank > team.rank ? (
                                      <ArrowUp className="h-3 w-3 text-green-400" />
                                    ) : (
                                      <ArrowDown className="h-3 w-3 text-red-400" />
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Team Info */}
                              <div>
                                <h3 className="font-medium text-white flex items-center">
                                  {team.teamName}
                                  {team.teamId === userTeam?.id && (
                                    <span className="ml-2 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                                      YOU
                                    </span>
                                  )}
                                  {team.isWinning && (
                                    <Flame className="h-4 w-4 ml-2 text-orange-500" />
                                  )}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {team.ownerName} • {team.playersActive} active • {team.playersComplete} done
                                </p>
                              </div>
                            </div>

                            {/* Scores */}
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getScoreColor(team.totalScore)}`}>
                                {team.totalScore.toFixed(1)}
                              </p>
                              <p className="text-sm text-gray-400">
                                Proj: {team.projectedScore.toFixed(1)}
                              </p>
                              {team.scoreChange !== undefined && team.scoreChange !== 0 && (
                                <p className={`text-xs ${team.scoreChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {team.scoreChange > 0 ? '+' : ''}{team.scoreChange.toFixed(1)}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* View: Matchups */}
              {viewMode === 'matchups' && (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-purple-500" />
                      Head-to-Head Matchups
                    </h2>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <p className="text-gray-400 text-center">Matchups view coming soon...</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* View: My Team */}
              {viewMode === 'my-team' && (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />
                      My Team Performance
                    </h2>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <p className="text-gray-400 text-center">My team detailed view coming soon...</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Recent Score Updates */}
              {recentUpdates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-500" />
                    Recent Updates
                  </h3>
                  <div className="space-y-2">
                    {recentUpdates.slice(0, 5).map((update, index) => (
                      <motion.div
                        key={`${update.playerId}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-800 rounded-lg border border-gray-700 p-3 text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            Player {update.playerId} • {update.stats.points.toFixed(1)} pts
                          </span>
                          <span className="text-xs text-gray-500">
                            {update.gameTime}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Games */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-red-500" />
                  Live Games
                </h3>
                <div className="space-y-3">
                  {displayGames.filter(g => g.status === 'active').map(game => (
                    <div key={game.gameId} className="border border-gray-600 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium text-sm">
                          {game.awayTeam} @ {game.homeTeam}
                        </span>
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded animate-pulse">
                          LIVE
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          {game.quarter} • {game.timeRemaining}
                        </span>
                        <span className="text-white font-bold">
                          {game.awayScore} - {game.homeScore}
                        </span>
                      </div>
                      {game.hasPlayersInvolved && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-blue-400">You have players in this game</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {displayGames.filter(g => g.status === 'active').length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No games currently live
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Highest Score</span>
                    <span className="text-white font-bold">{Math.max(...displayScores.map(s => s.totalScore)).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Average Score</span>
                    <span className="text-white font-bold">
                      {(displayScores.reduce((acc, s) => acc + s.totalScore, 0) / displayScores.length).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Games Active</span>
                    <span className="text-white font-bold">{displayGames.filter(g => g.status === 'active').length}</span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-400 text-sm">Auto-refresh</span>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-400 text-sm">Sound effects</span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-400 text-sm">Notifications</span>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}