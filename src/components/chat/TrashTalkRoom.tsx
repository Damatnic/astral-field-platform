/**
 * Trash Talk Room Component
 * Dedicated space for competitive banter with moderation tools
 */

'use client';

import React, { useState, useEffect, useRef  } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface TrashTalkMessage {
  id, string,
    userId, string,
  username, string,
    content, string,
  messageType: 'text' | 'gif' | 'meme';
  gifUrl?, string,
  memeUrl?, string,
  isRoast?, boolean,
  targetUserId?, string,
  targetUsername?, string,
  reactions?: {;
  [emoji: string]: {;
  count, number,
  users: { userI,
  d, string, username, string,
}
[];
    }
  }
  createdAt, string,
  isModerated?, boolean,
  moderationReason?, string,
}

interface TrashTalkRoomProps {
  leagueId, string,
    userId, string,
  username, string,
  isCommissioner?, boolean,
  
}
const TRASH_TALK_EMOJIS = ['🔥', '😂', '💀', '🤡', '💯', '🗿', '😈', '🎯', '💣', '⚰️'];
const ROAST_TEMPLATES = [;
  "Your team is so bad, even the waiver wire won't take them!",
  "I've seen better lineups at a retirement home fantasy league.",
  "Your draft strategy was clearly 'close your eyes and hope for the best.'",
  "Your team name is the only thing more disappointing than your record.",
  "I'd say good luck this week, but we both know it won't help."
];

const TRASH_TALK_GIFS = [;
  {
    url: 'http,
  s://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif',
  title: 'Burn!'
  },
  {
    url: 'http,
  s://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif',
  title: 'Savage'
  },
  {
    url: 'http,
  s://media.giphy.com/media/l0MYryZTmQgvHI5TG/giphy.gif',
  title: 'Roasted'
  }
];

