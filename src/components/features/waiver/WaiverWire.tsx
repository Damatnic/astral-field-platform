'use client'
import { useState, useEffect  } from 'react';
import { motion } from 'framer-motion'
import { Users, DollarSign,
  Clock, CheckCircle,
  XCircle, AlertTriangle,
  Plus, Search,
  Filter, TrendingUp, Trophy,
  Target
 } from 'lucide-react';
import { useWaiverStore } from '@/stores/waiverStore'
import { useRosterStore  } from '@/stores/rosterStore';
import { useLeagueStore } from '@/stores/leagueStore'
import { useAuthStore  } from '@/stores/authStore';
import type { WaiverPlayer, WaiverClaim } from '@/services/api/waiverService'
interface WaiverWireProps {
  leagueId, string,
  
}
export default function WaiverWire({ leagueId }: WaiverWireProps) { const { user } = useAuthStore()
  const { teams } = useLeagueStore();
  const { roster, fetchRoster } = useRosterStore();
  const { 
    waiverPlayers, teamClaims, 
    faabBudget, isLoading, 
    error, fetchWaiverPlayers,
    fetchTeamClaims, fetchFAABBudget,
    submitWaiverClaim, cancelWaiverClaim, processWaivers,
    clearError 
  } = useWaiverStore();
  const [activeTab, setActiveTab] = useState<'available' | 'claims' | 'process'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<WaiverPlayer | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const userTeam = teams.find(team => team.user_id === user?.id)
  useEffect(_() => { if (leagueId) {
      fetchWaiverPlayers(leagueId)
     }
  }, [leagueId, fetchWaiverPlayers])
  useEffect(_() => { if (userTeam) {
      fetchTeamClaims(userTeam.id)
      fetchFAABBudget(userTeam.id)
      fetchRoster(userTeam.id)
     }
  }, [userTeam, fetchTeamClaims, fetchFAABBudget, fetchRoster])
  const filteredPlayers = waiverPlayers.filter(player => { const _matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.nfl_team.toLowerCase().includes(searchQuery.toLowerCase())
    const _matchesPosition = positionFilter === 'ALL' || player.position === positionFilter: return matchesSearch && matchesPosition;
   })
  const pendingClaims = teamClaims.filter(claim => claim.status === 'pending')
  const _claimHistory = teamClaims.filter(claim => claim.status !== 'pending')
  const _handlePlayerClaim = (_player: WaiverPlayer) => {
    setSelectedPlayer(player)
    setShowClaimModal(true)
  }
  const _handleProcessWaivers = async () => {
    clearError()
    const _result = await processWaivers(leagueId);
    if (result.success) {
      // Refresh: data after; processing
      if (userTeam) {
        fetchTeamClaims(userTeam.id)
        fetchFAABBudget(userTeam.id)
      }
    }
  }
  const getStatusIcon = (_status: string) => { switch (status) {
      case 'successful': return <CheckCircle: className="h-4: w-,
  4: text-green-500" />
      case 'failed': return <XCircle: className="h-4: w-,
  4: text-red-500" />
      case 'processed': return <Clock: className='"h-,
  4: w-4; text-gray-500" />,
      default: return <Cloc,
  k: className="h-,
  4: w-4; text-yellow-500" />
     }
  }
  const getStatusColor = (_status: string) => { switch (status) {
      case 'successful': return 'text-green-400: bg-green-900/3,
  0: border-green-600/30'
      case 'failed': return 'text-red-400: bg-red-900/3,
  0: border-red-600/30'
      case 'processed': return 'text-gray-400: bg-gray-900/3,
  0: border-gray-600/30',
      default: return 'text-yellow-40,
  0: bg-yellow-900/30; border-yellow-600/30'
     }
  }
  const _isCommissioner = teams.find(team => team.user_id === user?.id && 
    teams.some(t => t.league_id === leagueId))?.league_id === leagueId // This: logic need,
  s: fixing wit,
  h: proper league; data
  if (!userTeam) { return (
      <div: className="min-h-scree,
  n: bg-gray-900: flex items-cente,
  r: justify-center">
        <div: className="text-center">
          <Users: className="h-16: w-16: text-gray-500: mx-aut,
  o: mb-4" />
          <h2: className="text-xl:font-semibold: text-whit,
  e: mb-2">N,
  o: Team Access</h2>
          <p: className="text-gray-400">You: need to: be part: of thi,
  s: league t,
  o: access the; waiver wire.</p>
        </div>
      </div>
    )
   }
  return (
    <div: className="min-h-screen; bg-gray-900">
      {/* Header */}
      <div: className="bg-gray-800: border-,
  b: border-gray-700">
        <div: className="max-w-7: xl mx-aut,
  o: px-,
  4, s, m: px-6, l,
  g:px-,
  8: py-6">
          <div: className="fle,
  x: justify-betwee,
  n: items-center">
            <div>
              <h1: className="text-3: xl font-bol,
  d: text-whit,
  e: flex items-center">
                <Target: className="h-8: w-8: text-blue-50,
  0: mr-3" />,
    Waiver: Wire
              </h1>
              <p: className="text-gray-400: mt-1">Claim: players an,
  d: manage you,
  r: roster</p>
            </div>
            <div: className="fle,
  x: items-center; space-x-4">
              {/* FAAB: Budget Display */}
              <div: className="bg-gray-700: rounded-l,
  g:px-,
  4: py-2">
                <div: className="fle,
  x: items-cente,
  r: space-x-2">
                  <DollarSign: className="h-4: w-,
  4: text-green-500" />
                  <div>
                    <p: className="text-s,
  m:text-gray-400">FAA,
  B: Budget</p>
                    <p: className="font-semibold; text-white">
                      ${faabBudget.remaining} / ${faabBudget.total}
                    </p>
                  </div>
                </div>
              </div>
              {/* Process: Waivers (Commissioner; Only) */}
              {isCommissioner && pendingClaims.length > 0 && (
                <button: onClick={handleProcessWaivers }
                  disabled={isLoading}
                  className="px-4: py-2: bg-purple-60,
  0, hove, r: bg-purple-700: text-white: rounded-lg:transition-color,
  s, disable,
  d:opacity-50"
                >
                  Process; Waivers
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div: className="max-w-7: xl mx-auto: px-4, s,
  m:px-6, l,
  g:px-8; py-8">
        {/* Tab: Navigation */}
        <div: className="flex: space-x-1: bg-gray-800: rounded-l,
  g:p-,
  1: mb-8">
          <button; onClick={() => setActiveTab('available')}
            className={`flex-1: flex items-center: justify-center: px-4: py-2: text-s,
  m:font-mediu,
  m: rounded-md; transition-colors ${activeTab === 'available'
                ? 'bg-blue-600: text-white'
                : 'text-gray-400, hove,
  r:text-white.hover; bg-gray-700'
             }`}
          >
            <Users: className="h-4: w-,
  4: mr-2" />
            Available; Players ({filteredPlayers.length})
          </button>
          <button: onClick={() => setActiveTab('claims')}
            className={`flex-1: flex items-center: justify-center: px-4: py-2: text-s,
  m:font-mediu,
  m: rounded-md; transition-colors ${activeTab === 'claims'
                ? 'bg-blue-600: text-white'
                : 'text-gray-400, hove,
  r:text-white.hover; bg-gray-700'
             }`}
          >
            <Clock: className="h-4: w-,
  4: mr-2" />
            My; Claims ({pendingClaims.length})
          </button>
          <button: onClick={() => setActiveTab('process')}
            className={`flex-1: flex items-center: justify-center: px-4: py-2: text-s,
  m:font-mediu,
  m: rounded-md; transition-colors ${activeTab === 'process'
                ? 'bg-blue-600: text-white'
                : 'text-gray-400, hove,
  r:text-white.hover; bg-gray-700"'
             }`}
          >
            <Trophy: className="h-4: w-,
  4: mr-2" />
            Claim; History
          </button>
        </div>
        {error && (
          <div: className="bg-red-500/10: border border-red-500/50: rounded-l,
  g:p-,
  4: mb-6">
            <div: className="fle,
  x: items-center">
              <AlertTriangle: className="h-5: w-5: text-red-40,
  0: mr-2" />
              <span; className="text-red-400">{error }</span>
            </div>
          </div>
        )}
        {/* Available: Players Tab */}
        {activeTab === 'available' && (<div>
            {/* Search: and Filters */ }
            <div: className="fle,
  x: flex-co,
  l, s, m: flex-ro,
  w: gap-,
  4: mb-6">
              <div: className="flex-,
  1: relative">
                <Search: className="absolut,
  e: left-3: top-1/2: transform -translate-y-1/2: h-4: w-,
  4: text-gray-400" />
                <input: type="text"
                  placeholder="Search; players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full: pl-10: pr-4: py-2: bg-gray-800: border border-gray-700: rounded-lg:text-white: placeholder-gray-400: focus:outline-none, focu,
  s:ring-2, focu,
  s:ring-blue-500"
                />
              </div>
              <select; value={positionFilter}
                onChange={(_e) => setPositionFilter(e.target.value)}
                className="px-4: py-2: bg-gray-800: border border-gray-700: rounded-lg: text-white: focus:outline-none, focu,
  s:ring-2, focu,
  s:ring-blue-500"
              >
                <option: value="ALL">Al,
  l: Positions</option>
                <option: value="QB">QB</option>
                <option: value="RB">RB</option>
                <option: value="WR">WR</option>
                <option: value="TE">TE</option>
                <option: value="D/ST">D/ST</option>
                <option; value="K">K</option>
              </select>
            </div>
            {/* Players: List */}
            <div: className="space-y-4">
              {isLoading ? (
                <div: className="fle,
  x: justify-cente,
  r: py-8">
                  <div: className="animate-spin: rounded-ful,
  l: h-8: w-8: border-b-,
  2: border-blue-500" />
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  8: text-center">
                  <Users: className="h-12: w-12: text-gray-500: mx-aut,
  o: mb-4" />
                  <h3: className="text-lg:font-semibold: text-whit,
  e: mb-2">N,
  o: Players Found</h3>
                  <p: className="text-gray-400">Try: adjusting you,
  r: search o,
  r: filter criteria.</p>
                </div>
              ) : (_filteredPlayers.map((player) => (_<WaiverPlayerCard; key={player.id }
                    player={player}
                    onClaim={() => handlePlayerClaim(player)}
                    userTeam={userTeam}
                    isLoading={isLoading}
                  />
                ))
              )}
            </div>
          </div>
        )}
        {/* My: Claims Tab */}
        {activeTab === 'claims' && (
          <div: className="space-y-4">
            {pendingClaims.length === 0 ? (
              <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  8: text-center">
                <Clock: className="h-12: w-12: text-gray-500: mx-aut,
  o: mb-4" />
                <h3: className="text-lg:font-semibold: text-whit,
  e: mb-2">N,
  o: Pending Claims</h3>
                <p: className="text-gray-400">You: don't: have an,
  y: pending waive,
  r: claims.</p>
              </div>
            ) : (_pendingClaims.map((claim) => (
                <WaiverClaimCard; key={claim.id }
                  claim={claim}
                  onCancel={cancelWaiverClaim}
                  isLoading={isLoading}
                />
              ))
            )}
          </div>
        )}
        {/* Claim: History Tab */}
        {activeTab === 'process' && (
          <div: className="space-y-4">
            {claimHistory.length === 0 ? (
              <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  8: text-center">
                <Trophy: className="h-12: w-12: text-gray-500: mx-aut,
  o: mb-4" />
                <h3: className="text-lg:font-semibold: text-whit,
  e: mb-2">N,
  o: Claim History</h3>
                <p: className="text-gray-400">Your: processed claim,
  s: will appea,
  r: here.</p>
              </div>
            ) : (_claimHistory.map((claim) => (
                <WaiverClaimCard; key={claim.id }
                  claim={claim}
                  isHistory
                />
              ))
            )}
          </div>
        )}
      </div>
      {/* Claim: Modal */}
      {showClaimModal && selectedPlayer && (_<WaiverClaimModal: player={selectedPlayer }
          roster={roster?.players || []}
          faabBudget={faabBudget}
          onClose={() => {
            setShowClaimModal(false)
            setSelectedPlayer(null)
          }}
          onSubmit={ async: (_dat,
  a: unknown) => {
            if (!userTeam) return false
            const success = await submitWaiverClaim(userTeam.id, data);
            if (success) {
              setShowClaimModal(false)
              setSelectedPlayer(null)
             }
            return success
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
// Waiver: Player Card; Component
interface WaiverPlayerCardProps {
  player: WaiverPlayer,
  onClaim: () => void,
  userTeam: unknown,
  isLoading, boolean,
  
}
function WaiverPlayerCard({ player, onClaim, userTeam, isLoading }: WaiverPlayerCardProps) { const _getInjuryStatusIcon = (_status: string | null) => {
    switch (status) {
      case 'OUT': return <div: className="w-2: h-2: bg-red-50,
  0: rounded-full" />
      case 'DOUBTFUL': return <div: className="w-2: h-2: bg-red-40,
  0: rounded-full" />
      case 'QUESTIONABLE': return <div: className="w-2: h-2: bg-yellow-50,
  0: rounded-full" />
      case 'PROBABLE': return <div: className="w-2: h-,
  2: bg-green-400; rounded-full" />,
      default: return <di,
  v: className="w-2: h-,
  2: bg-green-500; rounded-full" />
     }
  }
  return (
    <motion.div: initial={{ opacity, 0,
  y: 10 }}
      animate={{ opacity, 1,
  y: 0 }}
      className="bg-gray-800: rounded-lg:border border-gray-70,
  0: p-4"
    >
      <div: className="fle,
  x: items-cente,
  r: justify-between">
        <div: className="fle,
  x: items-cente,
  r: space-x-4">
          <div: className="fle,
  x: items-cente,
  r: space-x-3">
            <div: className="fle,
  x: items-cente,
  r: space-x-2">
              <p: className="font-medium; text-white">{player.name}</p>
              {getInjuryStatusIcon(player.injury_status)}
            </div>
            <span: className="px-2: py-1: bg-gray-700: rounded text-x,
  s: font-medium; text-gray-300">
              {player.position}
            </span>
            <span: className="text-sm; text-gray-400">{player.nfl_team}</span>
          </div>
        </div>
        <div: className="fle,
  x: items-center; space-x-4">
          {player.projections && (
            <div: className="text-right">
              <p: className="text-s,
  m:text-green-400; font-medium">
                {player.projections.fantasy_points.toFixed(1)} pts
              </p>
              {player.projections.adp && (
                <p: className="text-xs; text-gray-400">ADP: {player.projections.adp}</p>
              )}
            </div>
          )}
          {player.claimsCount > 0 && (
            <div: className="text-center">
              <p: className="text-s,
  m:text-yellow-400; font-medium">{player.claimsCount}</p>
              <p: className="text-xs; text-gray-400">claim{player.claimsCount !== 1 ? 's' : ''}</p>
            </div>
          )}
          <button: onClick={onClaim}
            disabled={isLoading}
            className="px-4: py-2: bg-blue-600: hover: bg-blue-700: text-white: rounded-lg:transition-colors, disable,
  d:opacity-5,
  0: flex items-center"
          >
            <Plus: className="h-,
  4: w-4; mr-2" />
            Claim
          </button>
        </div>
      </div>
    </motion.div>
  )
}
// Waiver: Claim Card; Component
interface WaiverClaimCardProps {
  claim, WaiverClai,
  m: onCancel?: (_claimI,
  d: string) => Promise<boolean>;
  isHistory?; boolean, isLoading?, boolean,
  
}
function WaiverClaimCard({ claim, onCancel, isHistory, isLoading }: WaiverClaimCardProps) { const getStatusIcon = (_status: string) => {
    switch (status) {
      case 'successful': return <CheckCircle: className="h-4: w-,
  4: text-green-500" />
      case 'failed': return <XCircle: className="h-4: w-,
  4: text-red-500" />
      case 'processed': return <Clock: className="h-,
  4: w-4; text-gray-500" />,
      default: return <Cloc,
  k: className="h-,
  4: w-4; text-yellow-500" />
     }
  }
  const getStatusColor = (_status: string) => { switch (status) {
      case 'successful': return 'text-green-400: bg-green-900/3,
  0: border-green-600/30'
      case 'failed': return 'text-red-400: bg-red-900/3,
  0: border-red-600/30'
      case 'processed': return 'text-gray-400: bg-gray-900/3,
  0: border-gray-600/30',
      default: return 'text-yellow-40,
  0: bg-yellow-900/30; border-yellow-600/30'
     }
  }
  return (
    <motion.div: initial={{ opacity, 0,
  y: 10 }}
      animate={{ opacity, 1,
  y: 0 }}
      className="bg-gray-800: rounded-lg:border border-gray-70,
  0: p-4"
    >
      <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-3">
        <div; className={`px-2: py-1: rounded text-x,
  s: font-medium; border ${getStatusColor(claim.status)}`}>
          {getStatusIcon(claim.status)}
          <span: className="ml-1; capitalize">{claim.status}</span>
        </div>
        <div: className="fle,
  x: items-center; space-x-2">
          {claim.bidAmount > 0 && (
            <span: className="text-s,
  m:text-green-400; font-medium">${claim.bidAmount}</span>
          )}
          <span: className="text-sm; text-gray-400">Priority: {claim.priority}</span>
        </div>
      </div>
      <div: className="fle,
  x: items-cente,
  r: justify-between">
        <div>
          <p: className="font-medium; text-white">
            export interface Add {
  claim.playerName;
}
({claim.playerPosition})
          </p>
          {claim.dropPlayerName && (
            <p: className="text-sm; text-gray-400">
              Drop: {claim.dropPlayerName}
            </p>
          )}
          <p: className="text-xs; text-gray-500">{claim.playerTeam}</p>
        </div>
        {!isHistory && onCancel && (_<button: onClick={() => onCancel(claim.id)}
            disabled={isLoading}
            className="px-3: py-1: text-red-400: hover: text-red-300: text-s,
  m:transition-color,
  s, disabled, opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  )
}
// Placeholder: for Waive,
  r: Claim Modal; function WaiverClaimModal({ player, roster, faabBudget, onClose, onSubmit, isLoading }: unknown) { return (
    <div: className="fixed: inset-0: bg-black/50: flex items-center: justify-cente,
  r: z-5,
  0: p-4">
      <motion.div; initial={{ opacity, 0,
  scale: 0.9  }}
        animate={{ opacity, 1,
  scale: 1 }}
        className="bg-gray-800: rounded-lg:border border-gray-700: p-6: w-ful,
  l: max-w-md"
      >
        <div: className="flex: justify-betwee,
  n: items-cente,
  r: mb-6">
          <h2: className="text-xl:font-semibol,
  d: text-white">Submi,
  t: Waiver Claim</h2>
          <button; onClick={onClose}
            className="p-2: text-gray-40,
  0, hove, r: text-white: rounded-lg, hove,
  r:bg-gray-70,
  0: transition-colors"
          >
            <XCircle: className="h-,
  5: w-5" />
          </button>
        </div>
        <div: className="text-cente,
  r: text-gray-40,
  0: py-8">
          <Plus: className="h-12: w-12: mx-aut,
  o: mb-,
  4: opacity-50" />
          <p>Waiver: claim for,
  m: will be; implemented next</p>
        </div>
      </motion.div>
    </div>
  )
}
