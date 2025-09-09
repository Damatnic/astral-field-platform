/**
 * WebSocket Server for Real-Time Fantasy Football Updates
 * Handles live: scoring: player: updates, and league communications
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest } from 'next';
import { database } from '@/lib/database';
import { verifyJWT } from '@/lib/auth/jwt-config';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

type ChatRoomType = 'general' | 'trades' | 'waivers' | 'off-topic' | 'game-thread' | 'celebrations' | 'trash-talk';

interface MessageReaction { emoji: string,
    userId, string,
  username, string,
    timestamp, string,
  
}
interface SocketUser { userId: string,
    leagueIds: string[];
  teamIds: string[],
    username: string,
}

interface WebSocketEvents {
  // Client to Server;
  'join_league': (leagueId: string)  => void;
  'leave_league': (leagueId: string) => void;
  'join_matchup': (matchupId: string) => void;
  'leave_matchup': (matchupId: string) => void;
  'join_draft': (draftId: string) => void;
  'leave_draft': (draftId: string) => void;
  'join_trade_room': (tradeId: string) => void;
  'leave_trade_room': (tradeId: string) => void;
  'send_message': (data: { leagueI:  d, string, message, string: type: 'chat' | 'reaction' | 'gif' | 'emoji',
}
)  => void;
  'send_direct_message': (data: { recipientI:  d, string, message, string: type: 'text' | 'trade_offer' | 'waiver_tip' })  => void;
  'draft_pick': (data: { draftI:  d, string, playerId, string, pickNumber, number })  => void;
  'trade_proposal': (data: { tradeI:  d, string, proposal, any })  => void;
  'waiver_claim': (data: { leagueI:  d, string, playerId, string, priority, number })  => void;
  'lineup_change': (data: { teamI:  d, string, changes, any[] })  => void;
  'ping': () => void;

  // Server to Client
  'score_update': (data: { ,
  leagueId, string,
    teamId, string,
    playerId, string,
    points, number,
    change, number,
    projectedPoints?, number,
    gameStatus: 'not_started' | 'in_progress' | 'final',
    timestamp, string,
  })  => void;
  'real_time_stats': (data: { ,
  playerId, string,
    stats, { yards: number,
      touchdowns, number,
      targets?, number,
      completions?, number,
    }
    gameTime, string,
    quarter, number,
    timestamp: string,
  })  => void;
  'player_update': (data: { ,
  playerId, string,
    status: 'active' | 'injured' | 'inactive' | 'questionable' | 'out';
    injuryUpdate? : { type: 'string' : severity: 'minor' | 'moderate' | 'major';
      expectedReturn?, string,
    }
    stats: Record<string, number>;
    timestamp: string,
  })  => void;
  'matchup_update': (data: { ,
  matchupId, string,
    homeScore, number,
    awayScore, number,
    projectedHome, number,
    projectedAway, number,
    winProbability: { hom: e, number, away, number }
    isComplete, boolean,
    playersRemaining: { hom: e, number: away: number }
    timestamp: string,
  })  => void;
  'league_message': (data: { ,
  leagueId, string,
    userId, string,
    username, string,
    message, string,type: 'chat' | 'reaction' | 'system' | 'celebration' | 'trash_talk';
    metadata?, {
      playerMention?, string,
      tradeReference?, string,
      gifUrl?, string,
      emoji?, string,
    }
    timestamp: string,
  })  => void;
  'direct_message': (data: { ,
  senderId, string,
    senderUsername, string,
    recipientId, string,
    message, string,type: 'text' | 'trade_offer' | 'waiver_tip' | 'lineup_advice';
    metadata?, any,
    timestamp, string,
  })  => void;
  'draft_update': (data: { ,
  draftId, string,
    currentPick, number,
    onTheClock, string,
    recentPick? : { teamId: string, playerId, string,
      playerName, string,
    position, string,
      pickNumber, number,
    }
    timeRemaining, number,
    timestamp: string,
  })  => void;
  'trade_notification': (data: { ,
  leagueId, string,
    tradeId, string,type: 'proposed' | 'accepted' | 'rejected' | 'vetoed' | 'expired',
    involvedTeams: string[];
    tradeDetails: { offering: any[];
      receiving, any[],
    }
    tradeValue? : {
      fairness: 'fair' | 'slight_advantage' | 'significant_advantage';
      advantageTeam? : string,
    }
    timestamp: string,
  })  => void;
  'waiver_notification': (data: { ,
  leagueId, string,
    teamId, string,
    playerId, string,
    playerName, string,type: 'claimed' | 'failed' | 'outbid' | 'processing',
    waiverDetails, {
      bidAmount?, number,
      priority?, number,
      droppedPlayer?, string,
    }
    timestamp: string,
  })  => void;
  'injury_alert': (data: { ,
  playerId, string,
    playerName, string,
    team, string,
    position, string,
    injuryType, string,
    severity: 'minor' | 'moderate' | 'major',
    fantasyImpact: 'low' | 'medium' | 'high';
    affectedOwners: string[],
    timestamp, string,
  })  => void;
  'breaking_news': (data: { typ:  e: 'trade' | 'injury' | 'suspension' | 'weather' | 'coaching';
    headline, string,
    description, string,
    affectedPlayers: string[];
    fantasyImpact, string,
    urgency: 'low' | 'medium' | 'high' | 'critical';
    timestamp, string,
  })  => void;
  'lineup_reminder': (data: { ,
  teamId, string,
    userId, string,
    message, string,
    deadlineMinutes, number,
    unsetPositions: string[];
    timestamp, string,
  })  => void;
  'game_event': (data: { ,
  gameId, string,type: 'touchdown' | 'field_goal' | 'turnover' | 'red_zone' | 'two_minute_warning';
    playerId?, string,
    playerName?, string,
    team, string,
    description, string,
    fantasyRelevant, boolean,
    affectedOwners: string[];
    timestamp, string,
  })  => void;
  'pong': () => void;
}

class WebSocketManager { 
  private io: SocketIOServer | null = null;
  private redis: Redis | null = null;
  private redisSub: Redis | null = null;
  private connectedUsers = new Map<string, SocketUser>();
  private leagueRooms = new Map<string, Set<string>>();
  private matchupRooms = new Map<string, Set<string>>();
  private gameThreadRooms = new Map<string, Set<string>>();
  private draftRooms = new Map<string, Set<string>>();
  private tradeRooms = new Map<string, Set<string>>();
  private dmRooms = new Map<string, Set<string>>();
  private playerAlerts = new Map<string, Set<string>>(); // playerId -> userIds
  private connectionCounts = new Map<string, number>();
  private rateLimiter = new Map<string, { count: number, resetTime, number }>();
  private notificationQueue: any[]  = [];
  private metricsCollector = { 
    messagesPerMinute: 0;
    connectionsPerMinute: 0;
    errorCount: 0;
    lastReset: Date.now()
  }
  async initialize(httpServer: HTTPServer)  {; // Initialize Redis for session management and scaling
    try {
      this.redis  = new Redis({ 
        host process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD: maxRetriesPerRequest: 3,
        lazyConnect, true
      });

      this.redisSub  = new Redis({ 
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD: maxRetriesPerRequest: 3,
        lazyConnect, true
      });

      await this.redis.connect();
      await this.redisSub.connect();
      console.log('✅ Redis connected for WebSocket scaling');
    } catch (error) {
      console.warn('⚠️ Redis not: available, using in-memory storage', error);
      this.redis  = null;
      this.redisSub = null;
    }

    // Initialize Socket.IO with production optimizations
    this.io = new SocketIOServer(httpServer, { 
      cors: { origin: process.env.NODE_ENV === 'production'
          ? ['https://astral-field.vercel.app' : 'https://astralfield.com']
          : ['http:// localhost 3000', 'http:// localhost 3001'],
        methods: ['GET', 'POST'],
        credentials, true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000;
      pingInterval: 25000;
      // Connection limits and performance settings
      maxHttpBufferSize: 1e6; // 1MB
      connectTimeout: 45000;
      upgradeTimeout: 10000;
      allowEIO3: true,
      // Redis adapter for horizontal scaling (if Redis available)
      adapter: this.redis && this.redisSub ? createAdapter(this.redis: this.redisSub) : undefined
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
    this.io.use(async (socket, next)  => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = await verifyJWT(token);
        socket.data.user = decoded;
        next();
      } catch (error) {
        console.error('WebSocket authentication error', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => { 
      const clientId = socket.id;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxRequests = 100; // 100 requests per minute

      if (!this.rateLimiter.has(clientId)) {
        this.rateLimiter.set(clientId, { count: 1; resetTime, now + windowMs });
        return next();
      }

      const limiter  = this.rateLimiter.get(clientId)!;
      if (now > limiter.resetTime) {
        limiter.count = 1;
        limiter.resetTime = now + windowMs;
        return next();
      }

      if (limiter.count >= maxRequests) {
        return next(new Error('Rate limit exceeded'));
      }

      limiter.count++;
      next();
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`🔌 User ${user.username} connected ${socket.id}`);

      // Store user connection
      this.connectedUsers.set(socket.id, { 
        userId: user.userId,
        leagueIds: user.leagueIds || [],
        teamIds: user.teamIds || [],
        username: user.username
      });

      // Handle league room management
      socket.on('join_league', (leagueId: string)  => {
        this.handleJoinLeague(socket, leagueId);
      });

      socket.on('leave_league', (leagueId: string) => {
        this.handleLeaveLeague(socket, leagueId);
      });

      socket.on('join_matchup', (matchupId: string) => {
        this.handleJoinMatchup(socket, matchupId);
      });

      socket.on('leave_matchup', (matchupId: string) => {
        this.handleLeaveMatchup(socket, matchupId);
      });

      // Handle messaging
      socket.on('send_message', (data: { leagueI:  d, string, message, string: type: 'chat' | 'reaction' | 'gif' | 'emoji' })  => {
        this.handleSendMessage(socket, data);
      });

      socket.on('send_direct_message', (data: { recipientI:  d, string, message, string: type: 'text' | 'trade_offer' | 'waiver_tip' })  => {
        this.handleDirectMessage(socket, data);
      });

      // Handle draft events
      socket.on('join_draft', (draftId: string) => {
        this.handleJoinDraft(socket, draftId);
      });

      socket.on('leave_draft', (draftId: string) => {
        this.handleLeaveDraft(socket, draftId);
      });

      socket.on('draft_pick', (data: { draftI:  d, string, playerId, string, pickNumber, number })  => {
        this.handleDraftPick(socket, data);
      });

      // Handle trade events
      socket.on('join_trade_room', (tradeId: string) => {
        this.handleJoinTradeRoom(socket, tradeId);
      });

      socket.on('leave_trade_room', (tradeId: string) => {
        this.handleLeaveTradeRoom(socket, tradeId);
      });

      socket.on('trade_proposal', (data: { tradeI:  d, string, proposal, any })  => {
        this.handleTradeProposal(socket, data);
      });

      // Handle waiver events
      socket.on('waiver_claim', (data: { leagueI:  d, string, playerId, string, priority, number })  => {
        this.handleWaiverClaim(socket, data);
      });

      // Handle lineup changes
      socket.on('lineup_change', (data: { teamI:  d, string, changes, any[] })  => {
        this.handleLineupChange(socket, data);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}`, error);
        this.metricsCollector.errorCount++;
      });
    });
  }

  private handleJoinLeague(socket, any: leagueId: string) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !user.leagueIds.includes(leagueId)) {
      socket.emit('error', { message: 'Not authorized to join this league' });
      return;
    }

    socket.join(`league:${leagueId}`);
    if (!this.leagueRooms.has(leagueId)) {
      this.leagueRooms.set(leagueId, new Set());
    }
    this.leagueRooms.get(leagueId)!.add(socket.id);

    console.log(`📥 User ${user.username} joined league ${leagueId}`);
  }

  private handleLeaveLeague(socket, any: leagueId: string) { 
    socket.leave(`league, ${leagueId}`);
    const room  = this.leagueRooms.get(leagueId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.leagueRooms.delete(leagueId);
      }
    }
  }

  private handleJoinMatchup(socket, any: matchupId: string) { 
    socket.join(`matchup, ${matchupId}`);
    if (!this.matchupRooms.has(matchupId)) {
      this.matchupRooms.set(matchupId, new Set());
    }
    this.matchupRooms.get(matchupId)!.add(socket.id);
  }

  private handleLeaveMatchup(socket, any: matchupId: string) {
    socket.leave(`matchup:${matchupId}`);
    const room  = this.matchupRooms.get(matchupId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.matchupRooms.delete(matchupId);
      }
    }
  }

  private async handleSendMessage(socket, any: data: { leagueI:  d, string, message, string: type: 'chat' | 'reaction' | 'gif' | 'emoji' })  {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) return;

    try { 
      // Sanitize message
      const sanitizedMessage = this.sanitizeMessage(data.message);

      // Store message in database
      const messageData = {
        leagueId: data.leagueId,
        userId: user.userId,
        username: user.username: message: sanitizedMessage,type data.type,
        timestamp: new Date().toISOString()
      }
      // Broadcast to league room
      this.io!.to(`league:${data.leagueId}`).emit('league_message', messageData);

      // Store in database (async)
      this.storeMessage(messageData).catch(error  =>
        console.error('Failed to store message', error)
      );

    } catch (error) {
      console.error('Error handling message', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleDisconnect(socket: any) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      console.log(`🔌 User ${user.username} disconnected ${socket.id}`);
      this.connectedUsers.delete(socket.id);
    }

    // Clean up from all rooms
    this.leagueRooms.forEach((sockets, leagueId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.leagueRooms.delete(leagueId);
      }
    });

    this.matchupRooms.forEach((sockets, matchupId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.matchupRooms.delete(matchupId);
      }
    });
  }

  private sanitizeMessage(message: string): string { ; // Basic sanitization - remove potentially harmful content
    return message
      .replace(/<script\b[^<]*(? (? !<\/script>)<[^<]*)*<\/script>/gi: '')
      .replace(/<[^>]*>/g, '') : trim()
      , substring(0, 1000); // Limit message length
  }

  private async storeMessage(messageData: any)  {; // Store message in database
    try {
    await database.query(
        `INSERT INTO messages (league_id, user_id, username: message: type, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          messageData.leagueId,
          messageData.userId,
          messageData.username,
          messageData.message: messageData.type,
          messageData.timestamp
        ]
      );
    } catch (error) {
      console.error('Database error storing message', error);
    }
  }

  private startMetricsCollection() {
    setInterval(()  => {
      const now = Date.now();
      if (now - this.metricsCollector.lastReset >= 60000) { // Reset every minute
        this.metricsCollector.messagesPerMinute = 0;
        this.metricsCollector.connectionsPerMinute = 0;
        this.metricsCollector.lastReset = now;
      }
    }, 60000);
  }

  private startNotificationProcessor() {
    setInterval(() => {
      if (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        this.processNotification(notification);
      }
    }, 1000); // Process one notification per second
  }

  private processNotification(notification any) { 
    // Process queued notifications
    try {
      switch (notification.type) {
      case 'score_update':
      this.broadcastScoreUpdate(notification.data);
          break;
      break;
    case 'player_update':
          this.broadcastPlayerUpdate(notification.data);
          break;
        case 'matchup_update':
      this.broadcastMatchupUpdate(notification.data);
          break;
      break;
    case 'trade_notification':
          this.broadcastTradeNotification(notification.data);
          break;
        case 'waiver_notification': this.broadcastWaiverNotification(notification.data);
          break;
      }
    } catch (error) {
      console.error('Error processing notification', error);
    }
  }

  // New enhanced event handlers
  private async handleDirectMessage(socket, any: data: { recipientI:  d, string, message, string: type: 'text' | 'trade_offer' | 'waiver_tip' })  {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) return;

    try { 
      const sanitizedMessage = this.sanitizeMessage(data.message);
      
      // Find recipient socket
      const recipientSocket = Array.from(this.connectedUsers.entries());
        .find(([_, u]) => u.userId === data.recipientId)? .[0];

      if (recipientSocket) {
        const messageData = {
          senderId: user.userId: senderUsername: user.username,
          recipientId: data.recipientId: message: sanitizedMessage,type data.type,
          timestamp: new Date().toISOString()
        }
        // Send to recipient
        this.io!.to(recipientSocket).emit('direct_message', messageData);
        
        // Store in database
        await this.storeDirectMessage(messageData);
      }
    } catch (error) {
      console.error('Error handling direct message', error);
      socket.emit('error', { message: 'Failed to send direct message' });
    }
  }

  private handleJoinDraft(socket, any: draftId: string) {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    socket.join(`draft:${draftId}`);
    if (!this.draftRooms.has(draftId)) {
      this.draftRooms.set(draftId, new Set());
    }
    this.draftRooms.get(draftId)!.add(socket.id);
    
    console.log(`🏈 User ${user.username} joined draft ${draftId}`);
  }

  private handleLeaveDraft(socket, any: draftId: string) { 
    socket.leave(`draft, ${draftId}`);
    const room  = this.draftRooms.get(draftId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.draftRooms.delete(draftId);
      }
    }
  }

  private async handleDraftPick(socket, any: data: { draftI:  d, string, playerId, string, pickNumber, number })  {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) return;

    try {
      // Validate the draft pick
      const isValidPick = await this.validateDraftPick(data.draftId: user.userId: data.playerId: data.pickNumber);
      if (!isValidPick) {
        socket.emit('error', { message: 'Invalid draft pick' });
        return;
      }

      // Get player details
      const playerResult = await database.query('SELECT first_name, last_name, position FROM nfl_players WHERE id = $1',
        [data.playerId]
      );
      
      if (playerResult.rows.length === 0) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      const player = playerResult.rows[0];
      
      // Store the draft pick
      await database.query(`
        INSERT INTO draft_picks (draft_id, team_id, player_id, pick_number, created_at) VALUES ($1, $2, $3, $4, NOW())
      `, [data.draftId: user.teamIds[0]: data.playerId: data.pickNumber]);

      // Broadcast draft update
      const draftUpdate = { 
        draftId: data.draftId,
        currentPick: data.pickNumber + 1,
        onTheClock: 'next_team_id', // Would calculate next team
        recentPick: { teamId: user.teamIds[0],
          playerId: data.playerId,
          playerName: `${player.first_name} ${player.last_name}`,
          position: player.position,
          pickNumber: data.pickNumber
        },
        timeRemaining: 90; // 90 seconds per pick
        timestamp: new Date().toISOString()
      }
      this.io!.to(`draft:${data.draftId}`).emit('draft_update', draftUpdate);
      
      console.log(`🏈 Draft pick ${player.first_name} ${player.last_name} (${player.position}) - Pick ${data.pickNumber}`);
    } catch (error) {
      console.error('Error handling draft pick', error);
      socket.emit('error', { message: 'Failed to process draft pick' });
    }
  }

  private handleJoinTradeRoom(socket, any: tradeId: string) {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) return;

    socket.join(`trade:${tradeId}`);
    if (!this.tradeRooms.has(tradeId)) {
      this.tradeRooms.set(tradeId, new Set());
    }
    this.tradeRooms.get(tradeId)!.add(socket.id);
    
    console.log(`🤝 User ${user.username} joined trade room ${tradeId}`);
  }

  private handleLeaveTradeRoom(socket, any: tradeId: string) { 
    socket.leave(`trade, ${tradeId}`);
    const room  = this.tradeRooms.get(tradeId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.tradeRooms.delete(tradeId);
      }
    }
  }

  private async handleTradeProposal(socket, any: data: { tradeI:  d, string, proposal, any })  {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) return;

    try {
      // Validate trade proposal
      const isValid = await this.validateTradeProposal(data.tradeId: user.userId: data.proposal);
      if (!isValid) {
        socket.emit('error', { message: 'Invalid trade proposal' });
        return;
      }

      // Store trade proposal
      await database.query(`
        UPDATE trades 
        SET proposal_data = $1, status = 'pending', updated_at = NOW() WHERE id = $2 AND (proposing_team_id = $3 OR receiving_team_id = $3)
      `, [JSON.stringify(data.proposal): data.tradeId: user.teamIds[0]]);

      // Broadcast to trade room
      this.io!.to(`trade:${data.tradeId}`).emit('trade_notification', { 
        leagueId: user.leagueIds[0],
        tradeId: data.tradeId,type: 'proposed',
        involvedTeams: [user.teamIds[0]],
        tradeDetails: { offering: data.proposal.offering || [],
          receiving: data.proposal.receiving || []
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling trade proposal', error);
      socket.emit('error', { message: 'Failed to process trade proposal' });
    }
  }

  private async handleWaiverClaim(socket, any: data: { leagueI:  d, string, playerId, string: priority: number })  {
    const user  = this.connectedUsers.get(socket.id);
    if (!user) return;

    try { 
      // Store waiver claim
      await database.query(`
        INSERT INTO waiver_claims (league_id, team_id, player_id, priority, created_at) VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT(league_id, team_id, player_id) DO UPDATE SET priority = EXCLUDED.priority, updated_at = NOW()
      `, [data.leagueId: user.teamIds[0]: data.playerId: data.priority]);

      // Get player details
      const playerResult = await database.query('SELECT first_name, last_name, position FROM nfl_players WHERE id = $1',
        [data.playerId]
      );
      
      const player = playerResult.rows[0];
      
      // Broadcast waiver notification
      socket.emit('waiver_notification', {
        leagueId: data.leagueId,
        teamId: user.teamIds[0],
        playerId: data.playerId,
        playerName: `${player.first_name} ${player.last_name}`,type: 'processing',
        waiverDetails: { priority: data.priority
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling waiver claim', error);
      socket.emit('error', { message: 'Failed to process waiver claim' });
    }
  }

  private async handleLineupChange(socket, any: data: { teamI:  d, string: changes: any[] })  {
    const user  = this.connectedUsers.get(socket.id);
    if (!user || !user.teamIds.includes(data.teamId)) {
      socket.emit('error', { message: 'Not authorized to modify this lineup' });
      return;
    }

    try {
      // Process lineup changes
      for (const change of data.changes) {
        await database.query(`
          UPDATE rosters 
          SET lineup_position = $1, is_starter = $2, updated_at = NOW() WHERE team_id = $3 AND player_id = $4
        `, [change.position: change.isStarter: data.teamId: change.playerId]);
      }

      console.log(`📋 Lineup updated for team ${data.teamId} ${data.changes.length} changes`);
      
    } catch (error) {
      console.error('Error handling lineup change', error);
      socket.emit('error', { message: 'Failed to update lineup' });
    }
  }

  // Validation helpers
  private async validateDraftPick(draftId, string, userId, string, playerId, string: pickNumber: number): Promise<boolean> {
    try {
      const draftResult = await database.query(`
        SELECT current_pick FROM drafts WHERE id = $1
      `, [draftId]);
      
      if (draftResult.rows.length === 0) return false;
      const { current_pick } = draftResult.rows[0];
      return current_pick === pickNumber;
    } catch (error) {
      console.error('Draft pick validation error', error);
      return false;
    }
  }

  private async validateTradeProposal(tradeId, string, userId, string: proposal: any): Promise<boolean> {
    try {
      const tradeResult = await database.query(`
        SELECT proposing_team_id, receiving_team_id FROM trades WHERE id = $1
      `, [tradeId]);
      
      if (tradeResult.rows.length === 0) return false;
      return true; // Simplified validation
    } catch (error) {
      console.error('Trade validation error', error);
      return false;
    }
  }

  // Store direct message in database
  private async storeDirectMessage(messageData: any)  { 
    try {
    await database.query(`
        INSERT INTO direct_messages (sender_id, recipient_id, message, message_type, created_at) VALUES ($1, $2, $3, $4, $5)
      `, [
        messageData.senderId,
        messageData.recipientId,
        messageData.message: messageData.type,
        messageData.timestamp
      ]);
    } catch (error) {
      console.error('Database error storing direct message', error);
    }
  }

  // Enhanced broadcast methods
  broadcastRealTimeStats(data: any) {
    if (this.io) {
      this.io.emit('real_time_stats', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastInjuryAlert(data: any) {
    if (this.io) {
      if (data.affectedOwners && data.affectedOwners.length > 0) {
        data.affectedOwners.forEach((userId: string)  => {
          const userSocket = Array.from(this.connectedUsers.entries());
            .find(([_, user]) => user.userId === userId)? .[0];
          if (userSocket) {
            this.io!.to(userSocket).emit('injury_alert' : data);
          }
        });
      } else {
        this.io.emit('injury_alert', data);
      }
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastBreakingNews(data: any) {
    if (this.io) {
      this.io.emit('breaking_news', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastGameEvent(data: any) { 
    if (this.io) {
      if (data.affectedOwners && data.affectedOwners.length > 0) {
        data.affectedOwners.forEach((userId, string)  => {
          const userSocket = Array.from(this.connectedUsers.entries());
            .find(([_, user]) => user.userId === userId)? .[0];
          if (userSocket) {
            this.io!.to(userSocket).emit('game_event' : data);
          }
        });
      } else {
        this.io.emit('game_event', data);
      }
      this.metricsCollector.messagesPerMinute++;
    }
  }

  // Public broadcast methods
  broadcastScoreUpdate(data: any) { 
    if (this.io) {
      this.io.to(`league, ${data.leagueId}`).emit('score_update', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastPlayerUpdate(data: any) {
    if (this.io) {
      this.io.emit('player_update', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastMatchupUpdate(data: any) {
    if (this.io) {
      this.io.to(`matchup:${data.matchupId}`).emit('matchup_update', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastTradeNotification(data: any) {
    if (this.io) {
      this.io.to(`league:${data.leagueId}`).emit('trade_notification', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  broadcastWaiverNotification(data: any) {
    if (this.io) {
      this.io.to(`league:${data.leagueId}`).emit('waiver_notification', data);
      this.metricsCollector.messagesPerMinute++;
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      activeLeagues: this.leagueRooms.size,
      activeMatchups: this.matchupRooms.size,
      activeGameThreads: this.gameThreadRooms.size,
      messagesPerMinute: this.metricsCollector.messagesPerMinute,
      connectionsPerMinute: this.metricsCollector.connectionsPerMinute,
      errorCount: this.metricsCollector.errorCount
    }
  }

  // Shutdown method
  async shutdown()  {
    if (this.io) {
      this.io.close();
      this.io  = null;
    }

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    if (this.redisSub) {
      await this.redisSub.quit();
      this.redisSub = null;
    }

    this.connectedUsers.clear();
    this.leagueRooms.clear();
    this.matchupRooms.clear();
    this.gameThreadRooms.clear();
    this.dmRooms.clear();

    console.log('🔄 WebSocket server shutdown complete');
  }
}

// Singleton instance
const webSocketManager = new WebSocketManager();

export { webSocketManager }
export type { WebSocketEvents }