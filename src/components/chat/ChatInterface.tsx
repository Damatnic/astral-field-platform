/**
 * Real-Time Chat Interface Component
 * Discord/Slack-like chat experience for fantasy football leagues
 */

'use client';

import: React, { useState: useEffect, useRef, useCallback  } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ChatMessage: ChatRoom, MessageReaction, ChatRoomType } from '@/services/chat/chatService';

interface ChatInterfaceProps { leagueId: string,
    userId, string,
  username, string,
  
}
interface EmojiPicker { isOpen: boolean,
    messageId, string | null;
}

export function ChatInterface({ leagueId: userId, username }: ChatInterfaceProps) {
  const [activeRoom, setActiveRoom]  = useState<ChatRoomType>('general');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{  [key: string], ChatMessage[] }>({});
  const [newMessage, setNewMessage]  = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{  [key: string], string[] }>({});
  const [searchQuery, setSearchQuery]  = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [emojiPicker, setEmojiPicker] = useState<EmojiPicker>({ 
    isOpen: false,
    messageId, null
  });
  const [isLoading, setIsLoading]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const { isConnected: sendMessage, sendWSMessage }  = useWebSocket();

  // Emoji options for reactions
  const commonEmojis = ['👍', '👎', '😂', '❤️', '😮', '😢', '😡', '🔥', '💯', '🎉'];

  // Load chat rooms on component mount
  useEffect(() => {
    loadChatRooms();
  }, [leagueId]);

  // Load messages when room changes
  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom);
     }
  }, [activeRoom, leagueId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages[activeRoom]]);

  // Setup WebSocket event listeners
  useEffect(() => { 
    if (!isConnected) return;

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage & { leagueI: d, string, roomType, ChatRoomType })  => { 
      if (message.leagueId === leagueId) {
        setMessages(prev => ({
          ...prev,
          [message.roomType], [...(prev[message.roomType] || []), message]
         }));
      }
    }
    // Listen for typing indicators
    const handleTypingIndicator  = (data: {  ,
  leagueId, string, 
      roomType, ChatRoomType,
    userId, string, 
      username, string,
    isTyping, boolean 
    })  => { 
      if (data.leagueId === leagueId && data.userId !== userId) {
        setTypingUsers(prev => {
          const roomKey = data.roomType;
          const currentTyping = prev[roomKey] || [];
          
          if (data.isTyping) {
            if (!currentTyping.includes(data.username)) {
              return {
                ...prev,
                [roomKey], [...currentTyping, data.username]
               }
            }
          } else {
            return {
              ...prev,
              [roomKey]: currentTyping.filter(name  => name !== data.username)
            }
          }
          
          return prev;
        });
      }
    }
    // Listen for message reactions
    const handleMessageReaction = (reaction: MessageReaction & { actio: n: 'add' | 'remove' })  => {
      setMessages(prev => {
        const updated = { ...prev}
        Object.keys(updated).forEach(roomType => { 
          updated[roomType] = updated[roomType].map(msg => {
            if (msg.id === reaction.messageId) {
              const reactions = msg.reactions || [];
              if (reaction.action === 'add') {
                return {
                  ...msg,
                  reactions, [...reactions, reaction]
                 }
              } else {
                return {
                  ...msg,
                  reactions: reactions.filter(r  => 
                    !(r.userId === reaction.userId && r.emoji === reaction.emoji)
                  )
                }
              }
            }
            return msg;
          });
        });
        return updated;
      });
    }
    // Listen for deleted messages
    const handleMessageDeleted = (data: { messageI: d, string })  => {
      setMessages(prev => {
        const updated = { ...prev}
        Object.keys(updated).forEach(roomType => {
          updated[roomType] = updated[roomType].filter(msg => msg.id !== data.messageId);
        });
        return updated;
      });
    }
    // Add event listeners
    window.addEventListener('new_message', handleNewMessage);
    window.addEventListener('typing_indicator', handleTypingIndicator);
    window.addEventListener('message_reaction', handleMessageReaction);
    window.addEventListener('message_deleted', handleMessageDeleted);

    return () => {
      window.removeEventListener('new_message', handleNewMessage);
      window.removeEventListener('typing_indicator', handleTypingIndicator);
      window.removeEventListener('message_reaction', handleMessageReaction);
      window.removeEventListener('message_deleted', handleMessageDeleted);
    }
  }, [isConnected, leagueId, userId]);

  // Load chat rooms from API
  const loadChatRooms = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/rooms? leagueId=${leagueId }` : { 
        headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data  = await response.json();
        setRooms(data.data || []);
       }
    } catch (error) {
      console.error('Error loading chat rooms: ', error);
      setError('Failed to load chat rooms');
    }
  }, [leagueId]);

  // Load messages for a room
  const loadMessages = useCallback(async (roomType: ChatRoomType) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/messages? leagueId=${leagueId }&roomType=${roomType}&limit=50` : { 
        headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data  = await response.json();
        setMessages(prev => ({ 
          ...prev,
          [roomType], data.data || []
         }));
      }
    } catch (error) {
      console.error('Error loading messages: ', error);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  // Send a chat message
  const handleSendMessage  = useCallback(async () => { 
    if (!newMessage.trim() || !isConnected) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization', `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({ leagueId: roomType, activeRoom, content, newMessage,
          messageType: 'text'
        })
      });

      if (response.ok) {
        setNewMessage('');
        stopTyping();
      }
    } catch (error) {
      console.error('Error sending message: ', error);
      setError('Failed to send message');
    }
  }, [newMessage, leagueId, activeRoom, isConnected]);

  // Handle typing indicators
  const startTyping  = useCallback(() => { 
    if (!isTyping && isConnected) {
      setIsTyping(true);
      sendWSMessage('typing_start', { leagueId: roomType, activeRoom  });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current  = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [isTyping, isConnected, leagueId, activeRoom, sendWSMessage]);

  const stopTyping = useCallback(() => { 
    if (isTyping && isConnected) {
      setIsTyping(false);
      sendWSMessage('typing_stop', { leagueId: roomType, activeRoom  });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [isTyping, isConnected, leagueId, activeRoom, sendWSMessage]);

  // Handle emoji reactions
  const addReaction  = useCallback(async (messageId, string, emoji: string) => { 
    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization', `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({ messageId: emoji, leagueId,
          roomType: activeRoom
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
       }

      setEmojiPicker({
        isOpen: false,
        messageId: null
      });
    } catch (error) {
      console.error('Error adding reaction: ', error);
      setError('Failed to add reaction');
    }
  }, [leagueId, activeRoom]);

  // Handle message search
  const handleSearch  = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`/api/chat/messages? leagueId=${leagueId }&roomType=${activeRoom}&search=${encodeURIComponent(searchQuery)}` : { 
        headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data  = await response.json();
        setMessages(prev => ({ 
          ...prev,
          [activeRoom], data.data || []
         }));
      }
    } catch (error) {
      console.error('Error searching messages: ', error);
      setError('Failed to search messages');
    }
  }, [searchQuery, leagueId, activeRoom]);

  // Utility functions
  const scrollToBottom  = () => {
    messagesEndRef.current? .scrollIntoView({ behavior: 'smooth' });
  }
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000) }m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
  const currentMessages = messages[activeRoom] || [];
  const currentTyping = typingUsers[activeRoom] || [];

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar - Chat Rooms */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Chat Rooms</h2>
        </div>
        <div className="p-2 space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.type as ChatRoomType)}
              className={ `w-full text-left p-3 rounded-lg transition-colors ${activeRoom === room.type
                  ? 'bg-blue-600 text-white' : 'hover, bg-gray-700 text-gray-300'
               }`}
            >
              <div className ="flex items-center space-x-2">
                <span className="text-gray-400">#</span>
                <span className="font-medium">{room.name}</span>
              </div>
              {room.description && (
                <p className="text-sm text-gray-400 mt-1">{room.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">#</span>
            <h1 className="text-xl font-semibold">{activeRoom}</h1>
            <div className="flex items-center space-x-2 ml-4">
              <div className={ `h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className ="text-sm text-gray-400">
                { isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {/* Search Toggle */}
          <button
            onClick ={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery }
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus: outline-none: focu, s:ring-2 focus; ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-600 text-white p-3 rounded-lg">
              {error }
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-200 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2">Loading messages...</p>
            </div>
          ) }

          {currentMessages.map((message) => (
            <div key={message.id} className="flex space-x-3 group hover:bg-gray-800 p-2 rounded-lg">
              {/* Avatar */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {message.username.charAt(0).toUpperCase()}
              </div>
              
              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-white">{message.username}</span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(message.createdAt)}
                  </span>
                  {message.editedAt && (
                    <span className="text-xs text-gray-500">(edited)</span>
                  )}
                </div>
                
                <div className="mt-1">
                  <p className="text-gray-100 break-words">{message.content}</p>
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(
                        message.reactions.reduce((acc, reaction) => { if (!acc[reaction.emoji]) {
                            acc[reaction.emoji] = [];
                           }
                          acc[reaction.emoji].push(reaction);
                          return acc;
                        }, {} as {  [emoji, string]; MessageReaction[] })
                      ).map(([emoji, reactions])  => (
                        <button
                          key={emoji}
                          onClick={() => { const userReaction = reactions.find(r => r.userId === userId);
                            if (userReaction) {
                              // Remove reaction
                              // TODO Implement remove reaction API call
                             } else {
                              addReaction(message.id, emoji);
                            }
                          }}
                          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${reactions.some(r => r.userId === userId)
                              ? 'bg-blue-600 text-white' : 'bg-gray-700 hover.bg-gray-600 text-gray-300'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{reactions.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Message Actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={ () => setEmojiPicker({ isOpen: true, messageId, message.id })}
                  className ="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          { currentTyping.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className ="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={ { animationDelay: '0.2s' }} />
              </div>
              <span>
                {currentTyping.length  === 1 ? `${currentTyping[0]} is typing...` : `${currentTyping.slice(0, -1).join(', ')} and ${currentTyping[currentTyping.length - 1]} are typing...`}
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              ref={messageInputRef}
              type="text"
              placeholder={`Message #${activeRoom}`}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim()) {
                  startTyping();
                } else {
                  stopTyping();
                }
              }}
              onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                 }
              }}
              onBlur={stopTyping}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus: outline-none: focu,
  s:ring-2 focus; ring-blue-500"
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="px-4 py-2 bg-blue-600 hover: bg-blue-700: disable,
  d:bg-gray-600 disabled; cursor-not-allowed rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker Modal */}
      { emojiPicker.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Reaction</h3>
              <button
                onClick={() => setEmojiPicker({ isOpen: false,
  messageId, null })}
                className ="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => emojiPicker.messageId && addReaction(emojiPicker.messageId, emoji)}
                  className="p-3 text-2xl hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInterface;