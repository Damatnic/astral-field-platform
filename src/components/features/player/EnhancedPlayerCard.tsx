'use client'

import React, { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  AlertTriangle,
  Heart,
  Activity,
  Target,
  Calendar,
  BarChart3,
  Info,
  Shield,
  Sword,
  Clock,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button/Button'
import { Progress } from '@/components/ui/progress'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row'] & {
  projections?: any
  stats?: any
  news?: any
  weatherForecast?: any
  matchupAnalysis?: any
  restOfSeasonOutlook?: any
  trends?: any
}

interface EnhancedPlayerCardProps {
  player: Player
  leagueId?: string
  showDetailedView?: boolean
  onPlayerSelect?: (player: Player) => void
  onAddToWatchlist?: (playerId: string) => void
  onTradeTarget?: (playerId: string) => void
}

interface NewsItem {
  id: string
  title: string
  summary: string
  timestamp: string
  impact: 'positive' | 'negative' | 'neutral'
  source: string
}

interface WeatherCondition {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind'
  windSpeed: number
  precipitation: number
  impact: 'positive' | 'negative' | 'neutral'
}

interface MatchupAnalysis {
  difficulty: 'easy' | 'medium' | 'hard'
  rank: number
  pointsAllowed: number
  opponentTeam: string
  gameLocation: 'home' | 'away'
  primetime: boolean
}

interface RestOfSeasonOutlook {
  difficulty: number // 1-10 scale
  byeWeek: number
  playoffSchedule: 'easy' | 'medium' | 'hard'
  injuryRisk: 'low' | 'medium' | 'high'
  upcomingMatchups: string[]
}

