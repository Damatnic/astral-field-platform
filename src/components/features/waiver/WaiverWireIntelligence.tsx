'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Star,
  Clock,
  Users,
  Activity,
  Zap,
  Brain,
  Plus,
  Minus,
  Eye,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Heart
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button/Button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/Card/Card'
import type { Database } from '@/types/database'

// Shared helpers (hoisted to module scope for reuse)
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-900/30'
    case 'medium': return 'text-yellow-400 bg-yellow-900/30'
    case 'low': return 'text-green-400 bg-green-900/30'
    default: return 'text-gray-400 bg-gray-900/30'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'injury_replacement': return <AlertTriangle className="h-4 w-4 text-red-400" />
    case 'trending_up': return <TrendingUp className="h-4 w-4 text-green-400" />
    case 'matchup_play': return <Target className="h-4 w-4 text-blue-400" />
    case 'stash': return <Clock className="h-4 w-4 text-purple-400" />
    case 'breakout_candidate': return <Star className="h-4 w-4 text-yellow-400" />
    default: return <Activity className="h-4 w-4 text-gray-400" />
  }
}

const getTrendIcon = (direction: string) => {
  switch (direction) {
    case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />
    case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />
    default: return <Activity className="h-4 w-4 text-gray-500" />
  }
}

type Player = Database['public']['Tables']['players']['Row']

interface WaiverRecommendation {
  playerId: string
  player: Player
  priority: 'high' | 'medium' | 'low'
  reason: string
  confidence: number
  faabSuggestion: number
  pickupPercentage: number
  trendDirection: 'up' | 'down' | 'stable'
  projectedPoints: number
  matchupRating: number
  injuryNews?: string
  category: 'injury_replacement' | 'trending_up' | 'matchup_play' | 'stash' | 'breakout_candidate'
}

interface DropCandidate {
  playerId: string
  player: Player
  reason: string
  confidence: number
  benchWarming: boolean
  injuryStatus: string
  recentPerformance: number
  upcomingSchedule: 'easy' | 'medium' | 'hard'
}

interface FABBudgetAnalysis {
  remaining: number
  total: number
  recommendedBid: number
  maxBid: number
  conservativeRange: [number, number]
  aggressiveRange: [number, number]
  leagueAverage: number
  bidHistory: Array<{ player: string; amount: number; successful: boolean }>
}

interface WaiverWireIntelligenceProps {
  leagueId: string
  teamId: string
  faabBudget?: FABBudgetAnalysis
  onClaimPlayer?: (playerId: string, bidAmount: number, dropPlayerId?: string) => void
}

