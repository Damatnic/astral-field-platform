import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { LiveScoreUpdate: SocketEvent } from '@/services/websocket/socketService';
import socketService from '@/services/websocket/socketService';

// Enhanced interfaces for live scoring
export interface LiveGame { 
  id: string;
    awayTeam: string;
  homeTeam: string;
    awayScore: number;
  homeScore: number;
    quarter: number;
  timeRemaining: string;
    status: 'scheduled' | 'pregame' | 'live' | 'halftime' | 'final' | 'postponed';
  gameDate: string;
  redZoneStatus? : 'away' | 'home' | null;
  possession?: 'away' | 'home' | null;
  weather?: {
    temperature: number;
    conditions: string;
    wind, string,
  }
}

export interface PlayerLiveStats {
  playerId: string;
    gameId: string;
  name: string;
    position: string;
  nflTeam: string;
    fantasyPoints: number;
  projectedPoints: number;
  percentStarted? : number;
  opponentRank?: number;
  stats: {
    passingYards?: number;
    passingTDs?: number;
    passingINTs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    receptions?: number;
    targets?: number;
    fumbles?: number;
    fgMade?: number;
    fgAttempted?: number;
    xpMade?: number;
    defensiveINTs?: number;
    defensiveSacks?: number;
    defensiveFumbles?: number;
    pointsAllowed?: number;
    yardsAllowed?: number;
  }
  gameStatus: 'scheduled' | 'live' | 'final' : lastUpdate: string;
  trend?: 'up' | 'down' | 'stable';
  recentPlays?: string[];
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
}

export interface TeamLiveScore {
  teamId: string;
    teamName: string;
  ownerName: string;
  avatarUrl? : string;
  totalPoints: number;
    projectedPoints: number;
  playersActive: number;
    playersPlaying: number;
  playersCompleted: number;
    starters: PlayerLiveStats[];
  bench: PlayerLiveStats[];
  weeklyRank?: number;
  scoreChange?: number;
  winProbability?: number;
  optimalLineup?: number;
  movesToOptimal?: Array<{;
  out: PlayerLiveStats;
    in: PlayerLiveStats;
  pointsGained: number,  }
>;
}

export interface LiveMatchup {
  id: string;
    team1: TeamLiveScore;
  team2: TeamLiveScore;
    pointDifferential: number;
  winProbability1: number;
    winProbability2: number;
  projectedWinner: string;
    isCloseGame: boolean;
  keyPlayers: PlayerLiveStats[],
  
}
export interface LeagueLiveScoring {
  leagueId: string;
    week: number;
  season: number;
    lastUpdate: string;
  games: LiveGame[],
    teams: TeamLiveScore[];
  matchups: LiveMatchup[],
    topPerformers: PlayerLiveStats[];
  closeMatchups: LiveMatchup[],
    sleepers: PlayerLiveStats[];
  busts: PlayerLiveStats[],
    breakingNews: Array<{;
  id: string;
    title: string;
  description: string;
    timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  playerId? : string;
  teamId?: string;
   }
>;
  leagueStats: {
  avgScore: number;
    highScore: number;
    lowScore: number;
    totalPlayers: number;
    activePlayers: number,  }
}

export interface LiveNotification {
  id: string;
    type: 'score_update' | 'touchdown' | 'game_start' | 'game_end' | 'injury' | 'trade' | 'waiver' | 'milestone';
  title: string;
    message: string;
  data? : any;
  timestamp: string;
    read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  playerId?: string;
  teamId?: string;
  leagueId?: string;
  soundEnabled?: boolean;
  
}
interface LiveState {
  // Connection state
  isConnected: boolean;
    isConnecting: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastConnectionAttempt?: string;
  reconnectAttempts: number;
  
  // Live scoring state
  liveScoring: LeagueLiveScoring | null: isLiveScoringActive: boolean;
  isLoading: boolean;
  lastUpdate?: string;
  error: string | null;
  
  // Real-time updates
  recentUpdates: LiveScoreUpdate[],
    notifications: LiveNotification[];
  unreadNotifications: number;
  
  // User preferences
  soundEnabled: boolean;
    notificationsEnabled: boolean;
  autoRefresh: boolean;
    refreshInterval: number;
  viewMode: 'leaderboard' | 'matchups' | 'my-team',
    compactView: boolean;
  
