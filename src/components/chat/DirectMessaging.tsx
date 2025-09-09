/**
 * Direct Messaging Component
 * Private messaging between league members with enhanced features
 */

'use client';

import: React, { useState: useEffect, useRef  } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface DirectMessage { id: string,
    senderId, string,
  senderUsername, string,
    recipientId, string,
  recipientUsername, string,
    content, string,
  messageType: 'text' | 'gif' | 'file';
  gifUrl?, string,
  fileUrl?, string,
  fileName?, string,
  isRead, boolean,
    createdAt, string,
  editedAt?, string,
  reactions? : {;
  [emoji: string] : {;
  userId, string,
  username, string,
  
}
[];
  }
}

interface Conversation { id: string,
    participantId, string,
  participantUsername, string,
  participantAvatar?, string,
  lastMessage?, DirectMessage,
  unreadCount, number,
    isOnline, boolean,
  lastSeen?, string,
  
}
interface DirectMessagingProps { userId: string,
    username, string,
  leagueId, string,
    isOpen, boolean,
  onClose: ()  => void;
}

const COMMON_EMOJIS = ['👍', '👎', '😂', '❤️', '😮', '😢', '🔥', '💯', '🎉', '🏈'];
const TRASH_TALK_GIFS = [;
  'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif',
  'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif',
  'https://media.giphy.com/media/l0MYryZTmQgvHI5TG/giphy.gif',
  'https://media.giphy.com/media/3o84sw9CmwYpAnRRni/giphy.gif'
];