export default function WaiverWireIntelligence({
  leagueId,
  teamId,
  faabBudget,
  onClaimPlayer
}: WaiverWireIntelligenceProps) {
  const [activeView, setActiveView] = useState<'recommendations' | 'trending' | 'drops' | 'replacements'>('recommendations')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'faab' | 'pickup_rate' | 'projection'>('priority')
  
  // Mock data - in real implementation, this would come from APIs
  const mockRecommendations: WaiverRecommendation[] = [
    {
      playerId: '1',
      player: {
        id: '1',
        name: 'Tyler Higbee',
        position: 'TE',
        nfl_team: 'LAR',
        bye_week: 6,
        injury_status: null
      } as Player,
      priority: 'high',
      reason: 'Starting TE injured, immediate starter opportunity',
      confidence: 95,
      faabSuggestion: 18,
      pickupPercentage: 67,
      trendDirection: 'up',
      projectedPoints: 12.4,
      matchupRating: 8.5,
      injuryNews: 'Team TE1 placed on IR, Higbee expected to see 80%+ snap share',
      category: 'injury_replacement'
    },
    {
      playerId: '2',
      player: {
        id: '2',
        name: 'Jerome Ford',
        position: 'RB',
        nfl_team: 'CLE',
        bye_week: 5,
        injury_status: null
      } as Player,
      priority: 'high',
      reason: 'Trending up with increased carries, favorable upcoming schedule',
      confidence: 82,
      faabSuggestion: 22,
      pickupPercentage: 45,
      trendDirection: 'up',
      projectedPoints: 14.8,
      matchupRating: 7.2,
      category: 'trending_up'
    },
    {
      playerId: '3',
      player: {
        id: '3',
        name: 'Jaylen Warren',
        position: 'RB',
        nfl_team: 'PIT',
        bye_week: 9,
        injury_status: null
      } as Player,
      priority: 'medium',
      reason: 'Handcuff with standalone value, excellent matchup this week',
      confidence: 71,
      faabSuggestion: 12,
      pickupPercentage: 38,
      trendDirection: 'stable',
      projectedPoints: 9.2,
      matchupRating: 9.1,
      category: 'matchup_play'
    }
  ]

  const mockDropCandidates: DropCandidate[] = [
    {
      playerId: '4',
      player: {
        id: '4',
        name: 'Elijah Moore',
        position: 'WR',
        nfl_team: 'NYJ',
        bye_week: 7,
        injury_status: null
      } as Player,
      reason: 'Declining target share, tough upcoming schedule',
      confidence: 78,
      benchWarming: true,
      injuryStatus: 'healthy',
      recentPerformance: 4.2,
      upcomingSchedule: 'hard'
    },
    {
      playerId: '5',
      player: {
        id: '5',
        name: 'Matt Breida',
        position: 'RB',
        nfl_team: 'NYG',
        bye_week: 11,
        injury_status: 'questionable'
      } as Player,
      reason: 'Limited role, injury concerns, better options available',
      confidence: 85,
      benchWarming: true,
      injuryStatus: 'questionable',
      recentPerformance: 2.8,
      upcomingSchedule: 'medium'
    }
  ]

  const mockFAABBudget: FABBudgetAnalysis = faabBudget || {
    remaining: 67,
    total: 100,
    recommendedBid: 18,
    maxBid: 25,
    conservativeRange: [12, 18],
    aggressiveRange: [20, 28],
    leagueAverage: 15.3,
    bidHistory: [
      { player: 'D. Swift', amount: 22, successful: true },
      { player: 'K. Herbert', amount: 15, successful: false },
      { player: 'T. Pollard', amount: 8, successful: true }
    ]
  }

  

  const filteredRecommendations = mockRecommendations.filter(rec => 
    selectedCategory === 'all' || rec.category === selectedCategory
  )

  return (
    <div className="space-y-6">
      {/* Intelligence Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Waiver Wire Intelligence</h2>
              <p className="text-blue-300 text-sm">AI-powered pickup and drop recommendations</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">FAAB Budget</div>
            <div className="text-lg font-bold text-white">
              ${mockFAABBudget.remaining}/${mockFAABBudget.total}
            </div>
          </div>
        </div>
      </div>

      {/* View Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'recommendations', label: 'Top Pickups', icon: Star },
          { key: 'trending', label: 'Trending Up', icon: TrendingUp },
          { key: 'drops', label: 'Drop Candidates', icon: Minus },
          { key: 'replacements', label: 'Injury Replacements', icon: AlertTriangle }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as any)}
            className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Recommendations View */}
      {activeView === 'recommendations' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="injury_replacement">Injury Replacements</option>
                <option value="trending_up">Trending Up</option>
                <option value="matchup_play">Matchup Plays</option>
                <option value="stash">Stash Candidates</option>
                <option value="breakout_candidate">Breakout Candidates</option>
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="priority">Priority</option>
                <option value="faab">FAAB Suggestion</option>
                <option value="pickup_rate">Pickup Rate</option>
                <option value="projection">Projection</option>
              </select>
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="space-y-3">
            {filteredRecommendations.map((rec) => (
              <WaiverRecommendationCard
                key={rec.playerId}
                recommendation={rec}
                faabBudget={mockFAABBudget}
                onClaim={onClaimPlayer}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trending View */}
      {activeView === 'trending' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              Trending Players
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-white">Rising</h4>
                {mockRecommendations
                  .filter(r => r.trendDirection === 'up')
                  .map((rec) => (
                    <div key={rec.playerId} className="flex items-center justify-between p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{rec.player.name}</p>
                        <p className="text-sm text-gray-400">{rec.player.position} - {rec.player.nfl_team}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">+{rec.pickupPercentage}%</div>
                        <div className="text-xs text-gray-400">pickup rate</div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-white">Cooling Off</h4>
                <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Sample Player</p>
                    <p className="text-sm text-gray-400">WR - NYJ</p>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold">-23%</div>
                    <div className="text-xs text-gray-400">pickup rate</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Drop Candidates View */}
      {activeView === 'drops' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Minus className="h-5 w-5 text-red-500 mr-2" />
              Drop Candidates
            </h3>
            
            <div className="space-y-3">
              {mockDropCandidates.map((candidate) => (
                <DropCandidateCard
                  key={candidate.playerId}
                  candidate={candidate}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Injury Replacements View */}
      {activeView === 'replacements' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Injury Replacement Finder
            </h3>
            
            <div className="space-y-4">
              {/* Position-specific replacements */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['RB', 'WR', 'TE'].map((position) => (
                  <div key={position} className="bg-gray-700 rounded-lg p-3">
                    <h4 className="font-medium text-white mb-2">{position} Replacements</h4>
                    <div className="space-y-2">
                      {mockRecommendations
                        .filter(r => r.player.position === position && r.category === 'injury_replacement')
                        .map((rec) => (
                          <div key={rec.playerId} className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-white">{rec.player.name}</span>
                              <span className="text-green-400">${rec.faabSuggestion}</span>
                            </div>
                            <p className="text-xs text-gray-400">{rec.reason}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Waiver Recommendation Card Component
interface WaiverRecommendationCardProps {
  recommendation: WaiverRecommendation
  faabBudget: FABBudgetAnalysis
  onClaim?: (playerId: string, bidAmount: number, dropPlayerId?: string) => void
}

function WaiverRecommendationCard({ recommendation, faabBudget, onClaim }: WaiverRecommendationCardProps) {
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidAmount, setBidAmount] = useState(recommendation.faabSuggestion)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {recommendation.player.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-white">{recommendation.player.name}</h3>
              <Badge className="text-xs text-blue-400 bg-blue-900/30">
                {recommendation.player.position}
              </Badge>
              <Badge className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                {recommendation.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{recommendation.player.nfl_team}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                {getCategoryIcon(recommendation.category)}
                <span className="capitalize">{recommendation.category.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            {getTrendIcon(recommendation.trendDirection)}
            <span className="text-sm font-medium text-white">{recommendation.projectedPoints} pts</span>
          </div>
          <div className="text-xs text-gray-400">Projected</div>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-3">{recommendation.reason}</p>

      {recommendation.injuryNews && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-2 mb-3">
          <p className="text-xs text-red-300">{recommendation.injuryNews}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">${recommendation.faabSuggestion}</div>
          <div className="text-xs text-gray-400">Suggested Bid</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{recommendation.pickupPercentage}%</div>
          <div className="text-xs text-gray-400">Pickup Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{recommendation.confidence}%</div>
          <div className="text-xs text-gray-400">Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">{recommendation.matchupRating}/10</div>
          <div className="text-xs text-gray-400">Matchup</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <DollarSign className="h-4 w-4" />
          <span>Budget: ${faabBudget.remaining} remaining</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBidModal(true)}
            className="text-gray-400 hover:text-white"
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Button
            size="sm"
            onClick={() => onClaim?.(recommendation.playerId, recommendation.faabSuggestion)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Claim
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Drop Candidate Card Component
interface DropCandidateCardProps {
  candidate: DropCandidate
}

function DropCandidateCard({ candidate }: DropCandidateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-900/20 border border-red-600/30 rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {candidate.player.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-white">{candidate.player.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{candidate.player.position} - {candidate.player.nfl_team}</span>
              {candidate.benchWarming && (
                <Badge className="text-xs text-orange-400 bg-orange-900/30">
                  Bench
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge className="text-xs text-red-400 bg-red-900/30">
          {candidate.confidence}% confidence
        </Badge>
      </div>

      <p className="text-sm text-gray-300 mb-3">{candidate.reason}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-sm font-bold text-red-400">{candidate.recentPerformance}</div>
          <div className="text-xs text-gray-400">Avg Points</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-yellow-400 capitalize">{candidate.upcomingSchedule}</div>
          <div className="text-xs text-gray-400">Schedule</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white capitalize">{candidate.injuryStatus}</div>
          <div className="text-xs text-gray-400">Health</div>
        </div>
      </div>
    </motion.div>
  )
}
