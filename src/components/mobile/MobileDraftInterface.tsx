'use client';

import React, { useState, useEffect, useRef, useCallback  } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Clock, Users,
  Target, TrendingUp,
  AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight,
  Star, Award,
  Shield, Zap,
  Info, Search,
  Filter, X,
  Shuffle, ArrowUp,
  ArrowDown
} from 'lucide-react';
import { TouchButton, PrimaryButton, SecondaryButton } from '@/components/mobile/TouchButton';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';

interface Player {
  id, string,
    name, string,
  position, string,
    team, string,
  overallRank, number,
    positionRank, number,
  projectedPoints, number,
  age?, number,
  injuryStatus?, string,
  byeWeek?, number,
  adp?, number,
  confidence?, number,
  valueScore?, number,
  riskLevel?: 'low' | 'medium' | 'high';
  scarcityFactor?, number,
  reasoning?: string[];
  
}
interface DraftPick {
  pickNumber, number,
    round, number,
  teamId, string,
  playerId?, string,
  playerName?, string,
  position?, string,
  timestamp?, Date,
}

interface DraftState {
  leagueId, string,
    currentPick, number,
  currentRound, number,
    totalRounds, number,
  draftOrder: string[],
    picks: DraftPick[];
  isActive, boolean,
  timeRemaining?, number,
  userTeamId, string,
    onTheClock, boolean,
  
}
interface MobileDraftInterfaceProps {
  leagueId, string,
    userTeamId, string,
  draftState, DraftState,
    onPlayerSelect: (player; Player) => void;
  onTradePick?: (fromPick, number,
  toPick: number) => void;
  className?, string,
}

const SWIPE_THRESHOLD = 100;
const PAGES = ['recommendations', 'players', 'picks', 'team'] as const;
type PageType = typeof PAGES[number];