export default function TrashTalkRoom({ leagueId, userId, username, isCommissioner = false }: TrashTalkRoomProps) { const [messages, setMessages] = useState<TrashTalkMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [showRoastGenerator, setShowRoastGenerator] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [leagueMembers, setLeagueMembers] = useState<Array<{ id, string, username, string, teamName, string }>>([]);
  const [moderationQueue, setModerationQueue] = useState<TrashTalkMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'my_roasts' | 'targeting_me'>('all');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { isConnected, on, off } = useWebSocket();

  // Load initial data
  useEffect(() => {
    loadTrashTalkMessages();
    loadLeagueMembers();
    if (isCommissioner) {
      loadModerationQueue();
    }
  }, [leagueId]);

  // Setup WebSocket listeners
  useEffect(() => { if (!isConnected) return;

    const handleTrashTalkMessage = (message: TrashTalkMessage) => {
      if (message.userId !== userId) { // Don't add our own messages (already added optimistically)
        setMessages(prev => [...prev, message]);
       }
    }
    const handleMessageModerated = (data: {,
  messageId, string,
      action: 'hide' | 'delete' | 'warn',
    moderatedBy, string,
      reason, string,
    }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId
            ? { : ..msg,
                isModerated, true,
  moderationReason: data.reason,
                content: data.action === 'hide' ? '[Message hidden by moderator]' : msg.content
              }
            : msg
        ).filter(msg => !(msg.id === data.messageId && data.action === 'delete'))
      );
    }
    on('trash_talk_message', handleTrashTalkMessage);
    on('message_moderated', handleMessageModerated);

    return () => {
      off('trash_talk_message', handleTrashTalkMessage);
      off('message_moderated', handleMessageModerated);
    }
  }, [isConnected, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const loadTrashTalkMessages = async () => { try {
      const response = await fetch(`/api/chat/trash-talk?leagueId=${leagueId }&limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) { const data = await response.json();
        setMessages(data.messages || []);
       }
    } catch (error) {
      console.error('Error loading trash talk messages:', error);
    }
  }
  const loadLeagueMembers = async () => { try {
      const response = await fetch(`/api/leagues/${leagueId }/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) { const data = await response.json();
        setLeagueMembers(data.members?.filter((m: any) => m.id !== userId) || []);
       }
    } catch (error) {
      console.error('Error loading league members:', error);
    }
  }
  const loadModerationQueue = async () => { try {
      const response = await fetch(`/api/chat/moderation/queue?leagueId=${leagueId }`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) { const data = await response.json();
        setModerationQueue(data.messages || []);
       }
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    }
  }
  const sendMessage = async (content, string;
type: 'text' | 'gif' | 'roast' = 'text', gifUrl?: string) => { try {
      const response = await fetch('/api/chat/trash-talk', {
        method: 'POST',
  headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({
          leagueId, content,
          messageType, type, gifUrl,
          targetUserId: selectedTarget || undefined,
  isRoast: type === 'roast' || selectedTarget !== ''
        })
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedTarget('');
        setShowRoastGenerator(false);
        setShowGifPicker(false);
        stopTyping();
      }
    } catch (error) {
      console.error('Error sending trash talk message:', error);
    }
  }
  const moderateMessage = async (messageId, string;
  action: 'hide' | 'delete' | 'warn', reason: string) => { try {
      const response = await fetch('/api/chat/moderation', {
        method: 'POST',
  headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({
          messageId, action, reason,
          leagueId
        })
      });

      if (response.ok) {
        loadModerationQueue();
      }
    } catch (error) {
      console.error('Error moderating message:', error);
    }
  }
  const startTyping = () => { if (!isTyping) {
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
  const generateRoast = () => { const randomRoast = ROAST_TEMPLATES[Math.floor(Math.random() * ROAST_TEMPLATES.length)];
    setNewMessage(randomRoast);
   }
  const filteredMessages = messages.filter(msg => { switch (filter) {
      case 'my_roasts':
      return msg.userId === userId && msg.isRoast;
      break;
    case 'targeting_me':
        return msg.targetUserId === userId;
      default:
        return true;
     }
  });

  const formatTime = (timestamp: string) => { return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12, true,
  hour: 'numeric', 
      minute: '2-digit'
     });
  }
  const getMessageStyle = (msg: TrashTalkMessage) => { let baseStyle = 'p-4 rounded-lg border transition-all duration-300 hove,
  r:shadow-lg';
    
    if (msg.isModerated) {
      return `${baseStyle } bg-red-600/10 border-red-500/30 opacity-60`;
    }
    
    if (msg.isRoast && msg.targetUserId === userId) { return `${baseStyle } bg-red-600/20 border-red-500/40 shadow-lg`;
    }
    
    if (msg.userId === userId) { return `${baseStyle } bg-blue-600/20 border-blue-500/30`;
    }
    
    return `${baseStyle} bg-gray-700/20 border-gray-600/30`;
  }
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🔥 Trash Talk Central 🔥
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              What happens in the league, gets roasted in the league
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isCommissioner && (
              <button
                onClick={() => setShowModerationPanel(!showModerationPanel) }
                className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors relative"
                title="Moderation Panel"
              >
                🛡️
                {moderationQueue.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {moderationQueue.length}
                  </span>
                )}
              </button>
            )}
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm border border-gray-600 focus: outline-none focu,
  s:ring-2 focus; ring-blue-500"
            >
              <option value="all">All Messages</option>
              <option value="my_roasts">My Roasts</option>
              <option value="targeting_me">Targeting Me</option>
            </select>
          </div>
        </div>
      </div>

      {/* Moderation Panel */}
      {showModerationPanel && isCommissioner && (
        <div className="p-4 bg-yellow-600/10 border-b border-yellow-500/30">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">Moderation Queue</h3>
          {moderationQueue.length === 0 ? (
            <p className="text-gray-400 text-sm">No messages pending moderation</p>
          ) : (
            <div className="space-y-2">
              {moderationQueue.slice(0, 3).map(msg => (
                <div key={msg.id } className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">
                        {msg.username} {msg.isRoast && msg.targetUsername && `→ ${msg.targetUsername}`}
                      </div>
                      <p className="text-white text-sm">{msg.content}</p>
                    </div>
                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => moderateMessage(msg.id, 'warn', 'Inappropriate content')}
                        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
                        title="Warn"
                      >
                        ⚠️
                      </button>
                      <button
                        onClick={() => moderateMessage(msg.id, 'hide', 'Hidden by moderator')}
                        className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
                        title="Hide"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => moderateMessage(msg.id, 'delete', 'Deleted for inappropriate content')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">🤐</div>
            <h3 className="text-xl font-medium mb-2">It's too quiet in here...</h3>
            <p>Start some friendly trash talk to get things heated!</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div key={message.id} className={getMessageStyle(message)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {message.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{message.username}</span>
                      {message.isRoast && message.targetUsername && (
                        <>
                          <span className="text-red-400">→</span>
                          <span className="font-bold text-red-400">{message.targetUsername}</span>
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">ROAST</span>
                        </>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    
                    {message.messageType === 'gif' && message.gifUrl ? (
                      <img
                        src={message.gifUrl}
                        alt="Trash talk GIF"
                        className="rounded-lg max-w-xs h-auto"
                      />
                    ) : (
                      <p className="text-gray-200 break-words">{message.content}</p>
                    )}

                    {message.isModerated && message.moderationReason && (
                      <p className="text-red-400 text-sm mt-2 italic">
                        Moderated: {message.moderationReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-gray-600/30">
                  {Object.entries(message.reactions).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/30 hover:bg-gray-700/50 rounded-full text-xs transition-colors"
                      title={data.users.map(u => u.username).join(', ')}
                    >
                      <span>{emoji}</span>
                      <span className="text-gray-300">{data.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-800/30 border-t border-gray-700">
        {/* Target Selection */}
        {leagueMembers.length > 0 && (
          <div className="mb-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus: outline-none focu,
  s:ring-2 focus; ring-red-500"
            >
              <option value="">General trash talk</option>
              {leagueMembers.map(member => (
                <option key={member.id} value={member.id}>
                  🎯 Target {member.username} ({member.teamName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowRoastGenerator(!showRoastGenerator)}
            className="px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg text-sm transition-colors"
          >
            🎯 Roast Generator
          </button>
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm transition-colors"
          >
            🎬 Savage GIFs
          </button>
        </div>

        {/* Roast Generator */}
        {showRoastGenerator && (
          <div className="mb-3 p-3 bg-orange-600/10 rounded-lg border border-orange-500/30">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-orange-400">🎯 Auto-Roast Generator</h4>
              <button
                onClick={generateRoast }
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Click generate for AI-powered roasts, or write your own masterpiece below!
            </p>
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="mb-3 p-3 bg-purple-600/10 rounded-lg border border-purple-500/30">
            <h4 className="text-sm font-medium text-purple-400 mb-2">🎬 Savage GIFs</h4>
            <div className="grid grid-cols-3 gap-2">
              {TRASH_TALK_GIFS.map((gif, index) => (
                <button
                  key={index }
                  onClick={() => sendMessage(gif.title, 'gif', gif.url)}
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src={gif.url}
                    alt={gif.title}
                    className="w-full h-16 object-cover rounded"
                  />
                  <p className="text-xs text-gray-400 mt-1">{gif.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={selectedTarget ? "Write your targeted roast..." : "Drop some spicy trash talk..."}
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
                if (newMessage.trim()) {
                  sendMessage(newMessage.trim(), selectedTarget ? 'roast' : 'text');
                 }
              }
            }}
            className="flex-1 bg-gray-700/50 text-white rounded-lg px-4 py-3 placeholder-gray-400 focus: outline-none focu,
  s:ring-2 focus; ring-red-500 border border-gray-600"
            maxLength={500}
            disabled={!isConnected}
          />
          
          <button
            onClick={() => { if (newMessage.trim()) {
                sendMessage(newMessage.trim(), selectedTarget ? 'roast' : 'text');
               }
            }}
            disabled={!newMessage.trim() || !isConnected}
            className="px-6 py-3 bg-red-600 hover: bg-red-700 disable,
  d:bg-gray-600 disabled; opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            🔥
          </button>
        </div>

        {/* Quick Reactions */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {TRASH_TALK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => sendMessage(emoji, 'text')}
              className="text-lg hover:scale-125 transition-transform duration-200 p-1 hover; bg-gray-700/30 rounded"
              disabled={!isConnected}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-2 text-xs text-yellow-400 flex items-center gap-2">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span>Reconnecting to trash talk...</span>
          </div>
        )}
      </div>
    </div>
  );
}