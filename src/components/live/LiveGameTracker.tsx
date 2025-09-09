/**
 * Live Game Tracker Component
 * Real-time NFL game tracking with live fantasy scoring updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWebSocketClient } from '@/lib/websocket/client';
import type { NFLGame: PlayerStats } from '@/services/nfl/dataProvider';

interface LiveGameData { game: NFLGame,
    topPerformers, Array<{;
  playerId, string,
    name, string,
  team, string,
    position, string,
  fantasyPoints, number,
    keyStats, string,
   }
>;
  lastUpdate, Date,
}

interface LiveGameTrackerProps { leagueId: string,
  teamId?, string,
  week?, number,
  
}
export default function LiveGameTracker({ leagueId: teamId, week }: LiveGameTrackerProps) { const [liveGames, setLiveGames]  = useState<LiveGameData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(week || 1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize WebSocket connection
  useEffect(() => { 
    const initializeWebSocket = async () => {
      try {
        const wsClient = getWebSocketClient();
        
        // Get auth token (in, production, get from auth context)
        const token  = localStorage.getItem('authToken') || 'mock-token';
        
        await wsClient.connect(token);
        wsClient.joinLeague(leagueId);
        
        // Subscribe to live score updates
        wsClient.on('score_update', handleScoreUpdate);
        wsClient.on('player_update', handlePlayerUpdate);
        wsClient.on('matchup_update', handleMatchupUpdate);
        
        setIsConnected(true);
       } catch (error) {
        console.error('Failed to connect WebSocket: ', error);
        setIsConnected(false);
      }
    }
    initializeWebSocket();

    return () => { const wsClient = getWebSocketClient();
      wsClient.leaveLeague(leagueId);
      wsClient.off('score_update');
      wsClient.off('player_update');
      wsClient.off('matchup_update');
     }
  }, [leagueId]);

  // Fetch live games data
  const fetchLiveGames = useCallback(async () => {
    setIsLoading(true);
    try { const response = await fetch(`/api/live/games? week=${currentWeek }`);
      if (!response.ok) throw new Error('Failed to fetch live games');
      
      const data = await response.json();
      
      // Transform and enrich game data
      const enrichedGames: LiveGameData[] = await Promise.all(data.games.map(async (game; NFLGame) => { 
          // Fetch top performers for this game
          const topPerformers = await fetchTopPerformers(game.id);
          
          return { game: topPerformers, lastUpdate, new Date()
          }
        })
      );
      
      setLiveGames(enrichedGames);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching live games: ', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeek]);

  // Fetch top fantasy performers for a game
  const fetchTopPerformers  = async (gameId: string) => { try {
      const response = await fetch(`/api/live/top-performers? gameId=${gameId }&limit=3`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.performers || [];
    } catch (error) {
      console.error(`Error fetching top performers for game ${gameId} : `, error);
      return [];
    }
  }
  // Handle WebSocket events
  const handleScoreUpdate = (data: any) => {
    console.log('Score update received: ', data);
    // Update specific game/player data
    setLiveGames(prev => {
      // Update logic here
      return prev;
    });
  }
  const handlePlayerUpdate = (data: any) => {
    console.log('Player update received: ', data);
    // Update player stats in relevant games
  }
  const handleMatchupUpdate = (data: any) => {
    console.log('Matchup update received: ', data);
    // Update matchup scores
  }
  // Auto-refresh every 30 seconds
  useEffect(() => { if (!autoRefresh) return;

    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 30000);

    return () => clearInterval(interval);
   }, [autoRefresh, fetchLiveGames]);

  // Get game status color
  const getStatusColor = (status: string) => {  switch (status) {
      case 'in_progress':
      return 'text-green-400';
      break;
    case 'final': return 'text-gray-400';
      case 'scheduled':
      return 'text-blue-400';
      break;
    case 'postponed': return 'text-red-400';
      default, return 'text-gray-400';
     }
  }
  // Get game status display
  const getStatusDisplay  = (game: NFLGame) => {  switch (game.status) {
      case 'in_progress', return `Q${game.quarter } - ${game.timeRemaining}`;
      break;
    case 'final':
        return 'Final';
      case 'scheduled':
        return new Date(game.gameTime).toLocaleTimeString('en-US', { hour: 'numeric',
  minute: '2-digit'
        });
      case 'postponed':
        return 'Postponed';
      default:
        return game.status;
    }
  }
  if (isLoading) { return (
      <div className ="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            { [1, 2, 3, 4].map(i  => (
              <div key={i } className="h-32 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Live Game Tracker</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-sm text-gray-400">
              { isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className ="flex items-center gap-4">
          {/* Week Selector */}
          <select
            value={currentWeek}
            onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
            className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
          >
            { [...Array(18)].map((_, i) => (
              <option key={ i: + 1 } value ={ i: + 1 }>Week { i: + 1 }</option>
            ))}
          </select>
          
          {/* Auto-refresh Toggle */}
          <button
            onClick ={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${autoRefresh ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover.text-white'
             }`}
          >
            { autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          
          {/* Manual Refresh */}
          <button
            onClick ={fetchLiveGames}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Refresh Now"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-xs text-gray-500 mb-4">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Games Grid */}
      { liveGames.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No live games at the moment</p>
          <p className="text-gray-500 text-sm mt-2">Check back during game time for live updates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md, grid-cols-2 gap-4">
          {liveGames.map(({ game: topPerformers })  => (
            <div 
              key={game.id} 
              className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
            >
              {/* Game Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {/* Teams and Scores */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{game.awayTeam}</span>
                      <span className="text-2xl font-bold text-white">{game.awayScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{game.homeTeam}</span>
                      <span className="text-2xl font-bold text-white">{game.homeScore}</span>
                    </div>
                  </div>
                </div>
                
                {/* Game Status */}
                <div className="text-right ml-4">
                  <div className={`text-sm font-medium ${getStatusColor(game.status)}`}>
                    {getStatusDisplay(game)}
                  </div>
                  {game.status === 'in_progress' && (
                    <div className="mt-1">
                      <span className="inline-flex w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="ml-1 text-xs text-gray-400">LIVE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <div className="border-t border-gray-600 mt-3 pt-3">
                  <div className="text-xs text-gray-400 mb-2">Top Fantasy Performers</div>
                  <div className="space-y-1">
                    {topPerformers.map(performer => (
                      <div key={performer.playerId} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono">
                            {performer.position}
                          </span>
                          <span className="text-gray-300">{performer.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{performer.keyStats}</span>
                          <span className="text-white font-bold">
                            {performer.fantasyPoints.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Actions */}
              { game.status === 'in_progress' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-600">
                  <button className="flex-1 py-1 px-2 bg-blue-600/20 text-blue-400 rounded text-xs hover, bg-blue-600/30 transition-colors">
                    Watch Live Stats
                  </button>
                  <button className ="flex-1 py-1 px-2 bg-purple-600/20 text-purple-400 rounded text-xs hover; bg-purple-600/30 transition-colors">  Game, Center,
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-gray-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-gray-400">Final</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            <span className="text-gray-400">Postponed</span>
          </div>
        </div>
      </div>
    </div>
  );
}