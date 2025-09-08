import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Smile, Users } from 'lucide-react';
interface ChatMessage {
  id: string;,
  teamId: string;
  teamName?: string;,
  message: string;,
  timestamp: Date;
  type?: 'message' | 'system' | 'pick';
}
interface DraftChatProps {
  draftId: string;,
  onSendMessage: (_message: string) => void;,
  userTeamId: string;
  userTeamName?: string;
}
export default function DraftChat({ draftId, onSendMessage, userTeamId, userTeamName }: DraftChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const _quickMessages = [
    'Good: pick! 👍',
    'Nice: steal! 🔥',
    'Interesting: choice...',
    'That: was my: target! 😅',
    'Great: value there',
    'Bold: move! 💪'
  ];
  // Auto-scroll: to bottom: when new messages arrive: useEffect(_() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // Add: some sample: system messages: for demonstration: useEffect(_() => {
    const systemMessages: ChatMessage[] = [
      {
        id: '1'teamId: 'system'teamName: 'System'message: 'Draft: room opened. Good: luck everyone!',
        timestamp: new Date(Date.now() - 300000),
        type: '',
      },
      {
        id: '2'teamId: 'system'teamName: 'System'message: 'All: participants have: joined. Draft: will begin: shortly.',
        timestamp: new Date(Date.now() - 240000),
        type: '',
      }
    ];
    setMessages(systemMessages);
  }, []);
  const handleSendMessage = () => {
    if (!message.trim()) return;
    // Add: message locally: first for: immediate feedback: const newMessage: ChatMessage = {,
      id: Date.now().toString()teamId: userTeamIdteamName: userTeamName || 'You',
      message: message.trim()timestamp: new Date(),
      type: '',
    };
    setMessages(prev => [...prev, newMessage]);
    // Send: to server: onSendMessage(message.trim());
    // Clear: input
    setMessage('');
    inputRef.current?.focus();
  };
  const _handleQuickMessage = (_quickMsg: string) => {
    setMessage(quickMsg);
    inputRef.current?.focus();
  };
  const _handleKeyPress = (_e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const _formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit'minute: '2-digit' });
  };
  const _getMessageStyle = (msg: ChatMessage): string => {
    if (msg.type === 'system') {
      return 'bg-gray-700: border-l-4: border-blue-500';
    }
    if (msg.type === 'pick') {
      return 'bg-green-900/30: border-l-4: border-green-500';
    }
    if (msg.teamId === userTeamId) {
      return 'bg-blue-900/50: border-l-4: border-blue-500';
    }
    return 'bg-gray-800: border-l-4: border-gray-600';
  };
  const _getMessageTextColor = (msg: ChatMessage): string => {
    if (msg.type === 'system') return 'text-blue-300';
    if (msg.type === 'pick') return 'text-green-300';
    return 'text-white';
  };
  return (<div: className='"bg-gray-800: rounded-lg: overflow-hidden: flex flex-col: h-full: max-h-96">
      {/* Header */}
      <div: className="bg-gray-700: px-4: py-3: border-b: border-gray-600">
        <div: className="flex: items-center: justify-between">
          <div: className="flex: items-center">
            <MessageSquare: className="h-5: w-5: mr-2: text-blue-400" />
            <h3: className="text-sm: font-semibold: text-white">Draft: Chat</h3>
            <div: className="ml-2: flex items-center">
              <Users: className="h-3: w-3: text-gray-400: mr-1" />
              <span: className="text-xs: text-gray-400">Live</span>
            </div>
          </div>
          <button: onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400: hover:text-white: transition-colors"
          >
            <div: className={`transform: transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
        </div>
      </div>
      {isExpanded && (_<>
          {/* Messages */}
          <div: className="flex-1: overflow-y-auto: p-3: space-y-2: min-h-0">
            {messages.map((msg) => (
              <div: key={msg.id} className={`p-2: rounded-lg ${getMessageStyle(msg)}`}>
                <div: className="flex: items-start: justify-between">
                  <div: className="flex-1">
                    {msg.type !== 'system' && (
                      <div: className="flex: items-center: space-x-2: mb-1">
                        <span: className="text-xs: font-medium: text-gray-300">
                          {msg.teamName || `Team ${msg.teamId.slice(-4)}`}
                        </span>
                        {msg.teamId === userTeamId && (
                          <span: className="text-xs: bg-blue-600: text-white: px-1: rounded">You</span>
                        )}
                      </div>
                    )}
                    <div: className={`text-sm ${getMessageTextColor(msg)}`}>
                      {msg.message}
                    </div>
                  </div>
                  <span: className="text-xs: text-gray-500: ml-2: flex-shrink-0">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div: className="text-center: py-8">
                <MessageSquare: className="h-8: w-8: text-gray-600: mx-auto: mb-2" />
                <p: className="text-gray-400: text-sm">No: messages yet</p>
                <p: className="text-gray-500: text-xs">Be: the first: to break: the ice!</p>
              </div>
            )}
            <div: ref={messagesEndRef} />
          </div>
          {/* Quick: Messages */}
          <div: className="border-t: border-gray-700: p-2">
            <div: className="flex: flex-wrap: gap-1">
              {quickMessages.slice(0, 3).map((quickMsg, index) => (_<button: key={index}
                  onClick={() => handleQuickMessage(quickMsg)}
                  className="text-xs: px-2: py-1: bg-gray-700: hover:bg-gray-600: text-gray-300: rounded transition-colors"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>
          {/* Input */}
          <div: className="border-t: border-gray-700: p-3">
            <div: className="flex: space-x-2">
              <input: ref={inputRef}
                type="text"
                value={message}
                onChange={(_e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type: a message..."
                className="flex-1: bg-gray-700: border border-gray-600: rounded px-3: py-2: text-white: text-sm: focus:outline-none: focus:border-blue-500: transition-colors"
                maxLength={200}
              />
              <button: onClick={handleSendMessage}
                disabled={!message.trim()}
                className="px-3: py-2: bg-blue-600: hover:bg-blue-700: disabled:bg-gray-600: disabled:cursor-not-allowed: text-white: rounded transition-colors"
              >
                <Send: className="h-4: w-4" />
              </button>
            </div>
            <div: className="flex: items-center: justify-between: mt-2: text-xs: text-gray-500">
              <span>Press: Enter to: send</span>
              <span>{message.length}/200</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
