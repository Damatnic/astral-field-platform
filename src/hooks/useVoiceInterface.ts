import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: any; // SpeechGrammarList
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'start', listener: () => void): void;
  addEventListener(type: 'end', listener: () => void): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => VoiceRecognition;
    webkitSpeechRecognition: new () => VoiceRecognition;
    speechSynthesis: SpeechSynthesis;
  }
}

interface VoiceCommand {
  pattern: RegExp;
  action: string;
  description: string;
  examples: string[];
  handler: (matches: RegExpMatchArray, transcript: string) => Promise<void> | void;
}

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  lastCommand: string | null;
  isProcessing: boolean;
}

interface VoiceInterfaceOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  autoStart?: boolean;
  voiceCommands?: VoiceCommand[];
}

export const useVoiceInterface = (options: VoiceInterfaceOptions = {}) => {
  const {
    continuous = false,
    interimResults = true,
    language = 'en-US',
    autoStart = false,
    voiceCommands = []
  } = options;

  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    error: null,
    lastCommand: null,
    isProcessing: false,
  });

  const recognition = useRef<VoiceRecognition | null>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const commandsRef = useRef<VoiceCommand[]>(voiceCommands);

  // Update commands reference when props change
  useEffect(() => {
    commandsRef.current = voiceCommands;
  }, [voiceCommands]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition && !!window.speechSynthesis;

    setState(prev => ({ ...prev, isSupported }));

    if (!isSupported) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = interimResults;
    recognitionInstance.lang = language;
    recognitionInstance.maxAlternatives = 3;

    // Event handlers
    recognitionInstance.addEventListener('start', () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    });

    recognitionInstance.addEventListener('end', () => {
      setState(prev => ({ ...prev, isListening: false }));
    });

    recognitionInstance.addEventListener('result', (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          setState(prev => ({ 
            ...prev, 
            transcript: finalTranscript.trim(),
            confidence,
            lastCommand: finalTranscript.trim()
          }));
          
          // Process voice commands
          processVoiceCommand(finalTranscript.trim());
        } else {
          interimTranscript += transcript;
          setState(prev => ({ 
            ...prev, 
            transcript: interimTranscript.trim(),
            confidence
          }));
        }
      }
    });

    recognitionInstance.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
      setState(prev => ({ 
        ...prev, 
        error: event.error,
        isListening: false 
      }));
      console.error('Speech recognition error:', event.error, event.message);
    });

    recognition.current = recognitionInstance;
    synthesis.current = window.speechSynthesis;

    // Auto start if requested
    if (autoStart) {
      startListening();
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, [continuous, interimResults, language, autoStart]);

  // Process voice commands
  const processVoiceCommand = useCallback(async (transcript: string) => {
    const commands = commandsRef.current;
    if (commands.length === 0) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      for (const command of commands) {
        const matches = transcript.toLowerCase().match(command.pattern);
        if (matches) {
          console.log(`Voice command matched: ${command.action}`, matches);
          await command.handler(matches, transcript);
          setState(prev => ({ ...prev, lastCommand: command.action }));
          break;
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setState(prev => ({ ...prev, error: 'Failed to process command' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  // Voice interface controls
  const startListening = useCallback(() => {
    if (!recognition.current || state.isListening) return;

    try {
      recognition.current.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setState(prev => ({ ...prev, error: 'Failed to start listening' }));
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (!recognition.current || !state.isListening) return;

    recognition.current.stop();
  }, [state.isListening]);

  const abortListening = useCallback(() => {
    if (!recognition.current) return;

    recognition.current.abort();
    setState(prev => ({ ...prev, isListening: false, transcript: '', error: null }));
  }, []);

  // Text-to-speech
  const speak = useCallback((text: string, options: SpeechSynthesisUtteranceInit = {}) => {
    if (!synthesis.current) return;

    // Cancel any ongoing speech
    synthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    synthesis.current.speak(utterance);

    return utterance;
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (!synthesis.current) return;
    synthesis.current.cancel();
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      confidence: 0, 
      error: null,
      lastCommand: null 
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    abortListening,
    speak,
    stopSpeaking,
    clearTranscript,
  };
};

// Fantasy Football Voice Commands
export const createFantasyVoiceCommands = (
  onNavigate: (route: string) => void,
  onSearch: (query: string) => void,
  onAction: (action: string, data?: any) => void
): VoiceCommand[] => [
  {
    pattern: /(?:go to|navigate to|open|show me) (?:the )?(dashboard|home|players|matchups|team|trades|stats|settings)/i,
    action: 'navigate',
    description: 'Navigate to different pages',
    examples: ['Go to dashboard', 'Show me players', 'Open my team'],
    handler: (matches) => {
      const destination = matches[1].toLowerCase();
      const routes: Record<string, string> = {
        dashboard: '/',
        home: '/',
        players: '/players',
        matchups: '/matchups',
        team: '/team',
        trades: '/trades',
        stats: '/stats',
        settings: '/settings',
      };
      onNavigate(routes[destination] || '/');
    }
  },
  {
    pattern: /search (?:for )?(.+)/i,
    action: 'search',
    description: 'Search for players or content',
    examples: ['Search for Mahomes', 'Search running backs'],
    handler: (matches) => {
      const query = matches[1];
      onSearch(query);
    }
  },
  {
    pattern: /(?:find|show me|get|lookup) (.+?) (?:stats|statistics|info|information)/i,
    action: 'player_info',
    description: 'Get player statistics',
    examples: ['Find Josh Allen stats', 'Show me Derrick Henry info'],
    handler: (matches) => {
      const playerName = matches[1];
      onAction('player_info', { player: playerName });
    }
  },
  {
    pattern: /(?:add|pick up|claim) (.+?) (?:from waivers|to my team)/i,
    action: 'add_player',
    description: 'Add player from waivers',
    examples: ['Add Mike Williams from waivers', 'Pick up handcuff to my team'],
    handler: (matches) => {
      const playerName = matches[1];
      onAction('add_player', { player: playerName });
    }
  },
  {
    pattern: /(?:drop|release|cut) (.+?) (?:from my team)/i,
    action: 'drop_player',
    description: 'Drop player from team',
    examples: ['Drop injured player from my team'],
    handler: (matches) => {
      const playerName = matches[1];
      onAction('drop_player', { player: playerName });
    }
  },
  {
    pattern: /(?:set|start|bench) (.+?) (?:as|in my) (?:starting lineup|lineup)/i,
    action: 'set_lineup',
    description: 'Set starting lineup',
    examples: ['Set Mahomes in my starting lineup', 'Start CMC as running back'],
    handler: (matches) => {
      const playerName = matches[1];
      onAction('set_lineup', { player: playerName, action: 'start' });
    }
  },
  {
    pattern: /what(?:'s| is) (?:the |my )?(?:score|points|total)/i,
    action: 'check_score',
    description: 'Check current score',
    examples: ["What's my score?", "What's the total?"],
    handler: () => {
      onAction('check_score');
    }
  },
  {
    pattern: /(?:who should i|should i) (?:start|play) (?:this week|today)/i,
    action: 'lineup_advice',
    description: 'Get lineup recommendations',
    examples: ['Who should I start this week?', 'Should I play anyone today?'],
    handler: () => {
      onAction('lineup_advice');
    }
  },
  {
    pattern: /(?:show|get|fetch) (?:me )?(?:the |my )?(?:latest |recent )?(?:news|updates) (?:for |about )?(.+)/i,
    action: 'player_news',
    description: 'Get player news and updates',
    examples: ['Show me news for CMC', 'Get updates about Mahomes'],
    handler: (matches) => {
      const playerName = matches[1];
      onAction('player_news', { player: playerName });
    }
  },
  {
    pattern: /(?:help|what can you do|commands|voice commands)/i,
    action: 'help',
    description: 'Show available voice commands',
    examples: ['Help', 'What can you do?', 'Voice commands'],
    handler: () => {
      onAction('help');
    }
  }
];

export default useVoiceInterface;