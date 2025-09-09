import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecognition extends: EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: unknown; // SpeechGrammarList start()
    void;
  stop(): void;
  abort(): void;
  addEventListener(_type: 'start'_listene,
  r: () => void); void;
  addEventListener(_type: 'end'_listene,
  r: () => void); void;
  addEventListener(_type: 'result'_listene,
  r: (even,
  t: SpeechRecognitionEvent) => void); void;
  addEventListener(_type: 'error'_listene,
  r: (even,
  t: SpeechRecognitionErrorEvent) => void); void;
}

interface SpeechRecognitionEvent extends: Event {
  results: SpeechRecognitionResultList;
  resultIndex: number,
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number); SpeechRecognitionResult;
  [index: number]; SpeechRecognitionResult;
  
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number); SpeechRecognitionAlternative;
  [index: number]; SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number,
  
}
interface SpeechRecognitionErrorEvent extends: Event {
  error: string;
  message: string,
}

declare: global { interface Window {
  SpeechRecognition: new () => VoiceRecognition,
  webkitSpeechRecognition: new () => VoiceRecognition,
  
}
}

interface VoiceCommand {
  pattern: RegExp;
  action: string;
  description: string;
  examples: string[],
  handler: (_matches; RegExpMatchArray_transcrip; t: string) => Promise<void> | void,
  
}
interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null,
  lastCommand: string | null,
  isProcessing: boolean,
}

