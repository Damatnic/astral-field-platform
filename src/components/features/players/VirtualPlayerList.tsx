'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { VirtualList, useVirtualList } from '@/components/ui/virtual-list';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button/Button';
import { debounce } from '@/utils/performance';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertCircle,
  Star,
  Plus,
  Minus
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  byeWeek: number;
  projectedPoints: number;
  avgPoints: number;
  rank: number;
  positionRank: number;
  status?: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir';
  trend?: 'up' | 'down' | 'stable';
  ownership?: number;
  isRostered?: boolean;
  price?: number;
}

interface VirtualPlayerListProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  onAddPlayer?: (player: Player) => void;
  onDropPlayer?: (player: Player) => void;
  showActions?: boolean;
  height?: number | string;
  searchTerm?: string;
  selectedPosition?: string;
  sortBy?: 'rank' | 'projected' | 'average' | 'name';
  className?: string;
}

export function VirtualPlayerList({
  players,
  onPlayerClick,
  onAddPlayer,
  onDropPlayer,
  showActions = false,
  height = 600,
  searchTerm = '',
  selectedPosition = 'ALL',
  sortBy = 'rank',
  className = ''
}: VirtualPlayerListProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(term) ||
        player.team.toLowerCase().includes(term)
      );
    }

    // Filter by position
    if (selectedPosition !== 'ALL') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    // Sort players
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.rank - b.rank;
        case 'projected':
          return b.projectedPoints - a.projectedPoints;
        case 'average':
          return b.avgPoints - a.avgPoints;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [players, searchTerm, selectedPosition, sortBy]);

  // Handle player selection
  const togglePlayerSelection = useCallback((playerId: string) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }, []);

  // Get position color
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'RB': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WR': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'TE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'K': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DST': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get status icon
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'questionable':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'doubtful':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'out':
      case 'ir':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  // Render player item
  const renderPlayer = useCallback((player: Player, index: number) => {
    const isSelected = selectedPlayers.has(player.id);
    
    return (
      <div 
        className={`
          group px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 
          transition-colors cursor-pointer
          ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : ''}
        `}
        onClick={() => onPlayerClick?.(player)}
      >
        <div className="flex items-center justify-between">
          {/* Left section - Player info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Rank */}
            <div className="text-center min-w-[40px]">
              <div className="text-xs text-gray-500">#{player.rank}</div>
              <div className="text-sm font-bold text-gray-300">
                {player.positionRank}
              </div>
            </div>

            {/* Player details */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-100">
                  {player.name}
                </span>
                {getStatusIcon(player.status)}
                {player.trend === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                )}
                {player.trend === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="default" 
                  className={`text-xs px-1.5 py-0 ${getPositionColor(player.position)}`}
                >
                  {player.position}
                </Badge>
                <span className="text-xs text-gray-400">{player.team}</span>
                {player.byeWeek && (
                  <span className="text-xs text-gray-500">BYE: {player.byeWeek}</span>
                )}
              </div>
            </div>
          </div>

          {/* Middle section - Stats */}
          <div className="flex items-center gap-6 px-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Proj</div>
              <div className="text-sm font-semibold text-gray-200">
                {player.projectedPoints.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg</div>
              <div className="text-sm font-semibold text-gray-200">
                {player.avgPoints.toFixed(1)}
              </div>
            </div>
            {player.ownership !== undefined && (
              <div className="text-center">
                <div className="text-xs text-gray-500">Own%</div>
                <div className="text-sm font-semibold text-gray-200">
                  {player.ownership}%
                </div>
              </div>
            )}
          </div>

          {/* Right section - Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              {player.isRostered ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDropPlayer?.(player);
                  }}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Drop
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPlayer?.(player);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
              <button
                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayerSelection(player.id);
                }}
              >
                <Star 
                  className={`w-4 h-4 ${
                    isSelected ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedPlayers, onPlayerClick, onAddPlayer, onDropPlayer, showActions, togglePlayerSelection]);

  // Header component
  const renderHeader = useCallback(() => (
    <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-2 z-10">
      <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
        <div className="flex items-center gap-3">
          <div className="min-w-[40px] text-center">Rank</div>
          <div className="flex-1">Player</div>
        </div>
        <div className="flex items-center gap-6 px-4">
          <div className="text-center w-12">Proj</div>
          <div className="text-center w-12">Avg</div>
          {players.some(p => p.ownership !== undefined) && (
            <div className="text-center w-12">Own%</div>
          )}
        </div>
        {showActions && (
          <div className="w-32 text-center">Actions</div>
        )}
      </div>
    </div>
  ), [players, showActions]);

  // Footer component
  const renderFooter = useCallback(() => {
    if (selectedPlayers.size === 0) return null;
    
    return (
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPlayers(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                // Handle bulk action
                console.log('Bulk action for:', Array.from(selectedPlayers));
              }}
            >
              <Trophy className="w-4 h-4 mr-1" />
              Compare
            </Button>
          </div>
        </div>
      </div>
    );
  }, [selectedPlayers]);

  // Loading component
  const renderLoader = useCallback(() => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ), []);

  // Empty state
  const emptyMessage = (
    <div className="text-center py-8">
      <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
      <p className="text-gray-400">No players found</p>
      <p className="text-sm text-gray-500 mt-1">
        Try adjusting your filters or search term
      </p>
    </div>
  );

  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardContent className="p-0">
        <VirtualList
          items={filteredPlayers}
          height={height}
          itemHeight={80}
          renderItem={renderPlayer}
          renderHeader={renderHeader}
          renderFooter={renderFooter}
          renderLoader={renderLoader}
          headerHeight={40}
          footerHeight={selectedPlayers.size > 0 ? 60 : 0}
          overscan={5}
          emptyMessage={emptyMessage}
          className="rounded-lg"
        />
      </CardContent>
    </Card>
  );
}