/**
 * WebSocket Server for Real-Time Fantasy Football Updates
 * Handles live scoring, player updates, and league communications
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest } from 'next';
import { database } from '@/lib/database';
import { verifyJWT } from '@/lib/auth/jwt-config';
import Redis from 'ioredis';

type ChatRoomType = 'general' | 'trades' | 'waivers' | 'off-topic' | 'game-thread' | 'celebrations' | 'trash-talk';

interface MessageReaction {
  emoji: string;
  userId: string;
  username: string;
  timestamp: string;
}

interface SocketUser {
  userId: string;
  leagueIds: string[];
  teamIds: string[];
  username: string;
}

interface WebSocketEvents {
  // Client to Server
  'join_league': (leagueId: string) => void;
  'leave_league': (leagueId: string) => void;
  'join_matchup': (matchupId: string) => void;
  'leave_matchup': (matchupId: string) => void;
  'send_message': (data: { leagueId: string; message: string; type: 'chat' | 'reaction' }) => void;
  
  // Server to Client
  'score_update': (data: { 
    leagueId: string; 
    teamId: string; 
    playerId: string; 
    points: number; 
    change: number;
    timestamp: string;
  }) => void;
  'player_update': (data: {
    playerId: string;
    status: 'active' | 'injured' | 'inactive';
    stats: Record<string, number>;
    timestamp: string;
  }) => void;
  'matchup_update': (data: {
    matchupId: string;
    homeScore: number;
    awayScore: number;
    isComplete: boolean;
    timestamp: string;
  }) => void;
  'league_message': (data: {
    leagueId: string;
    userId: string;
    username: string;
    message: string;
    type: 'chat' | 'reaction' | 'system';
    timestamp: string;
  }) => void;
  'trade_notification': (data: {
    leagueId: string;
    tradeId: string;
    type: 'proposed' | 'accepted' | 'rejected';
    involvedTeams: string[];
    timestamp: string;
  }) => void;
  'waiver_notification': (data: {
    leagueId: string;
    teamId: string;
    playerId: string;
    type: 'claimed' | 'failed';
    timestamp: string;
  }) => void;
}

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private redis: Redis | null = null;
  private connectedUsers = new Map<string, SocketUser>();
  private leagueRooms = new Map<string, Set<string>>();
  private matchupRooms = new Map<string, Set<string>>();
  private gameThreadRooms = new Map<string, Set<string>>();
  private dmRooms = new Map<string, Set<string>>();
  private connectionCounts = new Map<string, number>();
  private rateLimiter = new Map<string, { count: number; resetTime: number }>();
  private notificationQueue: any[] = [];
  private metricsCollector = {
    messagesPerMinute: 0,
    connectionsPerMinute: 0,
    errorCount: 0,
    lastReset: Date.now()
  };

  async initialize(httpServer: HTTPServer) {
    // Initialize Redis for session management and scaling
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      await this.redis.connect();
      console.log('✅ Redis connected for WebSocket scaling');
    } catch (error) {
      console.warn('⚠️ Redis not available, using in-memory storage:', error);
      this.redis = null;
    }

    // Initialize Socket.IO with production optimizations
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://astral-field.vercel.app', 'https://astralfield.com']
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      // Connection limits and performance settings
      maxHttpBufferSize: 1e6, // 1MB
      connectTimeout: 45000,
      upgradeTimeout: 10000,
      allowEIO3: true,
      // Redis adapter for horizontal scaling (if Redis available)
      adapter: this.redis ? undefined : undefined // TODO: Add Redis adapter when needed
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startMetricsCollection();
    this.startNotificationProcessor();
    
    console.log('✅ WebSocket server initialized with production features');
  }

  private setupMiddleware() {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = verifyJWT(token) as any;
        
        // Get user data from database
        const userResult = await database.query(
          'SELECT id, username FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return next(new Error('User not found or inactive'));
        }

        // Get user's leagues and teams
        const leaguesResult = await database.query(`
          SELECT DISTINCT l.id as league_id, t.id as team_id
          FROM leagues l
          JOIN teams t ON l.id = t.league_id
          WHERE t.user_id = $1 AND l.is_active = true
        `, [decoded.userId]);

        const user: SocketUser = {
          userId: decoded.userId,
          username: userResult.rows[0].username,
          leagueIds: leaguesResult.rows.map(row => row.league_id),
          teamIds: leaguesResult.rows.map(row => row.team_id)
        };

        socket.data.user = user;
        this.connectedUsers.set(socket.id, user);
        
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Advanced rate limiting middleware
    this.io.use((socket, next) => {
      const userId = socket.data.user?.userId || socket.handshake.address;
      const now = Date.now();
      const rateLimitKey = `rate_limit:${userId}`;
      
      let userLimit = this.rateLimiter.get(rateLimitKey);
      if (!userLimit || now > userLimit.resetTime) {
        userLimit = { count: 0, resetTime: now + 60000 }; // Reset every minute
        this.rateLimiter.set(rateLimitKey, userLimit);
      }
      
      // Allow 100 messages per minute per user
      if (userLimit.count >= 100) {
        return next(new Error('Rate limit exceeded'));
      }
      
      userLimit.count++;
      next();
    });

    // Connection limit middleware
    this.io.use((socket, next) => {
      const totalConnections = this.connectedUsers.size;
      const maxConnections = parseInt(process.env.MAX_WS_CONNECTIONS || '10000');
      
      if (totalConnections >= maxConnections) {
        return next(new Error('Server at capacity'));
      }
      
      next();
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = socket.data.user as SocketUser;
      console.log(`✅ User connected: ${user.username} (${user.userId})`);

      // Auto-join user's leagues
      user.leagueIds.forEach(leagueId => {
        socket.join(`league:${leagueId}`);
        this.addToLeagueRoom(leagueId, socket.id);
      });

      // Handle league joining
      socket.on('join_league', (leagueId: string) => {
        if (user.leagueIds.includes(leagueId)) {
          socket.join(`league:${leagueId}`);
          this.addToLeagueRoom(leagueId, socket.id);
          console.log(`User ${user.username} joined league ${leagueId}`);
        }
      });

      // Handle league leaving
      socket.on('leave_league', (leagueId: string) => {
        socket.leave(`league:${leagueId}`);
        this.removeFromLeagueRoom(leagueId, socket.id);
        console.log(`User ${user.username} left league ${leagueId}`);
      });

      // Handle matchup joining
      socket.on('join_matchup', (matchupId: string) => {
        socket.join(`matchup:${matchupId}`);
        this.addToMatchupRoom(matchupId, socket.id);
        console.log(`User ${user.username} joined matchup ${matchupId}`);
      });

      // Handle matchup leaving
      socket.on('leave_matchup', (matchupId: string) => {
        socket.leave(`matchup:${matchupId}`);
        this.removeFromMatchupRoom(matchupId, socket.id);
        console.log(`User ${user.username} left matchup ${matchupId}`);
      });

      // Handle chat messages
      socket.on('send_message', async (data: { 
        leagueId: string; 
        roomType?: ChatRoomType;
        message: string; 
        type: 'chat' | 'reaction' | 'gif';
        replyToId?: string;
        gifUrl?: string;
      }) => {
        if (!user.leagueIds.includes(data.leagueId)) {
          socket.emit('error', { message: 'Not authorized for this league' });
          return;
        }

        // Validate and sanitize message
        const sanitizedMessage = this.sanitizeMessage(data.message);
        if (!sanitizedMessage && data.type !== 'gif') {
          socket.emit('error', { message: 'Invalid message content' });
          return;
        }

        // Store message in database
        try {
          const messageId = await this.storeMessage(data.leagueId, data.roomType || 'general', user, {
            content: sanitizedMessage || '',
            type: data.type,
            replyToId: data.replyToId,
            gifUrl: data.gifUrl
          });

          // Broadcast to appropriate room
          const roomId = data.roomType ? `league:${data.leagueId}:${data.roomType}` : `league:${data.leagueId}`;
          this.io?.to(roomId).emit('league_message', {
            id: messageId,
            leagueId: data.leagueId,
            roomType: data.roomType || 'general',
            userId: user.userId,
            username: user.username,
            message: sanitizedMessage || '',
            type: data.type,
            replyToId: data.replyToId,
            gifUrl: data.gifUrl,
            timestamp: new Date().toISOString()
          });

          // Process mentions
          if (sanitizedMessage) {
            await this.processMentions(sanitizedMessage, data.leagueId, user);
          }

          // Update metrics
          this.metricsCollector.messagesPerMinute++;
        } catch (error) {
          console.error('Error saving message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle direct messages
      socket.on('send_dm', async (data: { 
        recipientId: string;
        message: string;
        type: 'text' | 'gif';
        gifUrl?: string;
      }) => {
        try {
          const dmId = await this.storeDM(user.userId, data.recipientId, {
            content: this.sanitizeMessage(data.message) || '',
            type: data.type,
            gifUrl: data.gifUrl
          });

          // Create DM room ID
          const dmRoomId = this.createDMRoomId(user.userId, data.recipientId);
          
          // Broadcast to both participants
          this.io?.to(dmRoomId).emit('direct_message', {
            id: dmId,
            senderId: user.userId,
            senderUsername: user.username,
            recipientId: data.recipientId,
            message: this.sanitizeMessage(data.message) || '',
            type: data.type,
            gifUrl: data.gifUrl,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error sending DM:', error);
          socket.emit('error', { message: 'Failed to send direct message' });
        }
      });

      // Handle emoji reactions
      socket.on('add_reaction', async (data: {
        messageId: string;
        emoji: string;
        leagueId: string;
        roomType?: ChatRoomType;
      }) => {
        try {
          await this.addMessageReaction(data.messageId, user.userId, data.emoji);
          
          const roomId = data.roomType ? `league:${data.leagueId}:${data.roomType}` : `league:${data.leagueId}`;
          this.io?.to(roomId).emit('message_reaction', {
            messageId: data.messageId,
            emoji: data.emoji,
            userId: user.userId,
            username: user.username,
            action: 'add',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error adding reaction:', error);
          socket.emit('error', { message: 'Failed to add reaction' });
        }
      });

      // Handle game thread joining
      socket.on('join_game_thread', (gameId: string) => {
        socket.join(`game:${gameId}`);
        this.addToGameThreadRoom(gameId, socket.id);
        console.log(`User ${user.username} joined game thread ${gameId}`);
      });

      // Handle game thread leaving
      socket.on('leave_game_thread', (gameId: string) => {
        socket.leave(`game:${gameId}`);
        this.removeFromGameThreadRoom(gameId, socket.id);
        console.log(`User ${user.username} left game thread ${gameId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { leagueId: string; roomType: ChatRoomType }) => {
        const roomId = `league:${data.leagueId}:${data.roomType}`;
        socket.to(roomId).emit('user_typing', {
          userId: user.userId,
          username: user.username,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data: { leagueId: string; roomType: ChatRoomType }) => {
        const roomId = `league:${data.leagueId}:${data.roomType}`;
        socket.to(roomId).emit('user_typing', {
          userId: user.userId,
          username: user.username,
          isTyping: false
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${user.username} (${reason})`);
        this.connectedUsers.delete(socket.id);
        
        // Clean up room memberships
        user.leagueIds.forEach(leagueId => {
          this.removeFromLeagueRoom(leagueId, socket.id);
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for user ${user.username}:`, error);
      });
    });
  }

  // Room management methods
  private addToLeagueRoom(leagueId: string, socketId: string) {
    if (!this.leagueRooms.has(leagueId)) {
      this.leagueRooms.set(leagueId, new Set());
    }
    this.leagueRooms.get(leagueId)!.add(socketId);
  }

  private removeFromLeagueRoom(leagueId: string, socketId: string) {
    const room = this.leagueRooms.get(leagueId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.leagueRooms.delete(leagueId);
      }
    }
  }

  private addToMatchupRoom(matchupId: string, socketId: string) {
    if (!this.matchupRooms.has(matchupId)) {
      this.matchupRooms.set(matchupId, new Set());
    }
    this.matchupRooms.get(matchupId)!.add(socketId);
  }

  private removeFromMatchupRoom(matchupId: string, socketId: string) {
    const room = this.matchupRooms.get(matchupId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.matchupRooms.delete(matchupId);
      }
    }
  }

  // Message sanitization
  private sanitizeMessage(message: string): string | null {
    if (!message || message.trim().length === 0) return null;
    if (message.length > 500) return null; // Max message length
    
    // Basic sanitization - remove potentially harmful content
    return message
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 500);
  }

  // Public methods for broadcasting updates
  public broadcastScoreUpdate(data: {
    leagueId: string;
    teamId: string;
    playerId: string;
    points: number;
    change: number;
  }) {
    if (!this.io) return;
    
    this.io.to(`league:${data.leagueId}`).emit('score_update', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastPlayerUpdate(data: {
    playerId: string;
    status: 'active' | 'injured' | 'inactive';
    stats: Record<string, number>;
  }) {
    if (!this.io) return;
    
    // Broadcast to all connected clients (player updates are global)
    this.io.emit('player_update', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastMatchupUpdate(data: {
    matchupId: string;
    leagueId: string;
    homeScore: number;
    awayScore: number;
    isComplete: boolean;
  }) {
    if (!this.io) return;
    
    // Broadcast to both league and specific matchup rooms
    this.io.to(`league:${data.leagueId}`).emit('matchup_update', {
      matchupId: data.matchupId,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      isComplete: data.isComplete,
      timestamp: new Date().toISOString()
    });

    this.io.to(`matchup:${data.matchupId}`).emit('matchup_update', {
      matchupId: data.matchupId,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      isComplete: data.isComplete,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastTradeNotification(data: {
    leagueId: string;
    tradeId: string;
    type: 'proposed' | 'accepted' | 'rejected';
    involvedTeams: string[];
  }) {
    if (!this.io) return;
    
    this.io.to(`league:${data.leagueId}`).emit('trade_notification', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastWaiverNotification(data: {
    leagueId: string;
    teamId: string;
    playerId: string;
    type: 'claimed' | 'failed';
  }) {
    if (!this.io) return;
    
    this.io.to(`league:${data.leagueId}`).emit('waiver_notification', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Chat-specific methods
  public broadcastToRoom(roomId: string, event: any) {
    if (!this.io) return;
    this.io.to(roomId).emit(event.type, event);
  }

  public sendToUser(userId: string, event: any) {
    if (!this.io) return;

    // Find socket for user
    const userSockets = Array.from(this.connectedUsers.entries())
      .filter(([, user]) => user.userId === userId)
      .map(([socketId]) => socketId);

    userSockets.forEach(socketId => {
      this.io?.to(socketId).emit(event.type, event);
    });
  }

  public broadcastNewMessage(roomId: string, message: any) {
    if (!this.io) return;
    this.io.to(roomId).emit('new_message', message);
  }

  public broadcastMessageReaction(roomId: string, reaction: any) {
    if (!this.io) return;
    this.io.to(roomId).emit('message_reaction', reaction);
  }

  public broadcastMessageDeleted(roomId: string, messageId: string) {
    if (!this.io) return;
    this.io.to(roomId).emit('message_deleted', { messageId });
  }

  // Helper methods for new features
  private async storeMessage(leagueId: string, roomType: ChatRoomType, user: SocketUser, messageData: any): Promise<string> {
    const result = await database.query(`
      INSERT INTO chat_messages (league_id, room_type, user_id, content, message_type, reply_to_id, gif_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [leagueId, roomType, user.userId, messageData.content, messageData.type, messageData.replyToId, messageData.gifUrl]);
    
    return result.rows[0].id;
  }

  private async storeDM(senderId: string, recipientId: string, messageData: any): Promise<string> {
    const result = await database.query(`
      INSERT INTO direct_messages (sender_id, recipient_id, content, message_type, gif_url, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `, [senderId, recipientId, messageData.content, messageData.type, messageData.gifUrl]);
    
    return result.rows[0].id;
  }

  private async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await database.query(`
      INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
    `, [messageId, userId, emoji]);
  }

  private async processMentions(message: string, leagueId: string, sender: SocketUser): Promise<void> {
    const mentions = message.match(/@(\w+)/g);
    if (!mentions) return;

    for (const mention of mentions) {
      const username = mention.substring(1);
      try {
        const userResult = await database.query(`
          SELECT u.id FROM users u
          JOIN teams t ON u.id = t.user_id
          WHERE u.username = $1 AND t.league_id = $2
        `, [username, leagueId]);

        if (userResult.rows.length > 0) {
          const mentionedUserId = userResult.rows[0].id;
          
          // Send notification
          this.queueNotification({
            userId: mentionedUserId,
            type: 'mention',
            title: `${sender.username} mentioned you`,
            message: message.substring(0, 100),
            data: { leagueId, senderId: sender.userId }
          });
        }
      } catch (error) {
        console.error('Error processing mention:', error);
      }
    }
  }

  private createDMRoomId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `dm:${sortedIds[0]}:${sortedIds[1]}`;
  }

  private addToGameThreadRoom(gameId: string, socketId: string): void {
    if (!this.gameThreadRooms.has(gameId)) {
      this.gameThreadRooms.set(gameId, new Set());
    }
    this.gameThreadRooms.get(gameId)!.add(socketId);
  }

  private removeFromGameThreadRoom(gameId: string, socketId: string): void {
    const room = this.gameThreadRooms.get(gameId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.gameThreadRooms.delete(gameId);
      }
    }
  }

  private queueNotification(notification: any): void {
    this.notificationQueue.push({
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      const now = Date.now();
      if (now - this.metricsCollector.lastReset > 60000) {
        console.log(`📊 WebSocket Metrics: ${this.metricsCollector.messagesPerMinute} msgs/min, ${this.metricsCollector.connectionsPerMinute} conns/min, ${this.metricsCollector.errorCount} errors`);
        this.metricsCollector = {
          messagesPerMinute: 0,
          connectionsPerMinute: 0,
          errorCount: 0,
          lastReset: now
        };
      }
    }, 60000);
  }

  private startNotificationProcessor(): void {
    setInterval(() => {
      if (this.notificationQueue.length > 0) {
        const notifications = this.notificationQueue.splice(0, 100); // Process up to 100 at a time
        this.processNotifications(notifications);
      }
    }, 5000);
  }

  private async processNotifications(notifications: any[]): Promise<void> {
    for (const notification of notifications) {
      try {
        // Send to connected user if online
        const userSockets = Array.from(this.connectedUsers.entries())
          .filter(([, user]) => user.userId === notification.userId)
          .map(([socketId]) => socketId);

        if (userSockets.length > 0) {
          userSockets.forEach(socketId => {
            this.io?.to(socketId).emit('notification', notification);
          });
        }

        // Store in database for offline users
        await database.query(`
          INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, false, NOW())
        `, [notification.userId, notification.type, notification.title, notification.message, JSON.stringify(notification.data || {})]);
      } catch (error) {
        console.error('Error processing notification:', error);
        this.metricsCollector.errorCount++;
      }
    }
  }

  // Enhanced broadcasting methods
  public broadcastGameUpdate(gameId: string, update: any): void {
    if (!this.io) return;
    this.io.to(`game:${gameId}`).emit('game_update', {
      ...update,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastCelebration(leagueId: string, celebration: any): void {
    if (!this.io) return;
    this.io.to(`league:${leagueId}:celebrations`).emit('celebration', {
      ...celebration,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    const userSockets = Array.from(this.connectedUsers.entries())
      .filter(([, user]) => user.userId === userId)
      .map(([socketId]) => socketId);

    userSockets.forEach(socketId => {
      this.io?.to(socketId).emit(event, data);
    });
  }

  // Health and monitoring methods
  public getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      activeLeagues: this.leagueRooms.size,
      activeMatchups: this.matchupRooms.size,
      activeGameThreads: this.gameThreadRooms.size,
      activeDMs: this.dmRooms.size,
      metricsPerMinute: {
        messages: this.metricsCollector.messagesPerMinute,
        connections: this.metricsCollector.connectionsPerMinute,
        errors: this.metricsCollector.errorCount
      },
      queuedNotifications: this.notificationQueue.length,
      connectedUsers: Array.from(this.connectedUsers.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        leagueCount: user.leagueIds.length
      }))
    };
  }

  public getLeagueConnections(leagueId: string): number {
    return this.leagueRooms.get(leagueId)?.size || 0;
  }

  public isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(user => user.userId === userId);
  }

  // Graceful shutdown
  public async shutdown() {
    if (this.io) {
      console.log('🔄 Shutting down WebSocket server...');
      
      // Notify all clients of shutdown
      this.io.emit('server_shutdown', { 
        message: 'Server is shutting down. Please refresh to reconnect.',
        timestamp: new Date().toISOString()
      });

      // Close all connections
      this.io.close();
      this.connectedUsers.clear();
      this.leagueRooms.clear();
      this.matchupRooms.clear();
      
      console.log('✅ WebSocket server shutdown complete');
    }
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();

// Export types for use in other files
export type { WebSocketEvents, SocketUser };