"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Minimize2, Maximize2, Crown, Send } from 'lucide-react';
import ChatSystem from './ChatSystem';

interface LeagueChatProps {
  leagueId: string;
  userId: string;
  username: string;
  isCommissioner?: boolean;
  className?: string;
}

export default function LeagueChat({ 
  leagueId, 
  userId, 
  username, 
  isCommissioner = false,
  className = "" 
}: LeagueChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // ToggleLeft minimize/maximize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setUnreadCount(0); // Reset unread when opening
    }
  };

  // Mobile responsive - hide on very small screens
  useEffect(() => {
    const handleResize = () => {
      setIsVisible(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {isMinimized ? (
        // Minimized state - floating button
        <div className="fixed bottom-6 right-6 z-50 md:relative md:bottom-auto md:right-auto">
          <button
            onClick={toggleMinimize}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden md:inline">League Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      ) : (
        // Expanded state
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">League Chat</h3>
              {isCommissioner && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">Commissioner</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <button
                onClick={toggleMinimize}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat System */}
          <div className="h-80">
            <ChatSystem
              leagueId={leagueId}
              userId={userId}
              username={username}
              isCommissioner={isCommissioner}
              className="h-full border-none shadow-none rounded-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}