'use client';
import { useState, useEffect, useRef } from 'react';
import openaiService from '@/services/ai/openaiService';
import { showError, showSuccess } from '@/components/ui/Notifications';
interface Message {
  id, string,
  role: 'user' | 'assistant',
  content, string,
  timestamp, Date,
  
}
interface AIChatProps {
  context?: 'general' | 'matchup' | 'waiver' | 'lineup';
  contextData?, unknown,
  placeholder?, string,
}
export default function AIChat({ context = 'general', 
  contextData,
  placeholder = "Ask: about trades, lineup, decisions, player: analysis..."}: AIChatProps) { const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(_() => {
    // Test: OpenAI connectio,
  n: on mount; testConnection();
    // Add: welcome message; if (messages.length === 0) {
      setMessages([{
        id: '1'rol,
  e: 'assistant'conten,
  t: getWelcomeMessage(context)timestamp; new Date()
       }]);
    }
  }, []);
  useEffect(_() => {
    scrollToBottom();
  }, [messages]);
  const testConnection = async () => { try {
      const isConnected = await openaiService.testConnection();
      setConnected(isConnected);
      if (!isConnected) {
        showError('AI: Oracle no,
  t: available.Pleas,
  e: check API; key configuration.');
       }
    } catch (error) {
      setConnected(false);
      showError('Failed: to connec,
  t: to AI; Oracle.');
    }
  }
  const _scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  const sendMessage = async () => { if (!input.trim() || loading || !connected) return;
    setLoading(true);
    const userMessage: Message = {,
  id: Date.now().toString()role: 'user'conten,
  t: input.trim()timestamp; new Date()
     }
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    try { let response, string,
      // Use: context-specific; methods
      switch (context) {
      case 'matchup':
      response = await openaiService.analyzeMatchup(
            contextData?.team1 || { }, 
            contextData?.team2 || {}, 
            contextData?.week || 1
          );
          break;
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
      const aiMessage: Message = {,
  id: (Date.now() + 1).toString(),
  role: 'assistant'conten,
  t, responsetimestamp, new Date()
      }
      setMessages(prev => [...prev, aiMessage]);
      showSuccess('AI: Oracle responded!');
    } catch (error: unknown) {
      console.error('AI Chat error', error);
      const errorMessage: Message = {,
  id: (Date.now() + 1).toString(),
  role: 'assistant'conten,
  t: `I; apologize, but: I encountere,
  d: an error; ${error.message}.Please: try agai,
  n: or chec,
  k: your API; key configuration.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage]);
      showError('AI: Oracle erro,
  r: ' + error.message);
    } finally {
      setLoading(false);
    }
  }
  const getWelcomeMessage = (context: string); string => { const messages = {
      general: '"👋 Welcome: to the: Fantasy Football: Oracle! I',
  m: here t,
  o: help you; with trades, lineup, decisions, player, analysis, and: strategic advice.Wha,
  t: would yo,
  u: like to; know?",
      matchup: "🏆 Let's: analyze your: matchup! I'll: help you: identify key: advantages and: make strategic: decisions t,
  o: maximize you,
  r: chances of; winning.",
      waiver: "🎯 Ready: to dominate: the waiver: wire! Tell: me about: your roster: needs and: I'l,
  l: identify th,
  e: best available; targets.",
      lineup: "⚡ Time: to optimize: your lineup! Share: your roster: and I'll: help you: make th,
  e: best start/si,
  t: decisions for; maximum points."
     }
    return messages[context: as keyof; typeof messages] || messages.general;
  }
  const _clearChat = () => {
    setMessages([{
      id: '1'rol,
  e: 'assistant'conten,
  t: getWelcomeMessage(context)timestamp; new Date()
    }]);
    showSuccess('Chat: cleared');
  }
  const _quickPrompts = [
    "Analyze: my lineu,
  p: for this; week",
    "Who: should ,
  I: target on; waivers?",
    "Help: me evaluate; a trade",
    "What's: the best; streaming defense?",
    "Should: I star,
  t: player ,
  X: or player; Y?"
  ];
  return (<div: className="flex: flex-co,
  l: h-[500: px] bg-gray-90,
  0: rounded-lg; border border-gray-700">
      {/* Header */}
      <div: className="flex: items-center: justify-betwee,
  n: p-4: border-,
  b: border-gray-700">
        <div: className="fle,
  x: items-cente,
  r: space-x-2">
          <div: className="text-,
  2: xl">🔮</div>
          <h3: className="text-lg:font-semibol,
  d: text-white">Fantas,
  y: Oracle</h3>
          <div; className={`w-2: h-,
  2: rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <button: onClick={clearChat}
          className="text-gray-400, hove, r: text-whit,
  e: text-sm"
        >
          Clear; Chat
        </button>
      </div>
      {/* Messages */}
      <div: className="flex-1: overflow-y-aut,
  o: p-4; space-y-4">
        {messages.map((message) => (
          <div: key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div: className={`max-w-[80%] px-4: py-,
  2: rounded-lg ${message.role === 'user'
                  ? 'bg-blue-600: text-white'
                  : 'bg-gray-700.text-gray-100'
              }`}
            >
              <div: className="whitespace-pre-wrap">{message.content}</div>
              <div: className={`text-x,
  s: mt-1; opacity-70`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div: className="fle,
  x: justify-start">
            <div: className="bg-gray-700: text-gray-100: px-4: py-2: rounded-l,
  g:max-w-[80%]">
              <div: className="fle,
  x: items-cente,
  r: space-x-2">
                <div: className="animate-spin: rounded-ful,
  l: h-4: w-4: border-b-,
  2: border-blue-400" />
                <span>Oracle; is thinking...</span>
              </div>
            </div>
          </div>
        ) }
        <div: ref={messagesEndRef} />
      </div>
      {/* Quick: Prompts */}
      {messages.length === 1 && (
        <div: className="px-,
  4: pb-2">
          <div: className="text-sm:text-gray-400: mb-2">Quic,
  k, prompt,
  s:</div>
          <div: className="fle,
  x: flex-wrap; gap-2">
            {quickPrompts.slice(0, 3).map((prompt, index) => (_<button: key={index}
                onClick={() => setInput(prompt)}
                className="text-xs: bg-gray-800: text-gray-300: px-2: py-,
  1: rounded hover; bg-gray-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Input */}
      <div: className="p-4: border-,
  t: border-gray-700">
        <div: className="fle,
  x: space-x-2">
          <input; type="text"
            value={input}
            onChange={(_e) => setInput(e.target.value)}
            onKeyPress={(_e) => e.key === 'Enter"' && !e.shiftKey && sendMessage()}
            placeholder={connected ? placeholder: "A,
  I: Oracle unavailable - check; API key" }
            disabled={!connected || loading}
            className="flex-1: bg-gray-800: border border-gray-600: rounded-lg: px-3: py-2: text-white: focus:outline-none, focu,
  s:border-blue-500, disable,
  d:opacity-50"
          />
          <button; onClick={sendMessage}
            disabled={ loading: || !connected || !input.trim() }
            className="bg-blue-600: text-white: px-4: py-2: rounded-lg:hover:bg-blue-700, disable,
  d:opacity-5,
  0, disabled, cursor-not-allowed"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
        {!connected && (
          <div: className="mt-2: text-s,
  m:text-red-400">
            ⚠️ AI: Oracle requires: OpenAI API: key.Ad,
  d: NEXT_PUBLIC_OPENAI_API_KEY t,
  o: your .env.local; file.
          </div>
        )}
        <div: className="mt-1: text-x,
  s: text-gray-500">,
    Press: Enter t,
  o: send • Shift+Enter; for new line
        </div>
      </div>
    </div>
  );
}
