"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, TrendingUp, TrendingDown, AlertTriangle,
  Calendar, Users, Trophy, BarChart3, Activity, Clock,
  Heart, MessageCircle, Share, Bell, BellOff, Plus, Minus
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import PlayerNewsPanel from '@/components/player/PlayerNewsPanel';

interface PlayerDetailPageProps {
  params: Promise<{ id: string }>;
}

interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: string;
  college: string;
  experience: number;
  injuryStatus: string;
  byeWeek: number;
  
  // Ownership data
  percentOwned: number;
  percentStarted: number;
  adp: number;
  
  // Season stats
  seasonStats: {
    gamesPlayed: number;
    totalPoints: number;
    avgPoints: number;
    highScore: number;
    lowScore: number;
    consistency: number;
    [key: string]: unknown;
  };
  
  // Performance trends
  weeklyScores: {
    week: number;
    points: number;
    opponent: string;
    projected: number;
  }[];
  
  // Recent games
  recentGames: {
    week: number;
    opponent: string;
    points: number;
    projected: number;
    result: 'win' | 'loss' | 'tie';
  }[];
  
  // Rankings
  rankings: {
    overall: number;
    position: number;
    halfPpr: number;
    ppr: number;
    ros: number; // Rest of season
  };
  
  // Advanced metrics
  advancedStats: {
    targetShare?: number;
    redZoneTargets?: number;
    snapCount?: number;
    completionPercentage?: number;
    touchdownRate?: number;
    strengthOfSchedule: number;
  };
  
  // News count
  newsCount: {
    total: number;
    breaking: number;
    lastUpdate: Date;
  };
}

const MOCK_PLAYER: PlayerProfile = {
  id: 'cmc',
  name: 'Christian McCaffrey',
  position: 'RB',
  team: 'SF',
  age: 27,
  height: '5\'11"',
  weight: '205 lbs',
  college: 'Stanford',
  experience: 7,
  injuryStatus: 'out',
  byeWeek: 9,
  
  percentOwned: 99.8,
  percentStarted: 97.2,
  adp: 1.2,
  
  seasonStats: {
    gamesPlayed: 8,
    totalPoints: 180.4,
    avgPoints: 22.55,
    highScore: 31.2,
    lowScore: 14.8,
    consistency: 85.2
  },
  
  weeklyScores: [
    { week: 1, points: 24.6, opponent: 'vs PIT', projected: 20.5 },
    { week: 2, points: 18.3, opponent: '@ MIN', projected: 22.1 },
    { week: 3, points: 31.2, opponent: 'vs NYG', projected: 21.8 },
    { week: 4, points: 19.7, opponent: '@ AZ', projected: 23.2 },
    { week: 5, points: 26.1, opponent: 'vs DAL', projected: 24.5 },
    { week: 6, points: 22.8, opponent: '@ SEA', projected: 19.8 },
    { week: 7, points: 23.9, opponent: 'vs KC', projected: 25.1 },
    { week: 8, points: 14.8, opponent: '@ LAR', projected: 21.3 }
  ],
  
  recentGames: [
    { week: 8, opponent: '@ LAR', points: 14.8, projected: 21.3, result: 'loss' },
    { week: 7, opponent: 'vs KC', points: 23.9, projected: 25.1, result: 'win' },
    { week: 6, opponent: '@ SEA', points: 22.8, projected: 19.8, result: 'win' }
  ],
  
  rankings: {
    overall: 1,
    position: 1,
    halfPpr: 1,
    ppr: 1,
    ros: 3
  },
  
  advancedStats: {
    snapCount: 89.5,
    touchdownRate: 12.4,
    strengthOfSchedule: 0.52
  },
  
  newsCount: {
    total: 12,
    breaking: 2,
    lastUpdate: new Date()
  }
};

export default function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string>("");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats & Trends' },
    { id: 'news', label: 'News & Updates' },
    { id: 'schedule', label: 'Schedule' }
  ];

  useEffect(() => {
    params.then((resolved) => {
      setPlayerId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (playerId) {
      // In production, fetch from API
      setTimeout(() => {
        setPlayer(MOCK_PLAYER);
        setLoading(false);
      }, 500);
    }
  }, [playerId]);

  const toggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    // In production, save to backend
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In production, save notification preference
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RB': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'WR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'TE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getInjuryStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'text-green-600';
      case 'questionable': return 'text-yellow-600';
      case 'doubtful': return 'text-orange-600';
      case 'out': return 'text-red-600';
      case 'ir': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">
            {error || 'Player not found'}
          </div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Player Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {player.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {player.name}
                    </h1>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                      {player.team}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Age: {player.age}</span>
                    <span>•</span>
                    <span>{player.height}, {player.weight}</span>
                    <span>•</span>
                    <span>{player.college}</span>
                    <span>•</span>
                    <span>{player.experience} years exp</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-sm font-medium ${getInjuryStatusColor(player.injuryStatus)}`}>
                      Status: {player.injuryStatus.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Bye Week: {player.byeWeek}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleWatchlist}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    isWatchlisted
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Star className={`h-4 w-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                  <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
                </button>

                <button
                  onClick={toggleNotifications}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    notificationsEnabled
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  <span>Notifications</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {player.seasonStats.avgPoints.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  #{player.rankings.overall}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Overall Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {player.percentOwned.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {player.adp.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ADP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {player.newsCount.total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">News Items</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'news' && player.newsCount.breaking > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs">
                      {player.newsCount.breaking}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Performance Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Weekly Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={player.weeklyScores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="points" stroke="#8884d8" name="Actual Points" />
                      <Line type="monotone" dataKey="projected" stroke="#82ca9d" strokeDasharray="5 5" name="Projected" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent Games */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Games
                  </h3>
                  <div className="space-y-3">
                    {player.recentGames.map((game, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Week {game.week}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {game.opponent}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {game.points.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              vs {game.projected.toFixed(1)} proj
                            </div>
                          </div>
                          
                          <div className={`w-3 h-3 rounded-full ${
                            game.points >= game.projected ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'news' && (
              <PlayerNewsPanel
                playerId={player.id}
                playerName={player.name}
                position={player.position}
                team={player.team}
                className="h-full"
              />
            )}

            {/* Other tabs content can be added here */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rankings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                Rankings
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall</span>
                  <span className="font-semibold text-gray-900 dark:text-white">#{player.rankings.overall}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Position</span>
                  <span className="font-semibold text-gray-900 dark:text-white">#{player.rankings.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Half PPR</span>
                  <span className="font-semibold text-gray-900 dark:text-white">#{player.rankings.halfPpr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Full PPR</span>
                  <span className="font-semibold text-gray-900 dark:text-white">#{player.rankings.ppr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rest of Season</span>
                  <span className="font-semibold text-gray-900 dark:text-white">#{player.rankings.ros}</span>
                </div>
              </div>
            </div>

            {/* Season Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                Season Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Games Played</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{player.seasonStats.gamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Points</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{player.seasonStats.totalPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">High Score</span>
                  <span className="font-semibold text-green-600">{player.seasonStats.highScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Low Score</span>
                  <span className="font-semibold text-red-600">{player.seasonStats.lowScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Consistency</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{player.seasonStats.consistency.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Compact News Panel - only if not on news tab */}
            {activeTab !== 'news' && (
              <PlayerNewsPanel
                playerId={player.id}
                playerName={player.name}
                position={player.position}
                team={player.team}
                compact={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}