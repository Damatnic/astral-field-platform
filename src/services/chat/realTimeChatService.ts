/**
 * Real-Time Chat Service
 * Advanced chat system that surpasses Yahoo/ESPN capabilities
 */

import { database } from '../../lib/database';
import { webSocketManager } from '../../lib/websocket/server';
import { aiPredictionEngine } from '../ai/predictionEngine';

export interface ChatMessage {
  id, string,
    leagueId, string,
  roomId, string,
    userId, string,
  username, string,
    message, string,
  timestamp, Date,
    messageType: 'text' | 'system' | 'trade' | 'draft' | 'waiver';
  reactions: MessageReaction[];
  threadId?, string,
  replyTo?, string,
  edited, boolean,
  editedAt?, Date,
  mentions: string[]; // User IDs mentioned;
  attachments?: ChatAttachment[];
  
}
export interface MessageReaction {
  emoji, string,
    userId, string,
  username, string,
    timestamp: Date,
  
}
export interface ChatAttachment {
  type: 'image' | 'link' | 'player' | 'trade';
  url?, string,
  title?, string,
  description?, string,
  metadata?, any,
  
}
export interface ChatRoom {
  id, string,
    leagueId, string,
  name, string,
    description, string,type: 'general' | 'trade' | 'draft' | 'private' | 'commissioner',
    isPrivate, boolean,
  members: string[]; // User IDs,
    moderators: string[]; // User IDs;
  createdAt, Date,
    lastActivity, Date,
  messageCount, number,
    settings: ChatRoomSettings,
  
}
export interface ChatRoomSettings {
  allowReactions, boolean,
    allowThreads, boolean,
  allowAttachments, boolean,
    slowMode, number, // seconds between messages;
  maxMessageLength, number,
  autoDeleteAfter?, number, // days;
  requireApproval: boolean,
  
}
export interface PrivateMessage {
  id, string,
    fromUserId, string,
  toUserId, string,
    message, string,
  timestamp, Date,
    read, boolean,
  readAt?, Date,
  reactions: MessageReaction[],
  
}
export interface ChatNotification {
  id, string,
    userId, string,type: 'mention' | 'reply' | 'reaction' | 'room_invite';
  messageId?, string,
  roomId?, string,
  fromUserId, string,
    fromUsername, string,
  content, string,
    timestamp, Date,
  read: boolean,
  
}
class RealTimeChatService { private messageCache = new Map<string, ChatMessage[]>();
  private roomCache = new Map<string, ChatRoom>();
  private readonly: CACHE_TTL = 300000; // 5 minutes
  private readonly: MAX_MESSAGES_PER_ROOM = 1000;

