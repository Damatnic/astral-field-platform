import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { useVoiceInterface, createFantasyVoiceCommands } from '@/hooks/useVoiceInterface';

// Voice interface icons
const MicrophoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const MicrophoneOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 5.586a2 2 0 012.828 0L12 9.172l3.586-3.586a2 2 0 012.828 2.828L14.828 12l3.586 3.586a2 2 0 01-2.828 2.828L12 14.828l-3.586 3.586a2 2 0 01-2.828-2.828L9.172 12 5.586 8.414a2 2 0 010-2.828z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3a2 2 0 012 2v6a2 2 0 01-2 2m-2 2a7 7 0 01-14 0m14 0V9a2 2 0 00-2-2m-2 2h.01" />
  </svg>
);

const SpeakerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

interface VoiceInterfaceProps {
  className?: string;
  variant?: 'floating' | 'inline' | 'compact';
  showTranscript?: boolean;
  showCommands?: boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  className,
  variant = 'floating',
  showTranscript = true,
  showCommands = false
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Voice command handlers
  const handleNavigate = useCallback((route: string) => {
    router.push(route);
  }, [router]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    router.push(`/players?search=${encodeURIComponent(query)}`);
  }, [router]);

  const handleAction = useCallback((action: string, data?: any) => {
    switch (action) {
      case 'player_info':
        router.push(`/players?search=${encodeURIComponent(data.player)}`);
        break;
      case 'check_score':
        router.push('/team');
        break;
      case 'lineup_advice':
        router.push('/ai-oracle');
        break;
      case 'help':
        setShowHelp(true);
        break;
      default:
        console.log('Voice action:', action, data);
    }
  }, [router]);

  // Create voice commands
  const voiceCommands = createFantasyVoiceCommands(
    handleNavigate,
    handleSearch,
    handleAction
  );

  // Initialize voice interface
  const voice = useVoiceInterface({
    continuous: false,
    interimResults: true,
    language: 'en-US',
    voiceCommands
  });

  // Handle voice toggle
  const toggleVoiceListening = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  // Voice interface variants
  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return 'fixed bottom-24 right-4 z-50';
      case 'inline':
        return 'w-full';
      case 'compact':
        return 'inline-flex items-center';
      default:
        return '';
    }
  };

  const getButtonClasses = () => {
    const baseClasses = [
      'flex items-center justify-center rounded-full transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400',
      voice.isListening 
        ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse' 
        : 'bg-blue-500 hover:bg-blue-400 text-white'
    ];

    switch (variant) {
      case 'floating':
        return cn(baseClasses, 'w-14 h-14 shadow-lg hover:shadow-xl');
      case 'compact':
        return cn(baseClasses, 'w-10 h-10');
      default:
        return cn(baseClasses, 'w-12 h-12');
    }
  };

  if (!voice.isSupported) {
    return null;
  }

  return (
    <>
      <div className={cn(getVariantClasses(), className)}>
        <div className="flex flex-col items-center space-y-2">
          {/* Main voice button */}
          <button
            onClick={toggleVoiceListening}
            className={getButtonClasses()}
            disabled={voice.isProcessing}
            title={voice.isListening ? 'Stop listening' : 'Start voice commands'}
          >
            {voice.isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : voice.isListening ? (
              <MicrophoneIcon className="w-6 h-6" />
            ) : (
              <MicrophoneOffIcon className="w-6 h-6" />
            )}
          </button>

          {/* Voice status indicator */}
          {variant !== 'compact' && (
            <div className="text-xs text-center">
              {voice.isListening && (
                <div className="bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                  Listening...
                </div>
              )}
              {voice.isProcessing && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full">
                  Processing...
                </div>
              )}
              {voice.error && (
                <div className="bg-red-500 text-white px-2 py-1 rounded-full">
                  Error
                </div>
              )}
            </div>
          )}

          {/* Transcript display */}
          {showTranscript && voice.transcript && variant !== 'compact' && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 max-w-xs">
              <div className="text-sm text-gray-300 mb-1">You said:</div>
              <div className="text-white">{voice.transcript}</div>
              {voice.confidence > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(voice.confidence * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          {variant === 'floating' && !voice.isListening && (
            <div className="flex space-x-1">
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors"
                title="Voice commands help"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Voice Commands</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Say any of these commands to control Astral Field:
              </div>

              {voiceCommands.map((command, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <div className="font-medium text-white mb-1">
                    {command.description}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    Examples:
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {command.examples.map((example, i) => (
                      <li key={i} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center text-blue-400 mb-2">
                <SpeakerIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">Tips for better recognition:</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Speak clearly and at normal pace</li>
                <li>• Use specific player names</li>
                <li>• Wait for the button to turn blue before speaking</li>
                <li>• Try different phrasings if not understood</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceInterface;