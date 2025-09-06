'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft,
  Plus,
  X,
  Check,
  Clock,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Calculator,
  Users,
  Send,
  ThumbsUp,
  ThumbsDown,
  ChevronDown
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLeagueStore } from '@/stores/leagueStore'

interface Player {
  id: string
  name: string
  position: string
  team: string
  fantasyPoints: number
  projectedPoints: number
  trend: 'up' | 'down' | 'stable'
  value: number
  injury?: string
}

interface TradeOffer {
  id: string
  fromTeamId: string
  fromTeamName: string
  toTeamId: string
  toTeamName: string
  offeredPlayers: Player[]
  requestedPlayers: Player[]
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired'
  message?: string
  timestamp: string
  expiresAt: string
  counterOffers?: TradeOffer[]
  analysis?: TradeAnalysis
}

interface TradeAnalysis {
  valueGap: number
  positionImpact: Record<string, number>
  rosterImpact: 'positive' | 'negative' | 'neutral'
  recommendation: string
  fairnessScore: number
}

interface TradeNegotiationProps {
  leagueId: string
  teamId: string
}

export default function TradeNegotiationInterface({ leagueId, teamId }: TradeNegotiationProps) {
  const { user } = useAuthStore()
  const { teams } = useLeagueStore()

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'create'>('incoming')
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [selectedOffer, setSelectedOffer] = useState<TradeOffer | null>(null)
  const [showTradeBuilder, setShowTradeBuilder] = useState(false)
  const [newTradeData, setNewTradeData] = useState({
    toTeamId: '',
    offeredPlayers: [] as Player[],
    requestedPlayers: [] as Player[],
    message: ''
  })

  useEffect(() => {
    loadTradeOffers()
    loadAvailablePlayers()
  }, [leagueId, teamId])

  const loadTradeOffers = async () => {
    // Mock trade offers
    const mockOffers: TradeOffer[] = [
      {
        id: '1',
        fromTeamId: 'team2',
        fromTeamName: 'Team Beta',
        toTeamId: teamId,
        toTeamName: 'Your Team',
        offeredPlayers: [
          {
            id: 'p1',
            name: 'Tyreek Hill',
            position: 'WR',
            team: 'MIA',
            fantasyPoints: 185.4,
            projectedPoints: 16.8,
            trend: 'up',
            value: 85
          }
        ],
        requestedPlayers: [
          {
            id: 'p2',
            name: 'Josh Jacobs',
            position: 'RB',
            team: 'LV',
            fantasyPoints: 178.2,
            projectedPoints: 14.2,
            trend: 'down',
            value: 78
          }
        ],
        status: 'pending',
        message: 'I think this trade helps both our teams. Hill gives you elite WR1 upside.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        analysis: {
          valueGap: 7,
          positionImpact: { WR: 15, RB: -8 },
          rosterImpact: 'positive',
          recommendation: 'Favorable trade - you gain WR depth while giving up RB depth',
          fairnessScore: 8.2
        }
      },
      {
        id: '2',
        fromTeamId: teamId,
        fromTeamName: 'Your Team',
        toTeamId: 'team3',
        toTeamName: 'Team Gamma',
        offeredPlayers: [
          {
            id: 'p3',
            name: 'DeAndre Hopkins',
            position: 'WR',
            team: 'TEN',
            fantasyPoints: 142.6,
            projectedPoints: 11.8,
            trend: 'stable',
            value: 62
          }
        ],
        requestedPlayers: [
          {
            id: 'p4',
            name: 'Tony Pollard',
            position: 'RB',
            team: 'DAL',
            fantasyPoints: 156.8,
            projectedPoints: 13.1,
            trend: 'up',
            value: 68
          }
        ],
        status: 'countered',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }
    ]

    setTradeOffers(mockOffers)
  }

  const loadAvailablePlayers = async () => {
    // Mock available players for trade building
    const mockPlayers: Player[] = [
      {
        id: 'p5',
        name: 'Cooper Kupp',
        position: 'WR',
        team: 'LAR',
        fantasyPoints: 156.4,
        projectedPoints: 14.8,
        trend: 'stable',
        value: 82,
        injury: 'Questionable'
      },
      {
        id: 'p6',
        name: 'Saquon Barkley',
        position: 'RB',
        team: 'NYG',
        fantasyPoints: 201.3,
        projectedPoints: 18.2,
        trend: 'up',
        value: 95
      },
      {
        id: 'p7',
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        fantasyPoints: 189.7,
        projectedPoints: 15.9,
        trend: 'down',
        value: 88
      }
    ]

    setAvailablePlayers(mockPlayers)
  }

  const acceptTrade = (tradeId: string) => {
    setTradeOffers(prev => prev.map(offer => 
      offer.id === tradeId 
        ? { ...offer, status: 'accepted' }
        : offer
    ))
  }

  const rejectTrade = (tradeId: string) => {
    setTradeOffers(prev => prev.map(offer => 
      offer.id === tradeId 
        ? { ...offer, status: 'rejected' }
        : offer
    ))
  }

  const createCounterOffer = (originalTradeId: string) => {
    const originalTrade = tradeOffers.find(t => t.id === originalTradeId)
    if (!originalTrade) return

    setNewTradeData({
      toTeamId: originalTrade.fromTeamId,
      offeredPlayers: originalTrade.requestedPlayers,
      requestedPlayers: originalTrade.offeredPlayers,
      message: 'Counter offer - what do you think about this instead?'
    })
    setActiveTab('create')
    setShowTradeBuilder(true)
  }

  const submitTrade = () => {
    const newTrade: TradeOffer = {
      id: Date.now().toString(),
      fromTeamId: teamId,
      fromTeamName: 'Your Team',
      toTeamId: newTradeData.toTeamId,
      toTeamName: teams.find(t => t.id === newTradeData.toTeamId)?.team_name || 'Unknown Team',
      offeredPlayers: newTradeData.offeredPlayers,
      requestedPlayers: newTradeData.requestedPlayers,
      status: 'pending',
      message: newTradeData.message,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    setTradeOffers(prev => [...prev, newTrade])
    setNewTradeData({
      toTeamId: '',
      offeredPlayers: [],
      requestedPlayers: [],
      message: ''
    })
    setShowTradeBuilder(false)
    setActiveTab('outgoing')
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'text-green-400 bg-green-900/30'
      case 'rejected': return 'text-red-400 bg-red-900/30'
      case 'countered': return 'text-yellow-400 bg-yellow-900/30'
      case 'expired': return 'text-gray-400 bg-gray-900/30'
      default: return 'text-blue-400 bg-blue-900/30'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-400" />
      default: return <div className="h-4 w-4" />
    }
  }

  const incomingOffers = tradeOffers.filter(offer => offer.toTeamId === teamId)
  const outgoingOffers = tradeOffers.filter(offer => offer.fromTeamId === teamId)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <ArrowRightLeft className="h-8 w-8 text-blue-500 mr-3" />
            Trade Negotiations
          </h1>
          <p className="text-gray-400 mt-2">Manage trade offers and negotiate with other teams</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8">
          {[
            { key: 'incoming', label: 'Incoming Offers', count: incomingOffers.filter(o => o.status === 'pending').length },
            { key: 'outgoing', label: 'Outgoing Offers', count: outgoingOffers.filter(o => o.status === 'pending').length },
            { key: 'create', label: 'Create Trade' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'incoming' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Incoming Trade Offers</h2>
              <div className="text-sm text-gray-400">
                {incomingOffers.length} total offers
              </div>
            </div>

            {incomingOffers.length === 0 ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-xl text-gray-400">No incoming trade offers</p>
                <p className="text-gray-500">When other teams send you trade offers, they'll appear here</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {incomingOffers.map((offer) => (
                  <TradeOfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={() => acceptTrade(offer.id)}
                    onReject={() => rejectTrade(offer.id)}
                    onCounter={() => createCounterOffer(offer.id)}
                    onViewDetails={() => setSelectedOffer(offer)}
                    isIncoming={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Outgoing Trade Offers</h2>
              <div className="text-sm text-gray-400">
                {outgoingOffers.length} total offers
              </div>
            </div>

            {outgoingOffers.length === 0 ? (
              <div className="text-center py-12">
                <Send className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-xl text-gray-400">No outgoing trade offers</p>
                <p className="text-gray-500">Trade offers you send to other teams will appear here</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {outgoingOffers.map((offer) => (
                  <TradeOfferCard
                    key={offer.id}
                    offer={offer}
                    onViewDetails={() => setSelectedOffer(offer)}
                    isIncoming={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create New Trade</h2>
              <button
                onClick={() => setShowTradeBuilder(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trade
              </button>
            </div>

            <TradeBuilder
              show={showTradeBuilder}
              onClose={() => setShowTradeBuilder(false)}
              teams={teams.filter(t => t.id !== teamId)}
              availablePlayers={availablePlayers}
              tradeData={newTradeData}
              onTradeDataChange={setNewTradeData}
              onSubmit={submitTrade}
            />

            {!showTradeBuilder && (
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-xl text-gray-400">Ready to make a trade?</p>
                <p className="text-gray-500 mb-6">Use our trade builder to create fair and strategic offers</p>
                <button
                  onClick={() => setShowTradeBuilder(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Building Trade
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trade Details Modal */}
      {selectedOffer && (
        <TradeDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onAccept={() => {
            acceptTrade(selectedOffer.id)
            setSelectedOffer(null)
          }}
          onReject={() => {
            rejectTrade(selectedOffer.id)
            setSelectedOffer(null)
          }}
          onCounter={() => {
            createCounterOffer(selectedOffer.id)
            setSelectedOffer(null)
          }}
        />
      )}
    </div>
  )
}

// Trade Offer Card Component
interface TradeOfferCardProps {
  offer: TradeOffer
  onAccept?: () => void
  onReject?: () => void
  onCounter?: () => void
  onViewDetails: () => void
  isIncoming: boolean
}

function TradeOfferCard({ offer, onAccept, onReject, onCounter, onViewDetails, isIncoming }: TradeOfferCardProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'text-green-400 bg-green-900/30'
      case 'rejected': return 'text-red-400 bg-red-900/30'
      case 'countered': return 'text-yellow-400 bg-yellow-900/30'
      case 'expired': return 'text-gray-400 bg-gray-900/30'
      default: return 'text-blue-400 bg-blue-900/30'
    }
  }

  const getTimeRemaining = () => {
    const now = new Date().getTime()
    const expires = new Date(offer.expiresAt).getTime()
    const diff = expires - now
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {(isIncoming ? offer.fromTeamName : offer.toTeamName).charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {isIncoming ? `From: ${offer.fromTeamName}` : `To: ${offer.toTeamName}`}
            </h3>
            <p className="text-sm text-gray-400">{new Date(offer.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(offer.status)}`}>
            {offer.status}
          </span>
          {offer.status === 'pending' && (
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {getTimeRemaining()}
            </div>
          )}
        </div>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Offered Players */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            {isIncoming ? 'They Offer' : 'You Offer'}
          </h4>
          <div className="space-y-2">
            {offer.offeredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRightLeft className="h-6 w-6 text-blue-400" />
        </div>

        {/* Requested Players */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            {isIncoming ? 'They Want' : 'You Want'}
          </h4>
          <div className="space-y-2">
            {offer.requestedPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>

      {/* Trade Analysis */}
      {offer.analysis && (
        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Trade Analysis</span>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 mr-2">Fairness Score:</span>
              <span className={`font-bold ${
                offer.analysis.fairnessScore >= 8 ? 'text-green-400' :
                offer.analysis.fairnessScore >= 6 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {offer.analysis.fairnessScore}/10
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400">{offer.analysis.recommendation}</p>
        </div>
      )}

      {/* Message */}
      {offer.message && (
        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <div className="flex items-center mb-2">
            <MessageSquare className="h-4 w-4 text-blue-400 mr-2" />
            <span className="text-sm font-medium text-gray-300">Message</span>
          </div>
          <p className="text-sm text-gray-300">{offer.message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onViewDetails}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          View Details
        </button>

        {isIncoming && offer.status === 'pending' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm flex items-center transition-colors"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Reject
            </button>
            <button
              onClick={onCounter}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm transition-colors"
            >
              Counter
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm flex items-center transition-colors"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Player Card Component
function PlayerCard({ player }: { player: Player }) {
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-400" />
      default: return null
    }
  }

  return (
    <div className="bg-gray-600 rounded p-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{player.name}</p>
          <p className="text-xs text-gray-300">{player.position} - {player.team}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-300">{player.projectedPoints}</span>
            {getTrendIcon(player.trend)}
          </div>
          {player.injury && (
            <span className="text-xs text-red-400">{player.injury}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Trade Builder Component
interface TradeBuilderProps {
  show: boolean
  onClose: () => void
  teams: any[]
  availablePlayers: Player[]
  tradeData: any
  onTradeDataChange: (data: any) => void
  onSubmit: () => void
}

function TradeBuilder({ 
  show, 
  onClose, 
  teams, 
  availablePlayers, 
  tradeData, 
  onTradeDataChange, 
  onSubmit 
}: TradeBuilderProps) {
  if (!show) return null

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Trade Builder</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Team Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trading Partner
        </label>
        <select
          value={tradeData.toTeamId}
          onChange={(e) => onTradeDataChange({ ...tradeData, toTeamId: e.target.value })}
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
        >
          <option value="">Select team...</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.team_name}</option>
          ))}
        </select>
      </div>

      {/* Players Selection */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-gray-300 mb-3">You Give</h4>
          <div className="bg-gray-700 rounded-lg p-4 min-h-[200px]">
            {tradeData.offeredPlayers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Add players you want to trade</p>
            ) : (
              <div className="space-y-2">
                {tradeData.offeredPlayers.map((player: Player) => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-600 rounded p-2">
                    <span className="text-white text-sm">{player.name}</span>
                    <button
                      onClick={() => onTradeDataChange({
                        ...tradeData,
                        offeredPlayers: tradeData.offeredPlayers.filter((p: Player) => p.id !== player.id)
                      })}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-300 mb-3">You Receive</h4>
          <div className="bg-gray-700 rounded-lg p-4 min-h-[200px]">
            {tradeData.requestedPlayers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Add players you want to receive</p>
            ) : (
              <div className="space-y-2">
                {tradeData.requestedPlayers.map((player: Player) => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-600 rounded p-2">
                    <span className="text-white text-sm">{player.name}</span>
                    <button
                      onClick={() => onTradeDataChange({
                        ...tradeData,
                        requestedPlayers: tradeData.requestedPlayers.filter((p: Player) => p.id !== player.id)
                      })}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Players */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-300 mb-3">Available Players</h4>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
          {availablePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                if (!tradeData.offeredPlayers.find((p: Player) => p.id === player.id)) {
                  onTradeDataChange({
                    ...tradeData,
                    offeredPlayers: [...tradeData.offeredPlayers, player]
                  })
                }
              }}
              className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
            >
              <div>{player.name}</div>
              <div className="text-xs text-gray-400">{player.position}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trade Message (Optional)
        </label>
        <textarea
          value={tradeData.message}
          onChange={(e) => onTradeDataChange({ ...tradeData, message: e.target.value })}
          placeholder="Add a message to explain your trade reasoning..."
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 resize-none"
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!tradeData.toTeamId || tradeData.offeredPlayers.length === 0 || tradeData.requestedPlayers.length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Trade Offer
        </button>
      </div>
    </div>
  )
}

// Trade Details Modal Component
function TradeDetailsModal({ offer, onClose, onAccept, onReject, onCounter }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Trade Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Detailed trade analysis and information would go here */}
          <div className="text-center py-8">
            <p className="text-gray-400">Detailed trade analysis coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}