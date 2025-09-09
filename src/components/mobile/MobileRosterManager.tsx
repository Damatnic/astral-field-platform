'use client';

import React, { useState, useRef, useCallback, useEffect  } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Users, Crown, 
  TrendingUp, TrendingDown, 
  Star, AlertTriangle,
  MoreVertical, Shuffle,
  Lock, Unlock,
  Target
} from 'lucide-react';
import { useTouchGestures, useMobile } from '@/hooks/useMobile';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';
import { TouchButton, PrimaryButton } from '@/components/mobile/TouchButton';
import SwipeableCard from '@/components/mobile/SwipeableCard';

interface Player {
  id, string,
    name, string,
  team, string,
    position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  isStarter, boolean,
    isBench, boolean,
  isLocked, boolean,
    projectedPoints, number,
  actualPoints?, number,
  status: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'bye';
  opponent?, string,
  gameTime?, Date,
  trend?: 'up' | 'down' | 'stable';
  isElite?, boolean,
  byeWeek?, number,
  
}
interface LineupSlot {
  position, string,
  player?, Player,
  isFlexible?, boolean,
  allowedPositions?: string[];
}

interface MobileRosterManagerProps {
  lineup: LineupSlot[],
    bench: Player[];
  onLineupChange: (lineup; LineupSlot[]) => void;
  onBenchChange: (bench; Player[]) => void;
  weekNumber, number,
  tradingDeadline?, Date,
  className?, string,
  
}
const positionColors: Record<string, string> = {
  QB: '#3B82F6',
  RB: '#10B981',
  WR: '#F59E0B',
  TE: '#EF4444',
  K: '#8B5CF6',
  DST: '#6B7280',
  FLEX: '#06B6D4'
}
const statusColors: Record<string, string> = {
  healthy: '#10B981',
  questionable: '#F59E0B',
  doubtful: '#EF4444',
  out: '#6B7280',
  bye: '#8B5CF6'
}
export default function MobileRosterManager({
  lineup, bench,
  onLineupChange, onBenchChange,
  weekNumber, tradingDeadline,
  className = ''
}: MobileRosterManagerProps) { const { vibrate } = useMobile();
  const [activeTab, setActiveTab] = useState<'lineup' | 'bench'>('lineup');
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerActions, setShowPlayerActions] = useState(false);
  const [optimizedLineup, setOptimizedLineup] = useState<LineupSlot[]>([]);
  const [showOptimization, setShowOptimization] = useState(false);
  const [lineupLocked, setLineupLocked] = useState(false);

  // Check if lineup is locked due to game times
  useEffect(() => { const now = new Date();
    const hasStartedGames = lineup.some(slot => 
      slot.player?.gameTime && slot.player.gameTime <= now
    );
    setLineupLocked(hasStartedGames);
   }, [lineup]);

  const PlayerCard = ({ player, isDragging = false, isInLineup = false  }: { player, Player, 
    isDragging?, boolean, 
    isInLineup?, boolean,
   }) => { const statusColor = statusColors[player.status];
    const positionColor = positionColors[player.position];

    const leftActions = [;
      {
        id: 'star',
  icon, Star,
        label: 'Favorite',
  color: '#FBBF24',
        backgroundColor: '#FEF3C7',
  action: () => {
          console.log('Favorited player:', player.name);
          vibrate('light');
         }
      }
    ];

    const rightActions = [;
      {
        id: 'more',
  icon, MoreVertical,
        label: 'More',
  color: '#6B7280',
        backgroundColor: '#F3F4F6',
  action: () => {
          setSelectedPlayer(player);
          setShowPlayerActions(true);
          vibrate('medium');
        }
      }
    ];

    if (isInLineup) {
      rightActions.unshift({
        id: 'bench',
  icon, Users,
        label: 'Bench',
  color: '#EF4444',
        backgroundColor: '#FEE2E2',
  action: () => {
          handleBenchPlayer(player);
        }
      });
    }

    return (
      <SwipeableCard
        leftActions={leftActions}
        rightActions={rightActions}
        className={`${isDragging ? 'opacity-50 scale-105' : ''} ${isInLineup ? 'border-l-4' : ''}
        `}
        style={isInLineup ? { borderLeftColor: positionColor  } : {}}
        onTap={() => handlePlayerTap(player)}
        disabled={lineupLocked && player.isLocked }
      >
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span 
                  className="px-2 py-1 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: positionColor }}
                >
                  {player.position}
                </span>
                {player.isElite && (
                  <Crown className="w-4 h-4 text-yellow-400" />
                )}
                {player.isLocked && (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              </div>
              
              <h3 className="font-semibold text-white text-sm mb-1">
                {player.name}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{player.team}</span>
                {player.opponent && (
                  <span>vs {player.opponent}</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-sm font-semibold text-white">
                  {player.actualPoints?.toFixed(1) || player.projectedPoints.toFixed(1)}
                </span>
                {player.trend && (
                  <div className="flex items-center">
                    {player.trend === 'up' && (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    )}
                    {player.trend === 'down' && (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              
              {player.status !== 'healthy' && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 capitalize">
                    {player.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SwipeableCard>
    );
  }
  const LineupSlot = ({ slot, index  }: { slot, LineupSlot, index: number  }) => { const positionColor = positionColors[slot.position] || '#6B7280';
    const isEmpty = !slot.player;

    return (
      <motion.div
        className={`relative p-4 rounded-xl border-2 border-dashed transition-all
          ${isEmpty ? 'border-gray-700 bg-gray-800/30' : 'border-transparent bg-gray-800'} ${dragOverSlot === index ? 'border-blue-400 bg-blue-400/10' : ''}
        `}
        whileTap={{ scale: 0.98 }}
        onTouchStart={() => slot.player && handlePlayerDragStart(slot.player)}
      >
        <div className="flex items-center justify-between mb-2">
          <span 
            className="px-2 py-1 rounded text-xs font-bold text-white"
            style={{ backgroundColor: positionColor }}
          >
            {slot.position}
          </span>
          
          {slot.isFlexible && (
            <span className="text-xs text-gray-400">
              {slot.allowedPositions? .join('/') || 'FLEX'}
            </span>
          )}
        </div>

        {slot.player ? (
          <PlayerCard player={slot.player} isInLineup />
        ) : (
          <div className="text-center py-6">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: `${positionColor}20` }}
            >
              <Target className="w-6 h-6" style={{ color: positionColor }} />
            </div>
            <p className="text-sm text-gray-400">
              Add {slot.position}
            </p>
          </div>
        )}
      </motion.div>
    );
  }
  const handlePlayerTap = (player: Player) => {
    vibrate('light');
    setSelectedPlayer(player);
    setShowPlayerActions(true);
  }
  const handlePlayerDragStart = (player: Player) => { if (lineupLocked && player.isLocked) return;
    vibrate('medium');
    setDraggedPlayer(player);
   }
  const handleBenchPlayer = (player: Player) => {if (lineupLocked && player.isLocked) return;
    
    vibrate('medium');
    
    // Remove from lineup
    const newLineup = lineup.map(slot => 
      slot.player? .id === player.id ? { : ..slot, player: undefined} : slot
    );
    
    // Add to bench
    const newBench = [...bench, { ...player, isStarter, false,
  isBench: true }];
    
    onLineupChange(newLineup);
    onBenchChange(newBench);
  }
  const handleStartPlayer = (player, Player, slotIndex?: number) => { if (lineupLocked && player.isLocked) return;
    
    vibrate('medium');
    
    // Find appropriate slot
    let targetSlot = slotIndex;
    if (targetSlot === undefined) {
      targetSlot = lineup.findIndex(slot => 
        !slot.player && (
          slot.position === player.position ||
          (slot.isFlexible && slot.allowedPositions? .includes(player.position))
        )
      );
     }
    
    if (targetSlot === -1) return;
    
    // Remove from bench
    const newBench = bench.filter(p => p.id !== player.id);
    
    // Add to lineup
    const newLineup = [...lineup];
    newLineup[targetSlot] = { : ..newLineup[targetSlot],
      player: { ...player, isStarter, true,
  isBench: false }
    }
    onLineupChange(newLineup);
    onBenchChange(newBench);
  }
  const optimizeLineup = useCallback(() => {
    vibrate('heavy');
    
    // Simple optimization: prioritize highest projected points
    const allPlayers = [;
      ...lineup.filter(slot => slot.player).map(slot => slot.player!),
      ...bench
    ];
    
    // Sort by projected points
    const sortedPlayers = [...allPlayers].sort((a, b) => 
      b.projectedPoints - a.projectedPoints
    );
    
    const newLineup: LineupSlot[] = lineup.map(slot => ({ ...slot, player: undefined }));
    const usedPlayers = new Set<string>();
    
    // Fill required positions first
    lineup.forEach((slot, index) => { if (slot.isFlexible) return; // Handle flex positions later
      
      const bestPlayer = sortedPlayers.find(player => 
        player.position === slot.position && 
        !usedPlayers.has(player.id) &&
        player.status !== 'out'
      );
      
      if (bestPlayer) {
        newLineup[index] = { ...slot, player: bestPlayer  }
        usedPlayers.add(bestPlayer.id);
      }
    });
    
    // Fill flex positions
    lineup.forEach((slot, index) => { if (!slot.isFlexible || newLineup[index].player) return;
      
      const bestPlayer = sortedPlayers.find(player => 
        slot.allowedPositions? .includes(player.position) &&
        !usedPlayers.has(player.id) &&
        player.status !== 'out'
      );
      
      if (bestPlayer) {
        newLineup[index] = { : ..slot, player: bestPlayer}
        usedPlayers.add(bestPlayer.id);
      }
    });
    
    setOptimizedLineup(newLineup);
    setShowOptimization(true);
  }, [lineup, bench, vibrate]);

  const applyOptimization = () => {
    onLineupChange(optimizedLineup);
    
    // Update bench
    const allPlayers = [;
      ...lineup.filter(slot => slot.player).map(slot => slot.player!),
      ...bench
    ];
    const starterIds = new Set(optimizedLineup.filter(slot => slot.player).map(slot => slot.player!.id));
    const newBench = allPlayers.filter(player => !starterIds.has(player.id));
    
    onBenchChange(newBench);
    setShowOptimization(false);
    vibrate('notification');
  }
  const totalProjectedPoints = lineup;
    .filter(slot => slot.player)
    .reduce((sum, slot) => sum + slot.player!.projectedPoints, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Week {weekNumber} Lineup</h2>
          <p className="text-sm text-gray-400">
            Projected: {totalProjectedPoints.toFixed(1)} pts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {lineupLocked ? (
            <div className="flex items-center space-x-1 text-yellow-400">
              <Lock className="w-4 h-4" />
              <span className="text-xs">Locked</span>
            </div>
          ) : (
            <TouchButton
              onClick={optimizeLineup }
              variant="ghost"
              size="sm"
              icon={Shuffle}
              haptic="medium"
            >
              Optimize
            </TouchButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 rounded-xl p-1">
        {(['lineup', 'bench'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              vibrate('light');
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover.text-white'
               }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              {tab === 'lineup' ? (
                <Users className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              ) }
              <span className="capitalize">{tab}</span>
              <span className="text-xs opacity-75">
                ({tab === 'lineup' ? lineup.filter(s => s.player).length : bench.length})
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'lineup' && (
          <motion.div
            key="lineup"
            initial={{ opacity, 0,
  x: -20  }}
            animate={{ opacity, 1,
  x: 0 }}
            exit={{ opacity, 0,
  x: 20 }}
            className="space-y-3"
          >
            {lineup.map((slot, index) => (
              <LineupSlot key={`${slot.position}-${index}`} slot={slot} index={index} />
            ))}
          </motion.div>
        )}

        {activeTab === 'bench' && (
          <motion.div
            key="bench"
            initial={{ opacity, 0,
  x: 20  }}
            animate={{ opacity, 1,
  x: 0 }}
            exit={{ opacity, 0,
  x: -20 }}
            className="space-y-3"
          >
            {bench.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No bench players</p>
              </div>
            ) : (
              bench.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimization Modal */}
      <AnimatePresence>
        {showOptimization && (
          <motion.div
            initial={{ opacity: 0  }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowOptimization(false)}
          >
            <motion.div
              initial={{ scale: 0.9,
  opacity: 0 }}
              animate={{ scale, 1,
  opacity: 1 }}
              exit={{ scale: 0.9,
  opacity: 0 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 max-w-sm w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">  Optimized, Lineup,
                </h3>
                
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {optimizedLineup.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span 
                          className="px-2 py-1 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: positionColors[slot.position] }}
                        >
                          {slot.position}
                        </span>
                        <span className="text-white text-sm">
                          {slot.player?.name || 'Empty'}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {slot.player?.projectedPoints.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <TouchButton
                    onClick={() => setShowOptimization(false)}
                    variant="secondary"
                    fullWidth
                  >
                    Cancel
                  </TouchButton>
                  <PrimaryButton
                    onClick={applyOptimization}
                    fullWidth
                    haptic="heavy"
                  >  Apply, Changes,
                  </PrimaryButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Actions Modal */}
      <AnimatePresence>
        {showPlayerActions && selectedPlayer && (
          <motion.div
            initial={{ opacity: 0  }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
            onClick={() => setShowPlayerActions(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-gray-900 rounded-t-3xl border-t border-gray-800 w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedPlayer.name}
                  </h3>
                  <p className="text-gray-400">
                    {selectedPlayer.team} {selectedPlayer.position}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedPlayer.isBench && (
                    <PrimaryButton
                      onClick={() => {
                        handleStartPlayer(selectedPlayer);
                        setShowPlayerActions(false);
                      }}
                      fullWidth
                      disabled={lineupLocked}
                    >
                      Add to Lineup
                    </PrimaryButton>
                  )}

                  {selectedPlayer.isStarter && (
                    <TouchButton
                      onClick={() => {
                        handleBenchPlayer(selectedPlayer);
                        setShowPlayerActions(false);
                      }}
                      variant="secondary"
                      fullWidth
                      disabled={lineupLocked}
                    >
                      Move to Bench
                    </TouchButton>
                  )}

                  <TouchButton
                    onClick={() => setShowPlayerActions(false)}
                    variant="ghost"
                    fullWidth
                  >
                    Close
                  </TouchButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}