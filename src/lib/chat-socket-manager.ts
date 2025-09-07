import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface ChatMessage {
  id: string;
  leagueId: string;
  userId: string;
  username: string;
  teamName?: string;
  channel: 'league' | 'trade' | 'commissioner' | 'team';
  channelId?: string; // For team messaging or trade negotiations
  message: string;
  messageType: 'text' | 'emoji' | 'gif' | 'announcement' | 'trade_proposal';
  metadata?: {
    tradeId?: string;
    playerId?: string;
    emoji?: string;
    gifUrl?: string;
    isSystem?: boolean;
  };
  timestamp: Date;
  reactions?: ChatReaction[];
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: string; // Reply to message ID
}

export interface ChatReaction {
  emoji: string;
  users: string[]; // userIds who reacted
  count: number;
}

export interface ChatChannel {
  id: string;
  leagueId: string;
  name: string;
  type: 'league' | 'trade' | 'commissioner' | 'team';
  participants: string[]; // userIds
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCounts: Map<string, number>; // userId -> unread count
  createdAt: Date;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  channelId: string;
  timestamp: Date;
}

export interface SocketWithChatData extends Socket {
  userId?: string;
  username?: string;
  leagueId?: string;
  activeChannels?: Set<string>;
}

class ChatSocketManager {
  private io: SocketIOServer | null = null;
  private channels: Map<string, ChatChannel> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map(); // channelId -> messages
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>
  private typingUsers: Map<string, Set<TypingIndicator>> = new Map(); // channelId -> typing users
  private onlineUsers: Map<string, Set<string>> = new Map(); // leagueId -> Set<userId>

