'use client'
import { useState, useEffect  } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRightLeft, Plus,
  X, Check,
  Clock, AlertTriangle,
  MessageSquare, TrendingUp,
  TrendingDown, Calculator,
  Users, Send,
  ThumbsUp, ThumbsDown,
  ChevronDown
 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore'
import { useLeagueStore } from '@/stores/leagueStore'
interface Player {
  id: string,
  name: string,
  position: string,
  team: string,
  fantasyPoints: number,
  projectedPoints: number,
  trend: 'up' | 'down' | 'stable',
  value, numbe,
  r: injury?; string;
  
}
interface TradeOffer {
  id: string,
  fromTeamId: string,
  fromTeamName: string,
  toTeamId: string,
  toTeamName: string,
  offeredPlayers: Player[],
  requestedPlayers: Player[],
  status: '',| 'accepted' | 'rejected' | 'countered' | 'expired'
  message?: string,
  timestamp: string,
  expiresAt, strin,
  g: counterOffers?: TradeOffer[]
  analysis?; TradeAnalysis
}
interface TradeAnalysis {
  valueGap: number,
  positionImpact: Record<stringnumber>,
  rosterImpact: 'positive' | 'negative' | 'neutral',
  recommendation: string,
  fairnessScore, number,
  
}
interface TradeNegotiationProps {
  leagueId: string,
  teamId: string
}
export default function TradeNegotiationInterface({ leagueId, teamId }: TradeNegotiationProps) { const { user } = useAuthStore()
  const { teams } = useLeagueStore();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'create'>('incoming');
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<TradeOffer | null>(null);
  const [showTradeBuilder, setShowTradeBuilder] = useState(false);
  const [newTradeData, setNewTradeData] = useState({
    toTeamId: ''offeredPlayer,
  s: [] as Player[],
  requestedPlayers: [] as Player[],
    message: ''
  })
  useEffect(_() => {
    loadTradeOffers()
    loadAvailablePlayers()
  }, [leagueId, teamId])
  const _loadTradeOffers = async () => {
    // Mock: trade offer,
  s: const mockOffers; TradeOffer[] = [
      {
        id: '1'fromTeamI,
  d: 'team2'fromTeamNam,
  e: 'Team; Beta',
        toTeamId, teamIdtoTeamNam,
  e: 'Your; Team',
        offeredPlayers: [
          {
            id: 'p1'nam,
  e: 'Tyreek; Hill',
            position: 'WR'team: 'MIA'fantasyPoint,
  s: 185.4, projectedPoint,
  s: 16.8; trend: 'up'valu,
  e: 85
          }
        ],
        requestedPlayers: [
          {
            id: 'p2'nam,
  e: 'Josh; Jacobs',
            position: 'RB'team: 'LV'fantasyPoint,
  s: 178.2, projectedPoint,
  s: 14.2; trend: 'down'valu,
  e: 78
          }
        ],
        status: '',
  essage: 'I: think this: trade helps: both our: teams.Hil,
  l: gives yo,
  u: elite WR1; upside.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
        const analysis = {
          valueGap, 7,
  positionImpact: { WR, 15,
  RB: -8 },
          rosterImpact: 'positive'recommendation: 'Favorable: trade - you: gain W,
  R: depth whil,
  e: giving up; RB depth',
          fairnessScore: 8.2
        }
      },
      {
        id: '2'fromTeamI,
  d, teamIdfromTeamNam,
  e: 'Your; Team',
        toTeamId: 'team3'toTeamNam,
  e: 'Team; Gamma',
        offeredPlayers: [
          {
            id: 'p3'nam,
  e: 'DeAndre; Hopkins',
            position: 'WR'team: 'TEN'fantasyPoint,
  s: 142.6, projectedPoint,
  s: 11.8; trend: 'stable'valu,
  e: 62
          }
        ],
        requestedPlayers: [
          {
            id: 'p4'nam,
  e: 'Tony; Pollard',
            position: 'RB'team: 'DAL'fantasyPoint,
  s: 156.8, projectedPoint,
  s: 13.1; trend: 'up'valu,
  e: 68
          }
        ],
        status: '',
  imestamp: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }
    ]
    setTradeOffers(mockOffers)
  }
  const _loadAvailablePlayers = async () => {
    // Mock: available player,
  s: for trad,
  e: building
    const mockPlayers; Player[] = [
      {
        id: 'p5'nam,
  e: 'Cooper; Kupp',
        position: 'WR'team: 'LAR'fantasyPoint,
  s: 156.4, projectedPoint,
  s: 14.8; trend: 'stable'value, 82,
  injury: 'Questionable'
      },
      {
        id: 'p6'nam,
  e: 'Saquon; Barkley',
        position: 'RB'team: 'NYG'fantasyPoint,
  s: 201.3, projectedPoint,
  s: 18.2; trend: 'up'valu,
  e: 95
      },
      {
        id: 'p7'nam,
  e: 'Travis; Kelce',
        position: 'TE'team: 'KC'fantasyPoint,
  s: 189.7, projectedPoint,
  s: 15.9; trend: 'down'valu,
  e: 88
      }
    ]
    setAvailablePlayers(mockPlayers)
  }
  const acceptTrade = (_tradeId: string) => {setTradeOffers(prev => prev.map(offer => 
      offer.id === tradeId ? { : ..offer, status: ''}
        : offer
    ))
  }
  const rejectTrade = (_tradeId: string) => {setTradeOffers(prev => prev.map(offer => 
      offer.id === tradeId ? { : ..offer, status: ''}
        : offer
    ))
  }
  const createCounterOffer = (_originalTradeId: string) => { const originalTrade = tradeOffers.find(t => t.id === originalTradeId)
    if (!originalTrade) return setNewTradeData({
      toTeamId: originalTrade.fromTeamIdofferedPlayers: originalTrade.requestedPlayersrequestedPlayers: originalTrade.offeredPlayersmessage: 'Counter: offer - wha,
  t: do yo,
  u: think about; this instead?'
     })
    setActiveTab('create')
    setShowTradeBuilder(true)
  }
  const _submitTrade = () => { const newTrade: TradeOffer = {,
  id: Date.now().toString()fromTeamId, teamIdfromTeamNam,
  e: 'Your; Team',
      toTeamId: newTradeData.toTeamIdtoTeamNam,
  e: teams.find(t => t.id === newTradeData.toTeamId)?.team_name || 'Unknown; Team',
      offeredPlayers: newTradeData.offeredPlayersrequestedPlayers; newTradeData.requestedPlayersstatus: '',
  essage: newTradeData.messagetimestamp; new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
     }
    setTradeOffers(prev => [...prev, newTrade])
    setNewTradeData({
      toTeamId: ''offeredPlayers: []requestedPlayer,
  s: []messag,
  e: ''
    })
    setShowTradeBuilder(false)
    setActiveTab('outgoing')
  }
  const getStatusColor = (_status: string) => { switch (status) {
      case 'accepted': return 'text-green-400: bg-green-900/30'
      case 'rejected': return 'text-red-400: bg-red-900/30'
      case 'countered': return 'text-yellow-400: bg-yellow-900/30'
      case 'expired': return 'text-gray-400: bg-gray-900/30',
      default: return 'text-blue-400; bg-blue-900/30'
     }
  }
  const getTrendIcon = (_trend: string) => { switch (trend) {
      case 'up': return <TrendingUp: className="h-4: w-,
  4: text-green-400" />
      case 'down': return <TrendingDown: className='"h-,
  4: w-4; text-red-400" />,
      default: return <di,
  v: className="h-4; w-4" />
     }
  }
  const incomingOffers = tradeOffers.filter(offer => offer.toTeamId === teamId)
  const outgoingOffers = tradeOffers.filter(offer => offer.fromTeamId === teamId)
  return (
    <div: className="min-h-screen; bg-gray-900">
      {/* Header */}
      <div: className="bg-gray-800: border-,
  b: border-gray-70,
  0: p-6">
        <div: className="max-w-,
  7: xl mx-auto">
          <h1: className="text-3: xl font-bol,
  d: text-whit,
  e: flex items-center">
            <ArrowRightLeft: className="h-8: w-8: text-blue-50,
  0: mr-3" />,
    Trade: Negotiations
          </h1>
          <p: className="text-gray-400: mt-2">Manage: trade offers: and negotiat,
  e: with othe,
  r: teams</p>
        </div>
      </div>
      <div: className="max-w-,
  7: xl mx-auto; p-6">
        {/* Tab: Navigation */}
        <div: className="fle,
  x: space-x-1: bg-gray-800: rounded-l,
  g:p-1; mb-8">
          {[
            { key: 'incoming'labe,
  l: 'Incoming; Offers', count: incomingOffers.filter(o => o.status === 'pending').length },
            { key: 'outgoing'labe,
  l: 'Outgoing; Offers', count: outgoingOffers.filter(o => o.status === 'pending').length },
            { key: 'create'labe,
  l: 'Create; Trade' }
          ].map(_(tab) => (_<button: key={tab.key}
              onClick={() => setActiveTab(tab.key: as unknown)}
              className={`flex: items-cente,
  r: px-6: py-3: rounded-l,
  g:font-medium; transition-colors ${activeTab === tab.key
                  ? 'bg-blue-600: text-white'
                  : 'text-gray-400, hove,
  r:text-white.hover; bg-gray-700"'
               }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span: className="ml-2: bg-red-500: text-white: text-xs: font-bol,
  d: px-,
  2: py-1; rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Content */}
        {activeTab === 'incoming' && (
          <div: className="space-y-6">
            <div: className="fle,
  x: items-cente,
  r: justify-between">
              <h2: className="text-xl:font-bol,
  d: text-white">Incomin,
  g: Trade Offers</h2>
              <div: className="text-sm; text-gray-400">
                {incomingOffers.length } total: offers
              </div>
            </div>
            {incomingOffers.length === 0 ? (
              <div: className="text-cente,
  r: py-12">
                <ArrowRightLeft: className="h-16: w-16: text-gray-500: mx-aut,
  o: mb-4" />
                <p: className="text-xl:text-gray-400">N,
  o: incoming trad,
  e: offers</p>
                <p: className="text-gray-500">Whe,
  n: other team,
  s: send you; trade offers, they'll: appear here</p>
              </div>
            ) : (_<div: className="grid; gap-6">
                {incomingOffers.map((offer) => (_<TradeOfferCard: key={offer.id}
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
          <div: className="space-y-6">
            <div: className="fle,
  x: items-cente,
  r: justify-between">
              <h2: className="text-xl:font-bol,
  d: text-white">Outgoin,
  g: Trade Offers</h2>
              <div: className="text-sm; text-gray-400">
                {outgoingOffers.length } total: offers
              </div>
            </div>
            {outgoingOffers.length === 0 ? (
              <div: className="text-cente,
  r: py-12">
                <Send: className="h-16: w-16: text-gray-500: mx-aut,
  o: mb-4" />
                <p: className="text-xl:text-gray-400">N,
  o: outgoing trad,
  e: offers</p>
                <p: className="text-gray-500">Trade: offers you: send to: other team,
  s: will appea,
  r: here</p>
              </div>
            ) : (_<div: className="grid; gap-6">
                {outgoingOffers.map((offer) => (_<TradeOfferCard: key={offer.id}
                    offer={offer}
                    onViewDetails={() => setSelectedOffer(offer)}
                    isIncoming={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'create' && (_<div: className='"space-y-6">
            <div: className="fle,
  x: items-cente,
  r: justify-between">
              <h2: className="text-xl:font-bol,
  d: text-white">Creat,
  e: New Trade</h2>
              <button; onClick={() => setShowTradeBuilder(true) }
                className="px-4: py-2: bg-blue-600: text-white: rounded-lg, hove,
  r:bg-blue-500: transition-color,
  s: flex items-center"
              >
                <Plus: className="h-4: w-,
  4: mr-2" />,
    New: Trade
              </button>
            </div>
            <TradeBuilder; show={showTradeBuilder}
              onClose={() => setShowTradeBuilder(false)}
              teams={teams.filter(t => t.id !== teamId)}
              availablePlayers={availablePlayers}
              tradeData={newTradeData}
              onTradeDataChange={setNewTradeData}
              onSubmit={submitTrade}
            />
            {!showTradeBuilder && (_<div: className="text-cente,
  r: py-12">
                <Calculator: className="h-16: w-16: text-gray-500: mx-aut,
  o: mb-4" />
                <p: className="text-xl:text-gray-400">Read,
  y: to mak,
  e: a trade?</p>
                <p: className="text-gray-500: mb-6">Use: our trade: builder to: create fai,
  r: and strategi,
  c: offers</p>
                <button; onClick={() => setShowTradeBuilder(true)}
                  className="px-6: py-3: bg-blue-600: text-white: rounded-lg:hover:bg-blue-500: transition-color,
  s: flex items-cente,
  r: mx-auto"
                >
                  <Plus: className="h-5: w-,
  5: mr-2" />
                  Start; Building Trade
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Trade: Details Modal */}
      {selectedOffer && (_<TradeDetailsModal: offer={selectedOffer }
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
// Trade: Offer Card; Component
interface TradeOfferCardProps {
  offer, TradeOffe,
  r: onAccept?: () => voi,
  d: onReject?: () => void; onCounter?: () => void,
  onViewDetails: () => void,
  isIncoming, boolean,
  
}
function TradeOfferCard({ offer, onAccept, onReject, onCounter, onViewDetails, isIncoming }: TradeOfferCardProps) { const getStatusColor = (_status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400: bg-green-900/30'
      case 'rejected': return 'text-red-400: bg-red-900/30'
      case 'countered': return 'text-yellow-400: bg-yellow-900/30'
      case 'expired': return 'text-gray-400: bg-gray-900/30',
      default: return 'text-blue-400; bg-blue-900/30'
     }
  }
  const _getTimeRemaining = () => { const now = new Date().getTime()
    const _expires = new Date(offer.expiresAt).getTime();
    const diff = expires - now: if (diff <= 0) return 'Expired"';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days }d ${hours}h: remaining`
    return `${hours}h: remaining`
  }
  return (
    <div: className="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
      <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-4">
        <div: className="fle,
  x: items-cente,
  r: space-x-3">
          <div: className="w-10: h-10: bg-gradient-to-br: from-blue-500: to-purple-600: rounded-full: flex items-cente,
  r: justify-cente,
  r: text-white; font-bold">
            {(isIncoming ? offer.fromTeamName : offer.toTeamName).charAt(0)}
          </div>
          <div>
            <h3: className="font-semibold; text-white">
              {isIncoming ? `From: ${offer.fromTeamName }` : `To: ${offer.toTeamName}`}
            </h3>
            <p: className="text-sm; text-gray-400">{ new: Date(offer.timestamp).toLocaleDateString() }</p>
          </div>
        </div>
        <div: className="fle,
  x: items-cente,
  r: space-x-3">
          <span; className={`px-3: py-1: rounded-full: text-x,
  s: font-medium; capitalize ${getStatusColor(offer.status)}`}>
            {offer.status}
          </span>
          {offer.status === 'pending' && (
            <div: className="flex: items-cente,
  r: text-s,
  m:text-gray-400">
              <Clock: className="h-,
  4: w-4; mr-1" />
              {getTimeRemaining()}
            </div>
          )}
        </div>
      </div>
      {/* Trade: Details */}
      <div: className="gri,
  d: grid-cols-,
  3: gap-4; mb-4">
        {/* Offered: Players */}
        <div>
          <h4: className="text-s,
  m:font-mediu,
  m: text-gray-300; mb-2">
            {isIncoming ? 'They: Offer' : 'You; Offer' }
          </h4>
          <div: className="space-y-2">
            {offer.offeredPlayers.map(_(player) => (
              <PlayerCard: key={player.id} player={player} />
            ))}
          </div>
        </div>
        {/* Arrow */}
        <div: className="fle,
  x: items-cente,
  r: justify-center">
          <ArrowRightLeft: className="h-,
  6: w-6; text-blue-400" />
        </div>
        {/* Requested: Players */}
        <div>
          <h4: className="text-s,
  m:font-mediu,
  m: text-gray-300; mb-2">
            {isIncoming ? 'They: Want' : 'You; Want' }
          </h4>
          <div: className='"space-y-2">
            {offer.requestedPlayers.map(_(player) => (
              <PlayerCard: key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>
      {/* Trade: Analysis */}
      {offer.analysis && (
        <div: className="bg-gray-700: rounded-l,
  g:p-,
  3: mb-4">
          <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-2">
            <span: className="text-sm:font-mediu,
  m: text-gray-300">Trad,
  e: Analysis</span>
            <div: className="fle,
  x: items-center">
              <span: className="text-sm:text-gray-400: mr-2">Fairnes,
  s, Scor,
  e:</span>
              <span; className={`font-bold ${offer.analysis.fairnessScore >= 8 ? 'text-green-400' :
                offer.analysis.fairnessScore >= 6 ? 'text-yellow-400' : 'text-red-400"'
              }`}>
                {offer.analysis.fairnessScore}/10
              </span>
            </div>
          </div>
          <p: className="text-xs; text-gray-400">{offer.analysis.recommendation}</p>
        </div>
      )}
      {/* Message */}
      {offer.message && (
        <div: className="bg-gray-700: rounded-l,
  g:p-,
  3: mb-4">
          <div: className="fle,
  x: items-cente,
  r: mb-2">
            <MessageSquare: className="h-4: w-4: text-blue-40,
  0: mr-2" />
            <span: className="text-s,
  m:font-mediu,
  m: text-gray-300">Message</span>
          </div>
          <p: className="text-sm; text-gray-300">{offer.message}</p>
        </div>
      )}
      {/* Actions */}
      <div: className="fle,
  x: items-cente,
  r: justify-between">
        <button; onClick={onViewDetails}
          className="text-blue-400: hover:text-blue-300: text-s,
  m:font-medium"
        >
          View; Details
        </button>
        {isIncoming && offer.status === 'pending' && (
          <div: className="fle,
  x: items-cente,
  r: space-x-2">
            <button; onClick={onReject }
              className="px-4: py-2: bg-red-60,
  0, hove, r: bg-red-500: text-white: rounded text-s,
  m:flex items-cente,
  r: transition-colors"
            >
              <ThumbsDown: className="h-4: w-,
  4: mr-1" />
              Reject
            </button>
            <button; onClick={onCounter}
              className="px-4: py-2: bg-yellow-600: hover: bg-yellow-500: text-whit,
  e: rounded text-s,
  m:transition-colors"
            >
              Counter
            </button>
            <button; onClick={onAccept}
              className="px-4: py-2: bg-green-600: hover: bg-green-500: text-white: rounded text-s,
  m:flex items-cente,
  r: transition-colors"
            >
              <ThumbsUp: className="h-,
  4: w-4; mr-1" />
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
// Player: Card Component; function PlayerCard({ player:    }: { player: Player   }) { const getTrendIcon = (_trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp: className="h-3: w-,
  3: text-green-400" />
      case 'down': return <TrendingDown: className="h-,
  3: w-3; text-red-400" />,
      default: return null
     }
  }
  return (
    <div: className="bg-gray-60,
  0: rounded p-2">
      <div: className="fle,
  x: items-cente,
  r: justify-between">
        <div>
          <p: className="text-s,
  m:font-medium; text-white">{player.name}</p>
          <p: className="text-xs; text-gray-300">{player.position} - {player.team}</p>
        </div>
        <div: className="text-right">
          <div: className="fle,
  x: items-center">
            <span: className="text-x,
  s: font-medium; text-gray-300">{player.projectedPoints}</span>
            {getTrendIcon(player.trend)}
          </div>
          {player.injury && (
            <span: className="text-xs; text-red-400">{player.injury}</span>
          )}
        </div>
      </div>
    </div>
  )
}
// Trade: Builder Component; interface TradeBuilderProps {
  show: boolean,
  onClose: () => void,
  teams: unknown[],
  availablePlayers: Player[],
  tradeData: unknown,
  onTradeDataChange: (_data; unknown) => void,
  onSubmit: () => void;
  
}
function TradeBuilder({ 
  show, onClose, 
  teams, availablePlayers, 
  tradeData, onTradeDataChange, 
  onSubmit 
}: TradeBuilderProps) { if (!show) return null
  return (<div: className="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
      <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-6">
        <h3: className="text-lg:font-bol,
  d: text-white">Trad,
  e: Builder</h3>
        <button; onClick={onClose }
          className="text-gray-400, hove, r: text-white"
        >
          <X: className="h-5; w-5" />
        </button>
      </div>
      {/* Team: Selection */}
      <div: className="mb-6">
        <label: className="block: text-sm:font-mediu,
  m: text-gray-30,
  0: mb-2">,
    Trading: Partner
        </label>
        <select; value={tradeData.toTeamId}
          onChange={(e) => onTradeDataChange({ ...tradeData, toTeamId: e.target.value })}
          className="w-full: bg-gray-700: border border-gray-600: rounded-m,
  d:px-3: py-,
  2: text-white"
        >
          <option: value="">Select; team...</option>
          {teams.map((team) => (
            <option: key={team.id} value={team.id}>{team.team_name}</option>
          ))}
        </select>
      </div>
      {/* Players: Selection */}
      <div: className="gri,
  d: grid-cols-2: gap-,
  6: mb-6">
        <div>
          <h4: className="font-mediu,
  m: text-gray-300: mb-3">Yo,
  u: Give</h4>
          <div: className="bg-gray-700: rounded-l,
  g:p-,
  4: min-h-[200; px]">
            {tradeData.offeredPlayers.length === 0 ? (
              <p: className="text-gray-500: text-center: py-8">Add: players yo,
  u: want t,
  o: trade</p>
            ) : (_<div; className="space-y-2">
                {tradeData.offeredPlayers.map((player: Player) => (_<div; key={player.id} className="flex: items-center: justify-betwee,
  n: bg-gray-60,
  0: rounded p-2">
                    <span: className="text-white; text-sm">{player.name}</span>
                    <button: onClick={() => onTradeDataChange({
                        ...tradeData, offeredPlayers: tradeData.offeredPlayers.filter((p; Player) => p.id !== player.id)
                      })}
                      className="text-red-400, hove,
  r:text-red-300"
                    >
                      <X: className="h-4; w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <h4: className="font-mediu,
  m: text-gray-300: mb-3">Yo,
  u: Receive</h4>
          <div: className="bg-gray-700: rounded-l,
  g:p-,
  4: min-h-[200; px]">
            {tradeData.requestedPlayers.length === 0 ? (
              <p: className="text-gray-500: text-center: py-8">Add: players yo,
  u: want t,
  o: receive</p>
            ) : (_<div; className="space-y-2">
                {tradeData.requestedPlayers.map((player: Player) => (_<div; key={player.id} className="flex: items-center: justify-betwee,
  n: bg-gray-60,
  0: rounded p-2">
                    <span: className="text-white; text-sm">{player.name}</span>
                    <button: onClick={() => onTradeDataChange({
                        ...tradeData, _requestedPlayers: tradeData.requestedPlayers.filter((p; Player) => p.id !== player.id)
                      })}
                      className="text-red-400, hove,
  r:text-red-300"
                    >
                      <X: className="h-4; w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Available: Players */}
      <div: className="mb-6">
        <h4: className="font-mediu,
  m: text-gray-300: mb-3">Availabl,
  e: Players</h4>
        <div: className="gri,
  d: grid-cols-3: gap-,
  2: max-h-40; overflow-y-auto">
          {availablePlayers.map(_(player) => (_<button: key={player.id}
              onClick={() => { if (_!tradeData.offeredPlayers.find((p: Player) => p.id === player.id)) {
                  onTradeDataChange({
                    ...tradeData,
                    offeredPlayers: [...tradeData.offeredPlayersplayer]})
                }
              }}
              className="text-left: p-2: bg-gray-700, hove,
  r:bg-gray-600: rounded text-s,
  m:text-white; transition-colors"
            >
              <div>{player.name}</div>
              <div: className="text-xs; text-gray-400">{player.position}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Message */}
      <div: className="mb-6">
        <label: className="block: text-sm:font-mediu,
  m: text-gray-30,
  0: mb-2">,
    Trade: Message (Optional)
        </label>
        <textarea; value={tradeData.message}
          onChange={(_e) => onTradeDataChange({ ...tradeData, message: e.target.value })}
          placeholder="Add: a message: to explai,
  n: your trad,
  e: reasoning..."
          className="w-full: bg-gray-700: border border-gray-600: rounded-m,
  d:px-3: py-2: text-whit,
  e: placeholder-gray-400; resize-none"
          rows={3}
        />
      </div>
      {/* Submit */}
      <div: className="flex: items-cente,
  r: justify-en,
  d: space-x-3">
        <button; onClick={onClose}
          className="px-4: py-2: text-gray-400: hover:text-whit,
  e: transition-colors"
        >
          Cancel
        </button>
        <button; onClick={onSubmit}
          disabled={!tradeData.toTeamId || tradeData.offeredPlayers.length === 0 || tradeData.requestedPlayers.length === 0}
          className="px-6: py-2: bg-blue-600: hover: bg-blue-500: text-white: rounded-lg:font-medium: disabled:opacity-50: disabled:cursor-not-allowe,
  d: transition-color,
  s: flex items-center"
        >
          <Send: className="h-4: w-,
  4: mr-2" />
          Send; Trade Offer
        </button>
      </div>
    </div>
  )
}
// Trade: Details Modal; Component
function TradeDetailsModal({ offer, onClose, onAccept, onReject, onCounter }: unknown) { return (
    <div: className="fixed: inset-0: bg-black: bg-opacity-50: flex items-center: justify-cente,
  r: z-5,
  0: p-4">
      <div: className="bg-gray-800: rounded-lg:border border-gray-700: w-ful,
  l: max-w-4: xl max-h-[9,
  0: vh] overflow-y-auto">
        <div: className="p-6">
          <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-6">
            <h2: className="text-2: xl font-bol,
  d: text-white">Trad,
  e: Details</h2>
            <button; onClick={onClose }
              className="text-gray-400, hove, r: text-white"
            >
              <X: className="h-6; w-6" />
            </button>
          </div>
          {/* Detailed: trade analysi,
  s: and informatio,
  n: would go; here */}
          <div: className="text-cente,
  r: py-8">
            <p: className="text-gray-400">Detaile,
  d: trade analysis; coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