const EnhancedPlayerCard = memo(function EnhancedPlayerCard({ 
  player, 
  leagueId, 
  showDetailedView = false,
  onPlayerSelect,
  onAddToWatchlist,
  onTradeTarget 
}: EnhancedPlayerCardProps) {
  const [expanded, setExpanded] = useState(showDetailedView)
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'news' | 'outlook'>('overview')

  // Mock data - in real implementation, this would come from APIs/database
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'Player expected to return from injury this week',
      summary: 'Coach confirms player is healthy and ready to play',
      timestamp: '2 hours ago',
      impact: 'positive',
      source: 'ESPN'
    },
    {
      id: '2',
      title: 'Increased target share expected',
      summary: 'With teammate injured, more opportunities available',
      timestamp: '1 day ago',
      impact: 'positive',
      source: 'NFL.com'
    }
  ]

  const mockWeather: WeatherCondition = {
    temperature: 72,
    condition: 'sunny',
    windSpeed: 8,
    precipitation: 0,
    impact: 'positive'
  }

  const mockMatchup: MatchupAnalysis = {
    difficulty: 'easy',
    rank: 28,
    pointsAllowed: 24.8,
    opponentTeam: 'BUF',
    gameLocation: 'home',
    primetime: false
  }

  const mockOutlook: RestOfSeasonOutlook = {
    difficulty: 6.5,
    byeWeek: player.bye_week || 7,
    playoffSchedule: 'medium',
    injuryRisk: 'low',
    upcomingMatchups: ['vs BUF', '@MIA', 'vs NYJ', '@NE']
  }

  const getInjuryStatusIcon = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'OUT': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'DOUBTFUL': return <AlertTriangle className="h-4 w-4 text-red-400" />
      case 'QUESTIONABLE': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'PROBABLE': return <Heart className="h-4 w-4 text-green-400" />
      default: return <Heart className="h-4 w-4 text-green-500" />
    }
  }

  const getInjuryStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'OUT': return 'text-red-400 bg-red-900/30'
      case 'DOUBTFUL': return 'text-red-300 bg-red-900/20'
      case 'QUESTIONABLE': return 'text-yellow-400 bg-yellow-900/30'
      case 'PROBABLE': return 'text-green-300 bg-green-900/20'
      default: return 'text-green-400 bg-green-900/30'
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-400" />
      case 'rain': return <CloudRain className="h-4 w-4 text-blue-500" />
      case 'snow': return <Snowflake className="h-4 w-4 text-blue-200" />
      case 'wind': return <Wind className="h-4 w-4 text-gray-300" />
      default: return <Sun className="h-4 w-4 text-yellow-500" />
    }
  }

  const getMatchupDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-900/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/30'
      case 'hard': return 'text-red-400 bg-red-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'text-purple-400 bg-purple-900/30'
      case 'RB': return 'text-green-400 bg-green-900/30'
      case 'WR': return 'text-blue-400 bg-blue-900/30'
      case 'TE': return 'text-yellow-400 bg-yellow-900/30'
      case 'K': return 'text-orange-400 bg-orange-900/30'
      case 'DST': return 'text-red-400 bg-red-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  const formatProjectedPoints = (): string => {
    if (player.projections?.projectedPoints) {
      return player.projections.projectedPoints.toFixed(1)
    }
    return '0.0'
  }

  const formatCurrentPoints = (): string => {
    if (player.stats?.fantasyPoints) {
      return player.stats.fantasyPoints.toFixed(1)
    }
    return '0.0'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <motion.div
      layout
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500/50 transition-colors"
      whileHover={{ y: -2 }}
    >
      {/* Main Player Card */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            {/* Player Avatar */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {player.name.split(' ').map(n => n[0]).join('')}
              </div>
              {/* Injury Status Indicator */}
              <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1">
                {getInjuryStatusIcon(player.injury_status)}
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-white text-lg cursor-pointer hover:text-blue-400 transition-colors"
                    onClick={() => onPlayerSelect?.(player)}>
                  {player.name}
                </h3>
                <Badge className={`text-xs ${getPositionColor(player.position)}`}>
                  {player.position}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="font-medium">{player.nfl_team}</span>
                <span>Bye: {player.bye_week}</span>
                {player.injury_status && (
                  <Badge className={`text-xs ${getInjuryStatusColor(player.injury_status)}`}>
                    {player.injury_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-right">
            <div className="flex items-center space-x-3">
              <div>
                <div className="text-sm text-gray-400">Current</div>
                <div className="font-semibold text-white">{formatCurrentPoints()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Projected</div>
                <div className="font-semibold text-green-400">{formatProjectedPoints()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Indicators */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Weather Indicator */}
            <div className="flex items-center space-x-1">
              {getWeatherIcon(mockWeather.condition)}
              <span className="text-xs text-gray-400">{mockWeather.temperature}°F</span>
            </div>

            {/* Matchup Difficulty */}
            <div className="flex items-center space-x-1">
              <Badge className={`text-xs ${getMatchupDifficultyColor(mockMatchup.difficulty)}`}>
                vs {mockMatchup.opponentTeam} ({mockMatchup.difficulty.toUpperCase()})
              </Badge>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center space-x-1">
              {getTrendIcon('up')}
              <span className="text-xs text-green-400">+8.2%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {onAddToWatchlist && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToWatchlist(player.id)}
                className="text-gray-400 hover:text-white"
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
            {onTradeTarget && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTradeTarget(player.id)}
                className="text-gray-400 hover:text-white"
              >
                <Target className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-700"
          >
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700">
              {[
                { key: 'overview', label: 'Overview', icon: Info },
                { key: 'stats', label: 'Stats', icon: BarChart3 },
                { key: 'news', label: 'News', icon: Activity },
                { key: 'outlook', label: 'Outlook', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'text-blue-400 bg-blue-900/20 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Weather Impact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Weather Impact</span>
                        {getWeatherIcon(mockWeather.condition)}
                      </div>
                      <div className="text-white font-medium">
                        {mockWeather.temperature}°F, {mockWeather.condition}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Wind: {mockWeather.windSpeed}mph
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Matchup</span>
                        <Badge className={`text-xs ${getMatchupDifficultyColor(mockMatchup.difficulty)}`}>
                          {mockMatchup.difficulty.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-white font-medium">
                        {mockMatchup.gameLocation === 'home' ? 'vs' : '@'} {mockMatchup.opponentTeam}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Rank: #{mockMatchup.rank} ({mockMatchup.pointsAllowed} pts/game)
                      </div>
                    </div>
                  </div>

                  {/* Performance Trends */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-3">Recent Performance</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">18.2</div>
                        <div className="text-xs text-gray-400">Last Game</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">15.8</div>
                        <div className="text-xs text-gray-400">3-Game Avg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">14.5</div>
                        <div className="text-xs text-gray-400">Season Avg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">87%</div>
                        <div className="text-xs text-gray-400">Snap Count</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Target Share</span>
                        <span className="text-sm text-white">24.5%</span>
                      </div>
                      <Progress value={24.5} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Red Zone Targets</span>
                        <span className="text-sm text-white">12</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-2">Advanced Stats</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Air Yards</span>
                        <span className="text-white">8.2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">YAC</span>
                        <span className="text-white">4.6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Catch Rate</span>
                        <span className="text-white">72.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">End Zone Targets</span>
                        <span className="text-white">6</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* News Tab */}
              {activeTab === 'news' && (
                <div className="space-y-3">
                  {mockNews.map((newsItem) => (
                    <div key={newsItem.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{newsItem.title}</h4>
                        <Badge className={`text-xs ${
                          newsItem.impact === 'positive' ? 'text-green-400 bg-green-900/30' :
                          newsItem.impact === 'negative' ? 'text-red-400 bg-red-900/30' :
                          'text-gray-400 bg-gray-900/30'
                        }`}>
                          {newsItem.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{newsItem.summary}</p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{newsItem.source}</span>
                        <span>{newsItem.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Outlook Tab */}
              {activeTab === 'outlook' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Schedule Difficulty</span>
                        <Badge className="text-xs text-yellow-400 bg-yellow-900/30">
                          {mockOutlook.difficulty}/10
                        </Badge>
                      </div>
                      <Progress value={mockOutlook.difficulty * 10} className="h-2 mb-2" />
                      <div className="text-xs text-gray-400">
                        Bye Week: {mockOutlook.byeWeek}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Injury Risk</span>
                        <Badge className={`text-xs ${
                          mockOutlook.injuryRisk === 'low' ? 'text-green-400 bg-green-900/30' :
                          mockOutlook.injuryRisk === 'medium' ? 'text-yellow-400 bg-yellow-900/30' :
                          'text-red-400 bg-red-900/30'
                        }`}>
                          {mockOutlook.injuryRisk.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-white">
                        Playoff Schedule: {mockOutlook.playoffSchedule}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-2">Upcoming Matchups</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {mockOutlook.upcomingMatchups.slice(0, 4).map((matchup, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          Week {index + 1}: {matchup}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

export default EnhancedPlayerCard