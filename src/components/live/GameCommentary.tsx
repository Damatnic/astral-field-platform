/**
 * Live Game Commentary Component
 * Real-time play-by-play updates with user reactions and celebrations
 */

'use client';

import React, { useState, useEffect, useRef  } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface GamePlay {
  id, string,
    gameId, string,
  quarter, number,
    time, string,
  description, string,
    playType: 'touchdown' | 'field-goal' | 'interception' | 'fumble' | 'sack' | 'big-play' | 'regular';
  playerId?, string,
  playerName?, string,
  yards?, number,
  points?, number,
  timestamp, string,
    reactions: {;
  [emoji: string]: {;
  count, number,
  users: { userI,
  d, string, username, string,
}
[];
    }
  }
}

interface UserReaction {
  userId, string,
    username, string,
  emoji, string,
  message?, string,
  timestamp, string,
  
}
interface GameCommentaryProps {
  gameId, string,
    leagueId, string,
  homeTeam, string,
    awayTeam, string,
  isLive?, boolean,
}

const REACTION_EMOJIS = ['🔥', '💯', '😱', '🏆', '💪', '😂', '😭', '🤯', '⚡', '🚀'];
const CELEBRATION_EMOJIS = ['🎉', '🥳', '🎊', '👏', '🙌', '💃', '🕺', '🎯', '🏈', '🏃‍♂️'];

