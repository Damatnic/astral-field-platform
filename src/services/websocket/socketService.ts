import { io, Socket } from 'socket.io-client';

export type SocketEventType =
  | "trade_proposal"
  | "trade_accepted" 
  | "trade_rejected"
  | "waiver_processed"
  | "lineup_updated"
  | "player_scores"
  | "league_activity"
  | "draft_pick"
  | "draft_state_change"
  | "game_start"
  | "game_end"
  | "injury_update"
  | "breaking_news"
  | "score_update"
  | "live_stats"
  | "user_joined"
  | "user_left"
  | "typing_indicator"
  | "notification"
  | "system_alert";

export interface SocketEvent {
  type: SocketEventType;
  leagueId: string;
  teamId?: string;
  data: unknown;
  timestamp: string;
  userId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface LiveScoreUpdate {
  playerId: string;
  gameId: string;
  stats: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    receptions?: number;
    fumbles?: number;
    interceptions?: number;
    points: number;
  };
  gameTime: string;
  quarter: number;
  isComplete: boolean;
}

export interface TradeProposal {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  fromPlayers: string[];
  toPlayers: string[];
  message?: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

class EnhancedSocketService {
  private socket: Socket | null = null;
  private eventHandlers = new Map<SocketEventType, Array<(event: SocketEvent) => void>>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect(userId?: string): Promise<boolean> {
    try {
      if (this.isConnected && this.socket) {
        return true;
      }

      const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3005';
      
      this.socket = io(socketUrl, {
        auth: {
          userId: userId || 'anonymous'
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        retries: 3
      });

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Failed to initialize socket'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.isConnected = false;
          this.attemptReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Handle incoming events
        this.socket.on('event', (event: SocketEvent) => {
          this.handleIncomingEvent(event);
        });

        // Handle bulk score updates
        this.socket.on('score_updates', (updates: LiveScoreUpdate[]) => {
          updates.forEach(update => {
            this.handleIncomingEvent({
              type: 'player_scores',
              leagueId: 'all',
              data: update,
              timestamp: new Date().toISOString(),
              priority: 'high'
            });
          });
        });
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return false;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
      console.log('🔌 WebSocket disconnected');
    }
  }

  async subscribeToLeague(leagueId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_league', { leagueId });
    console.log(`📡 Subscribed to league: ${leagueId}`);
  }

  async subscribeToLiveScoring(): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_live_scoring');
    console.log('⚡ Subscribed to live scoring');
  }

  async subscribeToTeam(teamId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_team', { teamId });
    console.log(`👥 Subscribed to team: ${teamId}`);
  }

  async subscribeToBreakingNews(): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_breaking_news');
    console.log('📰 Subscribed to breaking news');
  }

  on(eventType: SocketEventType, handler: (event: SocketEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: SocketEventType, handler: (event: SocketEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleIncomingEvent(event: SocketEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
        }
      });
    }
  }

  async broadcast(event: Omit<SocketEvent, "timestamp">): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    const fullEvent: SocketEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.socket.emit('broadcast_event', fullEvent);
  }

  // Enhanced methods for specific use cases
  async sendTradeProposal(proposal: TradeProposal): Promise<void> {
    await this.broadcast({
      type: 'trade_proposal',
      leagueId: proposal.fromTeamId, // Assuming teamId contains league info
      data: proposal,
      priority: 'high'
    });
  }

  async updateLineup(leagueId: string, teamId: string, lineup: any): Promise<void> {
    await this.broadcast({
      type: 'lineup_updated',
      leagueId,
      teamId,
      data: lineup,
      priority: 'medium'
    });
  }

  async sendTypingIndicator(leagueId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!this.socket) return;
    
    this.socket.emit('typing', { leagueId, userId, isTyping });
  }

  // Health check
  isHealthy(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }
}

const socketService = new EnhancedSocketService();
export default socketService;