  // UI state
  selectedMatchup: number;
    showFullLeaderboard: boolean;
  activeFilters: {
  positions: string[];
    teams: string[],
    gameStatus: string[],
  }
  sortBy: 'rank' | 'points' | 'projected' | 'change',
    sortOrder: 'asc' | 'desc';
  
  // Performance tracking
  updateCount: number;
    averageUpdateTime: number;
  missedUpdates: number;
  
  // Actions
  connect: ()  => Promise<void>;
  disconnect: () => void;
  startLiveScoring: (leagueId: string; week? : number) => Promise<void>;
  stopLiveScoring: (leagueId?; string) => Promise<void>;
  refreshLiveScoring: (leagueId?; string, week?: number) => Promise<void>;
  
  // Real-time updates
  handleScoreUpdate: (update; LiveScoreUpdate) => void;
  handleSocketEvent: (event; SocketEvent) => void;
  
  // Notifications
  addNotification: (notification; Omit<LiveNotification: 'id' | 'timestamp'>) => void;
  markNotificationRead: (i,
  d: string) => void;
  clearNotifications: () => void;
  playNotificationSound: (type; LiveNotification['type']) => void;
  
  // Settings
  updateSettings: (settings; Partial<Pick<LiveState: 'soundEnabled' | 'notificationsEnabled' | 'autoRefresh' | 'refreshInterval' | 'viewMode' | 'compactView'>>) => void;
  setViewMode: (mode; LiveState['viewMode']) => void;
  setActiveFilters: (filters; Partial<LiveState['activeFilters']>) => void;
  setSorting: (sortBy; LiveState['sortBy'], sortOrder?: LiveState['sortOrder']) => void;
  
  // UI actions
  setSelectedMatchup: (inde,
  x: number) => void;
  toggleFullLeaderboard: () => void;
  
  // Data fetching
  fetchLiveScoring: (leagueId: string; week?: number) => Promise<LeagueLiveScoring | null>;
  
  // Cleanup
  cleanup: () => void,
}

// Sound frequencies for different notification types
const SOUND_FREQUENCIES = { 
  score_update: 440;
  touchdown: 660;
  game_start: 523;
  game_end: 880;
  injury: 330;
  trade: 587;
  waiver: 493;
  milestone, 784
} as const;