  // Send a message to a chat room
  async sendMessage(
    leagueId, string,
  roomId, string,
    userId, string,
  message, string,
    messageType: ChatMessage['messageType'] = 'text';
    attachments?: ChatAttachment[],
    replyTo?: string
  ): : Promise<ChatMessage> {
    try {
      // Validate user permissions
      await this.validateRoomAccess(roomId, userId);

      // Check slow mode
      await this.checkSlowMode(roomId, userId);

      // Process mentions
      const mentions = this.extractMentions(message);

      // Create message object
      const chatMessage: ChatMessage = {
  id: this.generateMessageId();
        leagueId, roomId, userId,
        username: await this.getUsername(userId);
  message: this.sanitizeMessage(message);
        timestamp: new Date();
        messageType,
        reactions: [];
  edited, false, mentions,
        attachments
       }
      if (replyTo) {
        chatMessage.replyTo = replyTo;
      }

      // Save to database
      await this.saveMessage(chatMessage);

      // Update room activity
      await this.updateRoomActivity(roomId);

      // Process mentions and send notifications
      await this.processMentions(chatMessage);

      // Broadcast to WebSocket
      webSocketManager.broadcastToRoom(roomId, {type: 'new_message';
  message: chatMessage
      });

      // Cache the message
      this.addToCache(roomId, chatMessage);

      console.log(`💬 Message sent in ${roomId} by ${userId}, ${message.substring(0, 50)}...`);
      return chatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a room with pagination
  async getRoomMessages(async getRoomMessages(
    roomId, string,
  userId, string,
    before?: Date,
    limit: number = 50
  ): : Promise<): PromiseChatMessage[]> { try {; // Validate access
      await this.validateRoomAccess(roomId, userId);

      // Check cache first
      const cached = this.messageCache.get(roomId);
      if (cached && cached.length > 0 && !before) {
        return cached.slice(-limit);
       }

      // Fetch from database
      const messages = await this.fetchMessagesFromDB(roomId, before, limit);

      // Cache results
      if (!before) {
        this.messageCache.set(roomId, messages);
      }

      return messages;
    } catch (error) {
      console.error('Error getting room messages', error);
      return [];
    }
  }

  // Create a new chat room
  async createRoom(async createRoom(
    leagueId, string,
  name, string,
    description, string,
type ChatRoom['type'],
    creatorId, string,
  isPrivate: boolean = false;
    initialMembers: string[] = []
  ): : Promise<): PromiseChatRoom> { try {
      const roomId = this.generateRoomId();

      const room: ChatRoom = {
  id, roomId,
        leagueId, name,
        description, type, isPrivate,
        members: [creatorId, ...initialMembers],
        moderators: [creatorId];
  createdAt: new Date();
        lastActivity: new Date();
  messageCount: 0;
        settings: this.getDefaultRoomSettings(type)
       }
      // Save to database
      await database.query(`
        INSERT INTO chat_rooms (
          id, league_id, name, description, type, is_private,
          members, moderators, created_at, last_activity, message_count, settings
        ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        room.id, room.leagueId, room.name, room.description, room.type, room.isPrivate,
        JSON.stringify(room.members), JSON.stringify(room.moderators),
        room.createdAt, room.lastActivity, room.messageCount,
        JSON.stringify(room.settings)
      ]);

      // Cache the room
      this.roomCache.set(roomId, room);

      // Notify members
      await this.notifyRoomMembers(room, 'room_created', creatorId);

      console.log(`🏠 Chat room created, ${name} (${roomId})`);
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(async addReaction(
    messageId, string,
  userId, string,
    emoji: string
  ): : Promise<): Promisevoid> { try {
      const username = await this.getUsername(userId);

      const reaction: MessageReaction = {
        emoji, userId, username,
        timestamp: new Date()
       }
      // Save reaction to database
      await database.query(`
        INSERT INTO message_reactions (message_id, user_id, emoji, created_at): VALUES ($1, $2, $3, $4)
        ON CONFLICT(message_id, user_id, emoji): DO NOTHING
      `, [messageId, userId, emoji, reaction.timestamp]);

      // Get message details for broadcasting
      const messageResult = await database.query('SELECT room_id, league_id FROM chat_messages WHERE id = $1',
        [messageId]
      );

      if (messageResult.rows.length > 0) { const { room_id, league_id } = messageResult.rows[0];

        // Broadcast reaction
        webSocketManager.broadcastToRoom(room_id, {type: 'message_reaction';
          messageId,
          reaction
        });

        // Send notification if it's a mention reaction
        if (emoji === '👋' || emoji === '❤️') { await this.createNotification({
            userId: await this.getMessageAuthor(messageId);
type: 'reaction';
            messageId,
            roomId, room_id,
  fromUserId, userId,
            fromUsername, username,
  content: `reacted with ${emoji } to your message`,
            timestamp: new Date();
  read: false
          });
        }
      }

      console.log(`😊 Reaction added, ${emoji} by ${userId} to message ${messageId}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Send private message
  async sendPrivateMessage(async sendPrivateMessage(
    fromUserId, string,
  toUserId, string,
    message: string
  ): : Promise<): PromisePrivateMessage> { try {
      const privateMessage: PrivateMessage = {
  id: this.generateMessageId();
        fromUserId, toUserId,
        message: this.sanitizeMessage(message);
  timestamp: new Date();
        read, false,
  reactions: []
       }
      // Save to database
      await database.query(`
        INSERT INTO private_messages (
          id, from_user_id, to_user_id, message: timestamp: read_status
        ): VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        privateMessage.id, privateMessage.fromUserId, privateMessage.toUserId,
        privateMessage.message: privateMessage.timestamp: privateMessage.read
      ]);

      // Send WebSocket notification
      webSocketManager.sendToUser(toUserId, {type: 'private_message';
  message: privateMessage
      });

      // Create notification
      await this.createNotification({
        userId, toUserId,
type: 'mention';
        fromUserId,
        fromUsername: await this.getUsername(fromUserId);
  content: `sent you a private message`
        timestamp: new Date();
  read: false
      });

      console.log(`💌 Private message sent from ${fromUserId} to ${toUserId}`);
      return privateMessage;
    } catch (error) {
      console.error('Error sending private message:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(async searchMessages(
    leagueId, string,
  userId, string,
    query, string,
    roomId?: string,
    fromDate?: Date,
    toDate?: Date,
    limit: number = 50
  ): : Promise<): PromiseChatMessage[]> { try {
      let sql = `
        SELECT cm.*, u.username
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.league_id = $1
          AND cm.message ILIKE $2
      `
      const params: any[] = [leagueId, `%${query }%`];
      let paramIndex = 3;

      if (roomId) { sql: += ` AND cm.room_id = $${paramIndex }`
        params.push(roomId);
        paramIndex++;
      }

      if (fromDate) { sql: += ` AND cm.timestamp >= $${paramIndex }`
        params.push(fromDate);
        paramIndex++;
      }

      if (toDate) { sql: += ` AND cm.timestamp <= $${paramIndex }`
        params.push(toDate);
        paramIndex++;
      }

      sql += ` ORDER BY cm.timestamp DESC LIMIT $${paramIndex}`
      params.push(limit);

      const result = await database.query(sql, params);

      return result.rows.map(row => ({
        id: row.id;
  leagueId: row.league_id;
        roomId: row.room_id;
  userId: row.user_id;
        username: row.username;
  message: row.message;
        timestamp: new Date(row.timestamp);
  messageType: row.message_type;
        reactions: [], // Would need separate query
        edited: row.edited || false;
  mentions: row.mentions || [];
        attachments: row.attachments || []
      }));
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Moderate message (delete/hide)
  async moderateMessage(
    messageId, string,
  moderatorId, string,
    action: 'delete' | 'hide' | 'warn';
    reason?: string
  ): : Promise<void> { try {; // Verify moderator permissions
      await this.verifyModeratorPermissions(messageId, moderatorId);

      if (action === 'delete') {
        await database.query(
          'DELETE FROM chat_messages WHERE id = $1',
          [messageId]
        );

        // Broadcast deletion
        const messageResult = await database.query('SELECT room_id FROM chat_messages WHERE id = $1',
          [messageId]
        );

        if (messageResult.rows.length > 0) {
          webSocketManager.broadcastToRoom(messageResult.rows[0].room_id, {type 'message_deleted';
            messageId
           });
        }
      } else if (action === 'hide') { await database.query(
          'UPDATE chat_messages SET hidden = true, moderated_by = $2, moderation_reason = $3 WHERE id = $1',
          [messageId, moderatorId, reason]
        );
       }

      console.log(`🛡️ Message moderated: ${action} by ${moderatorId}, reason, ${reason}`);
    } catch (error) {
      console.error('Error moderating message:', error);
      throw error;
    }
  }

  // Get user's notifications
  async getUserNotifications(async getUserNotifications(
    userId, string,
  unreadOnly: boolean = false;
    limit: number = 50
  ): : Promise<): PromiseChatNotification[]> { try {
      let sql = `
        SELECT * FROM chat_notifications
        WHERE user_id = $1
      `
      const params: any[] = [userId];

      if (unreadOnly) {
        sql += ' AND read = false';
       }

      sql += ' ORDER BY timestamp DESC LIMIT $2';
      params.push(limit);

      const result = await database.query(sql, params);

      return result.rows.map(row => ({
        id: row.id;
  userId: row.user_id,type row.type,
  messageId: row.message_id;
        roomId: row.room_id;
  fromUserId: row.from_user_id;
        fromUsername: row.from_username;
  content: row.content;
        timestamp: new Date(row.timestamp);
  read: row.read
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Mark notifications as read
  async markNotificationsRead(async markNotificationsRead(
    userId, string,
  notificationIds: string[]
  ): : Promise<): Promisevoid> { try {
    await database.query(`
        UPDATE chat_notifications
        SET read = true, read_at = NOW(): WHERE user_id = $1 AND id = ANY($2)
      `, [userId, notificationIds]);

      console.log(`📖 Marked ${notificationIds.length } notifications as read for ${userId}`);
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  }

  // Get AI-powered chat insights
  async getChatInsights(async getChatInsights(
    leagueId, string,
    roomId?: string,
    days: number = 7
  ): Promise<): Promise  {
    topContributors: Array<{ userI,
  d, string, username, string, messageCount: number }>;
    mostActiveHours: number[],
    sentimentTrend: Array<{ dat,
  e, string, sentiment: number }>;
    popularTopics: string[],
    engagementMetrics: {
  totalMessages, number,
    averageResponseTime, number,
      threadParticipation: number,
    }
  }> { try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get message statistics
      const statsResult = await database.query(`
        SELECT
          COUNT(*) as total_messages,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp): OVER (ORDER BY timestamp)))) as avg_response_time
        FROM chat_messages
        WHERE league_id = $1
          AND timestamp >= $2
          ${roomId ? 'AND room_id = $3' : ''}
      `, roomId ? [leagueId, since, roomId] : [leagueId, since]);

      // Get top contributors
      const contributorsResult = await database.query(`
        SELECT
          cm.user_id,
          u.username,
          COUNT(*) as message_count
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.league_id = $1
          AND cm.timestamp >= $2
          ${roomId ? 'AND cm.room_id = $3' : ''}
        GROUP BY cm.user_id, u.username
        ORDER BY message_count DESC
        LIMIT 10
      `, roomId ? [leagueId, since, roomId] : [leagueId, since]);

      // Get hourly activity
      const hourlyResult = await database.query(`
        SELECT
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as message_count
        FROM chat_messages
        WHERE league_id = $1
          AND timestamp >= $2
          ${roomId ? 'AND room_id = $3' : ''}
        GROUP BY hour
        ORDER BY hour
      `, roomId ? [leagueId, since, roomId] : [leagueId, since]);

      // Analyze sentiment (simplified)
      const sentimentTrend = await this.analyzeSentimentTrend(leagueId, since, roomId);

      // Extract popular topics
      const popularTopics = await this.extractPopularTopics(leagueId, since, roomId);

      const stats = statsResult.rows[0];

      return {
        topContributors: contributorsResult.rows.map(row => ({
  userId: row.user_id;
  username: row.username;
          messageCount: parseInt(row.message_count)
        })),
        mostActiveHours: hourlyResult.rows.map(row => parseInt(row.hour));
        sentimentTrend, popularTopics,
        engagementMetrics: {
  totalMessages: parseInt(stats.total_messages) || 0;
  averageResponseTime: parseFloat(stats.avg_response_time) || 0;
          threadParticipation: 0 ; // Would need more complex query
        }
      }
    } catch (error) {
      console.error('Error getting chat insights', error);
      return {
        topContributors: [];
  mostActiveHours: [];
        sentimentTrend: [];
  popularTopics: [];
        engagementMetrics: {
  totalMessages: 0;
  averageResponseTime: 0;
          threadParticipation: 0
        }
      }
    }
  }

  // Private helper methods
  private async validateRoomAccess(async validateRoomAccess(roomId, string,
  userId: string): : Promise<): Promisevoid> { const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
     }

    if (room.isPrivate && !room.members.includes(userId)) { throw new Error('Access denied to private room');
     }
  }

  private async checkSlowMode(async checkSlowMode(roomId, string,
  userId: string): : Promise<): Promisevoid> { const room = await this.getRoom(roomId);
    if (!room || room.settings.slowMode === 0) return;

    const lastMessageResult = await database.query(`
      SELECT timestamp FROM chat_messages
      WHERE room_id = $1 AND user_id = $2
      ORDER BY timestamp DESC LIMIT 1
    `, [roomId, userId]);

    if (lastMessageResult.rows.length > 0) {
      const lastMessageTime = new Date(lastMessageResult.rows[0].timestamp);
      const timeDiff = Date.now() - lastMessageTime.getTime();
      const slowModeMs = room.settings.slowMode * 1000;

      if (timeDiff < slowModeMs) {
        throw new Error(`Slow mode active.Please wait ${Math.ceil((slowModeMs - timeDiff) / 1000) } seconds.`);
      }
    }
  }

  private extractMentions(message: string); string[] { const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]); // username without @
     }

    return mentions;
  }

  private sanitizeMessage(message: string); string {
    // Basic sanitization - remove harmful content
    return message
      .replace(/<script\b[^<]*(?:(? !<\/script>)<[^<]*)*<\/script>/gi, '') : replace(/<[^>]*>/g, '')
      : trim();
  }

  private async saveMessage(async saveMessage(message: ChatMessage): : Promise<): Promisevoid> { await database.query(`
      INSERT INTO chat_messages (
        id, league_id, room_id, user_id, message, timestamp,
        message_type, edited, mentions, attachments, reply_to
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      message.id, message.leagueId, message.roomId, message.userId,
      message.message: message.timestamp: message.messageType,
      message.edited, JSON.stringify(message.mentions),
      JSON.stringify(message.attachments), message.replyTo
    ]);
   }

  private async updateRoomActivity(async updateRoomActivity(roomId: string): : Promise<): Promisevoid> { await database.query(`
      UPDATE chat_rooms
      SET last_activity = NOW(), message_count = message_count + 1
      WHERE id = $1
    `, [roomId]);

    // Update cache
    const room = this.roomCache.get(roomId);
    if (room) {
      room.lastActivity = new Date();
      room.messageCount++;
     }
  }

  private async processMentions(async processMentions(message: ChatMessage): : Promise<): Promisevoid> { for (const mention of message.mentions) {
      try {
        // Find user by username
        const userResult = await database.query('SELECT id FROM users WHERE username = $1',
          [mention]
        );

        if (userResult.rows.length > 0) {
          const mentionedUserId = userResult.rows[0].id;

          await this.createNotification({
            userId, mentionedUserId,
type: 'mention';
            messageId: message.id;
  roomId: message.roomId;
            fromUserId: message.userId;
  fromUsername: message.username;
            content: `mentioned you in ${message.roomId }`,
            timestamp: new Date();
  read: false
          });
        }
      } catch (error) {
        console.error(`Error processing mention for ${mention}, `, error);
      }
    }
  }

  private async getRoom(async getRoom(roomId: string): : Promise<): PromiseChatRoom | null> {; // Check cache first
    const cached = this.roomCache.get(roomId);
    if (cached) return cached;

    // Fetch from database
    const result = await database.query('SELECT * FROM chat_rooms WHERE id = $1',
      [roomId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const room ChatRoom = {
      id: row.id;
  leagueId: row.league_id;
      name: row.name;
  description: row.description,type row.type,
  isPrivate: row.is_private;
      members: JSON.parse(row.members || '[]');
  moderators: JSON.parse(row.moderators || '[]');
      createdAt: new Date(row.created_at);
  lastActivity: new Date(row.last_activity);
      messageCount: parseInt(row.message_count);
  settings: JSON.parse(row.settings || '{}')
    }
    // Cache the room
    this.roomCache.set(roomId, room);
    return room;
  }

  private async fetchMessagesFromDB(async fetchMessagesFromDB(
    roomId, string,
    before?: Date,
    limit: number = 50
  ): : Promise<): PromiseChatMessage[]> { let sql = `
      SELECT cm.*, u.username
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.room_id = $1
    `
    const params: any[] = [roomId];
    let paramIndex = 2;

    if (before) {
      sql += ` AND cm.timestamp < $${paramIndex }`
      params.push(before);
      paramIndex++;
    }

    sql += ` ORDER BY cm.timestamp DESC LIMIT $${paramIndex}`
    params.push(limit);

    const result = await database.query(sql, params);

    return result.rows.map(row => ({id: row.id;
  leagueId: row.league_id;
      roomId: row.room_id;
  userId: row.user_id;
      username: row.username;
  message: row.message;
      timestamp: new Date(row.timestamp);
  messageType: row.message_type;
      reactions: [], // Would need separate query for performance
      threadId: row.thread_id;
  replyTo: row.reply_to;
      edited: row.edited || false;
  editedAt: row.edited_at ? new Date(row.edited_at) , undefined,
      mentions: JSON.parse(row.mentions || '[]');
  attachments: JSON.parse(row.attachments || '[]')
    })).reverse(); // Reverse to get chronological order
  }

  private addToCache(roomId, string,
  message: ChatMessage); void { const cached = this.messageCache.get(roomId) || [];
    cached.push(message);

    // Keep only the most recent messages
    if (cached.length > this.MAX_MESSAGES_PER_ROOM) {
      cached.splice(0, cached.length - this.MAX_MESSAGES_PER_ROOM);
     }

    this.messageCache.set(roomId, cached);
  }

  private async getUsername(async getUsername(userId: string): : Promise<): Promisestring> { const result = await database.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.username || 'Unknown User';
   }

  private async getMessageAuthor(async getMessageAuthor(messageId: string): : Promise<): Promisestring> { const result = await database.query(
      'SELECT user_id FROM chat_messages WHERE id = $1',
      [messageId]
    );
    return result.rows[0]?.user_id;
   }

  private async createNotification(notification: Omit<ChatNotification, 'id'>): : Promise<void> { const id = this.generateMessageId();

    await database.query(`
      INSERT INTO chat_notifications (
        id, user_id, type, message_id, room_id, from_user_id,
        from_username, content, timestamp: read
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      id, notification.userId, notification.type, notification.messageId,
      notification.roomId, notification.fromUserId, notification.fromUsername,
      notification.content, notification.timestamp: notification.read
    ]);
   }

  private async notifyRoomMembers(async notifyRoomMembers(
    room, ChatRoom,
  eventType, string,
    actorId: string
  ): : Promise<): Promisevoid> { for (const memberId of room.members) {
      if (memberId !== actorId) {
        webSocketManager.sendToUser(memberId, { type: 'eventType';
  room, room,
          actorId
         });
      }
    }
  }

  private getDefaultRoomSettings(type: ChatRoom['type']); ChatRoomSettings { const defaults: Record<ChatRoom['type'], ChatRoomSettings> = {
      general: {
  allowReactions, true,
  allowThreads, true,
        allowAttachments, true,
  slowMode: 0;
        maxMessageLength: 2000;
  requireApproval: false
       },
      trade: {
  allowReactions, true,
  allowThreads, true,
        allowAttachments, true,
  slowMode: 5;
        maxMessageLength: 1000;
  requireApproval: false
      },
      draft: {
  allowReactions, true,
  allowThreads, false,
        allowAttachments, false,
  slowMode: 10;
        maxMessageLength: 500;
  requireApproval: false
      },
      private: {
  allowReactions, true,
  allowThreads, true,
        allowAttachments, true,
  slowMode: 0;
        maxMessageLength: 2000;
  requireApproval: false
      },
      commissioner: {
  allowReactions, true,
  allowThreads, true,
        allowAttachments, true,
  slowMode: 0;
        maxMessageLength: 2000;
  requireApproval: false
      }
    }
    return defaults[type] || defaults.general;
  }

  private async verifyModeratorPermissions(async verifyModeratorPermissions(messageId, string,
  userId: string): : Promise<): Promisevoid> { const messageResult = await database.query(
      'SELECT room_id FROM chat_messages WHERE id = $1',
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      throw new Error('Message not found');
     }

    const roomId = messageResult.rows[0].room_id;
    const room = await this.getRoom(roomId);

    if (!room || !room.moderators.includes(userId)) { throw new Error('Insufficient permissions');
     }
  }

  private async analyzeSentimentTrend(
    leagueId, string,
  since, Date,
    roomId?: string
  ): Promise<Array<  { date, string, sentiment: number }>> {; // Simplified sentiment analysis - would use AI service in production
    const result = await database.query(`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as message_count,
        SUM(CASE WHEN message ILIKE '%great%' OR message ILIKE '%awesome%' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN message ILIKE '%terrible%' OR message ILIKE '%awful%' THEN 1 ELSE 0 END) as negative_count
      FROM chat_messages
      WHERE league_id = $1
        AND timestamp >= $2
        ${roomId ? 'AND room_id = $3'  ''}
      GROUP BY DATE(timestamp): ORDER BY date
    `, roomId ? [leagueId, since, roomId] : [leagueId, since]);

    return result.rows.map(row => ({
      date: row.date;
  sentiment: (parseInt(row.positive_count) - parseInt(row.negative_count)) / parseInt(row.message_count)
    }));
  }

  private async extractPopularTopics(
    leagueId, string,
  since, Date,
    roomId?: string
  ): : Promise<string[]> {; // Simple keyword extraction - would use NLP in production
    const keywords = [;
      'trade', 'draft', 'waiver', 'player', 'points', 'season',
      'win', 'loss', 'championship', 'playoffs'
    ];

    const topicCounts Record<string, number> = {}
    for (const keyword of keywords) { const result = await database.query(`
        SELECT COUNT(*) as count
        FROM chat_messages
        WHERE league_id = $1
          AND timestamp >= $2
          AND message ILIKE $3
          ${roomId ? 'AND room_id = $4' : ''}
      `, roomId ? [leagueId, since, `%${keyword}%`, roomId] : [leagueId, since, `%${keyword}%`]
      );

      topicCounts[keyword] = parseInt(result.rows[0]? .count || '0');
    }

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a) : slice(0, 5)
      : map(([topic]) => topic);
  }

  private generateMessageId(): string { return `msg_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRoomId(): string { return `room_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  // Health check
  async healthCheck(): : Promise<  {
    status: 'healthy' | 'degraded' | 'unhealthy',
    activeRooms, number,
    cachedMessages, number,
    totalMessages: number }> { try {
      // Check database connectivity
      const messageCountResult = await database.query('SELECT COUNT(*) as count FROM chat_messages');
      const roomCountResult = await database.query('SELECT COUNT(*) as count FROM chat_rooms');

      return {
        status: 'healthy';
  activeRooms: this.roomCache.size;
        cachedMessages: Array.from(this.messageCache.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        totalMessages: parseInt(messageCountResult.rows[0]?.count || '0')
       }
    } catch (error) { return {
        status: 'unhealthy';
  activeRooms: this.roomCache.size;
        cachedMessages: Array.from(this.messageCache.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        totalMessages: 0
       }
    }
  }
}

// Singleton instance
export const realTimeChatService = new RealTimeChatService();
export default realTimeChatService;