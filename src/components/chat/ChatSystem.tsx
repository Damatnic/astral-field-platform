"use client";

import React, { useState, useEffect, useRef, useCallback  } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  MessageCircle, Send, Smile, Image, Users, Crown, 
  TrendingUp, MoreVertical, Reply, Edit3, Trash2, Heart, ThumbsUp, Zap, Star
} from 'lucide-react';
import { ChatMessage, ChatChannel, ChatReaction, TypingIndicator } from '@/lib/chat-socket-manager';

interface ChatSystemProps {
  leagueId, string,
    userId, string,
  username, string,
  isCommissioner?, boolean,
  className?, string,
  
}
interface EmojiPicker {
  isOpen, boolean,
  messageId?, string,
}

export default function ChatSystem({ 
  leagueId, userId, username, 
  isCommissioner = false,
  className = "" 
}: ChatSystemProps) { const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [emojiPicker, setEmojiPicker] = useState<EmojiPicker>({ isOpen: false  });
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Common emojis for reactions
  const commonEmojis = ['❤️', '👍', '👎', '😂', '😮', '😢', '⚡', '🔥', '💯', '🎯'];

  // Initialize socket connection
  useEffect(() => { const newSocket = io({
      path: '/api/chat-socket',
  autoConnect: true
});

    newSocket.on('connect', () => {
      console.log('🔗 Connected to chat server');
      setIsConnected(true);
      
      // Authenticate user
      newSocket.emit('authenticate', { userId, username, leagueId });
    });

    newSocket.on('disconnect', () => {
      console.log('🔗 Disconnected from chat server');
      setIsConnected(false);
    });

    // Chat event listeners
    newSocket.on('channels', (channelList: ChatChannel[]) => {
      setChannels(channelList);
      if (channelList.length > 0 && !activeChannel) { const defaultChannel = channelList.find(c => c.type === 'league') || channelList[0];
        setActiveChannel(defaultChannel.id);
        newSocket.emit('join-channel', { channelId: defaultChannel.id  });
      }
    });

    newSocket.on('channel-messages', ({ channelId, messages: channelMessages  }: { channelId, string, messages: ChatMessage[]  }) => {
      setMessages(prev => new Map(prev).set(channelId, channelMessages));
    });

    newSocket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => { const newMap = new Map(prev);
        const channelMessages = newMap.get(message.channelId || '') || [];
        newMap.set(message.channelId || '', [...channelMessages, message]);
        return newMap;
       });
    });

    newSocket.on('message-edited', (editedMessage: ChatMessage) => {
      setMessages(prev => { const newMap = new Map(prev);
        const channelMessages = newMap.get(editedMessage.channelId || '') || [];
        const messageIndex = channelMessages.findIndex(m => m.id === editedMessage.id);
        if (messageIndex !== -1) {
          channelMessages[messageIndex] = editedMessage;
          newMap.set(editedMessage.channelId || '', [...channelMessages]);}
        return newMap;
      });
    });

    newSocket.on('reaction-added', ({ messageId, emoji, userId: reactorId  }: { messageId, string, emoji, string, userId: string  }) => {
      setMessages(prev => { const newMap = new Map(prev);
        for (const [channelId, channelMessages] of newMap) {
          const message = channelMessages.find(m => m.id === messageId);
          if (message) {
            if (!message.reactions) message.reactions = [];
            
            const existingReaction = message.reactions.find(r => r.emoji === emoji);
            if (existingReaction) {
              if (!existingReaction.users.includes(reactorId)) {
                existingReaction.users.push(reactorId);
                existingReaction.count++;
               }
            } else {
              message.reactions.push({ emoji, users: [reactorId],
  count: 1 });
            }
            
            newMap.set(channelId, [...channelMessages]);
            break;
          }
        }
        return newMap;
      });
    });

    newSocket.on('reaction-removed', ({ messageId, emoji, userId: reactorId  }: { messageId, string, emoji, string, userId: string  }) => {
      setMessages(prev => { const newMap = new Map(prev);
        for (const [channelId, channelMessages] of newMap) {
          const message = channelMessages.find(m => m.id === messageId);
          if (message && message.reactions) {
            const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
            if (reactionIndex !== -1) {
              const reaction = message.reactions[reactionIndex];
              const userIndex = reaction.users.indexOf(reactorId);
              
              if (userIndex !== -1) {
                reaction.users.splice(userIndex, 1);
                reaction.count--;

                if (reaction.count === 0) {
                  message.reactions.splice(reactionIndex, 1);
                 }
              }
            }
            newMap.set(channelId, [...channelMessages]);
            break;
          }
        }
        return newMap;
      });
    });

    newSocket.on('user-online', ({ userId: onlineUserId  }: { userId: string  }) => {
      setOnlineUsers(prev => new Set(prev).add(onlineUserId));
    });

    newSocket.on('user-offline', ({ userId: offlineUserId  }: { userId: string  }) => {
      setOnlineUsers(prev => { const newSet = new Set(prev);
        newSet.delete(offlineUserId);
        return newSet;
       });
    });

    newSocket.on('user-typing', (indicator: TypingIndicator) => {
      setTypingUsers(prev => { const filtered = prev.filter(t => !(t.userId === indicator.userId && t.channelId === indicator.channelId));
        return [...filtered, indicator];
       });
    });

    newSocket.on('user-stop-typing', ({ userId: stoppedUserId  }: { userId: string  }) => {
      setTypingUsers(prev => prev.filter(t => t.userId !== stoppedUserId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    }
  }, [leagueId, userId, username]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const switchChannel = useCallback((channelId: string) => { if (socket && channelId !== activeChannel) {
      socket.emit('join-channel', { channelId  });
      setActiveChannel(channelId);
    }
  }, [socket, activeChannel]);

  const sendMessage = useCallback(() => { if (socket && newMessage.trim() && activeChannel) {
      if (editingMessage) {
        socket.emit('edit-message', { messageId, editingMessage,
  newMessage: newMessage.trim()  });
        setEditingMessage(null);
      } else {
        socket.emit('send-message', { 
          channelId, activeChannel,
  message: newMessage.trim(),
          replyTo: replyingTo?.id
        });
      }
      setNewMessage('');
      setReplyingTo(null);
    }
  }, [socket, newMessage, activeChannel, editingMessage, replyingTo]);

  const handleTyping = useCallback(() => { if (socket && activeChannel) {
      socket.emit('typing-start', { channelId: activeChannel  });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', { channelId: activeChannel });
      }, 3000);
    }
  }, [socket, activeChannel]);

  const addReaction = useCallback((messageId, string;
  emoji: string) => { if (socket) {
      socket.emit('add-reaction', { messageId, emoji  });
    }
  }, [socket]);

  const removeReaction = useCallback((messageId, string;
  emoji: string) => { if (socket) {
      socket.emit('remove-reaction', { messageId, emoji  });
    }
  }, [socket]);

  const startEditing = useCallback((message: ChatMessage) => { if (message.userId === userId) {
      setEditingMessage(message.id);
      setNewMessage(message.message);
     }
  }, [userId]);

  const startReplying = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
  }, []);

  const renderMessage = (message: ChatMessage) => { const isOwnMessage = message.userId === userId;
    const isSystemMessage = message.metadata? .isSystem;
    const currentChannelTyping = typingUsers.filter(t => t.channelId === activeChannel);

    return (
      <div key={message.id } className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg: max-w-md px-4 py-2 rounded-lg ${isSystemMessage ? 'bg-blue-100 dar,
  k:bg-blue-900 text-blue-900 dar,
  k:text-blue-100 text-center mx-auto' :
          isOwnMessage ? 'bg-primary-500 text-white' : 'bg-gray-200 dark.bg-gray-700 text-gray-900 dark; text-white'
         }`}>
          {!isSystemMessage && !isOwnMessage && (
            <div className="flex items-center mb-1">
              <span className="text-xs font-semibold">{message.username}</span>
              {message.userId === 'commissioner' && (
                <Crown className="h-3 w-3 ml-1 text-yellow-500" />
              )}
            </div>
          )}
          
          {message.replyTo && (
            <div className="bg-black/10 p-2 rounded mb-2 text-xs opacity-75">
              <Reply className="h-3 w-3 inline mr-1" />
              Replying to message...
            </div>
          )}

          <p className="text-sm">{message.message}</p>
          
          {message.messageType === 'gif' && message.metadata?.gifUrl && (
            <img src={message.metadata.gifUrl} alt="GIF" className="rounded mt-2 max-w-full" />
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-75">
              { new: Date(message.timestamp).toLocaleTimeString() }
              {message.isEdited && <span className="ml-1">(edited)</span>}
            </span>
            
            {!isSystemMessage && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setEmojiPicker({ isOpen, true,
  messageId: message.id })}
                  className="text-xs hover:bg-black/10 p-1 rounded"
                >
                  <Smile className="h-3 w-3" />
                </button>
                
                <button
                  onClick={() => startReplying(message)}
                  className="text-xs hover:bg-black/10 p-1 rounded"
                >
                  <Reply className="h-3 w-3" />
                </button>

                {isOwnMessage && (
                  <button
                    onClick={() => startEditing(message) }
                    className="text-xs hover:bg-black/10 p-1 rounded"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => { const userReacted = reaction.users.includes(userId);
                return (
                  <button
                    key={index }
                    onClick={() => userReacted ? removeReaction(message.id, reaction.emoji) : addReaction(message.id, reaction.emoji)}
                    className={`px-2 py-1 rounded-full text-xs ${userReacted ? 'bg-primary-100 dark: bg-primary-900 ring-1 ring-primary-500' : 'bg-gray-100 dar,
  k:bg-gray-800 hove,
  r:bg-gray-200 dark.hover; bg-gray-700'
                     }`}
                  >
                    {reaction.emoji} {reaction.count}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
  const activeChannelObj = channels.find(c => c.id === activeChannel);
  const currentMessages = messages.get(activeChannel) || [];
  const currentChannelTyping = typingUsers.filter(t => t.channelId === activeChannel && t.userId !== userId);

  return (
    <div className={`flex flex-col h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark; text-white">
            {activeChannelObj? .name || 'Chat'}
          </h3>
          {activeChannelObj?.type === 'commissioner' && (
            <Crown className="h-4 w-4 text-yellow-500" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {onlineUsers.size} online
            </span>
          </div>
          
          <select 
            value={activeChannel} 
            onChange={(e) => switchChannel(e.target.value)}
            className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 dark; text-gray-300"
          >
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet.Start the conversation!</p>
            </div>
          </div>
        ) : (
          currentMessages.map(renderMessage)
        )}

        {/* Typing indicators */}
        {currentChannelTyping.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            {currentChannelTyping.map(t => t.username).join(', ')} 
            {currentChannelTyping.length === 1 ? ' is' : ' are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 dark: bg-gray-700 border-t dar,
  k:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark; text-gray-400">
              <Reply className="h-3 w-3 inline mr-1" />
              Replying to {replyingTo.username  }: { replyingTo.message.substring(0, 50) }...
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover: text-gray-700 dar,
  k, hover, text-gray-300"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
               } else if (e.key === 'Escape') {
                setEditingMessage(null);
                setReplyingTo(null);
                setNewMessage('');
              }
            }}
            placeholder={editingMessage ? "Edit message..." : replyingTo ? "Reply..." : "Type a message..."}
            className="flex-1 px-3 py-2 bg-gray-100 dark: bg-gray-700 rounded-lg border-none focu,
  s:ring-2 focu,
  s:ring-primary-500 text-gray-900 dark; text-white"
            disabled={!isConnected}
          />
          
          <button
            onClick={() => setEmojiPicker({ isOpen: !emojiPicker.isOpen })}
            className="p-2 text-gray-500 hover: text-gray-700 dar,
  k, hover, text-gray-300"
          >
            <Smile className="h-5 w-5" />
          </button>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-primary-500 text-white rounded-lg hover: bg-primary-600 disable,
  d:opacity-50 disabled; cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Emoji Picker */}
      {emojiPicker.isOpen && (
        <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50">
          <div className="grid grid-cols-5 gap-2">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => { if (emojiPicker.messageId) {
                    addReaction(emojiPicker.messageId, emoji);
                   } else {
                    setNewMessage(prev => prev + emoji);
                  }
                  setEmojiPicker({ isOpen: false });
                }}
                className="p-2 hover: bg-gray-100 dar,
  k, hover, bg-gray-700 rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}