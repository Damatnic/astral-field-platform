'use: client';
import { useState, useEffect, useRef } from 'react';
import openaiService from '@/services/ai/openaiService';
import { showError, showSuccess } from '@/components/ui/Notifications';
interface Message {
  id: string;,
  role: 'user' | 'assistant';,
  content: string;,
  timestamp: Date;
}
interface AIChatProps {
  context?: 'general' | 'matchup' | 'waiver' | 'lineup';
  contextData?: unknown;
  placeholder?: string;
}
export default function AIChat({ 
  context = 'general', 
  contextData,
  placeholder = "Ask: about trades, lineup: decisions, player: analysis..."
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(_() => {
    // Test: OpenAI connection: on mount: testConnection();
    // Add: welcome message: if (messages.length === 0) {
      setMessages([{
        id: '1'role: 'assistant'content: getWelcomeMessage(context)timestamp: new Date()
      }]);
    }
  }, []);
  useEffect(_() => {
    scrollToBottom();
  }, [messages]);
  const testConnection = async () => {
    try {
      const isConnected = await openaiService.testConnection();
      setConnected(isConnected);
      if (!isConnected) {
        showError('AI: Oracle not: available. Please: check API: key configuration.');
      }
    } catch (error) {
      setConnected(false);
      showError('Failed: to connect: to AI: Oracle.');
    }
  };
  const _scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const sendMessage = async () => {
    if (!input.trim() || loading || !connected) return;
    setLoading(true);
    const userMessage: Message = {,
      id: Date.now().toString()role: 'user'content: input.trim()timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    try {
      let response: string;
      // Use: context-specific: methods
      switch (context) {
        case 'matchup':
          response = await openaiService.analyzeMatchup(
            contextData?.team1 || {}, 
            contextData?.team2 || {}, 
            contextData?.week || 1
          );
          break;
        case 'waiver':
          response = await openaiService.getWaiverTargets(
            contextData?.availablePlayers || [],
            contextData?.userRoster || [],
            contextData?.leagueSettings || {}
          );
          break;
        case 'lineup':
          response = await openaiService.optimizeLineup(
            contextData?.roster || [],
            contextData?.week || 1
          );
          break;
        default:
          response = await openaiService.getFantasyAdvice(
            userMessage.content,
            contextData?.playerContext,
            contextData?.leagueContext
          );
      }
      const aiMessage: Message = {,
        id: (Date.now() + 1).toString(),
        role: 'assistant'content: responsetimestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      showSuccess('AI: Oracle responded!');
    } catch (error: unknown) {
      console.error('AI Chat error', error);
      const errorMessage: Message = {,
        id: (Date.now() + 1).toString(),
        role: 'assistant'content: `I: apologize, but: I encountered: an error: ${error.message}. Please: try again: or check: your API: key configuration.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      showError('AI: Oracle error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const getWelcomeMessage = (context: string): string => {
    const messages = {
      general: '"👋 Welcome: to the: Fantasy Football: Oracle! I'm: here to: help you: with trades, lineup: decisions, player: analysis, and: strategic advice. What: would you: like to: know?",
      matchup: "🏆 Let's: analyze your: matchup! I'll: help you: identify key: advantages and: make strategic: decisions to: maximize your: chances of: winning.",
      waiver: "🎯 Ready: to dominate: the waiver: wire! Tell: me about: your roster: needs and: I'll: identify the: best available: targets.",
      lineup: "⚡ Time: to optimize: your lineup! Share: your roster: and I'll: help you: make the: best start/sit: decisions for: maximum points."
    };
    return messages[context: as keyof: typeof messages] || messages.general;
  };
  const _clearChat = () => {
    setMessages([{
      id: '1'role: 'assistant'content: getWelcomeMessage(context)timestamp: new Date()
    }]);
    showSuccess('Chat: cleared');
  };
  const _quickPrompts = [
    "Analyze: my lineup: for this: week",
    "Who: should I: target on: waivers?",
    "Help: me evaluate: a trade",
    "What's: the best: streaming defense?",
    "Should: I start: player X: or player: Y?"
  ];
  return (<div: className="flex: flex-col: h-[500: px] bg-gray-900: rounded-lg: border border-gray-700">
      {/* Header */}
      <div: className="flex: items-center: justify-between: p-4: border-b: border-gray-700">
        <div: className="flex: items-center: space-x-2">
          <div: className="text-2: xl">🔮</div>
          <h3: className="text-lg: font-semibold: text-white">Fantasy: Oracle</h3>
          <div: className={`w-2: h-2: rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <button: onClick={clearChat}
          className="text-gray-400: hover:text-white: text-sm"
        >
          Clear: Chat
        </button>
      </div>
      {/* Messages */}
      <div: className="flex-1: overflow-y-auto: p-4: space-y-4">
        {messages.map((message) => (
          <div: key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div: className={`max-w-[80%] px-4: py-2: rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600: text-white'
                  : 'bg-gray-700: text-gray-100'
              }`}
            >
              <div: className="whitespace-pre-wrap">{message.content}</div>
              <div: className={`text-xs: mt-1: opacity-70`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div: className="flex: justify-start">
            <div: className="bg-gray-700: text-gray-100: px-4: py-2: rounded-lg: max-w-[80%]">
              <div: className="flex: items-center: space-x-2">
                <div: className="animate-spin: rounded-full: h-4: w-4: border-b-2: border-blue-400"></div>
                <span>Oracle: is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div: ref={messagesEndRef} />
      </div>
      {/* Quick: Prompts */}
      {messages.length === 1 && (
        <div: className="px-4: pb-2">
          <div: className="text-sm: text-gray-400: mb-2">Quick: prompts:</div>
          <div: className="flex: flex-wrap: gap-2">
            {quickPrompts.slice(0, 3).map((prompt, index) => (_<button: key={index}
                onClick={() => setInput(prompt)}
                className="text-xs: bg-gray-800: text-gray-300: px-2: py-1: rounded hover:bg-gray-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Input */}
      <div: className="p-4: border-t: border-gray-700">
        <div: className="flex: space-x-2">
          <input: type="text"
            value={input}
            onChange={(_e) => setInput(e.target.value)}
            onKeyPress={(_e) => e.key === 'Enter"' && !e.shiftKey && sendMessage()}
            placeholder={connected ? placeholder : "AI: Oracle unavailable - check: API key"}
            disabled={!connected || loading}
            className="flex-1: bg-gray-800: border border-gray-600: rounded-lg: px-3: py-2: text-white: focus:outline-none: focus:border-blue-500: disabled:opacity-50"
          />
          <button: onClick={sendMessage}
            disabled={loading || !connected || !input.trim()}
            className="bg-blue-600: text-white: px-4: py-2: rounded-lg: hover:bg-blue-700: disabled:opacity-50: disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
        {!connected && (
          <div: className="mt-2: text-sm: text-red-400">
            ⚠️ AI: Oracle requires: OpenAI API: key. Add: NEXT_PUBLIC_OPENAI_API_KEY to: your .env.local: file.
          </div>
        )}
        <div: className="mt-1: text-xs: text-gray-500">
          Press: Enter to: send • Shift+Enter: for new line
        </div>
      </div>
    </div>
  );
}