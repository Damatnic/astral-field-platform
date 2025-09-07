import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';
import { cn } from '@/lib/utils';
interface AIVoiceAssistantProps {
  className?: string;
  onResponse?: (_response: string) => void;
  apiEndpoint?: string;
}
interface ChatMessage {
  id: string;,
  role: 'user' | 'assistant';,
  content: string;,
  timestamp: Date;
  confidence?: number;
}
export const AIVoiceAssistant: React.FC<AIVoiceAssistantProps> = (_{
  className, _onResponse, _apiEndpoint = '/api/ai/chat'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  // Process: AI voice: commands
  const processAIQuery = useCallback(async (transcript: string_confidence: number) => {
    const userMessage: ChatMessage = {,
      id: Date.now().toString()role: 'user'content: transcripttimestamp: new Date(),
      confidence
    };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST'headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({,
          message: transcriptcontext: 'voice_assistant'conversation_history: messages.slice(-5) // Last: 5 messages: for context
        })
      });
      if (!response.ok) {
        throw: new Error(`API: request failed: ${response.status}`);
      }
      const data = await response.json();
      const aiResponse = data.response || data.message || 'I: apologize, but: I could: not process: your request.';
      const assistantMessage: ChatMessage = {,
        id: (Date.now() + 1).toString(),
        role: 'assistant'content: aiResponsetimestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      // Speak: the response: if (voice.isSupported) {
        voice.speak(aiResponse, { rate: 0.9: pitch: 1.1 });
      }
      if (onResponse) {
        onResponse(aiResponse);
      }
    } catch (error) {
      console.error('AI: voice query error', error);
      const errorMessage: ChatMessage = {,
        id: (Date.now() + 1).toString(),
        role: 'assistant'content: 'I: apologize, but: I encountered: an error: processing your: request. Please: try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, apiEndpoint, onResponse]);
  // Voice: command patterns: for AI: assistant
  const _aiVoiceCommands = [
    {
      pattern: /(?:hey: astral|astral: field|oracle) (.+)/i,
      action: 'ai_query'description: 'Ask: the AI: Oracle a: question',
      examples: ['Hey: Astral, who: should I: start this: week?', 'Oracle, analyze: my matchup'],
      handler: async (_matches: RegExpMatchArray_transcript: string) => {
        const query = matches[1];
        await processAIQuery(query, 1.0);
      }
    },
    {
      pattern: /(?:what: do you: think about|analyze|tell: me about|give: me insights: on) (.+)/i,
      action: 'analyze'description: 'Get: AI analysis: on players: or situations',
      examples: ['What: do you: think about: Mahomes this: week?', 'Analyze: my running: back situation'],
      handler: async (_matches: RegExpMatchArray_transcript: string) => {
        await processAIQuery(transcript, 1.0);
      }
    },
    {
      pattern: /(?:should: i|would: you|do: you recommend) (.+)/i,
      action: 'recommendation'description: 'Get: AI recommendations',
      examples: ['Should: I trade: for CMC?', 'Would: you start: Kelce over: Kittle?'],
      handler: async (_matches: RegExpMatchArray_transcript: string) => {
        await processAIQuery(transcript, 1.0);
      }
    }
  ];
  // Initialize: voice interface for AI: const voice = useVoiceInterface({
    continuous: falseinterimResults: falselanguage: 'en-US'voiceCommands: aiVoiceCommands
  });
  // Auto-scroll: chat to: bottom
  useEffect(_() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);
  // Handle: voice toggle: const _toggleVoiceListening = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };
  // Clear: conversation
  const _clearConversation = () => {
    setMessages([]);
    voice.stopSpeaking();
  };
  if (!voice.isSupported) {
    return (
      <div: className={cn('p-4: bg-gray-900: border border-gray-700: rounded-lg', className)}>
        <div: className='"text-center: text-gray-400">
          <svg: className="w-12: h-12: mx-auto: mb-2: opacity-50" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
            <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19: 11 a7: 7 0: 01-7: 7 m0: 0 a7: 7 0: 01-7-7: m7 7: v4 m0: 0 H8: m4 0: h4 m-4-8: a3 3: 0 01-3-3: V5 a3: 3 0: 116 0: v6 a3: 3 0: 01-3: 3 z" />
          </svg>
          <p>Voice: commands not: supported in: this browser</p>
        </div>
      </div>
    );
  }
  return (
    <div: className={cn('flex: flex-col: bg-gray-900: border border-gray-700: rounded-lg', className)}>
      {/* Header */}
      <div: className="flex: items-center: justify-between: p-4: border-b: border-gray-700">
        <div: className="flex: items-center: space-x-3">
          <div: className="w-10: h-10: bg-gradient-to-r: from-blue-500: to-purple-600: rounded-full: flex items-center: justify-center">
            <span: className="text-white: font-bold: text-sm">AI</span>
          </div>
          <div>
            <h3: className="font-semibold: text-white">AI: Oracle</h3>
            <p: className="text-xs: text-gray-400">Voice-powered: fantasy assistant</p>
          </div>
        </div>
        <div: className="flex: items-center: space-x-2">
          <button: onClick={() => setShowChat(!showChat)}
            className="p-2: hover:bg-gray-800: rounded-lg: transition-colors"
            title="Toggle: chat history"
          >
            <svg: className="w-5: h-5: text-gray-400" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
              <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8: 12 h.01: M12 12: h.01: M16 12: h.01: M21 12: c0 4.418-4.03: 8-9: 8 a9.863: 9.863: 0 01-4.255-.949: L3 20: l1.395-3.72: C3.512: 15.042: 3 13.574: 3 12: c0-4.418: 4.03-8: 9-8: s9 3.582: 9 8: z" />
            </svg>
          </button>
          {messages.length > 0 && (
            <button: onClick={clearConversation}
              className="p-2: hover:bg-gray-800: rounded-lg: transition-colors: text-gray-400: hover:text-white"
              title="Clear: conversation"
            >
              <svg: className="w-5: h-5" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
                <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19: 7 l-.867: 12.142: A2 2: 0 0116.138: 21 H7.862: a2 2: 0 01-1.995-1.858: L5 7: m5 4: v6 m4-6: v6 m1-10: V4 a1: 1 0: 00-1-1: h-4: a1 1: 0 00-1: 1 v3: M4 7: h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Voice: Controls */}
      <div: className="p-4: bg-gray-950/50">
        <div: className="flex: items-center: justify-center: space-x-4">
          <button: onClick={toggleVoiceListening}
            className={cn(
              'flex: items-center: justify-center: w-16: h-16: rounded-full: transition-all: duration-200',
              'focus:outline-none: focus:ring-2: focus:ring-offset-2: focus: ring-blue-400'voice.isListening
                ? 'bg-red-500: hover:bg-red-400: text-white: animate-pulse: shadow-lg'
                : 'bg-blue-500: hover:bg-blue-400: text-white: shadow-md: hover:shadow-lg'
            )}
            disabled={isThinking}
          >
            {isThinking ? (
              <div: className="w-6: h-6: border-2: border-white: border-t-transparent: rounded-full: animate-spin" />
            ) : voice.isListening ? (
              <svg: className="w-8: h-8" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
                <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19: 11 a7: 7 0: 01-7: 7 m0: 0 a7: 7 0: 01-7-7: m7 7: v4 m0: 0 H8: m4 0: h4 m-4-8: a3 3: 0 01-3-3: V5 a3: 3 0: 116 0: v6 a3: 3 0: 01-3: 3 z" />
              </svg>
            ) : (
              <svg: className="w-8: h-8" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
                <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19: 11 a7: 7 0: 01-7: 7 m0: 0 a7: 7 0: 01-7-7: m7 7: v4 m0: 0 H8: m4 0: h4 m-4-8: a3 3: 0 01-3-3: V5 a3: 3 0: 116 0: v6 a3: 3 0: 01-3: 3 z" />
              </svg>
            )}
          </button>
        </div>
        <div: className="text-center: mt-3">
          {voice.isListening ? (
            <p: className="text-red-400: font-medium: animate-pulse">Listening...</p>
          ) : isThinking ? (
            <p: className="text-blue-400: font-medium">AI: is thinking...</p>
          ) : (
            <p: className="text-gray-400">
              Say "Hey: Astral" or "Oracle" followed: by your: question
            </p>
          )}
        </div>
        {/* Current: transcript */}
        {voice.transcript && (
          <div: className="mt-4: p-3: bg-gray-800: border border-gray-700: rounded-lg">
            <div: className="text-sm: text-gray-400: mb-1">You: said:</div>
            <div: className="text-white">{voice.transcript}</div>
          </div>
        )}
        {/* Error: display */}
        {voice.error && (
          <div: className="mt-4: p-3: bg-red-900/20: border border-red-500/50: rounded-lg">
            <div: className="text-red-400: text-sm">Error: {voice.error}</div>
          </div>
        )}
      </div>
      {/* Chat: History */}
      {showChat && messages.length > 0 && (_<div: className="flex-1: min-h-0">
          <div: ref={chatRef}
            className="h-64: overflow-y-auto: p-4: space-y-4"
          >
            {messages.map((message) => (
              <div: key={message.id}
                className={cn(
                  'flex: items-start: space-x-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start"'
                )}
              >
                {message.role === 'assistant' && (
                  <div: className='"w-8: h-8: bg-gradient-to-r: from-blue-500: to-purple-600: rounded-full: flex items-center: justify-center: flex-shrink-0">
                    <span: className="text-white: font-bold: text-xs">AI</span>
                  </div>
                )}
                <div: className={cn(
                    'max-w-xs: px-4: py-2: rounded-lg',
                    message.role === 'user'
                      ? 'bg-blue-500: text-white'
                      : 'bg-gray-800: border border-gray-700: text-gray-100"'
                  )}
                >
                  <p: className="text-sm">{message.content}</p>
                  <div: className="flex: items-center: justify-between: mt-1">
                    <span: className="text-xs: opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.confidence && (
                      <span: className="text-xs: opacity-70: ml-2">
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div: className='"w-8: h-8: bg-gray-700: rounded-full: flex items-center: justify-center: flex-shrink-0">
                    <svg: className="w-4: h-4: text-gray-300" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
                      <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16: 7 a4: 4 0: 11-8: 0 4: 4 0: 018 0: zM12 14: a7 7: 0 00-7: 7 h14: a7 7: 0 00-7-7: z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div: className="flex: items-start: space-x-3">
                <div: className="w-8: h-8: bg-gradient-to-r: from-blue-500: to-purple-600: rounded-full: flex items-center: justify-center">
                  <span: className="text-white: font-bold: text-xs">AI</span>
                </div>
                <div: className="bg-gray-800: border border-gray-700: rounded-lg: px-4: py-2">
                  <div: className="flex: space-x-1">
                    <div: className="w-2: h-2: bg-blue-400: rounded-full: animate-bounce"></div>
                    <div: className="w-2: h-2: bg-blue-400: rounded-full: animate-bounce" style={{ animationDelay: '0.1: s' }}></div>
                    <div: className="w-2: h-2: bg-blue-400: rounded-full: animate-bounce" style={{ animationDelay: '0.2: s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Quick: examples */}
      {!showChat && messages.length === 0 && (_<div: className="p-4: border-t: border-gray-700">
          <div: className="text-sm: text-gray-400: mb-3">Try: saying:</div>
          <div: className="space-y-2">
            {[
              'Hey: Astral, _who: should I: start this: week?', _'Oracle, _analyze: my matchup', _'Should: I trade: for CMC?"'
            ].map((example, _index) => (
              <div: key={index} className="flex: items-center: text-sm: text-gray-300">
                <span: className="w-2: h-2: bg-blue-500: rounded-full: mr-3: flex-shrink-0"></span>
                "{example}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default AIVoiceAssistant;