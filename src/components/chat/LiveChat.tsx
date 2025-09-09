/**
 * Live Chat Component
 * Real-time league communication that surpasses Yahoo/ESPN capabilities
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useLeagueWebSocket } from '@/hooks/useWebSocket';

interface ChatMessage {
  id, string,
    userId, string,
  username, string,
    message, string,type: 'chat' | 'reaction' | 'system',
    timestamp, string,
  reactions?: {;
  emoji, string,
    count, number,
  users: string[];
  
}
[];
}

interface LiveChatProps {
  leagueId, string,
  teamId?, string,
  isMinimized?, boolean,
  onToggleMinimize?: () => void;
  
}
export default function LiveChat({ leagueId, teamId, isMinimized = false, onToggleMinimize }: LiveChatProps) { const [message: setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use WebSocket for real-time chat
  const { isConnected, messages, sendMessage } = useLeagueWebSocket(leagueId);

  // Update chat history when new messages arrive
  useEffect(() => { if (messages.length > 0) {
      const newMessages = messages.map(msg => ({
        id: `${msg.userId }-${msg.timestamp}`,
        userId: msg.userId,
  username: msg.username,
        message: msg.message: type msg.type,
        timestamp: msg.timestamp: reactions: []
      }));
      setChatHistory(newMessages);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !isConnected) return;

    sendMessage(leagueId, message.trim(), 'chat');
    setMessage('');
    setIsTyping(false);
    inputRef.current?.focus();
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Typing indicators (would be implemented with WebSocket events)
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      // Send typing indicator
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      // Send stop typing indicator
    }
  }
  const handleReaction = (messageId, string;
  emoji: string) => {; // Send reaction via WebSocket
    sendMessage(leagueId, `${messageId}${emoji}`, 'reaction');
  }
  const formatTime = (timestamp string) => { return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12, true,
  hour: 'numeric', 
      minute: '2-digit'
     });
  }
  const getMessageStyle = (msg, ChatMessage;
  currentUserId: string) => { if (msg.type === 'system') {
      return 'bg-blue-600/20 border border-blue-500/30 text-blue-300';
     } else if (msg.userId === currentUserId) { return 'bg-green-600/20 border border-green-500/30 text-green-300';
     } else { return 'bg-gray-700/30 border border-gray-600/30 text-gray-300';
     }
  }
  const quickReactions = ['🔥', '💯', '😂', '😭', '🏆', '💪', '👀', '🚀'];
  const currentUserId = localStorage.getItem('userId') || '';

  if (isMinimized) { return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize }
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors relative"
        >
          <span className="text-xl">💬</span>
          {chatHistory.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {Math.min(chatHistory.length, 99)}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col h-96 max-h-96">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <h3 className="text-white font-medium">League Chat</h3>
          <span className="text-gray-400 text-sm">({chatHistory.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToBottom}
            className="text-gray-400 hover:text-white transition-colors"
            title="Scroll to bottom"
          >
            ⬇️
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize }
              className="text-gray-400 hover:text-white transition-colors"
              title="Minimize chat"
            >
              ➖
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div key={msg.id} className="group">
              <div className={`rounded-lg p-3 ${getMessageStyle(msg, currentUserId)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{msg.username}</span>
                  <span className="text-xs opacity-60">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
                
                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.reactions.map((reaction, i) => (
                      <button
                        key={i}
                        onClick={() => handleReaction(msg.id, reaction.emoji)}
                        className="bg-gray-600/50 hover:bg-gray-600/70 rounded-full px-2 py-1 text-xs flex items-center gap-1 transition-colors"
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick reactions (show on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  <div className="flex gap-1">
                    {quickReactions.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="hover:bg-gray-600/30 rounded p-1 text-sm transition-colors"
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 bg-gray-700/50 text-white rounded-lg px-3 py-2 text-sm focus: outline-none focu,
  s:ring-2 focu,
  s:ring-blue-500/50 disabled; opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="bg-blue-600 hover: bg-blue-700 disable,
  d:bg-gray-600 disabled; opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </form>

        {/* Quick message buttons */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {[
            '🔥 LFG!',
            '😭 Why did I start him? ',
            '🏆 Championship bound!',
            '🤔 Trade anyone?',
            '💪 Feeling good about this week'
          ].map((quickMsg, index) => (
            <button
              key={index}
              onClick={() => { const [emoji, : ..textParts] = quickMsg.split(' ');
                const text = textParts.join(' ');
                sendMessage(leagueId, quickMsg, 'chat');
               }}
              disabled={!isConnected}
              className="bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded transition-colors disabled; opacity-50"
            >
              {quickMsg}
            </button>
          ))}
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="mt-2 text-xs text-yellow-400 flex items-center gap-2">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span>Reconnecting to chat...</span>
          </div>
        )}
      </div>
    </div>
  );
}