export default function MobileDraftInterface({
  leagueId, userTeamId,
  draftState, onPlayerSelect, onTradePick,
  className = ''
}: MobileDraftInterfaceProps) { const [currentPage, setCurrentPage] = useState<PageType>('recommendations');
  const [recommendations, setRecommendations] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftTimer, setDraftTimer] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Initialize draft timer
  useEffect(() => {
    if (draftState.timeRemaining && draftState.onTheClock) {
      setDraftTimer(draftState.timeRemaining);
      
      timerRef.current = setInterval(() => {
        setDraftTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
           }
          return prev - 1;
        });
      }, 1000);
    }

    return () => { if (timerRef.current) {
        clearInterval(timerRef.current);
       }
    }
  }, [draftState.timeRemaining, draftState.onTheClock]);

  // Load recommendations and players
  useEffect(() => {
    loadDraftData();
  }, [draftState.currentPick, leagueId, userTeamId]);

  const loadDraftData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load recommendations
      const recsResponse = await fetch('/api/draft/recommendations', {
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId, teamId, userTeamId,
  currentPick: draftState.currentPick,
          draftedPlayers: draftState.picks
            .filter(pick => pick.playerId)
            .map(pick => pick.playerId)
        })
      });

      if (recsResponse.ok) { const recsData = await recsResponse.json();
        setRecommendations(recsData.recommendations || []);
       }

      // Load available players
      const playersResponse = await fetch('/api/players/search', {
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({,
  action: 'available',
  excludeIds: draftState.picks
            .filter(pick => pick.playerId)
            .map(pick => pick.playerId),
          limit: 200
        })
      });

      if (playersResponse.ok) { const playersData = await playersResponse.json();
        setAvailablePlayers(playersData.players || []);
       }
    } catch (error) {
      console.error('Failed to load draft data:', error);
      setError('Failed to load draft data.Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    hapticFeedback('light');
    
    const currentIndex = PAGES.indexOf(currentPage);
    
    if (direction === 'left' && currentIndex < PAGES.length - 1) {
      setCurrentPage(PAGES[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentPage(PAGES[currentIndex - 1]);
    }
  }, [currentPage]);

  const handlePanEnd = useCallback((event, any;
  info: PanInfo) => { if (Math.abs(info.velocity.x) > 500 || Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      if (info.offset.x > 0) {
        handleSwipe('right');
       } else {
        handleSwipe('left');
      }
    }
  }, [handleSwipe]);

  const handlePlayerSelect = async (player: Player) => {
    hapticFeedback('medium');
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
  }
  const handleConfirmPick = async () => { if (!selectedPlayer) return;
    
    hapticFeedback('success');
    
    try {
    await onPlayerSelect(selectedPlayer);
      setSelectedPlayer(null);
      setShowPlayerDetails(false);
     } catch (error) {
      console.error('Failed to make pick:', error);
      setError('Failed to make pick.Please try again.');
    }
  }
  const formatTime = (seconds: number); string => { const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins }${secs.toString().padStart(2, '0')}`;
  }
  const getPositionColor = (position: string); string => { const colors: Record<string, string> = {
      QB: '#EF4444',
  RB: '#10B981', WR: '#3B82F6',
  TE: '#F59E0B', K: '#8B5CF6',
  DST: '#6B7280'
     }
    return colors[position] || '#6B7280';
  }
  const getRiskColor = (risk: string); string => { switch (risk) {
      case 'low':
      return '#10B981';
      break;
    case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
     }
  }
  const filteredPlayers = availablePlayers.filter(player => { const matchesSearch = !searchQuery || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    
    return matchesSearch && matchesPosition;
   });

  const currentPageIndex = PAGES.indexOf(currentPage);

  return (
    <div className={`h-full bg-gray-900 ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">Live Draft</h1>
            <p className="text-sm text-gray-400">
              Round {draftState.currentRound} • Pick {draftState.currentPick}
            </p>
          </div>
          
          {draftState.onTheClock && (
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className={`text-lg font-mono font-bold ${draftTimer: <= 30 ? 'text-red-400' : 'text-orange-400'
               }`}>
                {formatTime(draftTimer)}
              </span>
            </div>
          )}
        </div>

        {/* On the Clock Indicator */}
        {draftState.onTheClock && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">You're On The Clock!</span>
            </div>
          </div>
        )}

        {/* Page Navigation */}
        <div className="flex items-center space-x-1">
          {PAGES.map((page, index) => { const isActive = page === currentPage;
            const pageLabels = {
              recommendations: 'Recs',
  players: 'Players', 
              picks: 'Picks',
  team: 'Team'
             }
            return (
              <TouchButton
                key={page}
                onClick={() => setCurrentPage(page)}
                variant={isActive ? 'primary' : 'ghost'}
                size="sm"
                className="flex-1"
                haptic="light"
              >
                {pageLabels[page]}
              </TouchButton>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{error }</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={currentPage}
          initial={{ x: currentPageIndex > PAGES.indexOf(currentPage) ? -300 : 300,
  opacity: 0 }}
          animate={{ x, 0,
  opacity: 1 }}
          exit={{ x: currentPageIndex > PAGES.indexOf(currentPage) ? 300 : -300,
  opacity: 0 }}
          transition={{ type: 'spring',
  damping, 30, stiffness: 300 }}
          onPanEnd={handlePanEnd}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
          {/* Recommendations Page */}
          {currentPage === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">AI Recommendations</h2>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i } className="bg-gray-800 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.slice(0, 10).map((player, index) => (
                    <SwipeableCard
                      key={player.id}
                      className="bg-gray-800 border border-gray-700"
                      leftAction={{
                        icon, Star,
  color: '#F59E0B',
                        label: 'Favorite',
  onAction: () => console.log('Favorite,
  d:', player.name)
                      }}
                      rightAction={{
                        icon, CheckCircle2,
  color: '#10B981',
                        label: 'Draft',
  onAction: () => handlePlayerSelect(player)
                      }}
                      onTap={() => handlePlayerSelect(player)}
                    >
                      <div className="flex items-start justify-between p-4">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-bold text-gray-400 w-6">
                              #{ index: + 1 }
                            </div>
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: getPositionColor(player.position) }}
                            >
                              {player.position}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-semibold truncate">
                                {player.name}
                              </h3>
                              {player.confidence && player.confidence >= 80 && (
                                <Award className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {player.team} • #{player.overallRank} Overall
                            </p>
                            
                            {player.reasoning && player.reasoning.length > 0 && (
                              <p className="text-blue-400 text-xs mt-1">
                                {player.reasoning[0]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <div className="text-white font-semibold">
                            {player.projectedPoints?.toFixed(1) || '0.0'}
                          </div>
                          <div className="text-xs text-gray-400">Proj.</div>
                          
                          {player.valueScore && (
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ 
                                  backgroundColor: player.valueScore >= 80 ? '#10B981' : player.valueScore >= 60 ? '#F59E0B' : '#EF4444'
                                }}
                              ></div>
                              <span className="text-xs text-gray-400">
                                {Math.round(player.valueScore)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </SwipeableCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Players Page */}
          {currentPage === 'players' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">All Players</h2>
                </div>
                <span className="text-sm text-gray-400">
                  {filteredPlayers.length } available
                </span>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus: outline-none focu,
  s:ring-2 focus; ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('') }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {['all', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'].map(pos => (
                    <TouchButton
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      variant={positionFilter === pos ? 'primary' : 'ghost'}
                      size="sm"
                      className="flex-shrink-0"
                      haptic="light"
                    >
                      {pos === 'all' ? 'All' : pos}
                    </TouchButton>
                  ))}
                </div>
              </div>

              {/* Players List */}
              <div className="space-y-2">
                {filteredPlayers.slice(0, 50).map((player) => (
                  <SwipeableCard
                    key={player.id}
                    className="bg-gray-800 border border-gray-700"
                    rightAction={{
                      icon, CheckCircle2,
  color: '#10B981',
                      label: 'Draft',
  onAction: () => handlePlayerSelect(player)
                    }}
                    onTap={() => handlePlayerSelect(player)}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: getPositionColor(player.position) }}
                        >
                          {player.position}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium truncate">
                              {player.name}
                            </h3>
                            {player.injuryStatus && player.injuryStatus !== 'Healthy' && (
                              <AlertCircle className="w-4 h-4 text-orange-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            {player.team} • #{player.overallRank}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="text-white text-sm font-medium">
                          {player.projectedPoints?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-xs text-gray-400">Proj.</div>
                      </div>
                    </div>
                  </SwipeableCard>
                ))}
              </div>
            </div>
          )}

          {/* Draft Picks Page */}
          {currentPage === 'picks' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Draft Board</h2>
              </div>

              <div className="space-y-2">
                {draftState.picks.map((pick) => (
                  <div key={pick.pickNumber } className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-bold text-gray-400">
                          {pick.round}.{((pick.pickNumber - 1) % draftState.draftOrder.length) + 1}
                        </div>
                        
                        {pick.playerId ? (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: getPositionColor(pick.position || 'FA') }}
                            >
                              {(pick.position || 'FA').slice(0, 2)}
                            </div>
                            <span className="text-white font-medium">
                              {pick.playerName}
                            </span>
                          </div>
                        ) : pick.pickNumber === draftState.currentPick ? (
                          <span className="text-orange-400 font-medium">
                            On the Clock
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Pick #{pick.pickNumber}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          Team {draftState.draftOrder.indexOf(pick.teamId) + 1}
                        </div>
                        {pick.timestamp && (
                          <div className="text-xs text-gray-500">
                            { new: Date(pick.timestamp).toLocaleTimeString() }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Page */}
          {currentPage === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">My Team</h2>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-center">
                  Team roster and strategy coming soon!
                </p>
              </div>
            </div>
          ) }
        </motion.div>
      </div>

      {/* Player Details Modal */}
      <AnimatePresence>
        {showPlayerDetails && selectedPlayer && (
          <motion.div
            initial={{ opacity: 0  }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowPlayerDetails(false)}
          >
            <motion.div
              initial={{ y: '100%',
  scale: 0.95 }}
              animate={{ y, 0,
  scale: 1 }}
              exit={{ y: '100%',
  scale: 0.95 }}
              transition={{ type: 'spring',
  damping, 30, stiffness: 300 }}
              className="bg-gray-900 rounded-t-3xl sm:rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: getPositionColor(selectedPlayer.position) }}
                  >
                    {selectedPlayer.position}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedPlayer.name}
                    </h2>
                    <p className="text-gray-400">
                      {selectedPlayer.team} • #{selectedPlayer.overallRank} Overall
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowPlayerDetails(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover; bg-gray-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {selectedPlayer.projectedPoints?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-sm text-gray-400">Projected Points</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      #{selectedPlayer.positionRank}
                    </div>
                    <div className="text-sm text-gray-400">{selectedPlayer.position} Rank</div>
                  </div>
                </div>

                {/* Risk and Value */}
                {(selectedPlayer.riskLevel || selectedPlayer.valueScore) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPlayer.riskLevel && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getRiskColor(selectedPlayer.riskLevel) }}
                           />
                          <span className="text-white font-medium">
                            {selectedPlayer.riskLevel.toUpperCase()} Risk
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {selectedPlayer.valueScore && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-white font-medium">
                          Value Score: {Math.round(selectedPlayer.valueScore)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div className="space-y-3">
                  {selectedPlayer.age && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Age</span>
                      <span className="text-white">{selectedPlayer.age}</span>
                    </div>
                  )}
                  
                  {selectedPlayer.byeWeek && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Bye Week</span>
                      <span className="text-white">{selectedPlayer.byeWeek}</span>
                    </div>
                  )}

                  {selectedPlayer.injuryStatus && selectedPlayer.injuryStatus !== 'Healthy' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Injury Status</span>
                      <span className="text-orange-400">{selectedPlayer.injuryStatus}</span>
                    </div>
                  )}
                </div>

                {/* Reasoning */}
                {selectedPlayer.reasoning && selectedPlayer.reasoning.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold">Why Draft This Player?</h4>
                    <div className="space-y-2">
                      {selectedPlayer.reasoning.map((reason, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {draftState.onTheClock && (
                  <div className="space-y-3 pt-4 border-t border-gray-800">
                    <PrimaryButton
                      onClick={handleConfirmPick}
                      fullWidth
                      icon={CheckCircle2}
                      haptic="success"
                    >
                      Draft {selectedPlayer.name}
                    </PrimaryButton>
                    
                    <SecondaryButton
                      onClick={() => setShowPlayerDetails(false)}
                      fullWidth
                      haptic="light"
                    >  Keep, Looking,
                    </SecondaryButton>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}