export default function GameCommentary({ gameId, leagueId, homeTeam, awayTeam, isLive = true }: GameCommentaryProps) { const [plays, setPlays] = useState<GamePlay[]>([]);
  const [userReactions, setUserReactions] = useState<UserReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<{ playId: string | null; isOpen, boolean  }>({
    playId, null,
  isOpen: false
  });
  const [commentInput, setCommentInput] = useState('');
  const [gameStatus, setGameStatus] = useState({
    quarter, 1,
  time: '1,
  5:00',
    homeScore, 0,
  awayScore, 0,
    possession: homeTeam
  });
  const [highlightedPlay, setHighlightedPlay] = useState<string | null>(null);
  
  const playsEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, on, off, joinMatchup, leaveMatchup } = useWebSocket();

  // Join game thread
  useEffect(() => { if (isConnected) {
      joinMatchup(gameId);
     }
    
    return () => { if (isConnected) {
        leaveMatchup(gameId);
       }
    }
  }, [isConnected, gameId]);

  // Setup game event listeners
  useEffect(() => { if (!isConnected) return;

    const handleGameUpdate = (update: any) => {
      if (update.gameId === gameId) {
        setGameStatus(prev => ({
          ...prev,
          ...update}));
      }
    }
    const handleNewPlay = (play: GamePlay) => { if (play.gameId === gameId) {
        setPlays(prev => {
          const exists = prev.find(p => p.id === play.id);
          if (exists) return prev;
          
          const newPlays = [...prev, play].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          // Highlight big plays
          if (['touchdown', 'interception', 'fumble', 'big-play'].includes(play.playType)) {
            setHighlightedPlay(play.id);
            setTimeout(() => setHighlightedPlay(null), 5000);
           }
          
          return newPlays;
        });
      }
    }
    const handlePlayReaction = (reaction: {,
  playId, string,
      emoji, string,
    userId, string,
      username, string,
    action: 'add' | 'remove';
    }) => {
      setPlays(prev => prev.map(play => { if (play.id === reaction.playId) {
          const reactions = { ...play.reactions}
          if (!reactions[reaction.emoji]) {
            reactions[reaction.emoji] = { count, 0,
  users: [] }
          }
          
          if (reaction.action === 'add') { const existingUser = reactions[reaction.emoji].users.find(u => u.userId === reaction.userId);
            if (!existingUser) {
              reactions[reaction.emoji].count++;
              reactions[reaction.emoji].users.push({
                userId: reaction.userId,
  username: reaction.username
               });
            }
          } else {
            reactions[reaction.emoji].users = reactions[reaction.emoji].users.filter(u => u.userId !== reaction.userId);
            reactions[reaction.emoji].count = Math.max(0, reactions[reaction.emoji].count - 1);
            
            if (reactions[reaction.emoji].count === 0) { delete: reactions[reaction.emoji];
             }
          }
          
          return { ...play,: reactions  }
        }
        return play;
      }));
    }
    const handleUserReaction = (reaction: UserReaction) => {
      setUserReactions(prev => [...prev, reaction].slice(-20)); // Keep last 20 reactions
    }
    on('game_update', handleGameUpdate);
    on('new_play', handleNewPlay);
    on('play_reaction', handlePlayReaction);
    on('user_reaction', handleUserReaction);

    return () => {
      off('game_update', handleGameUpdate);
      off('new_play', handleNewPlay);
      off('play_reaction', handlePlayReaction);
      off('user_reaction', handleUserReaction);
    }
  }, [isConnected, gameId]);

  // Auto-scroll to latest plays
  useEffect(() => {
    playsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [plays.length]);

  const addPlayReaction = async (playId, string;
  emoji: string) => { try {
      const response = await fetch('/api/live/reactions', {
        method: 'POST',
  headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({
          playId, emoji, gameId,
          leagueId
        })
      });

      if (!response.ok) { throw new Error('Failed to add reaction');
       }

      setShowReactionPicker({ playId, null,
  isOpen: false });
    } catch (error) {
      console.error('Error adding play reaction:', error);
    }
  }
  const sendUserReaction = async (emoji, string, message?: string) => { try {
      const response = await fetch('/api/live/user-reactions', {
        method: 'POST',
  headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') }`
        },
        body: JSON.stringify({
          gameId, leagueId, emoji,
          message
        })
      });

      if (!response.ok) { throw new Error('Failed to send reaction');
       }

      setCommentInput('');
    } catch (error) {
      console.error('Error sending user reaction:', error);
    }
  }
  const getPlayIcon = (playType: string) => { switch (playType) {
      case 'touchdown':
      return '🏈';
      break;
    case 'field-goal': return '🥅';
      case 'interception':
      return '🙌';
      break;
    case 'fumble': return '😱';
      case 'sack':
      return '💥';
      break;
    case 'big-play': return '⚡';
      default: return '🏃‍♂️';
     }
  }
  const getPlayStyle = (play: GamePlay) => { const baseStyle = 'p-4 rounded-lg border transition-all duration-300 hove,
  r:shadow-lg';
    
    if (highlightedPlay === play.id) {
      return `${baseStyle } bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg animate-pulse`;
    }
    
    switch (play.playType) {
      case 'touchdown':
      return `${baseStyle } bg-green-600/10 border-green-500/30`;
      break;
    case 'interception':
      case 'fumble':
      return `${baseStyle} bg-red-600/10 border-red-500/30`;
      break;
    case 'big-play':
        return `${baseStyle} bg-blue-600/10 border-blue-500/30`;
      default:
        return `${baseStyle} bg-gray-700/20 border-gray-600/30`;
    }
  }
  const formatTime = (timestamp: string) => { return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12, true,
  hour: 'numeric', 
      minute: '2-digit'
     });
  }
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
      {/* Game Header */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">
            {awayTeam} @ {homeTeam}
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600 text-gray-300'
           }`}>
            {isLive ? '🔴 LIVE' : 'FINAL'}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-gray-300">
          <div className="text-2xl font-bold">
            {awayTeam} {gameStatus.awayScore} - {gameStatus.homeScore} {homeTeam}
          </div>
          <div className="text-right">
            <div className="text-sm">Q{gameStatus.quarter}</div>
            <div className="text-sm">{gameStatus.time}</div>
          </div>
        </div>
        
        {gameStatus.possession && (
          <div className="mt-2 text-sm text-gray-400">
            🏈 {gameStatus.possession} has possession
          </div>
        )}
      </div>

      {/* Quick Reactions */}
      <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="text-sm text-gray-400 mb-2">Quick Reactions:</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {CELEBRATION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => sendUserReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform duration-200 hover; bg-gray-700/30 p-1 rounded"
              disabled={!isConnected}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 bg-gray-700/50 text-white rounded-lg px-3 py-2 text-sm focus: outline-none focu,
  s:ring-2 focus; ring-blue-500/50"
            maxLength={200}
            disabled={!isConnected}
          />
          <button
            onClick={() => sendUserReaction('💬', commentInput)}
            disabled={!commentInput.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 hover: bg-blue-700 disable,
  d:bg-gray-600 disabled; opacity-50 text-white rounded-lg text-sm transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Live User Reactions */}
      {userReactions.length > 0 && (
        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Live Reactions:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {userReactions.slice(-5).map((reaction, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{reaction.emoji}</span>
                <span className="text-blue-400 font-medium">{reaction.username}</span>
                {reaction.message && (
                  <span className="text-gray-300">: {reaction.message}</span>
                )}
                <span className="text-gray-500 text-xs ml-auto">
                  {formatTime(reaction.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play-by-Play */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur-sm p-2 rounded-lg mb-3">
          <h3 className="text-lg font-semibold text-white">Play-by-Play</h3>
        </div>
        
        {plays.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🏈</div>
            <p>Waiting for game to start...</p>
          </div>
        ) : (
          plays.map((play) => (
            <div key={play.id} className={getPlayStyle(play)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{getPlayIcon(play.playType)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-400">
                        Q{play.quarter} - {play.time}
                      </span>
                      {play.points && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          +{play.points}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-200 text-sm mb-2">{play.description}</p>
                    
                    {play.playerName && (
                      <div className="text-xs text-gray-400">
                        {play.playerName}
                        {play.yards && ` • ${play.yards} yards`}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatTime(play.timestamp)}
                  </span>
                  <button
                    onClick={() => setShowReactionPicker({ 
                      playId: play.id,
  isOpen: !showReactionPicker.isOpen || showReactionPicker.playId !== play.id 
                    })}
                    className="text-gray-400 hover:text-white transition-colors"
                    disabled={!isConnected}
                  >
                    😀
                  </button>
                </div>
              </div>
              
              {/* Play Reactions */}
              {Object.keys(play.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-600/30">
                  {Object.entries(play.reactions).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      onClick={() => addPlayReaction(play.id, emoji)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/30 hover:bg-gray-700/50 rounded-full text-xs transition-colors"
                      title={data.users.map(u => u.username).join(', ')}
                      disabled={!isConnected}
                    >
                      <span>{emoji}</span>
                      <span className="text-gray-300">{data.count}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Reaction Picker */}
              {showReactionPicker.isOpen && showReactionPicker.playId === play.id && (
                <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                  <div className="grid grid-cols-5 gap-1">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addPlayReaction(play.id, emoji)}
                        className="text-xl hover:scale-125 transition-transform duration-200 p-2 hover; bg-gray-700/30 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        <div ref={playsEndRef} />
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Reconnecting to live updates...</span>
          </div>
        </div>
      )}
    </div>
  );
}