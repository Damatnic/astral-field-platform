import { EnhancedWebSocketManager, WebSocketMessage, ConnectedClient, UserSession } from '../manager';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('EnhancedWebSocketManager', () => {
  let manager: EnhancedWebSocketManager;
  let mockServer: HTTPServer;
  let mockIo: jest.Mocked<SocketIOServer>;

  beforeEach(() => {
    manager = new EnhancedWebSocketManager();
    mockServer = {} as HTTPServer;
    
    // Reset the mocked Socket.IO server
    mockIo = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      close: jest.fn(),
    } as any;

    (SocketIOServer as jest.Mock).mockReturnValue(mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      manager.initialize(mockServer);

      expect(SocketIOServer).toHaveBeenCalledWith(mockServer, {
        cors: {
          origin: expect.any(String),
          methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
      });

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should use environment URL when available', () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      manager.initialize(mockServer);

      expect(SocketIOServer).toHaveBeenCalledWith(mockServer, {
        cors: {
          origin: 'https://example.com',
          methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
      });

      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });
  });

  describe('client management', () => {
    beforeEach(() => {
      manager.initialize(mockServer);
    });

    it('should add client successfully', () => {
      const mockSocket = { send: jest.fn() };
      
      manager.addClient('client-1', mockSocket, 'user-1', 'league-1', 'team-1');

      const stats = manager.getConnectionStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.userConnections).toBe(1);
      expect(stats.leagueConnections).toBe(1);
    });

    it('should handle multiple clients for same user', () => {
      const mockSocket1 = { send: jest.fn() };
      const mockSocket2 = { send: jest.fn() };
      
      manager.addClient('client-1', mockSocket1, 'user-1', 'league-1');
      manager.addClient('client-2', mockSocket2, 'user-1', 'league-1');

      const stats = manager.getConnectionStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.userConnections).toBe(1); // Same user
      expect(stats.leagueConnections).toBe(1); // Same league
    });

    it('should remove client successfully', () => {
      const mockSocket = { send: jest.fn() };
      
      manager.addClient('client-1', mockSocket, 'user-1', 'league-1');
      manager.removeClient('client-1');

      const stats = manager.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should handle removing non-existent client gracefully', () => {
      expect(() => {
        manager.removeClient('non-existent');
      }).not.toThrow();

      const stats = manager.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
    });
  });

  describe('message sending', () => {
    beforeEach(() => {
      manager.initialize(mockServer);
    });

    it('should send message to user successfully', async () => {
      const mockSocket = { send: jest.fn() };
      const message: WebSocketMessage = {
        type: 'test_message',
        data: { content: 'Hello' },
        timestamp: new Date(),
        priority: 'medium'
      };
      
      manager.addClient('client-1', mockSocket, 'user-1');

      const result = await manager.sendToUser('user-1', message);

      expect(result).toBe(true);
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle user with no connections', async () => {
      const message: WebSocketMessage = {
        type: 'test_message',
        timestamp: new Date()
      };

      const result = await manager.sendToUser('non-existent-user', message);

      expect(result).toBe(false);
    });

    it('should remove failed connections during message sending', async () => {
      const mockSocket = { 
        send: jest.fn().mockImplementation(() => {
          throw new Error('Connection failed');
        })
      };
      const message: WebSocketMessage = {
        type: 'test_message',
        timestamp: new Date()
      };
      
      manager.addClient('client-1', mockSocket, 'user-1');

      const result = await manager.sendToUser('user-1', message);

      expect(result).toBe(false);
      
      // Client should be removed due to send failure
      const stats = manager.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should send message to league successfully', async () => {
      const mockSocket1 = { send: jest.fn() };
      const mockSocket2 = { send: jest.fn() };
      const message: WebSocketMessage = {
        type: 'league_update',
        timestamp: new Date()
      };
      
      manager.addClient('client-1', mockSocket1, 'user-1', 'league-1');
      manager.addClient('client-2', mockSocket2, 'user-2', 'league-1');

      const result = await manager.sendToLeague('league-1', message);

      expect(result).toBe(2);
      expect(mockSocket1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(mockSocket2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should exclude specified user when sending to league', async () => {
      const mockSocket1 = { send: jest.fn() };
      const mockSocket2 = { send: jest.fn() };
      const message: WebSocketMessage = {
        type: 'league_update',
        timestamp: new Date()
      };
      
      manager.addClient('client-1', mockSocket1, 'user-1', 'league-1');
      manager.addClient('client-2', mockSocket2, 'user-2', 'league-1');

      const result = await manager.sendToLeague('league-1', message, 'user-1');

      expect(result).toBe(1);
      expect(mockSocket1.send).not.toHaveBeenCalled();
      expect(mockSocket2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  describe('broadcasting', () => {
    beforeEach(() => {
      manager.initialize(mockServer);
    });

    it('should broadcast event to league room', () => {
      const event = {
        type: 'trade_proposed',
        leagueId: 'league-1',
        data: { tradeId: 'trade-123' },
        timestamp: new Date().toISOString()
      };

      manager.broadcastEvent(event);

      expect(mockIo.to).toHaveBeenCalledWith('league:league-1');
      expect(mockIo.emit).toHaveBeenCalledWith('event', {
        ...event,
        timestamp: expect.any(String)
      });
    });

    it('should broadcast event to team room when teamId provided', () => {
      const event = {
        type: 'roster_update',
        leagueId: 'league-1',
        teamId: 'team-1',
        data: { playerId: 'player-123' },
        timestamp: new Date().toISOString()
      };

      manager.broadcastEvent(event);

      expect(mockIo.to).toHaveBeenCalledWith('team:team-1');
    });

    it('should broadcast to league using convenience method', () => {
      const event = {
        type: 'draft_pick',
        data: { playerId: 'player-123' }
      };

      manager.broadcastToLeague('league-1', event);

      expect(mockIo.to).toHaveBeenCalledWith('league:league-1');
      expect(mockIo.emit).toHaveBeenCalledWith('event', {
        ...event,
        leagueId: 'league-1',
        timestamp: expect.any(String)
      });
    });

    it('should broadcast live scores', () => {
      const updates = [
        { gameId: 'game-1', homeScore: 14, awayScore: 7 },
        { gameId: 'game-2', homeScore: 21, awayScore: 10 }
      ];

      manager.broadcastLiveScores(updates);

      expect(mockIo.to).toHaveBeenCalledWith('live_scoring');
      expect(mockIo.emit).toHaveBeenCalledWith('score_updates', updates);
    });

    it('should broadcast breaking news', () => {
      const news = {
        title: 'Player Injury Update',
        content: 'Star player questionable for Sunday',
        playerId: 'player-123',
        priority: 'high' as const
      };

      manager.broadcastBreakingNews(news);

      expect(mockIo.to).toHaveBeenCalledWith('breaking_news');
      expect(mockIo.emit).toHaveBeenCalledWith('breaking_news', {
        ...news,
        timestamp: expect.any(String)
      });
    });

    it('should handle broadcasting without initialized socket', () => {
      const uninitializedManager = new EnhancedWebSocketManager();
      
      expect(() => {
        uninitializedManager.broadcastEvent({
          type: 'test',
          leagueId: 'league-1'
        });
      }).not.toThrow();

      expect(() => {
        uninitializedManager.broadcastLiveScores([]);
      }).not.toThrow();

      expect(() => {
        uninitializedManager.broadcastBreakingNews({
          title: 'Test',
          content: 'Test',
          priority: 'low'
        });
      }).not.toThrow();
    });
  });

  describe('connection stats and status', () => {
    beforeEach(() => {
      manager.initialize(mockServer);
    });

    it('should return accurate connection stats', () => {
      const mockSocket1 = { send: jest.fn() };
      const mockSocket2 = { send: jest.fn() };
      
      manager.addClient('client-1', mockSocket1, 'user-1', 'league-1');
      manager.addClient('client-2', mockSocket2, 'user-2', 'league-1');
      manager.addClient('client-3', mockSocket1, 'user-1', 'league-2');

      const stats = manager.getConnectionStats();

      expect(stats).toEqual({
        totalConnections: 3,
        userConnections: 2, // user-1 and user-2
        leagueConnections: 2, // league-1 and league-2
        activeConnections: 3,
        activeSessions: 0, // No sessions in direct client management
        leagueRooms: 0,
        teamRooms: 0,
      });
    });

    it('should return correct status when initialized', () => {
      const status = manager.getStatus();

      expect(status).toEqual({
        connected: true,
        activeConnections: 0,
        leagueRooms: 0,
        teamRooms: 0
      });
    });

    it('should return disconnected status when not initialized', () => {
      const uninitializedManager = new EnhancedWebSocketManager();
      const status = uninitializedManager.getStatus();

      expect(status).toEqual({
        connected: false,
        activeConnections: 0,
        leagueRooms: 0,
        teamRooms: 0
      });
    });
  });

  describe('socket event handling', () => {
    let mockSocket: any;
    let connectionHandler: Function;
    let joinLeagueHandler: Function;
    let disconnectHandler: Function;

    beforeEach(() => {
      manager.initialize(mockServer);
      
      // Get the connection handler
      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      // Mock socket object
      mockSocket = {
        id: 'socket-123',
        handshake: {
          auth: { userId: 'user-123' }
        },
        on: jest.fn(),
        join: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
    });

    it('should handle socket connection correctly', () => {
      connectionHandler(mockSocket);

      // Should set up event handlers
      expect(mockSocket.on).toHaveBeenCalledWith('join_league', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

      // Should store user session
      const status = manager.getStatus();
      expect(status.activeConnections).toBe(1);
    });

    it('should handle league joining', () => {
      connectionHandler(mockSocket);

      // Get the join_league handler
      joinLeagueHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'join_league'
      )?.[1];

      joinLeagueHandler({ leagueId: 'league-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('league:league-123');
      expect(mockSocket.to).toHaveBeenCalledWith('league:league-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('user_joined', {
        userId: 'user-123',
        timestamp: expect.any(String)
      });
    });

    it('should handle socket disconnection', () => {
      connectionHandler(mockSocket);

      // Simulate joining a league first
      joinLeagueHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'join_league'
      )?.[1];
      joinLeagueHandler({ leagueId: 'league-123' });

      // Get the disconnect handler
      disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];

      disconnectHandler('client disconnected');

      // Should clean up session
      const status = manager.getStatus();
      expect(status.activeConnections).toBe(0);
    });

    it('should handle anonymous users', () => {
      const anonymousSocket = {
        ...mockSocket,
        handshake: { auth: {} }
      };

      connectionHandler(anonymousSocket);

      const status = manager.getStatus();
      expect(status.activeConnections).toBe(1);
    });
  });

  describe('room management', () => {
    let mockSocket: any;
    let connectionHandler: Function;
    let joinLeagueHandler: Function;
    let disconnectHandler: Function;

    beforeEach(() => {
      manager.initialize(mockServer);
      
      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      mockSocket = {
        id: 'socket-123',
        handshake: { auth: { userId: 'user-123' } },
        on: jest.fn(),
        join: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
    });

    it('should track league rooms correctly', () => {
      connectionHandler(mockSocket);
      
      joinLeagueHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'join_league'
      )?.[1];

      joinLeagueHandler({ leagueId: 'league-123' });

      const status = manager.getStatus();
      expect(status.leagueRooms).toBe(1);
    });

    it('should clean up empty league rooms on disconnect', () => {
      connectionHandler(mockSocket);
      
      joinLeagueHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'join_league'
      )?.[1];
      joinLeagueHandler({ leagueId: 'league-123' });

      disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler('client disconnected');

      const status = manager.getStatus();
      expect(status.leagueRooms).toBe(0);
    });

    it('should not clean up league rooms with remaining connections', () => {
      // Add two sockets to the same league
      const socket1 = { ...mockSocket, id: 'socket-1' };
      const socket2 = { ...mockSocket, id: 'socket-2' };

      connectionHandler(socket1);
      connectionHandler(socket2);

      const joinHandler1 = socket1.on.mock.calls.find(call => call[0] === 'join_league')?.[1];
      const joinHandler2 = socket2.on.mock.calls.find(call => call[0] === 'join_league')?.[1];

      joinHandler1({ leagueId: 'league-123' });
      joinHandler2({ leagueId: 'league-123' });

      // Disconnect one socket
      const disconnectHandler1 = socket1.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      disconnectHandler1('client disconnected');

      // League room should still exist
      const status = manager.getStatus();
      expect(status.leagueRooms).toBe(1);
    });
  });
});