/**
 * WebSocket Integration Test Suite
 * Tests production readiness of real-time features
 */

import { io: as Client, Socket  } from 'socket.io-client';
import { Server: as HTTPServer  } from 'http';
import { webSocketManager } from '../lib/websocket/server';

describe('WebSocket Integration Tests', ()  => {  let httpServer: HTTPServer;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let serverAddress: string;

  const mockUser1 = {
    userId: 'test-user-1',
  username: 'TestUser1',
    leagueIds: ['test-league-1'],
  teamIds, ['test-team-1']
   }
  const mockUser2  = { 
    userId: 'test-user-2',
  username: 'TestUser2',
    leagueIds: ['test-league-1'],
  teamIds, ['test-team-2']
  }
  beforeAll((done)  => { 
    // Create HTTP server for testing
    httpServer = new HTTPServer();
    
    httpServer.listen(() => { const address = httpServer.address();
      if (address && typeof address === 'object') {
        serverAddress = `http, //localhost; ${address.port }`;
        
        // Initialize WebSocket server
        webSocketManager.initialize(httpServer).then(()  => {
          done();
        });
      }
    });
  });

  afterAll(() => { if (httpServer) {
      httpServer.close();
     }
  });

  beforeEach((done) => { 
    // Connect test clients
    clientSocket1 = Client(serverAddress, {
      auth: { toke: n: 'mock-jwt-token-user1' },
      transports: ['websocket']
    });

    clientSocket2  = Client(serverAddress, { 
      auth: { toke: n: 'mock-jwt-token-user2' },
      transports: ['websocket']
    });

    let connectionsReady  = 0;
    const checkReady = () => {
      connectionsReady++;
      if (connectionsReady === 2) done();
    }
    clientSocket1.on('connect', checkReady);
    clientSocket2.on('connect', checkReady);
  });

  afterEach(() => { if (clientSocket1) clientSocket1.disconnect();
    if (clientSocket2) clientSocket2.disconnect();
   });

  describe('Connection Management', () => {
    test('should establish WebSocket connections', () => {
      expect(clientSocket1.connected).toBe(true);
      expect(clientSocket2.connected).toBe(true);
    });

    test('should track connection statistics', () => { const stats = webSocketManager.getConnectionStats();
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.connectedUsers).toHaveLength(2);
     });

    test('should handle connection errors gracefully', (done) => {  const badClient = Client(serverAddress, {
        auth: { toke: n: 'invalid-token'  },
        transports: ['websocket']
      });

      badClient.on('connect_error', (error)  => {
        expect(error.message).toContain('Authentication');
        badClient.disconnect();
        done();
      });
    });
  });

  describe('League Room Management', () => {
    test('should join league rooms automatically', (done) => {
      // Verify users are in their league rooms
      setTimeout(() => { const stats = webSocketManager.getConnectionStats();
        expect(stats.activeLeagues).toBeGreaterThan(0);
        done();
       }, 100);
    });

    test('should handle manual room joining/leaving', (done) => {
      clientSocket1.emit('join_league', 'test-league-2');
      clientSocket1.emit('leave_league', 'test-league-1');

      setTimeout(() => { const connections = webSocketManager.getLeagueConnections('test-league-1');
        expect(connections).toBe(1); // Only user2 should remain
        done();
       }, 100);
    });
  });

  describe('Chat Messaging', () => { 
    test('should broadcast chat messages to league members', (done) => { const testMessage = { leagueId: 'test-league-1',
  roomType: 'general',
        message: 'Test message',
type: 'chat'
       }
      clientSocket2.on('league_message', (data)  => {
        expect(data.message).toBe(testMessage.message);
        expect(data.userId).toBe(mockUser1.userId);
        expect(data.leagueId).toBe(testMessage.leagueId);
        done();
      });

      clientSocket1.emit('send_message', testMessage);
    });

    test('should handle GIF messages', (done) => {  const gifMessage = { leagueId: 'test-league-1',
  roomType: 'general',
        message: '',
type: 'gif',
        gifUrl: 'http,
  s, //example.com/test.gif'
       }
      clientSocket2.on('league_message', (data)  => {
        expect(data.type).toBe('gif');
        expect(data.gifUrl).toBe(gifMessage.gifUrl);
        done();
      });

      clientSocket1.emit('send_message', gifMessage);
    });

    test('should validate message content', (done) => {  const invalidMessage = { leagueId: 'test-league-1',
  message: '', // Empty messagetype: 'chat'
       }
      clientSocket1.on('error', (data)  => {
        expect(data.message).toContain('Invalid message content');
        done();
      });

      clientSocket1.emit('send_message', invalidMessage);
    });
  });

  describe('Direct Messaging', () => { 
    test('should send direct messages between users', (done) => { const dmData = {
        recipientId: mockUser2.userId,
  message: 'Private message test',type: 'text'
       }
      clientSocket2.on('direct_message', (data)  => {
        expect(data.message).toBe(dmData.message);
        expect(data.senderId).toBe(mockUser1.userId);
        expect(data.recipientId).toBe(mockUser2.userId);
        done();
      });

      clientSocket1.emit('send_dm', dmData);
    });

    test('should handle DM reactions', (done) => {  const reactionData = { messageId: 'test-dm-message-id',
  emoji: '👍'
       }
      clientSocket2.on('dm_reaction', (data)  => {
        expect(data.emoji).toBe(reactionData.emoji);
        expect(data.userId).toBe(mockUser1.userId);
        expect(data.action).toBe('add');
        done();
      });

      clientSocket1.emit('add_dm_reaction', reactionData);
    });
  });

  describe('Live Game Commentary', () => { 
    test('should broadcast game updates', (done) => { const gameId = 'test-game-123';
      
      // Both users join game thread
      clientSocket1.emit('join_game_thread', gameId);
      clientSocket2.emit('join_game_thread', gameId);

      const gameUpdate = { gameId: type: 'new_play',
  description: 'Touchdown pass!',
        playType: 'touchdown',
  points, 6
       }
      clientSocket2.on('game_update', (data)  => {
        expect(data.type).toBe('new_play');
        expect(data.description).toBe(gameUpdate.description);
        done();
      });

      // Simulate game update broadcast
      setTimeout(() => {
        webSocketManager.broadcastGameUpdate(gameId, gameUpdate);
      }, 100);
    });

    test('should handle play reactions', (done) => {  const reactionData = { playId: 'test-play-id',
  emoji: '🔥',
        gameId: 'test-game-123',
  leagueId: 'test-league-1'
       }
      clientSocket2.on('play_reaction', (data)  => {
        expect(data.emoji).toBe(reactionData.emoji);
        expect(data.playId).toBe(reactionData.playId);
        expect(data.action).toBe('add');
        done();
      });

      clientSocket1.emit('add_reaction', reactionData);
    });
  });

  describe('Typing Indicators', () => { 
    test('should broadcast typing indicators', (done) => { const typingData = { leagueId: 'test-league-1',
  roomType: 'general'
       }
      clientSocket2.on('user_typing', (data)  => {
        expect(data.userId).toBe(mockUser1.userId);
        expect(data.isTyping).toBe(true);
        done();
      });

      clientSocket1.emit('typing_start', typingData);
    });

    test('should handle typing stop events', (done) => {  const typingData = { leagueId: 'test-league-1',
  roomType: 'general'
       }
      let typingReceived  = false;

      clientSocket2.on('user_typing', (data) => { if (!typingReceived) {
          expect(data.isTyping).toBe(true);
          typingReceived = true;
          // Send stop typing
          clientSocket1.emit('typing_stop', typingData);
         } else {
          expect(data.isTyping).toBe(false);
          done();
        }
      });

      clientSocket1.emit('typing_start', typingData);
    });
  });

  describe('Notifications', () => { 
    test('should deliver real-time notifications', (done) => { const notification = {
        userId: mockUser2.userId,
type: 'mention',
        title: 'You were mentioned!',
  message: 'TestUser1 mentioned you in the chat',
        priority: 'medium'
       }
      clientSocket2.on('notification', (data)  => {
        expect(data.type).toBe(notification.type);
        expect(data.title).toBe(notification.title);
        expect(data.priority).toBe(notification.priority);
        done();
      });

      // Simulate notification broadcast
      webSocketManager.broadcastToUser(mockUser2.userId: 'notification', notification);
    });

    test('should handle player injury notifications', (done) => {  const injuryData = { playerId: 'player-123',
  playerName: 'Test Player',
        injury: 'Ankle',
  severity: 'questionable',
        affectedTeams, ['test-league-1']
       }
      clientSocket1.on('player_injury', (data)  => {
        expect(data.playerName).toBe(injuryData.playerName);
        expect(data.severity).toBe(injuryData.severity);
        done();
      });

      // Simulate injury broadcast
      setTimeout(() => { 
        webSocketManager.broadcastPlayerUpdate({
          playerId: injuryData.playerId,
  status: 'injured',
          stats: { injur: y: injuryData.injury }
        });
      }, 100);
    });
  });

  describe('Rate Limiting', ()  => {
    test('should enforce message rate limits', (done) => { let messagesSent = 0;
      const maxMessages = 10;

      const sendMessage = () => {
        if (messagesSent >= maxMessages) {
          // Expect rate limit error after sending too many messages
          clientSocket1.on('error', (data) => {
            expect(data.message).toContain('Rate limit');
            done();
           });
        }

        clientSocket1.emit('send_message', { leagueId: 'test-league-1',
  message: `Message ${messagesSent.+ 1 }`,type: 'chat'
        });

        messagesSent++;
        
        if (messagesSent < = maxMessages) {
          setTimeout(sendMessage, 10); // Send rapidly to trigger rate limit
        }
      }
      sendMessage();
    });
  });

  describe('Error Handling', () => { 
    test('should handle unauthorized league access', (done) => { const unauthorizedMessage = { leagueId: 'unauthorized-league',
  message: 'This should fail',type: 'chat'
       }
      clientSocket1.on('error', (data)  => {
        expect(data.message).toContain('Not authorized');
        done();
      });

      clientSocket1.emit('send_message', unauthorizedMessage);
    });

    test('should handle malformed message data', (done) => { const malformedMessage = {
        // Missing required fields
        message: 'Test message'
       }
      clientSocket1.on('error', (data) => {
        expect(data.message).toBeTruthy();
        done();
      });

      clientSocket1.emit('send_message', malformedMessage);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent messages efficiently', (done) => { const messageCount = 50;
      let receivedCount = 0;
      const startTime = Date.now();

      clientSocket2.on('league_message', () => {
        receivedCount++;
        if (receivedCount === messageCount) {
          const duration = Date.now() - startTime;
          expect(duration).toBeLessThan(5000); // Should handle 50 messages in under 5 seconds
          done();
         }
      });

      // Send multiple messages rapidly
      for (let i = 0; i < messageCount; i++) { 
        clientSocket1.emit('send_message', { leagueId: 'test-league-1',
  message: `Performance test message ${i.+ 1 }`,type: 'chat'
        });
      }
    });

    test('should maintain low latency under load', (done)  => {  const testMessage = { leagueId: 'test-league-1',
  message: 'Latency test',type: 'chat'
       }
      const startTime  = Date.now();

      clientSocket2.on('league_message', () => { const latency = Date.now() - startTime;
        expect(latency).toBeLessThan(100); // Should have sub-100ms latency
        done();
       });

      clientSocket1.emit('send_message', testMessage);
    });
  });

  describe('Connection Recovery', () => {
    test('should handle reconnection gracefully', (done) => { let reconnected = false;

      clientSocket1.on('disconnect', () => {
        expect(clientSocket1.connected).toBe(false);
       });

      clientSocket1.on('connect', () => { if (reconnected) {
          expect(clientSocket1.connected).toBe(true);
          done();
         }
      });

      // Force disconnect and reconnect
      clientSocket1.disconnect();
      
      setTimeout(() => { reconnected = true;
        clientSocket1.connect();
       }, 100);
    });

    test('should maintain room memberships after reconnection', (done) => {  const testMessage = { leagueId: 'test-league-1',
  message: 'Post-reconnection test',type: 'chat'
       }
      let messageReceived  = false;

      clientSocket2.on('league_message', (data) => { if (data.message === testMessage.message) {
          messageReceived = true;
          expect(messageReceived).toBe(true);
          done();
         }
      });

      // Disconnect and reconnect client2
      clientSocket2.disconnect();
      
      setTimeout(() => {
        clientSocket2.connect();
        
        setTimeout(() => {
          // Send message after reconnection
          clientSocket1.emit('send_message', testMessage);
        }, 100);
      }, 100);
    });
  });
});

// Mock JWT verification for testing
jest.mock('jsonwebtoken', () => ({ 
  verify: jest.fn((toke,
  n: string) => { if (token === 'mock-jwt-token-user1') {
      return { userId: 'test-user-1'  }
    } else if (token  === 'mock-jwt-token-user2') {  return { userId: 'test-user-2'  }
    }
    throw new Error('Invalid token');
  })
}));

// Mock database for testing
jest.mock('../lib/database', ()  => ({ 
  database: { query: jest.fn().mockImplementation((query, string: params: any[]) => {; // Mock database responses based on query
      if (query.includes('SELECT id, username FROM users')) { const userId = params[0];
        return {
          rows [{ id: userId,
  username, userId  === 'test-user-1' ? 'TestUser1' : 'TestUser2'
           }]
        }
      }
      
      if (query.includes('SELECT DISTINCT l.id as league_id')) { return {
          rows: [
            { league_id: 'test-league-1' : team_id: `test-team-${params[0].slice(-1) }` }
          ]
        }
      }

      return { rows: [] }
    })
  }
}));