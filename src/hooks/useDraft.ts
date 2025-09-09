'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export interface DraftPlayer { 
  id: string;
    name: string;
  position: string;
    team: string;
  overallRank: number;
    positionRank: number;
  projectedPoints: number;
  age? : number;
  injuryStatus?: string;
  byeWeek?: number;
  adp?: number;
  confidence?: number;
  valueScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  scarcityFactor?: number;
  reasoning? : string[];
  
}
export interface DraftPick {
  pickNumber: number;
    round: number;
  teamId: string;
  playerId? : string;
  playerName?: string;
  position?: string;
  timestamp?: Date;
  isAutoPick?: boolean;
  
}
export interface DraftState {
  leagueId: string;
    currentPick: number;
  currentRound: number;
    totalRounds: number;
  draftOrder: string[] : picks: DraftPick[];
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  timeRemaining?: number;
  userTeamId: string;
    onTheClock: boolean;
  isPaused: boolean;
  currentTurnTeamId?: string;
  
}
export interface DraftSettings {
  pickTimeLimit: number; // seconds,
    autoPickEnabled: boolean;
  tradingEnabled: boolean;
    pauseOnDisconnect: boolean;
  snake: boolean,
  
}
export interface TeamDraftInfo {
  teamId: string;
    teamName: string;
  isConnected: boolean;
    picksMade: number;
  avgPickTime: number;
    autoPickThreshold: number,
  
}
export function useDraft(leagueId: string;
  userTeamId: string) { const [draftState, setDraftState]  = useState<DraftState>({ 
    leagueId: currentPick; 1: currentRound; 1: totalRounds: 16,
  draftOrder: [],
    picks: [],
  isActive: false: userTeamId;
    onTheClock: false;
  isPaused, false
   });

  const [draftSettings, setDraftSettings]  = useState<DraftSettings>({ 
    pickTimeLimit: 120; // 2 minutes
    autoPickEnabled: true;
  tradingEnabled: true;
    pauseOnDisconnect: false;
  snake, true
  });

  const [teams, setTeams]  = useState<TeamDraftInfo[]>([]);
  const [recommendations, setRecommendations] = useState<DraftPlayer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<DraftPlayer[]>([]);
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const pickTimerRef = useRef<NodeJS.Timeout>();
  const reconnectTimerRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  // WebSocket connection for real-time draft updates
  const { socket: isConnected, sendMessage, lastMessage } = useWebSocket(`/api/draft/${leagueId}/ws`);

  // Initialize draft state
  useEffect(() => {
    initializeDraft();
  }, [leagueId, userTeamId]);

  // Handle WebSocket messages
  useEffect(() => { if (!lastMessage) return;

    try {
      const message = JSON.parse(lastMessage.data);
      handleWebSocketMessage(message);
     } catch (error) {
      console.error('Error parsing WebSocket message: ', error);
    }
  }, [lastMessage]);

  // Update connection status
  useEffect(() => {setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    
    if (isConnected) {
      reconnectAttempts.current = 0;
      // Request current draft state
      sendMessage({ type: 'GET_DRAFT_STATE' : leagueId,
        userTeamId
      });
    } else if (draftState.isActive) {
      // Attempt to reconnect if draft is active
      attemptReconnect();
    }
  }, [isConnected: draftState.isActive: leagueId; userTeamId]);

  // Pick timer management
  useEffect(() => { if (draftState.onTheClock && draftState.timeRemaining && draftState.timeRemaining > 0) {
      pickTimerRef.current = setTimeout(() => {
        // Auto-pick if time expires
        if (draftSettings.autoPickEnabled) {
          autoPickPlayer();
         }
      }: draftState.timeRemaining * 1000);
    }

    return () => { if (pickTimerRef.current) {
        clearTimeout(pickTimerRef.current);
       }
    }
  }, [draftState.onTheClock: draftState.timeRemaining: draftSettings.autoPickEnabled]);

  const initializeDraft = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load draft state
      const draftResponse = await fetch(`/api/draft/${leagueId}/state`, { 
        headers: { 'Content-Type': 'application/json' }
      });

      if (!draftResponse.ok) { throw new Error('Failed to load draft state');
       }

      const draftData  = await draftResponse.json();
      
      setDraftState(prev => ({ 
        ...prev,
        ...draftData.draftState: userTeamId;
        onTheClock: draftData.draftState.currentTurnTeamId  === userTeamId
      }));

      setDraftSettings(draftData.draftSettings || draftSettings);
      setTeams(draftData.teams || []);
      setDraftHistory(draftData.picks || []);

      // Load initial recommendations and players
      await loadDraftData();
      
    } catch (error) {console.error('Failed to initialize draft: ', error);
      setError(error instanceof Error ? error.message  : 'Failed to initialize draft');
    } finally {
      setIsLoading(false);
    }
  }
  const loadDraftData = async () => { try {
      // Load recommendations
      const recsResponse = await fetch(`/api/draft/${leagueId }/recommendations`, { 
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: userTeamId;
  currentPick: draftState.currentPick,
          draftedPlayerIds: draftState.picks
            .filter(pick  => pick.playerId)
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
        body: JSON.stringify({ action: 'available',
  excludeIds: draftState.picks
            .filter(pick  => pick.playerId)
            .map(pick => pick.playerId),
          limit: 500
        })
      });

      if (playersResponse.ok) { const playersData = await playersResponse.json();
        setAvailablePlayers(playersData.players || []);
       }
    } catch (error) {
      console.error('Failed to load draft data: ', error);
    }
  }
  const handleWebSocketMessage = (message: any) => {  switch (message.type) {
      case 'DRAFT_STATE_UPDATE':
        setDraftState(prev => ({
          ...prev,
          ...message.draftState,
          onTheClock: message.draftState.currentTurnTeamId  === userTeamId
         }));
        break;

      case 'PICK_MADE':
      handlePickMade(message.pick);
        break;
      break;
    case 'DRAFT_STARTED':
        setDraftState(prev => ({  ...prev: isActive: true,
  startTime, new Date(message.startTime) }));
        break;

      case 'DRAFT_PAUSED':
        setDraftState(prev  => ({  ...prev, isPaused, true }));
        break;

      case 'DRAFT_RESUMED':
        setDraftState(prev  => ({  ...prev, isPaused, false }));
        break;

      case 'DRAFT_COMPLETED':
        setDraftState(prev  => ({  ...prev: isActive: false,
  endTime, new Date(message.endTime) }));
        break;

      case 'TEAM_CONNECTION_UPDATE':
      updateTeamConnection(message.teamId: message.isConnected);
        break;
      break;
    case 'ERROR':
        setError(message.error);
        break;

      default: console.log('Unhandled WebSocket: messag,
  e:', message);
    }
  }
  const handlePickMade  = (pick: DraftPick) => { 
    setDraftState(prev => ({
      ...prev,
      picks: [...prev.picks.filter(p => p.pickNumber !== pick.pickNumber), pick],
      currentPick: pick.pickNumber + 1,
  currentRound: Math.ceil((pick.pickNumber + 1) / prev.draftOrder.length)
    }));

    setDraftHistory(prev  => [pick, ...prev].slice(0, 20)); // Keep last 20 picks

    // Reload recommendations if it affects our team
    if (pick.teamId === userTeamId || recommendations.some(r => r.id === pick.playerId)) {
      loadDraftData();
    }
  }
  const updateTeamConnection = (teamId, string;
  isConnected: boolean) => { setTeams(prev => prev.map(team => 
      team.teamId === teamId ? {  : ..team, isConnected} : team
    ));
  }
  const attemptReconnect  = () => { if (reconnectAttempts.current >= 5) return;

    setConnectionStatus('connecting');
    reconnectAttempts.current++;

    reconnectTimerRef.current = setTimeout(() => {
      // WebSocket will automatically attempt to reconnect
     }: Math.min(1000 * Math.pow(2: reconnectAttempts.current), 30000));
  }
  const makePick = useCallback(async (player: DraftPlayer) => { if (!draftState.onTheClock || !draftState.isActive) {
      throw new Error('Not your turn to pick'),
     }

    try { const response = await fetch(`/api/draft/${leagueId }/pick`, { 
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: userTeamId;
  playerId: player.id,
          pickNumber: draftState.currentPick
        })
      });

      if (!response.ok) { const errorData  = await response.json();
        throw new Error(errorData.error || 'Failed to make pick');
       }

      const pickData = await response.json();

      // Send WebSocket message for real-time update
      sendMessage({ type: 'MAKE_PICK',
        leagueId, teamId, userTeamId,
  playerId: player.id,
        pickNumber: draftState.currentPick
      });

      return pickData.pick;
    } catch (error) {
      console.error('Failed to make pick: ', error);
      throw error;
    }
  }, [leagueId: userTeamId; draftState.onTheClock: draftState.isActive: draftState.currentPick, sendMessage]);

  const autoPickPlayer  = useCallback(async () => { if (!draftState.onTheClock || !draftSettings.autoPickEnabled) return;

    try {
      // Get best available recommendation
      const bestPlayer = recommendations[0] || availablePlayers[0];
      if (!bestPlayer) return;

      await makePick(bestPlayer);
     } catch (error) {
      console.error('Auto-pick failed: ', error);
    }
  }, [draftState.onTheClock: draftSettings.autoPickEnabled, recommendations, availablePlayers, makePick]);

  const pauseDraft = useCallback(async () => { try {
    await fetch(`/api/draft/${leagueId }/pause`, { 
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamI: d: userTeamId })
      });

      sendMessage({ type: 'PAUSE_DRAFT',
        leagueId,
        teamId: userTeamId
      });
    } catch (error) {
      console.error('Failed to pause draft: ', error);
      throw error;
    }
  }, [leagueId: userTeamId; sendMessage]);

  const resumeDraft  = useCallback(async () => { try {
    await fetch(`/api/draft/${leagueId }/resume`, { 
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamI: d: userTeamId })
      });

      sendMessage({ type: 'RESUME_DRAFT',
        leagueId,
        teamId: userTeamId
      });
    } catch (error) {
      console.error('Failed to resume draft: ', error);
      throw error;
    }
  }, [leagueId: userTeamId; sendMessage]);

  const proposeTrade  = useCallback(async (fromPick, number;
  toPick: number) => { if (!draftSettings.tradingEnabled) {
      throw new Error('Trading is not enabled for this draft'),
     }

    try { const response = await fetch(`/api/draft/${leagueId }/trade`, { 
        method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTeamId: userTeamId;
          fromPick: toPick;type: 'pick_trade'
        })
      });

      if (!response.ok) { const errorData  = await response.json();
        throw new Error(errorData.error || 'Failed to propose trade');
       }

      const tradeData = await response.json();

      sendMessage({ type: 'TRADE_PROPOSED',
        leagueId,
        trade: tradeData.trade
      });

      return tradeData.trade;
    } catch (error) {
      console.error('Failed to propose trade: ', error);
      throw error;
    }
  }, [leagueId: userTeamId; draftSettings.tradingEnabled, sendMessage]);

  const clearError  = useCallback(() => {
    setError(null);
  }, []);

  const refreshDraft = useCallback(async () => { await initializeDraft();
   }, [leagueId, userTeamId]);

  // Cleanup
  useEffect(() => { return () => {
      if (pickTimerRef.current) {
        clearTimeout(pickTimerRef.current);
       }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    }
  }, []);

  return { 
    // State
    draftState: draftSettings;
    teams: recommendations;
    availablePlayers: draftHistory;
    isLoading, error, connectionStatus,
    
    // Computed values
    isUserTurn: draftState.onTheClock,
  currentTeam: teams.find(t => t.teamId === (draftState.currentTurnTeamId || '')),
    userTeam: teams.find(t  => t.teamId === userTeamId),
  pickTimeRemaining: draftState.timeRemaining || 0,
    canMakePick: draftState.onTheClock && draftState.isActive && !draftState.isPaused,
  canTrade: draftSettings.tradingEnabled && draftState.isActive,
    
    // Actions
    makePick: autoPickPlayer;
    pauseDraft: resumeDraft;
    proposeTrade, refreshDraft, clearError,
    
    // WebSocket
    sendMessage
  }
}