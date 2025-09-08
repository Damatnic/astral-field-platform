import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { SocketEvent, LiveScoreUpdate, TradeProposal } from './socketService';

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  userId?: string;
  leagueId?: string;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ConnectedClient {
  id: string;
  userId?: string;
  leagueId?: string;
  teamId?: string;
  socket: unknown;
  lastActivity: Date;
  subscriptions: Set<string>;
}

export interface UserSession {
  userId: string;
  socketId: string;
  leagueId?: string;
  teamId?: string;
  lastActivity: Date;
}

export class EnhancedWebSocketManager {
  private io: SocketIOServer | null = null;
  private clients = new Map<string, ConnectedClient>();
  private userConnections = new Map<string, string[]>();
  private leagueConnections = new Map<string, string[]>();
  private userSessions = new Map<string, UserSession>();
  private leagueRooms = new Map<string, Set<string>>();
  private teamRooms = new Map<string, Set<string>>();

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🚀 Enhanced WebSocket manager initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.id}`);

      const userId = socket.handshake.auth.userId || 'anonymous';
      
      // Store user session
      this.userSessions.set(socket.id, {
        userId,
        socketId: socket.id,
        lastActivity: new Date()
      });

      // Handle league room joining
      socket.on('join_league', ({ leagueId }: { leagueId: string }) => {
        socket.join(`league:${leagueId}`);
        
        // Update session
        const session = this.userSessions.get(socket.id);
        if (session) {
          session.leagueId = leagueId;
          session.lastActivity = new Date();
        }

        // Track league room
        if (!this.leagueRooms.has(leagueId)) {
          this.leagueRooms.set(leagueId, new Set());
        }
        this.leagueRooms.get(leagueId)!.add(socket.id);

        console.log(`📡 User ${userId} joined league: ${leagueId}`);
        
        // Notify other users in league
        socket.to(`league:${leagueId}`).emit('user_joined', {
          userId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('disconnect', (reason) => {
        console.log(`👤 User disconnected: ${socket.id} (${reason})`);
        this.handleDisconnection(socket.id);
      });
    });
  }

  addClient(
    clientId: string,
    socket: unknown,
    userId?: string,
    leagueId?: string,
    teamId?: string,
  ): void {
    const client: ConnectedClient = {
      id: clientId,
      userId,
      leagueId,
      teamId,
      socket,
      lastActivity: new Date(),
      subscriptions: new Set(),
    };
    this.clients.set(clientId, client);
    if (userId)
      this.userConnections.set(userId, [
        ...(this.userConnections.get(userId) || []),
        clientId,
      ]);
    if (leagueId)
      this.leagueConnections.set(leagueId, [
        ...(this.leagueConnections.get(leagueId) || []),
        clientId,
      ]);
  }

  private handleDisconnection(socketId: string): void {
    const session = this.userSessions.get(socketId);
    if (session) {
      // Remove from league room tracking
      if (session.leagueId) {
        const leagueRoom = this.leagueRooms.get(session.leagueId);
        if (leagueRoom) {
          leagueRoom.delete(socketId);
          if (leagueRoom.size === 0) {
            this.leagueRooms.delete(session.leagueId);
          }
        }
      }

      // Remove from team room tracking
      if (session.teamId) {
        const teamRoom = this.teamRooms.get(session.teamId);
        if (teamRoom) {
          teamRoom.delete(socketId);
          if (teamRoom.size === 0) {
            this.teamRooms.delete(session.teamId);
          }
        }
      }

      this.userSessions.delete(socketId);
    }

    this.clients.delete(socketId);
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    if (client.userId)
      this.userConnections.set(
        client.userId,
        (this.userConnections.get(client.userId) || []).filter(
          (id) => id !== clientId,
        ),
      );
    if (client.leagueId)
      this.leagueConnections.set(
        client.leagueId,
        (this.leagueConnections.get(client.leagueId) || []).filter(
          (id) => id !== clientId,
        ),
      );
    this.clients.delete(clientId);
  }

  async sendToUser(
    userId: string,
    message: WebSocketMessage,
  ): Promise<boolean> {
    const ids = this.userConnections.get(userId) || [];
    let count = 0;
    for (const id of ids) {
      const client = this.clients.get(id);
      if (client) {
        try {
          client.socket?.send?.(JSON.stringify(message));
          count++;
        } catch (_) {
          this.removeClient(id);
        }
      }
    }
    return count > 0;
  }

  async sendToLeague(
    leagueId: string,
    message: WebSocketMessage,
    excludeUserId?: string,
  ): Promise<number> {
    const ids = this.leagueConnections.get(leagueId) || [];
    let count = 0;
    for (const id of ids) {
      const client = this.clients.get(id);
      if (client && client.userId !== excludeUserId) {
        try {
          client.socket?.send?.(JSON.stringify(message));
          count++;
        } catch (_) {
          this.removeClient(id);
        }
      }
    }
    return count;
  }

  // Enhanced broadcasting methods
  broadcastEvent(event: SocketEvent): void {
    if (!this.io) return;

    const room = event.teamId ? `team:${event.teamId}` : `league:${event.leagueId}`;
    
    this.io.to(room).emit('event', {
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    });

    console.log(`📢 Broadcasted ${event.type} to ${room}`);
  }

  broadcastToLeague(leagueId: string, event: Omit<SocketEvent, 'leagueId'>): void {
    this.broadcastEvent({
      ...event,
      leagueId
    });
  }

  broadcastLiveScores(updates: LiveScoreUpdate[]): void {
    if (!this.io) return;

    this.io.to('live_scoring').emit('score_updates', updates);
    console.log(`⚡ Broadcasted ${updates.length} score updates`);
  }

  broadcastBreakingNews(news: {
    title: string;
    content: string;
    playerId?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }): void {
    if (!this.io) return;

    this.io.to('breaking_news').emit('breaking_news', {
      ...news,
      timestamp: new Date().toISOString()
    });

    console.log(`📰 Broadcasted breaking news: ${news.title}`);
  }

  getConnectionStats() {
    return {
      totalConnections: this.clients.size,
      userConnections: this.userConnections.size,
      leagueConnections: this.leagueConnections.size,
      activeConnections: this.clients.size,
      activeSessions: this.userSessions.size,
      leagueRooms: this.leagueRooms.size,
      teamRooms: this.teamRooms.size,
    };
  }

  // Health check
  getStatus(): {
    connected: boolean;
    activeConnections: number;
    leagueRooms: number;
    teamRooms: number;
  } {
    return {
      connected: !!this.io,
      activeConnections: this.userSessions.size,
      leagueRooms: this.leagueRooms.size,
      teamRooms: this.teamRooms.size
    };
  }
}

export default new EnhancedWebSocketManager();
