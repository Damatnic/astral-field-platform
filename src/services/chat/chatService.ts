/**
 * Chat Service for Real-Time Fantasy Football League Communication
 * Handles chat rooms, messaging, reactions, moderation, and analytics
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';

export type ChatRoomType = 'general' | 'trades' | 'waivers' | 'off-topic';

export interface ChatRoom {
  id, string,
    leagueId, string,
  name, string,
  description?, string,type ChatRoomType;
  isPrivate, boolean,
    createdBy, string,
  createdAt, string,
    updatedAt: string,
  
}
export interface ChatMessage {
  id, string,
    roomId, string,
  userId, string,
    username, string,
  content, string,
    messageType: 'text' | 'emoji' | 'gif' | 'system';
  replyToId?, string,
  editedAt?, string,
  createdAt, string,
    updatedAt, string,
  reactions?: MessageReaction[];
  
}
export interface MessageReaction {
  id, string,
    messageId, string,
  userId, string,
    username, string,
  emoji, string,
    createdAt: string,
  
}
export interface TypingIndicator {
  roomId, string,
    userId, string,
  username, string,
    startedAt: string,
  
}
export interface ChatAnalytics {
  leagueId, string,
    date, string,
  totalMessages, number,
    activeUsers, number,
  topTopics: string[],
    engagementScore: number,
  
}
class ChatService { private typingIndicators = new Map<string, Set<string>>();
  private activeUsers = new Map<string, Set<string>>();

  // Chat Room Management
  async getChatRooms(async getChatRooms(leagueId: string): : Promise<): PromiseChatRoom[]> {
    try {
      const result = await database.query(`
        SELECT id, league_id as leagueId, name, description, type, is_private as isPrivate,
               created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM chat_rooms
        WHERE league_id = $1 AND is_private = false
        ORDER BY type, name
      `, [leagueId]);

      return result.rows;
     } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw new Error('Failed to fetch chat rooms');
    }
  }

  async createChatRoom(leagueId, string,
  name, string, type, ChatRoomType, description?: string, createdBy?: string): : Promise<ChatRoom> { try {
      const result = await database.query(`
        INSERT INTO chat_rooms (league_id, name, description, type, created_by): VALUES ($1, $2, $3, $4, $5)
        RETURNING id, league_id as leagueId, name, description, type, is_private as isPrivate,
                  created_by as createdBy, created_at as createdAt, updated_at as updatedAt
      `, [leagueId, name, description, type, createdBy]);

      return result.rows[0];
     } catch (error) {
      console.error('Error creating chat room:', error);
      throw new Error('Failed to create chat room');
    }
  }

  // Message Management
  async sendMessage(
    leagueId, string,
  roomType, ChatRoomType, 
    userId, string,
  content, string, 
    messageType: 'text' | 'emoji' | 'gif' = 'text';
    replyToId?: string
  ): : Promise<ChatMessage> { try {; // Get room ID from type
      const roomResult = await database.query(`
        SELECT id FROM chat_rooms WHERE league_id = $1 AND type = $2
      `, [leagueId, roomType]);

      if (roomResult.rows.length === 0) {
        throw new Error('Chat room not found');
       }

      const roomId = roomResult.rows[0].id;

      // Get username
      const userResult = await database.query(`
        SELECT username FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) { throw new Error('User not found');
       }

      const username = userResult.rows[0].username;

      // Sanitize content
      const sanitizedContent = this.sanitizeMessage(content);
      if (!sanitizedContent) { throw new Error('Invalid message content');
       }

      // Insert message
      const messageResult = await database.query(`
        INSERT INTO chat_messages (room_id, user_id, content, message_type, reply_to_id) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, room_id as roomId, user_id as userId, content, message_type as messageType,
                  reply_to_id as replyToId, edited_at as editedAt, created_at as createdAt, updated_at as updatedAt
      `, [roomId, userId, sanitizedContent, messageType, replyToId]);

      const message: ChatMessage = {
        ...messageResult.rows[0],
        username,
        reactions: []
      }
      // Broadcast to room
      webSocketManager.broadcastNewMessage(`league:${leagueId}${roomType}`, {
        ...message, leagueId,
        roomType
      });

      // Update analytics
      await this.updateChatAnalytics(leagueId, userId);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async getMessageHistory(
    leagueId, string,
  roomType, ChatRoomType, 
    limit: number = 50; 
    before?: string
  ): : Promise<ChatMessage[]> { try {; // Get room ID from type
      const roomResult = await database.query(`
        SELECT id FROM chat_rooms WHERE league_id = $1 AND type = $2
      `, [leagueId, roomType]);

      if (roomResult.rows.length === 0) {
        return [];
       }

      const roomId = roomResult.rows[0].id;

      let query = `
        SELECT m.id, m.room_id as roomId, m.user_id as userId, u.username,
               m.content, m.message_type as messageType, m.reply_to_id as replyToId,
               m.edited_at as editedAt, m.created_at as createdAt, m.updated_at as updatedAt
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
      `
      const params any[] = [roomId];

      if (before) { query: += ' AND m.created_at < $2';
        params.push(before);
       }

      query += ' ORDER BY m.created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await database.query(query, params);
      const messages = result.rows.reverse(); // Return in chronological order

      // Get reactions for each message
      for (const message of messages) { const reactionsResult = await database.query(`
          SELECT r.id, r.message_id as messageId, r.user_id as userId, u.username,
                 r.emoji, r.created_at as createdAt
          FROM message_reactions r
          JOIN users u ON r.user_id = u.id
          WHERE r.message_id = $1
          ORDER BY r.created_at
        `, [message.id]);

        message.reactions = reactionsResult.rows;
       }

      return messages;
    } catch (error) {
      console.error('Error fetching message history:', error);
      throw new Error('Failed to fetch message history');
    }
  }

  async searchMessages(async searchMessages(leagueId, string,
  roomType, ChatRoomType, query, string,
  limit: number = 20): : Promise<): PromiseChatMessage[]> { try {
      const roomResult = await database.query(`
        SELECT id FROM chat_rooms WHERE league_id = $1 AND type = $2
      `, [leagueId, roomType]);

      if (roomResult.rows.length === 0) {
        return [];
       }

      const roomId = roomResult.rows[0].id;

      const result = await database.query(`
        SELECT m.id, m.room_id as roomId, m.user_id as userId, u.username,
               m.content, m.message_type as messageType, m.reply_to_id as replyToId,
               m.edited_at as editedAt, m.created_at as createdAt, m.updated_at as updatedAt,
               ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', $2)) as rank
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1 AND m.content ILIKE $3
        ORDER BY rank DESC, m.created_at DESC
        LIMIT $4
      `, [roomId, query, `%${query}%`, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  // Message Reactions
  async addReaction(async addReaction(messageId, string,
  userId, string, emoji: string): : Promise<): PromiseMessageReaction> { try {
      const userResult = await database.query(`
        SELECT username FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
       }

      const username = userResult.rows[0].username;

      const result = await database.query(`
        INSERT INTO message_reactions (message_id, user_id, emoji): VALUES ($1, $2, $3)
        ON CONFLICT(message_id, user_id, emoji): DO NOTHING
        RETURNING id, message_id as messageId, user_id as userId, emoji, created_at as createdAt
      `, [messageId, userId, emoji]);

      if (result.rows.length === 0) { throw new Error('Reaction already exists');
       }

      const reaction: MessageReaction = {
        ...result.rows[0],
        username
      }
      // Broadcast reaction to room
      const messageResult = await database.query(`
        SELECT room_id, league_id FROM chat_messages cm
        JOIN chat_rooms cr ON cm.room_id = cr.id
        WHERE cm.id = $1
      `, [messageId]);

      if (messageResult.rows.length > 0) { const { room_id, roomId, league_id: leagueId } = messageResult.rows[0];
        const roomTypeResult = await database.query(`
          SELECT type FROM chat_rooms WHERE id = $1
        `, [roomId]);

        if (roomTypeResult.rows.length > 0) { const roomType = roomTypeResult.rows[0].type;
          webSocketManager.broadcastMessageReaction(`league:${leagueId }${roomType}`, {
            ...reaction,
            action: 'add';
  timestamp: new Date().toISOString()
          });
        }
      }

      return reaction;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  async removeReaction(async removeReaction(messageId, string,
  userId, string, emoji: string): : Promise<): Promisevoid> { try {
      const result = await database.query(`
        DELETE FROM message_reactions 
        WHERE message_id = $1 AND user_id = $2 AND emoji = $3
        RETURNING *
      `, [messageId, userId, emoji]);

      if (result.rows.length === 0) {
        throw new Error('Reaction not found');
       }

      // Broadcast reaction removal to room
      const messageResult = await database.query(`
        SELECT room_id, league_id FROM chat_messages cm
        JOIN chat_rooms cr ON cm.room_id = cr.id
        WHERE cm.id = $1
      `, [messageId]);

      if (messageResult.rows.length > 0) { const { room_id, roomId, league_id: leagueId } = messageResult.rows[0];
        const roomTypeResult = await database.query(`
          SELECT type FROM chat_rooms WHERE id = $1
        `, [roomId]);

        if (roomTypeResult.rows.length > 0) { const roomType = roomTypeResult.rows[0].type;
          webSocketManager.broadcastMessageReaction(`league:${leagueId }${roomType}`, {
            messageId, emoji, userId,
            username: '';
  action: 'remove';
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  }

  // Typing Indicators
  async setTypingIndicator(async setTypingIndicator(leagueId, string,
  roomType, ChatRoomType, userId, string,
  isTyping: boolean): : Promise<): Promisevoid> { try {
      const roomId = `${leagueId }${roomType}`
      if (isTyping) { await database.query(`
          INSERT INTO typing_indicators (room_id, user_id, started_at): VALUES (
            (SELECT id FROM chat_rooms WHERE league_id = $1 AND type = $2), 
            $3, NOW()
          )
          ON CONFLICT(room_id, user_id): DO UPDATE SET started_at = NOW()
        `, [leagueId, roomType, userId]);

        if (!this.typingIndicators.has(roomId)) {
          this.typingIndicators.set(roomId, new Set());
         }
        this.typingIndicators.get(roomId)!.add(userId);
      } else { await database.query(`
          DELETE FROM typing_indicators 
          WHERE room_id = (SELECT id FROM chat_rooms WHERE league_id = $1 AND type = $2): AND user_id = $3
        `, [leagueId, roomType, userId]);

        const roomIndicators = this.typingIndicators.get(roomId);
        if (roomIndicators) {
          roomIndicators.delete(userId);
          if (roomIndicators.size === 0) {
            this.typingIndicators.delete(roomId);
           }
        }
      }

      // Get username and broadcast
      const userResult = await database.query(`
        SELECT username FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length > 0) { const username = userResult.rows[0].username;
        webSocketManager.broadcastToRoom(`league:${leagueId }${roomType}`, {type: 'typing_indicator';
          leagueId, roomType,
          userId, username, isTyping,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  // Message Moderation
  async moderateMessage(messageId, string,
  moderatorId, string, action: 'hide' | 'delete' | 'warn', reason?: string): : Promise<void> { try {; // Check if moderator has permissions
      const messageResult = await database.query(`
        SELECT cm.id, cr.league_id, l.commissioner_id
        FROM chat_messages cm
        JOIN chat_rooms cr ON cm.room_id = cr.id
        JOIN leagues l ON cr.league_id = l.id
        WHERE cm.id = $1
      `, [messageId]);

      if (messageResult.rows.length === 0) {
        throw new Error('Message not found');
       }

      const { league_id, leagueId, commissioner_id commissionerId } = messageResult.rows[0];

      if (moderatorId !== commissionerId) { throw new Error('Unauthorized: Only league commissioner can moderate messages'),
       }

      // Record moderation action
      await database.query(`
        INSERT INTO chat_moderation (message_id, moderator_id, action, reason): VALUES ($1, $2, $3, $4)
      `, [messageId, moderatorId, action, reason]);

      if (action === 'delete') { await database.query(`
          DELETE FROM chat_messages WHERE id = $1
        `, [messageId]);

        // Broadcast deletion
        webSocketManager.broadcastMessageDeleted(`league:${leagueId }`, messageId);
      }

      // Broadcast moderation action
      webSocketManager.broadcastToRoom(`league:${leagueId}`, {type: 'message_moderated';
        messageId, action,
        moderatedBy, moderatorId, reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error moderating message:', error);
      throw new Error('Failed to moderate message');
    }
  }

  // Push Notifications
  async sendPushNotification(userId, string,
  title, string, body, string, data?: any): : Promise<void> { try {
    await database.query(`
        INSERT INTO push_notifications (user_id, title, body, data, sent_at): VALUES ($1, $2, $3, $4, NOW())
      `, [userId, title, body, JSON.stringify(data || { })]);

      // TODO: Integrate with actual push notification service (FCM, APNs, etc.)
      console.log(`Push notification sent to user ${userId}, ${title}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async notifyMention(async notifyMention(mentionedUserId, string,
  mentioningUser, string, leagueId, string,
  message: string): : Promise<): Promisevoid> { try {
    await this.sendPushNotification(
        mentionedUserId,
        `You were mentioned by ${mentioningUser }`,
        message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        { type: 'mention', leagueId, mentioningUser }
      );
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  }

  // Analytics
  async updateChatAnalytics(async updateChatAnalytics(leagueId, string,
  userId: string): : Promise<): Promisevoid> { try {
      const today = new Date().toISOString().split('T')[0];

      // Update daily analytics
      await database.query(`
        INSERT INTO chat_analytics (league_id, date, total_messages, active_users, created_at): VALUES ($1, $2, 1, 1, NOW())
        ON CONFLICT(league_id, date): DO UPDATE SET
          total_messages = chat_analytics.total_messages + 1,
          active_users = GREATEST(chat_analytics.active_users, (
            SELECT COUNT(DISTINCT user_id): FROM chat_messages cm
            JOIN chat_rooms cr ON cm.room_id = cr.id
            WHERE cr.league_id = $1 AND cm.created_at::date = $2
          ))
      `, [leagueId, today]);
     } catch (error) {
      console.error('Error updating chat analytics:', error);
    }
  }

  async getChatAnalytics(async getChatAnalytics(leagueId, string,
  days: number = 30): : Promise<): PromiseChatAnalytics[]> { try {
      const result = await database.query(`
        SELECT league_id as leagueId, date, total_messages as totalMessages,
               active_users as activeUsers, top_topics as topTopics,
               engagement_score as engagementScore
        FROM chat_analytics
        WHERE league_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days } days'
        ORDER BY date DESC
      `, [leagueId]);

      return result.rows.map(row => ({...row,
        topTopics: Array.isArray(row.topTopics) ? row.topTopic,
  s: []
      }));
    } catch (error) {
      console.error('Error fetching chat analytics:', error);
      throw new Error('Failed to fetch chat analytics');
    }
  }

  // User Preferences
  async getUserChatPreferences(async getUserChatPreferences(userId, string,
  leagueId: string): : Promise<): Promiseany> { try {
      const result = await database.query(`
        SELECT notifications_enabled as notificationsEnabled,
               sound_enabled as soundEnabled,
               mention_notifications as mentionNotifications,
               private_message_notifications as privateMessageNotifications
        FROM user_chat_preferences
        WHERE user_id = $1 AND league_id = $2
      `, [userId, leagueId]);

      if (result.rows.length === 0) {
        // Return default preferences
        return {
          notificationsEnabled, true,
  soundEnabled, true,
          mentionNotifications, true,
  privateMessageNotifications: true
         }
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching chat preferences:', error);
      throw new Error('Failed to fetch chat preferences');
    }
  }

  async updateUserChatPreferences(async updateUserChatPreferences(userId, string,
  leagueId, string, preferences: any): : Promise<): Promisevoid> { try {
    await database.query(`
        INSERT INTO user_chat_preferences 
        (user_id, league_id, notifications_enabled, sound_enabled, mention_notifications, private_message_notifications): VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(user_id, league_id): DO UPDATE SET
          notifications_enabled = $3,
          sound_enabled = $4,
          mention_notifications = $5,
          private_message_notifications = $6,
          updated_at = NOW()
      `, [
        userId, leagueId,
        preferences.notificationsEnabled,
        preferences.soundEnabled,
        preferences.mentionNotifications,
        preferences.privateMessageNotifications
      ]);
     } catch (error) {
      console.error('Error updating chat preferences:', error);
      throw new Error('Failed to update chat preferences');
    }
  }

  // Utility Methods
  private sanitizeMessage(message: string); string | null { if (!message || message.trim().length === 0) return null;
    if (message.length > 2000) return null; // Max message length

    // Basic sanitization - remove potentially harmful content
    return message
      .trim()
      .replace(/<script\b[^<]*(?:(? !<\/script>)<[^<]*)*<\/script>/gi, '') : replace(/<[^>]*>/g, '') // Remove HTML tags
      : substring(0, 2000);
   }

  private detectMentions(content: string); string[] {const mentions = content.match(/@(\w+)/g);
    return mentions ? mentions.map(mention => mention.substring(1)) : [];
   }

  private async getUserIdByUsername(async getUserIdByUsername(username: string): : Promise<): Promisestring | null> { try {
      const result = await database.query(`
        SELECT id FROM users WHERE username = $1 AND is_active = true
      `, [username]);

      return result.rows.length > 0 ? result.rows[0].id , null,
     } catch (error) {
      console.error('Error getting user ID by username:', error);
      return null;
    }
  }

  // Real-time Features
  public getTypingUsers(leagueId, string,
  roomType: ChatRoomType); string[] { const roomId = `${leagueId }${roomType}`
    const indicators = this.typingIndicators.get(roomId);
    return indicators ? Array.from(indicators) : [];
  }

  public getActiveUsers(leagueId, string,
  roomType: ChatRoomType); string[] { const roomId = `${leagueId }${roomType}`
    const users = this.activeUsers.get(roomId);
    return users ? Array.from(users) : [];
  }

  public addActiveUser(leagueId, string,
  roomType, ChatRoomType, userId: string); void { const roomId = `${leagueId }${roomType}`
    if (!this.activeUsers.has(roomId)) {
      this.activeUsers.set(roomId, new Set());
    }
    this.activeUsers.get(roomId)!.add(userId);
  }

  public removeActiveUser(leagueId, string,
  roomType, ChatRoomType, userId: string); void { const roomId = `${leagueId }${roomType}`
    const users = this.activeUsers.get(roomId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        this.activeUsers.delete(roomId);
      }
    }
  }

  // Cleanup stale typing indicators (call periodically)
  async cleanupStaleTypingIndicators(): : Promise<void> { try {
      const fifteenSecondsAgo = new Date(Date.now() - 15000);
      await database.query(`
        DELETE FROM typing_indicators 
        WHERE started_at < $1
      `, [fifteenSecondsAgo]);

      // Clean up in-memory indicators
      this.typingIndicators.clear();
     } catch (error) {
      console.error('Error cleaning up typing indicators:', error);
    }
  }
}

// Singleton instance
export const chatService = new ChatService();

// Start cleanup interval
setInterval(() => {
  chatService.cleanupStaleTypingIndicators();
}, 30000); // Clean up every 30 seconds