/**
 * Live Scoreboard Component
 * Real-time fantasy matchup tracking with live scoring updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWebSocketClient } from '@/lib/websocket/client';

interface TeamScore {
  teamId: string;
  teamName: string;
  ownerName: string;
  totalScore: number;
  projectedScore: number;
  playersPlaying: number;
  playersYetToPlay: number;
  playersFinished: number;
}

interface Matchup {
  matchupId: string;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  isComplete: boolean;
  winProbability: {
    home: number;
    away: number;
  };
}

interface PlayerScore {
  playerId: string;
  name: string;
  position: string;
  team: string;
  currentPoints: number;
  projectedPoints: number;
  gameStatus: 'not_started' | 'in_progress' | 'finished';
  isStarter: boolean;
  positionSlot: string;
}

interface LiveScoreboardProps {
  leagueId: string;
  teamId?: string;
  week?: number;
  view?: 'league' | 'matchup' | 'team';
}

export default function LiveScoreboard({ 
  leagueId, 
  teamId, 
  week,
  view = 'league' 
}: LiveScoreboardProps) {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(week || 1);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const wsClient = getWebSocketClient();
        const token = localStorage.getItem('authToken') || 'mock-token';
        
        await wsClient.connect(token);
        wsClient.joinLeague(leagueId);
        
        // Subscribe to score updates
        wsClient.on('score_update', handleScoreUpdate);
        wsClient.on('matchup_update', handleMatchupUpdate);
        
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    initializeWebSocket();

    return () => {
      const wsClient = getWebSocketClient();
      wsClient.leaveLeague(leagueId);
      wsClient.off('score_update');
      wsClient.off('matchup_update');
    };
  }, [leagueId]);

  // Fetch matchup data
  const fetchMatchups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/matchups?week=${currentWeek}`);
      if (!response.ok) throw new Error('Failed to fetch matchups');
      
      const data = await response.json();
      
      // Transform matchup data with scores
      const enrichedMatchups = await Promise.all(
        data.matchups.map(async (matchup: any) => {
          const scoresResponse = await fetch(`/api/live/scores?leagueId=${leagueId}&week=${currentWeek}`);
          const scoresData = await scoresResponse.json();
          
          const homeTeamScore = scoresData.data.teams.find((t: any) => t.teamId === matchup.home_team_id);
          const awayTeamScore = scoresData.data.teams.find((t: any) => t.teamId === matchup.away_team_id);
          
          return {
            matchupId: matchup.id,
            homeTeam: {
              teamId: matchup.home_team_id,
              teamName: homeTeamScore?.teamName || 'Unknown',
              ownerName: homeTeamScore?.ownerName || 'Unknown',
              totalScore: homeTeamScore?.totalScore || 0,
              projectedScore: matchup.home_projected || 0,
              playersPlaying: 0,
              playersYetToPlay: 0,
              playersFinished: 0
            },
            awayTeam: {
              teamId: matchup.away_team_id,
              teamName: awayTeamScore?.teamName || 'Unknown',
              ownerName: awayTeamScore?.ownerName || 'Unknown',
              totalScore: awayTeamScore?.totalScore || 0,
              projectedScore: matchup.away_projected || 0,
              playersPlaying: 0,
              playersYetToPlay: 0,
              playersFinished: 0
            },
            isComplete: matchup.is_complete,
            winProbability: calculateWinProbability(
              homeTeamScore?.totalScore || 0,
              awayTeamScore?.totalScore || 0,
              matchup.home_projected || 0,
              matchup.away_projected || 0
            )
          };
        })
      );
      
      setMatchups(enrichedMatchups);
      
      // Auto-select user's matchup if teamId provided
      if (teamId) {
        const userMatchup = enrichedMatchups.find(
          m => m.homeTeam.teamId === teamId || m.awayTeam.teamId === teamId
        );
        if (userMatchup) {
          setSelectedMatchup(userMatchup);
        }
      }
    } catch (error) {
      console.error('Error fetching matchups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leagueId, currentWeek, teamId]);

  // Fetch player scores for a team
  const fetchPlayerScores = useCallback(async (teamId: string) => {
    try {
      const response = await fetch(`/api/live/scores?leagueId=${leagueId}&teamId=${teamId}&week=${currentWeek}`);
      if (!response.ok) throw new Error('Failed to fetch player scores');
      
      const data = await response.json();
      setPlayerScores(data.data.players || []);
    } catch (error) {
      console.error('Error fetching player scores:', error);
    }
  }, [leagueId, currentWeek]);

  // Calculate win probability based on current and projected scores
  const calculateWinProbability = (
    homeScore: number, 
    awayScore: number, 
    homeProjected: number, 
    awayProjected: number
  ) => {
    const homeLead = homeScore - awayScore;
    const homeRemaining = Math.max(0, homeProjected - homeScore);
    const awayRemaining = Math.max(0, awayProjected - awayScore);
    
    // Simple probability calculation (can be enhanced with ML)
    const homeExpected = homeScore + homeRemaining * 0.7; // 70% of remaining projected
    const awayExpected = awayScore + awayRemaining * 0.7;
    
    const total = homeExpected + awayExpected;
    if (total === 0) return { home: 50, away: 50 };
    
    return {
      home: Math.round((homeExpected / total) * 100),
      away: Math.round((awayExpected / total) * 100)
    };
  };

  // Handle WebSocket events
  const handleScoreUpdate = (data: any) => {
    setMatchups(prev => {
      return prev.map(matchup => {
        if (matchup.homeTeam.teamId === data.teamId) {
          return {
            ...matchup,
            homeTeam: {
              ...matchup.homeTeam,
              totalScore: matchup.homeTeam.totalScore + data.change
            }
          };
        }
        if (matchup.awayTeam.teamId === data.teamId) {
          return {
            ...matchup,
            awayTeam: {
              ...matchup.awayTeam,
              totalScore: matchup.awayTeam.totalScore + data.change
            }
          };
        }
        return matchup;
      });
    });
  };

  const handleMatchupUpdate = (data: any) => {
    setMatchups(prev => {
      return prev.map(matchup => {
        if (matchup.matchupId === data.matchupId) {
          return {
            ...matchup,
            homeTeam: {
              ...matchup.homeTeam,
              totalScore: data.homeScore
            },
            awayTeam: {
              ...matchup.awayTeam,
              totalScore: data.awayScore
            },
            isComplete: data.isComplete
          };
        }
        return matchup;
      });
    });
  };

  // Auto-refresh
  useEffect(() => {
    fetchMatchups();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMatchups, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchMatchups]);

  // Get score difference display
  const getScoreDifference = (score1: number, score2: number) => {
    const diff = Math.abs(score1 - score2);
    if (diff === 0) return 'TIED';
    return `+${diff.toFixed(1)}`;
  };

  // Get team score color
  const getScoreColor = (isWinning: boolean, isClose: boolean) => {
    if (isWinning) return isClose ? 'text-yellow-400' : 'text-green-400';
    return isClose ? 'text-orange-400' : 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
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
          <h2 className="text-xl font-bold text-white">Live Scoreboard</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className="text-sm text-gray-400">Week {currentWeek}</span>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          {['league', 'matchup'].map(v => (
            <button
              key={v}
              onClick={() => view = v as any}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)} View
            </button>
          ))}
        </div>
      </div>

      {/* Matchups List */}
      <div className="space-y-3">
        {matchups.map(matchup => {
          const homeWinning = matchup.homeTeam.totalScore > matchup.awayTeam.totalScore;
          const isClose = Math.abs(matchup.homeTeam.totalScore - matchup.awayTeam.totalScore) < 10;
          
          return (
            <div
              key={matchup.matchupId}
              className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedMatchup(matchup);
                fetchPlayerScores(teamId || matchup.homeTeam.teamId);
              }}
            >
              <div className="flex justify-between items-center">
                {/* Home Team */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{matchup.homeTeam.teamName}</div>
                      <div className="text-gray-400 text-sm">{matchup.homeTeam.ownerName}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(homeWinning, isClose)}`}>
                        {matchup.homeTeam.totalScore.toFixed(1)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Proj: {matchup.homeTeam.projectedScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Win Probability Bar */}
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${matchup.winProbability.home}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {matchup.winProbability.home}% win probability
                  </div>
                </div>

                {/* VS Divider */}
                <div className="mx-4 text-gray-500 font-medium">VS</div>

                {/* Away Team */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(!homeWinning, isClose)}`}>
                        {matchup.awayTeam.totalScore.toFixed(1)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Proj: {matchup.awayTeam.projectedScore.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-medium text-right">{matchup.awayTeam.teamName}</div>
                      <div className="text-gray-400 text-sm text-right">{matchup.awayTeam.ownerName}</div>
                    </div>
                  </div>
                  
                  {/* Win Probability Bar */}
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                      style={{ width: `${matchup.winProbability.away}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {matchup.winProbability.away}% win probability
                  </div>
                </div>
              </div>

              {/* Score Difference */}
              {matchup.homeTeam.totalScore !== matchup.awayTeam.totalScore && (
                <div className="text-center mt-3">
                  <span className={`text-sm font-medium ${homeWinning ? 'text-blue-400' : 'text-red-400'}`}>
                    {homeWinning ? matchup.homeTeam.teamName : matchup.awayTeam.teamName} leads by{' '}
                    {Math.abs(matchup.homeTeam.totalScore - matchup.awayTeam.totalScore).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Matchup Details */}
      {selectedMatchup && playerScores.length > 0 && (
        <div className="mt-6 bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Player Scores</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Starters */}
            <div>
              <h4 className="text-gray-400 text-sm mb-2">Starting Lineup</h4>
              <div className="space-y-2">
                {playerScores
                  .filter(p => p.isStarter)
                  .map(player => (
                    <div key={player.playerId} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono w-8">
                          {player.positionSlot}
                        </span>
                        <div>
                          <div className="text-white text-sm">{player.name}</div>
                          <div className="text-gray-500 text-xs">
                            {player.team} - {player.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {player.currentPoints.toFixed(1)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Proj: {player.projectedPoints.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bench */}
            <div>
              <h4 className="text-gray-400 text-sm mb-2">Bench</h4>
              <div className="space-y-2">
                {playerScores
                  .filter(p => !p.isStarter)
                  .map(player => (
                    <div key={player.playerId} className="flex justify-between items-center opacity-75">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-mono w-8">BN</span>
                        <div>
                          <div className="text-gray-300 text-sm">{player.name}</div>
                          <div className="text-gray-600 text-xs">
                            {player.team} - {player.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300 font-bold">
                          {player.currentPoints.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}