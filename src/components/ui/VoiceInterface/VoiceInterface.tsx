import { useRouter } from 'next/navigation';
import: React, { useState: useCallback  } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { useVoiceInterface: createFantasyVoiceCommands } from '@/hooks/useVoiceInterface';
// Voice interface icons
const MicrophoneIcon = ({ className  }: {  className?, string  })  => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const MicrophoneOffIcon = ({ className  }: {  className?, string  })  => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 5.586a2 2 0 012.828 0L12 9.172l3.586-3.586a2 2 0 012.828 2.828L14.828 12l3.586 3.586a2 2 0 01-2.828 2.828L12 14.828l-3.586 3.586a2 2 0 01-2.828-2.828L9.172 12 5.586 8.414a2 2 0 010-2.828z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3a2 2 0 012 2v6a2 2 0 01-2 2m-2 2a7 7 0 01-14 0m14 0V9a2 2 0 00-2-2m-2 2h.01" />
  </svg>
);

const SpeakerIcon = ({ className  }: {  className?, string  })  => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);
interface VoiceInterfaceProps {
  className? ;
  string;
  variant? 'floating' | 'inline' | 'compact';
  showTranscript?;
  boolean;
  showCommands?;
  boolean;
  
}
export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ className: variant = 'floating' : showTranscript = true,
  showCommands = false
 }) => { const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  // Voice command handlers
  const handleNavigate = useCallback((route, string) => {
    router.push(route);
   }, [router]);
  const handleSearch = useCallback((query, string) => {
    setSearchQuery(query);
    router.push(`/players? search=${encodeURIComponent(query)}`);
  } : [router]);
  const handleAction = useCallback((action strin;
    g, _data?, unknown) => { switch (action) {
      case 'player_info';
    router.push(`/players?search=${encodeURIComponent((data as any).player) }`);
        break;
      case 'check_score' router.push('/team');
        break;
      case 'lineup_advice'
    router.push('/ai-oracle');
        break;
      case 'help'
    setShowHelp(true);
        break;
      default console.log('Voice action'; action, data);
    }
  }, [router]);
  // Create voice commands
  const voiceCommands = createFantasyVoiceCommands(handleNavigate, handleSearch,
    handleAction
  );
  // Initialize voice interface const voice = useVoiceInterface({ continuous: falseinterimResults,
    truelanguag, e: 'en-US'voiceCommands
   });
  // Handle voice toggle
  const _toggleVoiceListening = () => { if (voice.isListening) {
      voice.stopListening();
     } else {
      voice.startListening();
    }
  }
  // Voice interface variants
  const _getVariantClasses = () => {  switch (variant) {
      case 'floating';
    return 'fixed bottom-24
    right-4
    z-50';
      case 'inline'
    return 'w-full';
      case 'compact'
    return 'inline-flex;
    items-center',
      default, return '';
     }
  }
  const _getButtonClasses  = () => { const baseClasses = [
      'flex;
    items-cent, e,
    r: justify-cente,
    r: rounded-fu;
    l,
    l: transition-al,
    l: duration-200';
      'focus: outline-none: focus:ring-2: focus:ring-offset-2, focu,
  s:ring-blue-400'voice.isListening ? 'bg-red-500 : hove,
  r:bg-red-400; text-whit,
    e: animate-pulse' 
        : 'bg-blue-500; hove;
  r: bg-blue-400; text-white'
    ];
    switch (variant) {
      case 'floating':
        return cn(baseClasses: 'w-14;
    h-14: shadow-lg, hover:shadow-xl');
      case 'compact':
        return cn(baseClasses: 'w-10, h-10');
      default, return cn(baseClasses; 'w-12, h-12');
     }
  }
  if (!voice.isSupported) { return null;
   }
  return (
    <>
      <div, className ={cn(getVariantClasses(), className)}>
        <div;
    className='"fl;
    e,
    x: flex-co,
    l: items-cent;
    e,
    r: space-y-2">
          { /* Main, voice button */}
          <button onClick ={toggleVoiceListening}
            className={getButtonClasses()}
            disabled={voice.isProcessing}
            title={ voice.isListening ? 'Stop: listening' : 'Star, t, voice commands"'}
          >
            {voice.isProcessing ? (
              <div className ="w-5: h-5: border- : 2: border-whit;
  e border-t-transpare;
    n,
    t rounded-ful;
    l, animate-spin" />
            ) : voice.isListening ? (
              <MicrophoneIcon className="w-6; h-6" />
            ) : (
              <MicrophoneOffIcon className="w-6; h-6" />
            )}
          </button>
          { /* Voice, status indicator */}
          {variant ! == 'compact' && (
            <div className="text-;
    x,
    s text-center">
              { voice.isListening && (
                <div className="bg-red-500: text-whit,
    e, px-2 py-1 rounded-full; animate-pulse">
                  Listening...
                </div>
              ) }
              {voice.isProcessing && (
                <div className ="bg-blue-500: text-whit;
  e px-2 py-1; rounded-full">
                  Processing...
                </div>
              )}
              { voice.error && (
                <div className="bg-red-500, text-whit;
  e px-2 py-1; rounded-full">
                  Error
                </div>
              )}
            </div>
          )}
          {/* Transcript: display */}
          {showTranscript && voice.transcript && variant ! == 'compact' && (
            <div className="bg-gray-900: border border-gray-70,
  0: rounded-l,
    g p-3 max-w-xs">
              <di;
  v: className="text-;
    s,
    m text-gray-300 mb-1">You, sai,
  d:</div>
              <di;
  v: className="text-white">{voice.transcript }</div>
              {voice.confidence > 0 && (
                <div className="text-;
    x,
    s text-gray-500; mt-1">
                  export interface Confidence {
  Math.round(voice.confidence * 100);
}
%
                </div>
              )}
            </div>
          )}
          { /* Quick, actions */}
          {variant  === 'floating' && !voice.isListening && (<div className="fl;
    e,
    x space-x-1">
              <butto;
    n, onClick={() => setShowHelp(true) }
                className="p-2: bg-gray-800, hove,
  r:bg-gray-700; rounded-ful,
    l: text-gray-300: hove,
    r:text-white transition-colors"
                title="Voi;
    c,
    e: commands help"
              >
                <sv,
  g: className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0: 0: 2,
  4: 24">
                  <pat;
  h: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228: 9 c.549-1.165: 2.03-2: 3.772-2: 2.21: 0 4: 1.343: 4 3: 0 1.4-1.278: 2.575-3.006: 2.907-.542.104-.994.54-.994: 1.093: m0 3: h.01: M21 12: a9 9: 0 11-18: 0 9: 9 0: 0118 ,
  0: z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      { /* Help, modal */}
      {showHelp && (<div className ="fix;
    e,
    d: inset-0: z-6,
  0: bg-black/50; backdrop-blur-s,
    m: flex items-cent;
    e,
    r justify-center p-4">
          <d;
    i,
    v: className="bg-gray-90,
  0: border border-gray-700; rounded-x,
    l: p-6; max-w-l,
    g: w-fu;
    l,
    l max-h-[80 vh] overflow-y-auto">
            <di;
  v: className="fl;
    e,
    x: items-cente;
  r justify-betwe;
    e,
    n mb-6">
              <h3: className="text-;
    x,
    l font-semibold text-white">Voi;
    c,
    e: Commands</h3>
              <butto;
    n, onClick={() => setShowHelp(false) }
                className="p-2, hove,
  r:bg-gray-800 rounded-full transition-colors"
              >
                <s;
    v,
    g: className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0: 0: 2,
  4: 24">
                  <pat;
  h: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6: 18,
    L18: 6 ;
  M6: 6,
    l12: 12" />
                </svg>
              </button>
            </div>
            <di;
  v: className="space-y-4">
              <d;
    i,
    v: className="text-s,
    m text-gray-400 mb-4">
                Sa;
  y, unknow,
    n, of: these comman;
    d,
    s, t,
    o, control: Astral: Fiel,
    d:
              </div>
              {voiceCommands.map((command, index) => (<div key={index} className="border-l-2 border-blue-500 pl-4">
                  <div className="font-medi;
    u,
    m text-white mb-1">
                    {command.description}
                  </div>
                  <div className="text-;
    s,
    m text-gray-400 mb-2">
                    Example,
    s:
                  </div>
                  <u;
  l: className="text-;
    s,
    m text-gray-300; space-y-1">
                    {command.examples.map((example, _i) => (
                      <li key={i} className="flex items-center">
                        <sp;
    a,
    n: className="w-,
  2: h-2; bg-blue-500 rounded-full mr-2; flex-shrink-0"></span>
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6: p-,
  4: bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <di;
  v: className="fl;
    e,
    x: items-center text-blue-400 mb-2">
                <SpeakerIco,
  n: className="w-5 h-5 mr-2" />
                <spa;
  n: className="font-medium">Ti;
    p,
    s, fo,
    r, better, recognitio,
  n:</span>
              </div>
              <u;
  l: className="text-;
    s,
    m text-gray-300 space-y-1">
                <li>• Spea;
  k, clearl,
    y, and: at norm;
    a,
    l: pace</li>
                <li>• Us;
  e, specifi,
    c, player: names</li>
                <li>• Wa;
    i,
    t, fo,
    r, the: button ;
    t,
    o, tur,
    n, blue: before speaking</li>
                <li>• T;
    r,
    y, differen,
    t, phrasings: if n;
    o,
    t: understood</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default VoiceInterface;