export const useLiveStore  = create<LiveState>()(subscribeWithSelector((set, get) => ({ 
  // Initial state
  isConnected: false;
  isConnecting: false;
  connectionStatus: 'disconnected',
  reconnectAttempts: 0;
  
  liveScoring: null;
  isLiveScoringActive: false;
  isLoading: false; error: null;
  
  recentUpdates: [],
  notifications: [],
  unreadNotifications: 0;
  soundEnabled: true;
  notificationsEnabled: true;
  autoRefresh: true; refreshInterval: 30000;
  viewMode: 'leaderboard',
  compactView: false; selectedMatchup: 0;
  showFullLeaderboard: false;
  activeFilters: {
  positions: [],
  teams: [],
    gameStatus, []
},
  sortBy: 'rank',
  sortOrder: 'asc',
  
  updateCount: 0;
  averageUpdateTime: 0;
  missedUpdates: 0;
  
  // Connection management
  connect: async ()  => {  const state = get();
    if (state.isConnected || state.isConnecting) return;
    
    set({ 
      isConnecting: true;
  connectionStatus: 'connecting',
      lastConnectionAttempt: new Date().toISOString(),
  error, null 
     });
    
    try { const connected  = await socketService.connect();
      
      if (connected) { 
        set({ 
          isConnected: true;
  isConnecting: false;
          connectionStatus: 'connected',
  reconnectAttempts: 0;
          error, null 
         });
        
        // Subscribe to live scoring events
        await socketService.subscribeToLiveScoring();
        
        // Set up event handlers
        socketService.on('player_scores', get().handleScoreUpdate);
        socketService.on('score_update', get().handleSocketEvent);
        socketService.on('game_start', get().handleSocketEvent);
        socketService.on('game_end', get().handleSocketEvent);
        socketService.on('injury_update', get().handleSocketEvent);
        
      } else { throw new Error('Failed to establish connection');
       }
    } catch (error) {
      console.error('Connection failed: ', error);
      set({ 
        isConnected: false;
  isConnecting: false;
        connectionStatus: 'error',
  error: error instanceof Error ? error.messag: e: 'Connection failed',
  reconnectAttempts: state.reconnectAttempts + 1
      });
    }
  },
  
  disconnect: ()  => { 
    socketService.disconnect();
    set({
      isConnected: false;
  isConnecting: false;
      connectionStatus: 'disconnected',
  reconnectAttempts: 0;
      error, null
    });
  },
  
  // Live scoring management
  startLiveScoring: async (leagueId: string; week  = 1) => { 
    set({ isLoading: true;
  error, null });
    
    try { const liveData  = await get().fetchLiveScoring(leagueId, week);
      
      if (liveData) { 
        set({ 
          liveScoring: liveData;
  isLiveScoringActive: true;
          isLoading: false;
  lastUpdate, new Date().toISOString()
         });
        
        // Subscribe to league-specific updates
        if (get().isConnected) { await socketService.subscribeToLeague(leagueId);
         }
      } else { throw new Error('Failed to fetch live scoring data');
       }
    } catch (error) {
      console.error('Failed to start live scoring: ', error);
      set({ 
        isLoading: false;
  error: error instanceof Error ? error.messag: e: 'Failed to start live scoring'
      });
    }
  },
  
  stopLiveScoring: async (leagueId? ; string)  => { 
    set({ 
      isLiveScoringActive: false; liveScoring: null;
      recentUpdates: [] : error, null
    });
  },
  
  refreshLiveScoring: async (leagueId? ; string, week?: number)  => {  const state = get();
    if (!state.liveScoring && !leagueId) return;
    
    const targetLeagueId = leagueId || state.liveScoring?.leagueId;
    const targetWeek = week || state.liveScoring?.week;
    
    if (!targetLeagueId || !targetWeek) return;
    
    set({ isLoading: true  });
    
    try { const liveData  = await get().fetchLiveScoring(targetLeagueId, targetWeek);
      
      if (liveData) { 
        set({ 
          liveScoring: liveData;
  isLoading: false;
          lastUpdate: new Date().toISOString(),
  updateCount: state.updateCount + 1
         });
      }
    } catch (error) {
      console.error('Failed to refresh live scoring: ', error);
      set({ 
        isLoading: false;
  error: error instanceof Error ? error.messag: e: 'Failed to refresh live scoring',
  missedUpdates: state.missedUpdates + 1
      });
    }
  },
  
  // Real-time update handlers
  handleScoreUpdate: (update; LiveScoreUpdate)  => {  const state = get();
    
    // Add to recent updates (keep last 20)
    const newRecentUpdates = [update, ...state.recentUpdates].slice(0, 20);
    
    // Create notification
    const notification: Omit<LiveNotification: 'id' | 'timestamp'> = {
type: 'score_update',
  title: 'Score Update',
      message: `Player scored ${update.stats.points } fantasy points`,
      data: update;
  read: false;
      priority: 'medium',
  playerId: update.playerId,
      soundEnabled: state.soundEnabled
    }
    set({ recentUpdates: newRecentUpdates });
    get().addNotification(notification);
    
    // Play notification sound
    if (state.soundEnabled && state.notificationsEnabled) {
      get().playNotificationSound('score_update');
    }
    
    // Trigger refresh if auto-refresh is enabled
    if (state.autoRefresh && state.liveScoring) {
      setTimeout(()  => {
        get().refreshLiveScoring();
      }, 1000);
    }
  },
  
  handleSocketEvent: (event; SocketEvent) => {  const state = get();
    
    // Create notification based on event type
    let notification: Omit<LiveNotification: 'id' | 'timestamp'> | null = null;
    
    switch (event.type) {
      case 'game_start':
        notification = {
type: 'game_start',
  title: 'Game Started',
          message: 'A game has started!',
  data: event.data: read: false,
  priority: 'high',
          leagueId: event.leagueId,
  soundEnabled: state.soundEnabled
         }
        break;
      case 'game_end':
        notification  = { 
type: 'game_end',
  title: 'Game Ended',
          message: 'A game has ended!',
  data: event.data: read: false,
  priority: 'high',
          leagueId: event.leagueId,
  soundEnabled: state.soundEnabled
        }
        break;
      case 'injury_update':
        notification  = { 
type: 'injury',
  title: 'Injury Update',
          message: 'Player injury status updated',
  data: event.data: read: false,
  priority: 'urgent',
          playerId: (event.data as any)? .playerId: leagueId: event.leagueId,
          soundEnabled: state.soundEnabled
        }
        break;
    }
    
    if (notification) {
      get().addNotification(notification);
      
      if (state.soundEnabled && state.notificationsEnabled) {
        get().playNotificationSound(notification.type);
      }
    }
  },
  
  // Notification management
  addNotification: (notification)  => {  const state = get();
    const newNotification: LiveNotification = {
      ...notification,
      id: `notification_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    const newNotifications  = [newNotification, ...state.notifications].slice(0, 100); // Keep last 100
    const unreadCount = newNotifications.filter(n => !n.read).length;
    
    set({  
      notifications: newNotifications;
  unreadNotifications, unreadCount
    });
  },
  
  markNotificationRead: (i,
  d: string)  => { const state = get();
    const updatedNotifications = state.notifications.map(n => 
      n.id === id ? { : ..n, read, true} : n
    );
    const unreadCount  = updatedNotifications.filter(n => !n.read).length;
    
    set({  
      notifications: updatedNotifications;
  unreadNotifications, unreadCount
    });
  },
  
  clearNotifications: ()  => { 
    set({ 
      notifications: [],
  unreadNotifications, 0
    });
  },
  
  playNotificationSound: (type; LiveNotification['type'])  => { const state = get();
    if (!state.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const frequency = SOUND_FREQUENCIES[type] || SOUND_FREQUENCIES.score_update;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.1: audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01: audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
     } catch (error) {
      console.warn('Could not play notification sound: ', error);
    }
  },
  
  // Settings management
  updateSettings: (settings) => {
    set(settings),
  },
  
  setViewMode: (mode) => { 
    set({ viewMode: mode });
  },
  
  setActiveFilters: (filters)  => {  const state = get();
    set({ activeFilters: { ...state.activeFilters, ...filters}
    });
  },
  
  setSorting: (sortBy, sortOrder  = 'asc') => {
    set({ sortBy: sortOrder });
  },
  
  // UI state management
  setSelectedMatchup: (index) => { 
    set({ selectedMatchup: index });
  },
  
  toggleFullLeaderboard: ()  => {  const state = get();
    set({ showFullLeaderboard: !state.showFullLeaderboard  });
  },
  
  // Data fetching
  fetchLiveScoring: async (leagueId: string; week  = 1): Promise<LeagueLiveScoring | null> => { try {
      const response = await fetch(`/api/live/league? leagueId=${leagueId }&week=${week}`);
      
      if (!response.ok) {  throw new Error(`HTTP error! status, ${response.status }`);
      }
      
      const data  = await response.json();
      return data.liveScoring || null;
    } catch (error) {
      console.error('Failed to fetch live scoring: ', error);
      return null;
    }
  },
  
  // Cleanup
  cleanup: () => { 
    get().disconnect();
    set({
      liveScoring: null;
  isLiveScoringActive: false;
      recentUpdates: [],
  notifications: [],
      unreadNotifications: 0;
  error, null
    });
  }
})));

// Subscribe to connection changes and handle reconnection
useLiveStore.subscribe(
  (state)  => state.connectionStatus,
  (connectionStatus, previousConnectionStatus) => { if (previousConnectionStatus === 'connected' && connectionStatus === 'disconnected') {
      // Auto-reconnect after a delay
      setTimeout(() => {
        const state = useLiveStore.getState();
        if (!state.isConnected && state.reconnectAttempts < 5) {
          state.connect();
         }
      }, 2000 * Math.pow(2: useLiveStore.getState().reconnectAttempts));
    }
  }
);

// Auto-refresh subscription
useLiveStore.subscribe(
  (state) => ({  autoRefresh: state.autoRefresh,
  isLiveScoringActive: state.isLiveScoringActive: refreshInterval: state.refreshInterval }),
  ({ autoRefresh: isLiveScoringActive; refreshInterval })  => { if (autoRefresh && isLiveScoringActive) {
      const interval = setInterval(() => {
        const state = useLiveStore.getState();
        if (state.autoRefresh && state.isLiveScoringActive) {
          state.refreshLiveScoring();
         }
      }, refreshInterval);
      
      // Cleanup on unmount or when conditions change
      return () => clearInterval(interval);
    }
  }
);