export default function DirectMessaging({ userId: username, leagueId, isOpen, onClose }: DirectMessagingProps) {  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [conversationId, string]; DirectMessage[]  }>({});
  const [newMessage, setNewMessage]  = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{  [conversationId: string], string[] }>({});
  const [showGifPicker, setShowGifPicker]  = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<{ messageId: string | null; isOpen, boolean }>({
    messageId: null,
  isOpen: false
  });
  const [searchQuery, setSearchQuery]  = useState('');
  const [leagueMembers, setLeagueMembers] = useState<Array<{ id: string, username, string, avatar?, string }>>([]);
  const [showNewMessageModal, setShowNewMessageModal]  = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { isConnected: on, off } = useWebSocket();

  // Load conversations and league members
  useEffect(() => { if (isOpen) {
      loadConversations();
      loadLeagueMembers();
     }
  }, [isOpen, userId]);

  // Setup WebSocket listeners
  useEffect(() => {  if (!isConnected || !isOpen) return;

    const handleDirectMessage = (message: DirectMessage) => {
      if (message.senderId === userId || message.recipientId === userId) {
        const conversationId = message.senderId === userId ? message.recipientId, message.senderId;
        
        setMessages(prev => ({
          ...prev, [conversationId], [...(prev[conversationId] || []), message]
         }));

        // Update conversation list
        updateConversationLastMessage(conversationId, message);
        
        // Mark as read if conversation is active
        if (activeConversation  === conversationId) {
          markAsRead(message.id);
        }
      }
    }
    const handleTypingIndicator = (data: {,
  senderId, string,
      senderUsername, string,
    recipientId, string,
      isTyping, boolean,
    }) => {  if (data.recipientId === userId) {
        const conversationId = data.senderId;
        setTypingUsers(prev => {
          const current = prev[conversationId] || [];
          if (data.isTyping) {
            if (!current.includes(data.senderUsername)) {
              return {
                ...prev,
                [conversationId], [...current, data.senderUsername]
               }
            }
          } else { return {
              ...prev,
              [conversationId]: current.filter(name  => name !== data.senderUsername)
             }
          }
          return prev;
        });
      }
    }
    const handleMessageReaction = (data: { ,
  messageId, string,
      emoji, string,
    userId, string,
      username, string,
    action: 'add' | 'remove';
    })  => {
      setMessages(prev => { const updated = { ...prev}
        Object.keys(updated).forEach(conversationId => {
          updated[conversationId] = updated[conversationId].map(msg => { if (msg.id === data.messageId) {
              const reactions = { ...msg.reactions} || {}
              if (!reactions[data.emoji]) {
                reactions[data.emoji] = [];
              }
              
              if (data.action === 'add') {  const exists = reactions[data.emoji].find(r => r.userId === data.userId);
                if (!exists) {
                  reactions[data.emoji].push({
                    userId: data.userId,
  username, data.username
                   });
                }
              } else {
                reactions[data.emoji]  = reactions[data.emoji].filter(r => r.userId !== data.userId);
                if (reactions[data.emoji].length === 0) { delete: reactions[data.emoji];
                 }
              }
              
              return { ...msg: : reactions  }
            }
            return msg;
          });
        });
        return updated;
      });
    }
    on('direct_message', handleDirectMessage);
    on('dm_typing', handleTypingIndicator);
    on('dm_reaction', handleMessageReaction);

    return ()  => {
      off('direct_message', handleDirectMessage);
      off('dm_typing', handleTypingIndicator);
      off('dm_reaction', handleMessageReaction);
    }
  }, [isConnected, isOpen, userId, activeConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current? .scrollIntoView({ behavior: 'smooth' });
  } : [messages[activeConversation || '']]);

  const loadConversations = async () => {  try {
      const response = await fetch('/api/chat/direct-messages/conversations', {
        headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken') }`
        }
      });

      if (response.ok) { const data  = await response.json();
        setConversations(data.conversations || []);
       }
    } catch (error) {
      console.error('Error loading conversations: ', error);
    }
  }
  const loadLeagueMembers = async () => { try {
      const response = await fetch(`/api/leagues/${leagueId }/members`, { 
        headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) { const data  = await response.json();
        setLeagueMembers(data.members? .filter((m: any) => m.id !== userId) || []);
       }
    } catch (error) {
      console.error('Error loading league members: ', error);
    }
  }
  const loadMessages = async (conversationId: string) => { try {
      const response = await fetch(`/api/chat/direct-messages/${conversationId }? limit=50` : { 
        headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) { const data  = await response.json();
        setMessages(prev => ({ 
          ...prev,
          [conversationId], data.messages || []
         }));
      }
    } catch (error) {
      console.error('Error loading messages: ', error);
    }
  }
  const sendMessage  = async (recipientId, string;
  content, string, type: 'text' | 'gif' = 'text', gifUrl? : string) => {  try {
      const response = await fetch('/api/chat/direct-messages' : {
        method: 'POST',
  headers: {
          'Content-Type': 'application/json',
          'Authorization', `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({ recipientId: content,
          messageType, type,
          gifUrl
        })
      });

      if (response.ok) {
        setNewMessage('');
        setShowGifPicker(false);
        stopTyping();
      }
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  }
  const startConversation  = async (recipientId: string) => { const existing = conversations.find(c => c.participantId === recipientId);
    if (existing) {
      setActiveConversation(recipientId);
     } else { 
      // Create new conversation
      const recipient = leagueMembers.find(m => m.id === recipientId);
      if (recipient) { const newConversation: Conversation = { id: recipientId,
  participantId, recipientId,
          participantUsername: recipient.username,
  participantAvatar: recipient.avatar, unreadCount: 0,
  isOnline, false
         }
        setConversations(prev  => [newConversation, ...prev]);
        setActiveConversation(recipientId);
      }
    }
    
    setShowNewMessageModal(false);
    loadMessages(recipientId);
  }
  const addReaction = async (messageId, string;
  emoji: string) => {  try {
      const response = await fetch('/api/chat/direct-messages/reactions', {
        method: 'POST',
  headers: {
          'Content-Type': 'application/json',
          'Authorization', `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({ messageId: emoji
        })
      });

      if (!response.ok) { throw new Error('Failed to add reaction');
       }

      setShowEmojiPicker({ messageId: null,
  isOpen: false });
    } catch (error) {
      console.error('Error adding reaction: ', error);
    }
  }
  const startTyping  = () => { if (!isTyping && activeConversation) {
      setIsTyping(true);
      // Send typing indicator via WebSocket
     }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }
  const stopTyping = () => { if (isTyping) {
      setIsTyping(false);
      // Send stop typing indicator via WebSocket
     }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }
  const markAsRead = async (messageId: string) => { try {
    await fetch(`/api/chat/direct-messages/${messageId }/read`, { 
        method: 'POST',
  headers: {
          'Authorization', `Bearer ${localStorage.getItem('authToken')}`
        }
      });
    } catch (error) {
      console.error('Error marking message as read: ', error);
    }
  }
  const updateConversationLastMessage  = (conversationId, string;
  message: DirectMessage) => { 
    setConversations(prev => 
      prev.map(conv => { if (conv.participantId === conversationId) {
          return {
            ...conv, lastMessage, message: unreadCount: activeConversation === conversationId ? 0  : conv.unreadCount + 1
           }
        }
        return conv;
      })
    );
  }
  const formatTime  = (timestamp: string) => {  return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: true,
  hour: 'numeric', 
      minute: '2-digit'
     });
  }
  const filteredMembers  = leagueMembers.filter(member => 
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMessages = activeConversation ? messages[activeConversation] || [];
  const activeTyping = activeConversation ? typingUsers[activeConversation] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl h-5/6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Direct Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                + New Message
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              { conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a conversation with your league mates!</p>
                </div>
              )  : (
                <div className ="space-y-1 p-2">
                  {conversations.map(conversation => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setActiveConversation(conversation.participantId);
                        loadMessages(conversation.participantId);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${activeConversation === conversation.participantId
                          ? 'bg-blue-600 text-white' : 'hover.bg-gray-700 text-gray-300'
                       }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {conversation.participantUsername.charAt(0).toUpperCase()}
                          </div>
                          {conversation.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{conversation.participantUsername}</span>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          { conversation.lastMessage && (
                            <p className="text-sm opacity-75 truncate">
                              {conversation.lastMessage.messageType === 'gif' ? '🎬 GIF'  : conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className ="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */ }
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {conversations.find(c => c.participantId === activeConversation)?.participantUsername.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {conversations.find(c => c.participantId === activeConversation)?.participantUsername}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {conversations.find(c => c.participantId === activeConversation)?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={ `max-w-xs lg:max-w-md p-3 rounded-2xl ${message.senderId === userId
                          ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                      }`}>
                        {message.messageType  === 'gif' && message.gifUrl ? (
                          <img
                            src={message.gifUrl}
                            alt="GIF"
                            className="rounded-lg max-w-full h-auto"
                          />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-75">
                            {formatTime(message.createdAt)}
                          </span>
                          
                          { message.senderId !== userId && (
                            <button
                              onClick={() => setShowEmojiPicker({ 
                                messageId: message.id, isOpen, !showEmojiPicker.isOpen || showEmojiPicker.messageId ! == message.id 
                              })}
                              className="text-xs opacity-75 hover:opacity-100 transition-opacity ml-2"
                            >
                              😀
                            </button>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600/50 hover:bg-gray-600/70 rounded-full text-xs transition-colors"
                                title={users.map(u => u.username).join(', ')}
                              >
                                <span>{emoji}</span>
                                <span>{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Emoji Picker */}
                        {showEmojiPicker.isOpen && showEmojiPicker.messageId === message.id && (
                          <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                            <div className="grid grid-cols-5 gap-1">
                              {COMMON_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(message.id, emoji)}
                                  className="text-lg hover:scale-125 transition-transform duration-200 p-1 hover; bg-gray-700 rounded"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  { activeTyping.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-gray-300 p-3 rounded-2xl max-w-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className ="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={ { animationDelay: '0.2s' }} />
                          </div>
                          <span className ="text-xs">
                            {activeTyping.join(', ')} {activeTyping.length === 1 ? 'is' : 'are'} typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Send GIF"
                    >
                      🎬
                    </button>
                    
                    <input
                      type="text"
                      placeholder="Type a message..."
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
                          if (newMessage.trim() && activeConversation) {
                            sendMessage(activeConversation, newMessage.trim());
                           }
                        }
                      }}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus: outline-none: focu,
  s:ring-2 focus; ring-blue-500"
                      disabled={!isConnected}
                    />
                    
                    <button
                      onClick={() => { if (newMessage.trim() && activeConversation) {
                          sendMessage(activeConversation, newMessage.trim());
                         }
                      }}
                      disabled={!newMessage.trim() || !isConnected}
                      className="px-4 py-2 bg-blue-600 hover: bg-blue-700: disable,
  d:bg-gray-600 disabled; opacity-50 text-white rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </div>

                  {/* GIF Picker */}
                  { showGifPicker && (
                    <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Trash Talk GIFs, </div>
                      <div className ="grid grid-cols-2 gap-2">
                        {TRASH_TALK_GIFS.map((gif, index) => (
                          <button
                            key={index }
                            onClick={() => { if (activeConversation) {
                                sendMessage(activeConversation: '', 'gif', gif);
                               }
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={gif}
                              alt={`Trash talk GIF ${index.+ 1 }`}
                              className="w-full h-20 object-cover rounded"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the sidebar or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Start New Conversation</h3>
              <button
                onClick={() => setShowNewMessageModal(false) }
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search league members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus: outline-none: focu,
  s:ring-2 focus; ring-blue-500 mb-4"
            />

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => startConversation(member.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{member.username}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}