  initialize(server: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(server, {
      path: '/api/chat-socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    this.setupPeriodicCleanup();
    return this.io;
  }

  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: SocketWithChatData) => {
      console.log('🔗 Chat socket connected:', socket.id);

      // User authentication and join league
      socket.on('authenticate', async (data: { userId: string; username: string; leagueId: string }) => {
        try {
          const { userId, username, leagueId } = data;
          
          socket.userId = userId;
          socket.username = username;
          socket.leagueId = leagueId;
          socket.activeChannels = new Set();

          // Track user connection
          if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
          }
          this.userConnections.get(userId)!.add(socket.id);

          // Add to online users
          if (!this.onlineUsers.has(leagueId)) {
            this.onlineUsers.set(leagueId, new Set());
          }
          this.onlineUsers.get(leagueId)!.add(userId);

          // Join league room
          await socket.join(`league:${leagueId}`);

          // Send available channels
          const leagueChannels = this.getLeagueChannels(leagueId);
          socket.emit('channels', leagueChannels);

          // Broadcast user online status
          socket.to(`league:${leagueId}`).emit('user-online', { userId, username });

          console.log(`👤 User ${username} authenticated for league ${leagueId}`);
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Join specific channel
      socket.on('join-channel', async (data: { channelId: string }) => {
        try {
          const { channelId } = data;
          if (!socket.userId || !socket.leagueId) return;

          const channel = this.channels.get(channelId);
          if (!channel || !channel.participants.includes(socket.userId)) {
            socket.emit('error', { message: 'Not authorized to join this channel' });
            return;
          }

          await socket.join(channelId);
          socket.activeChannels?.add(channelId);

          // Send recent messages
          const recentMessages = this.getChannelMessages(channelId, 50);
          socket.emit('channel-messages', { channelId, messages: recentMessages });

          // Reset unread count
          channel.unreadCounts.set(socket.userId, 0);

          console.log(`📱 User ${socket.userId} joined channel ${channelId}`);
        } catch (error) {
          console.error('❌ Join channel error:', error);
        }
      });

      // Send message
      socket.on('send-message', async (data: { 
        channelId: string; 
        message: string; 
        messageType?: 'text' | 'emoji' | 'gif';
        metadata?: any;
        replyTo?: string;
      }) => {
        try {
          if (!socket.userId || !socket.username || !socket.leagueId) return;

          const { channelId, message, messageType = 'text', metadata, replyTo } = data;
          const channel = this.channels.get(channelId);
          
          if (!channel || !channel.participants.includes(socket.userId)) {
            socket.emit('error', { message: 'Not authorized to send messages in this channel' });
            return;
          }

          const chatMessage: ChatMessage = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            leagueId: socket.leagueId,
            userId: socket.userId,
            username: socket.username,
            channel: channel.type,
            channelId,
            message,
            messageType,
            metadata,
            replyTo,
            timestamp: new Date(),
            reactions: []
          };

          // Store message
          if (!this.messages.has(channelId)) {
            this.messages.set(channelId, []);
          }
          this.messages.get(channelId)!.push(chatMessage);

          // Update channel last message
          channel.lastMessage = chatMessage;

          // Update unread counts for other participants
          channel.participants.forEach(participantId => {
            if (participantId !== socket.userId) {
              const currentCount = channel.unreadCounts.get(participantId) || 0;
              channel.unreadCounts.set(participantId, currentCount + 1);
            }
          });

          // Broadcast message to channel
          this.io!.to(channelId).emit('new-message', chatMessage);

          // Send notification to offline users
          this.notifyOfflineUsers(channel, chatMessage);

          console.log(`💬 Message sent in ${channelId} by ${socket.username}`);
        } catch (error) {
          console.error('❌ Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Edit message
      socket.on('edit-message', async (data: { messageId: string; newMessage: string }) => {
        try {
          if (!socket.userId) return;

          const { messageId, newMessage } = data;
          
          // Find and update message
          for (const [channelId, channelMessages] of this.messages) {
            const messageIndex = channelMessages.findIndex(m => m.id === messageId && m.userId === socket.userId);
            if (messageIndex !== -1) {
              channelMessages[messageIndex].message = newMessage;
              channelMessages[messageIndex].isEdited = true;
              channelMessages[messageIndex].editedAt = new Date();

              // Broadcast update
              this.io!.to(channelId).emit('message-edited', channelMessages[messageIndex]);
              break;
            }
          }
        } catch (error) {
          console.error('❌ Edit message error:', error);
        }
      });

      // Add reaction to message
      socket.on('add-reaction', async (data: { messageId: string; emoji: string }) => {
        try {
          if (!socket.userId) return;

          const { messageId, emoji } = data;

          // Find and update message
          for (const [channelId, channelMessages] of this.messages) {
            const message = channelMessages.find(m => m.id === messageId);
            if (message) {
              if (!message.reactions) {
                message.reactions = [];
              }

              const existingReaction = message.reactions.find(r => r.emoji === emoji);
              if (existingReaction) {
                if (!existingReaction.users.includes(socket.userId)) {
                  existingReaction.users.push(socket.userId);
                  existingReaction.count++;
                }
              } else {
                message.reactions.push({
                  emoji,
                  users: [socket.userId],
                  count: 1
                });
              }

              // Broadcast reaction update
              this.io!.to(channelId).emit('reaction-added', { messageId, emoji, userId: socket.userId });
              break;
            }
          }
        } catch (error) {
          console.error('❌ Add reaction error:', error);
        }
      });

      // Remove reaction from message
      socket.on('remove-reaction', async (data: { messageId: string; emoji: string }) => {
        try {
          if (!socket.userId) return;

          const { messageId, emoji } = data;

          // Find and update message
          for (const [channelId, channelMessages] of this.messages) {
            const message = channelMessages.find(m => m.id === messageId);
            if (message && message.reactions) {
              const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
              if (reactionIndex !== -1) {
                const reaction = message.reactions[reactionIndex];
                const userIndex = reaction.users.indexOf(socket.userId);
                
                if (userIndex !== -1) {
                  reaction.users.splice(userIndex, 1);
                  reaction.count--;

                  if (reaction.count === 0) {
                    message.reactions.splice(reactionIndex, 1);
                  }

                  // Broadcast reaction update
                  this.io!.to(channelId).emit('reaction-removed', { messageId, emoji, userId: socket.userId });
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Remove reaction error:', error);
        }
      });

      // Typing indicators
      socket.on('typing-start', (data: { channelId: string }) => {
        if (!socket.userId || !socket.username) return;

        const { channelId } = data;
        if (!this.typingUsers.has(channelId)) {
          this.typingUsers.set(channelId, new Set());
        }

        const typingIndicator: TypingIndicator = {
          userId: socket.userId,
          username: socket.username,
          channelId,
          timestamp: new Date()
        };

        this.typingUsers.get(channelId)!.add(typingIndicator);
        socket.to(channelId).emit('user-typing', typingIndicator);
      });

      socket.on('typing-stop', (data: { channelId: string }) => {
        if (!socket.userId) return;

        const { channelId } = data;
        const typingSet = this.typingUsers.get(channelId);
        if (typingSet) {
          const toRemove = Array.from(typingSet).find(t => t.userId === socket.userId);
          if (toRemove) {
            typingSet.delete(toRemove);
            socket.to(channelId).emit('user-stop-typing', { userId: socket.userId });
          }
        }
      });

      // Create trade negotiation channel
      socket.on('create-trade-channel', async (data: { participantIds: string[]; tradeName: string }) => {
        try {
          if (!socket.userId || !socket.leagueId) return;

          const { participantIds, tradeName } = data;
          const allParticipants = [socket.userId, ...participantIds];

          const tradeChannel = await this.createTradeChannel(socket.leagueId, allParticipants, tradeName);
          
          // Join all participants to the channel
          for (const participantId of allParticipants) {
            const participantSockets = this.userConnections.get(participantId);
            if (participantSockets) {
              for (const socketId of participantSockets) {
                const participantSocket = this.io!.sockets.sockets.get(socketId);
                if (participantSocket) {
                  await participantSocket.join(tradeChannel.id);
                }
              }
            }
          }

          // Notify all participants
          this.io!.to(tradeChannel.id).emit('trade-channel-created', tradeChannel);

        } catch (error) {
          console.error('❌ Create trade channel error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔗 Chat socket disconnected:', socket.id);

        if (socket.userId && socket.leagueId) {
          // Remove from user connections
          const userConnections = this.userConnections.get(socket.userId);
          if (userConnections) {
            userConnections.delete(socket.id);

            // If no more connections, mark offline
            if (userConnections.size === 0) {
              const onlineSet = this.onlineUsers.get(socket.leagueId);
              if (onlineSet) {
                onlineSet.delete(socket.userId);
                
                // Broadcast user offline status
                socket.to(`league:${socket.leagueId}`).emit('user-offline', { 
                  userId: socket.userId 
                });
              }

              // Clear typing indicators
              if (socket.activeChannels) {
                for (const channelId of socket.activeChannels) {
                  const typingSet = this.typingUsers.get(channelId);
                  if (typingSet) {
                    const toRemove = Array.from(typingSet).find(t => t.userId === socket.userId);
                    if (toRemove) {
                      typingSet.delete(toRemove);
                      socket.to(channelId).emit('user-stop-typing', { userId: socket.userId });
                    }
                  }
                }
              }
            }
          }
        }
      });
    });
  }

  // Channel management
  async createLeagueChannel(leagueId: string): Promise<ChatChannel> {
    const channel: ChatChannel = {
      id: `league:${leagueId}`,
      leagueId,
      name: 'League Chat',
      type: 'league',
      participants: [], // Will be populated with all league members
      isActive: true,
      unreadCounts: new Map(),
      createdAt: new Date()
    };

    this.channels.set(channel.id, channel);
    return channel;
  }

  async createCommissionerChannel(leagueId: string, commissionerId: string): Promise<ChatChannel> {
    const channel: ChatChannel = {
      id: `commissioner:${leagueId}`,
      leagueId,
      name: 'Commissioner Announcements',
      type: 'commissioner',
      participants: [commissionerId], // Only commissioner can send
      isActive: true,
      unreadCounts: new Map(),
      createdAt: new Date()
    };

    this.channels.set(channel.id, channel);
    return channel;
  }

  async createTradeChannel(leagueId: string, participantIds: string[], tradeName: string): Promise<ChatChannel> {
    const channelId = `trade:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channel: ChatChannel = {
      id: channelId,
      leagueId,
      name: tradeName,
      type: 'trade',
      participants: participantIds,
      isActive: true,
      unreadCounts: new Map(),
      createdAt: new Date()
    };

    this.channels.set(channel.id, channel);
    return channel;
  }

  private getLeagueChannels(leagueId: string): ChatChannel[] {
    return Array.from(this.channels.values()).filter(c => c.leagueId === leagueId);
  }

  private getChannelMessages(channelId: string, limit: number = 50): ChatMessage[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit);
  }

  private notifyOfflineUsers(channel: ChatChannel, message: ChatMessage) {
    // In production, this would send push notifications to offline users
    const onlineUsers = this.onlineUsers.get(channel.leagueId) || new Set();
    const offlineParticipants = channel.participants.filter(p => !onlineUsers.has(p));
    
    if (offlineParticipants.length > 0) {
      console.log(`📮 Would send push notifications to ${offlineParticipants.length} offline users`);
      // Implementation would depend on push notification service (Firebase, etc.)
    }
  }

  private setupPeriodicCleanup() {
    // Clean up old typing indicators every 30 seconds
    setInterval(() => {
      const now = new Date();
      for (const [channelId, typingSet] of this.typingUsers) {
        const expired = Array.from(typingSet).filter(t => 
          now.getTime() - t.timestamp.getTime() > 10000 // 10 seconds
        );
        
        expired.forEach(indicator => {
          typingSet.delete(indicator);
          this.io?.to(channelId).emit('user-stop-typing', { userId: indicator.userId });
        });
      }
    }, 30000);

    // Clean up old messages (keep only last 1000 per channel)
    setInterval(() => {
      for (const [channelId, messages] of this.messages) {
        if (messages.length > 1000) {
          this.messages.set(channelId, messages.slice(-1000));
        }
      }
    }, 300000); // Every 5 minutes
  }

  // Public methods for external access
  getChannelById(channelId: string): ChatChannel | undefined {
    return this.channels.get(channelId);
  }

  getOnlineUsers(leagueId: string): string[] {
    return Array.from(this.onlineUsers.get(leagueId) || []);
  }

  sendSystemMessage(channelId: string, message: string, metadata?: any) {
    if (!this.channels.has(channelId)) return;

    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      leagueId: this.channels.get(channelId)!.leagueId,
      userId: 'system',
      username: 'System',
      channel: this.channels.get(channelId)!.type,
      channelId,
      message,
      messageType: 'announcement',
      metadata: { isSystem: true, ...metadata },
      timestamp: new Date(),
      reactions: []
    };

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    this.messages.get(channelId)!.push(systemMessage);

    this.io?.to(channelId).emit('new-message', systemMessage);
  }
}

export const chatSocketManager = new ChatSocketManager();
export default chatSocketManager;