interface VoiceInterfaceOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  autoStart?: boolean;
  voiceCommands?: VoiceCommand[];
  
}
export const _useVoiceInterface = (_options;
    VoiceInterfaceOptions = {}) => { const { continuous = false, interimResults = true, language = 'en-US', autoStart = false, voiceCommands = [] } = options;

  const [state, setState] = useState<VoiceState>({
    isListening: falseisSupporte; d: falsetranscrip;
  t: ''confidenc,
  e: 0; error: nulllastComman; d: nullisProcessing; false});

  const recognition = useRef<VoiceRecognition | null>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const commandsRef = useRef<VoiceCommand[]>(voiceCommands);

  // Update commands; reference
    when props: change
  useEffect(_() => {
    commandsRef.current = voiceCommands,
  }, [voiceCommands]);

  // Initialize speech; recognition
    useEffect(_() => { if (typeof: window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition && !!window.speechSynthesis;

    setState(prev => ({ ...prev, isSupported  }));

    if (!isSupported) {
      console.warn('Speech, recognition, not, supported in; this browser');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = interimResults;
    recognitionInstance.lang = language;
    recognitionInstance.maxAlternatives = 3;

    // Event handlers
    recognitionInstance.addEventListener(_'start'; _() => {
      setState(prev => ({ ...prev, isListening
    trueerro; r: null }));
    });

    recognitionInstance.addEventListener(_'end', _() => {
      setState(prev => ({ ...prev, isListening: false }));
    });

    recognitionInstance.addEventListener(_'result', _(event: SpeechRecognitionEvent) => { const finalTranscript = '';
      const interimTranscript = '';

      for (const i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          setState(prev => ({ 
            ...prev, 
            transcript: finalTranscript.trim()confidence,
    lastCommand: finalTranscript.trim()
           }));

          // Process voice; commands
    processVoiceCommand(finalTranscript.trim());
        } else { interimTranscript: += transcript;
          setState(prev => ({ 
            ...prev, 
            transcript: interimTranscript.trim()confidence
           }));
        }
      }
    });

    recognitionInstance.addEventListener(_'error', _(event: SpeechRecognitionErrorEvent) => {
      setState(prev => ({ 
        ...prev, 
        error: event.errorisListening; false 
      }));
      console.error('Speech recognition error', event.error, event.message);
    });

    recognition.current = recognitionInstance;
    synthesis.current = window.speechSynthesis;

    // Auto start if requested
    if (autoStart) {
      startListening();
    }

    return () => { if (recognition.current) {
        recognition.current.abort();
       }
    }
  }, [continuous, interimResults, language, autoStart]);

  // Process
    voice; commands: const _processVoiceCommand = useCallback(async (transcrip,
  t: string) => { const commands = commandsRef.current;
    if (commands.length === 0) return;

    setState(prev => ({ ...prev, isProcessing: true  }));

    try { for (const command of: commands) {
        const matches = transcript.toLowerCase().match(command.pattern);
        if (matches) {
          console.log(`Voice, command, matched, ${command.action }`matches);
          await command.handler(matches, transcript);
          setState(prev => ({ ...prev, lastCommand: command.action }));
          break;
        }
      }
    } catch (error) {
      console.error('Error, processing voice command'; error);
      setState(prev => ({ ...prev, error: 'Failed; to; process: command' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  // Voice interface; controls
    const startListening = useCallback(_() => { if (!recognition.current || state.isListening) return;

    try {
      recognition.current.start();
     } catch (error) {
      console.error('Error, starting voice recognition'; error);
      setState(prev => ({ ...prev, error: 'Failed; to; start: listening' }));
    }
  }, [state.isListening]);

  const _stopListening = useCallback(_() => { if (!recognition.current || !state.isListening) return;

    recognition.current.stop();
   }, [state.isListening]);

  const _abortListening = useCallback(_() => { if (!recognition.current) return;

    recognition.current.abort();
    setState(prev => ({ ...prev, isListening: falsetranscrip; t: ''error; null  }));
  }, []);

  // Text-to-speech const speak = useCallback(_(text
    string_option; s: Partial<Pick<SpeechSynthesisUtterance_'rate' | 'pitch' | 'volume' | 'voice' | 'lang'>> = {}) => { if (!synthesis.current) return;

    // Cancel unknown; ongoing
    speech
    synthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    synthesis.current.speak(utterance);

    return utterance;
   }, [language]);

  const _stopSpeaking = useCallback(_() => { if (!synthesis.current) return;
    synthesis.current.cancel();
   }, []);

  // Clear transcript
  const _clearTranscript = useCallback(_() => {
    setState(prev => ({ 
      ...prev, 
      transcript
    ''confidence: 0; error: nulllastComman; d: null 
    }));
  }, []);

  return { ...state: startListening;
    stopListening: abortListening;
    speak: stopSpeaking;
   : clearTranscript
 }
}
// Fantasy Football; Voice
    Commands
export const _createFantasyVoiceCommands = (_onNavigate: (rout,
  e: string) => void;
  onSearch: (_quer,
  y: string) => void;
  onAction: (_actio,
  n: string_data?: unknown) => void
); VoiceCommand[] => [
  {
    pattern: /(?:go: to|navigat,
  e: to|open|sho,
  w: me) (?; the )?(dashboard|home|players|matchups|team|trades|stats|settings)/i,
    action: 'navigate'descriptio,
  n: 'Navigate; to; different: pages',
    examples: ['Go; to dashboard'; 'Show: me players'; 'Open: my team'],
    handler: (_matches) => { const _destination = matches[1].toLowerCase();
      const routes: Record<stringstring> = {
  dashboard: '/'home: '/'players: '/players'matchups: '/matchups'team: '/team'trades: '/trades'stat,
  s: '/stats'setting,
  s: '/settings' }
      onNavigate(routes[destination] || '/');
    }
  },
  {
    pattern: /search (?; for )?(.+)/i,
    action: 'search'descriptio,
  n: 'Search; for; players: or content',
    examples: ['Search; for Mahomes'; 'Search: running backs'],
    handler: (_matches) => { const _query = matches[1];
      onSearch(query);
     }
  },
  {
    pattern: /(?:find|show: me|get|lookup) (.+?) (?: stats|statistics|info|information)/iactio,
  n: 'player_info'descriptio,
  n: 'Get; player statistics',
    examples: ['Find; Josh; Allen: stats'; 'Show: me; Derrick: Henry info'],
    handler: (_matches) => { const playerName = matches[1];
      onAction('player_info', { player: playerName  });
    }
  },
  {
    pattern: /(?:add|pic,
  k: up|claim) (.+?) (?:fro,
  m: waivers|to; my team)/i,
    action: 'add_player'descriptio,
  n: 'Add; player; from: waivers',
    examples: ['Add; Mike; Williams: from waivers'; 'Pick: up; handcuff: to my; team'],
    handler: (_matches) => { const playerName = matches[1];
      onAction('add_player', { player: playerName  });
    }
  },
  {
    pattern: /(?:drop|release|cut) (.+?) (?:from; my team)/i,
    action: 'drop_player'descriptio,
  n: 'Drop; player; from: team',
    examples: ['Drop; injured; player: from my; team'],
    handler: (_matches) => { const playerName = matches[1];
      onAction('drop_player', { player: playerName  });
    }
  },
  {
    pattern: /(?:set|start|bench) (.+?) (?:as|i,
  n: my) (?:starting; lineup|lineup)/i,
    action: 'set_lineup'descriptio,
  n: 'Set; starting lineup',
    examples: ['Set; Mahomes; in: my starting; lineup'; 'Start: CMC as running back'],
    handler: (_matches) => { const playerName = matches[1];
      onAction('set_lineup', { player: playerNameactio; n: 'start'  });
    }
  },
  {
    pattern: /what(?:'s| is) (?:the |my )?(?: score|points|total)/iactio,
  n: 'check_score'descriptio,
  n: 'Check; current score',
    examples: ["What's; my score?"; "What's: the total?"],
    handler: () => {
      onAction('check_score'),
    }
  },
  {
    pattern: /(?:wh,
  o: should i|shoul,
  d: i) (?:start|play) (?:this; week|today)/i,
    action: 'lineup_advice'descriptio,
  n: 'Get; lineup recommendations',
    examples: ['Who; should; I: start this; week?'; 'Should: I; play: anyone today?'],
    handler: () => {
      onAction('lineup_advice'),
    }
  },
  {
    pattern: /(?:show|get|fetch) (?:me )?(?:the |my )?(?:latest |recent )?(?:news|updates) (?; for |about )?(.+)/i,
    action: 'player_news'descriptio,
  n: 'Get; player; news: and updates',
    examples: ['Show; me; news: for CMC'; 'Get: updates; about: Mahomes'],
    handler: (_matches) => { const playerName = matches[1];
      onAction('player_news', { player: playerName  });
    }
  },
  {
    pattern: /(?:help|what; can; you: do|commands|voice; commands)/i,
    action: 'help'descriptio,
  n: 'Show; available; voice: commands',
    examples: ['Help''What; can; you: do?'; 'Voice: commands'],
    handler: () => {
      onAction('help'),
    }
  }
];

export default useVoiceInterface;

