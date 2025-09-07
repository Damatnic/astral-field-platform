"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, TrendingUp, TrendingDown, AlertTriangle,
  Target, Brain, BarChart3, Clock, Star, Shield,
  Zap, CheckCircle, XCircle, Info, RefreshCw,
  ThumbsUp, ThumbsDown, Eye, ArrowRight
} from 'lucide-react';

interface StartSitPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  gameTime: string;
  projection: number;
  confidence: number;
  recommendation: 'start' | 'sit' | 'bench' | 'flex';
  tier: 1 | 2 | 3 | 4 | 5;
  factors: RecommendationFactor[];
  alternativeOptions: Player[];
  riskLevel: 'low' | 'medium' | 'high';
  upside: 'low' | 'medium' | 'high';
  consistency: number;
  recentForm: number[];
  matchupHistory: MatchupHistory;
  weatherImpact?: 'positive' | 'neutral' | 'negative';
  injuryStatus?: string;
  newsImpact?: 'positive' | 'neutral' | 'negative';
}

interface RecommendationFactor {
  category: 'matchup' | 'volume' | 'redzone' | 'gameflow' | 'weather' | 'injury' | 'form' | 'coaching';
  impact: 'positive' | 'neutral' | 'negative';
  weight: number;
  description: string;
  dataPoints: string[];
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  projection: number;
}

interface MatchupHistory {
  vsOpponent: {
    games: number;
    avgPoints: number;
    lastMeeting: number;
  };
  vsDefenseRank: number;
  targetShare?: number;
  redZoneTargets?: number;
}

interface StartSitRecommendationsProps {
  leagueId: string;
  teamId: string;
  week: number;
  rosterPlayers: StartSitPlayer[];
  className?: string;
}

const MOCK_PLAYERS: StartSitPlayer[] = [
  {
    id: 'tyreek-hill',
    name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    opponent: '@ BUF',
    gameTime: '1:00 PM ET',
    projection: 18.7,
    confidence: 85,
    recommendation: 'start',
    tier: 1,
    riskLevel: 'medium',
    upside: 'high',
    consistency: 78,
    recentForm: [28.4, 14.2, 22.1, 8.7, 31.5],
    matchupHistory: {
      vsOpponent: { games: 4, avgPoints: 19.3, lastMeeting: 24.1 },
      vsDefenseRank: 12,
      targetShare: 28.5,
      redZoneTargets: 8
    },
    weatherImpact: 'neutral',
    alternativeOptions: [],
    factors: [
      {
        category: 'matchup',
        impact: 'positive',
        weight: 0.8,
        description: 'Buffalo allows 17.2 fantasy points per game to WRs',
        dataPoints: ['#12 vs WR', '245 YPG allowed', '18 TDs allowed']
      },
      {
        category: 'volume',
        impact: 'positive',
        weight: 0.9,
        description: 'Elite target share and air yards',
        dataPoints: ['28.5% target share', '142 air yards/game', '9.8 targets/game']
      },
      {
        category: 'form',
        impact: 'positive',
        weight: 0.7,
        description: 'Strong recent performances with 20+ points in 3 of last 5',
        dataPoints: ['20.4 avg last 5', '3 games 20+', '1 game 30+']
      }
    ]
  },
  {
    id: 'dj-moore',
    name: 'DJ Moore',
    position: 'WR',
    team: 'CHI',
    opponent: 'vs GB',
    gameTime: '1:00 PM ET',
    projection: 12.4,
    confidence: 65,
    recommendation: 'sit',
    tier: 3,
    riskLevel: 'high',
    upside: 'medium',
    consistency: 52,
    recentForm: [8.3, 15.7, 6.1, 19.2, 4.8],
    matchupHistory: {
      vsOpponent: { games: 6, avgPoints: 11.8, lastMeeting: 8.3 },
      vsDefenseRank: 5,
      targetShare: 22.1,
      redZoneTargets: 3
    },
    weatherImpact: 'negative',
    injuryStatus: 'questionable',
    alternativeOptions: [
      { id: 'rome-odunze', name: 'Rome Odunze', position: 'WR', team: 'CHI', projection: 9.2 },
      { id: 'keenan-allen', name: 'Keenan Allen', position: 'WR', team: 'CHI', projection: 10.8 }
    ],
    factors: [
      {
        category: 'matchup',
        impact: 'negative',
        weight: 0.8,
        description: 'Green Bay has elite pass defense ranking #5 vs WRs',
        dataPoints: ['#5 vs WR', '12.8 PPG allowed', '0.85 TDs/game']
      },
      {
        category: 'form',
        impact: 'negative',
        weight: 0.7,
        description: 'Inconsistent recent performances with boom/bust profile',
        dataPoints: ['10.4 avg last 5', '40% games <10 pts', 'High volatility']
      },
      {
        category: 'injury',
        impact: 'negative',
        weight: 0.9,
        description: 'Listed as questionable with ankle injury',
        dataPoints: ['Limited practice Wed', 'Ankle concern', 'Game-time decision']
      }
    ]
  },
  {
    id: 'tank-dell',
    name: 'Tank Dell',
    position: 'WR',
    team: 'HOU',
    opponent: '@ IND',
    gameTime: '1:00 PM ET',
    projection: 14.2,
    confidence: 72,
    recommendation: 'flex',
    tier: 2,
    riskLevel: 'medium',
    upside: 'high',
    consistency: 68,
    recentForm: [18.7, 9.3, 21.4, 12.1, 16.8],
    matchupHistory: {
      vsOpponent: { games: 2, avgPoints: 15.6, lastMeeting: 18.7 },
      vsDefenseRank: 18,
      targetShare: 19.3,
      redZoneTargets: 5
    },
    weatherImpact: 'neutral',
    newsImpact: 'positive',
    alternativeOptions: [
      { id: 'nico-collins', name: 'Nico Collins', position: 'WR', team: 'HOU', projection: 16.3 }
    ],
    factors: [
      {
        category: 'matchup',
        impact: 'positive',
        weight: 0.7,
        description: 'Indianapolis struggles against slot receivers',
        dataPoints: ['#18 vs WR', '15.4 slot PPG', 'Poor slot coverage']
      },
      {
        category: 'gameflow',
        impact: 'positive',
        weight: 0.8,
        description: 'Expected shootout with high passing volume',
        dataPoints: ['O/U 47.5', 'Expected trailing', '35+ pass attempts']
      },
      {
        category: 'redzone',
        impact: 'positive',
        weight: 0.6,
        description: 'Growing red zone usage in recent weeks',
        dataPoints: ['5 RZ targets L3', 'Goal line looks', 'TD upside']
      }
    ]
  }
];

export default function StartSitRecommendations({ 
  leagueId, 
  teamId, 
  week,
  rosterPlayers,
  className = "" 
}: StartSitRecommendationsProps) {
  const [players, setPlayers] = useState<StartSitPlayer[]>(MOCK_PLAYERS);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'projection' | 'confidence' | 'tier'>('confidence');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<Record<string, 'helpful' | 'not-helpful'>>({});

  const positions = ['all', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];

  useEffect(() => {
    // In production, fetch recommendations from API
    // fetchRecommendations();
  }, [leagueId, teamId, week]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // setPlayers(apiResponse);
    } catch (error) {
      console.error('❌ Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players
    .filter(player => selectedPosition === 'all' || player.position === selectedPosition)
    .sort((a, b) => {
      switch (sortBy) {
        case 'projection':
          return b.projection - a.projection;
        case 'confidence':
          return b.confidence - a.confidence;
        case 'tier':
          return a.tier - b.tier;
        default:
          return 0;
      }
    });

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'start':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sit':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'bench':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'flex':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'start':
        return <Play className="h-4 w-4" />;
      case 'sit':
        return <Pause className="h-4 w-4" />;
      case 'bench':
        return <XCircle className="h-4 w-4" />;
      case 'flex':
        return <Target className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUpsideColor = (upside: string) => {
    switch (upside) {
      case 'low':
        return 'text-gray-600';
      case 'medium':
        return 'text-blue-600';
      case 'high':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFactorIcon = (category: string) => {
    switch (category) {
      case 'matchup':
        return <Target className="h-4 w-4" />;
      case 'volume':
        return <BarChart3 className="h-4 w-4" />;
      case 'form':
        return <TrendingUp className="h-4 w-4" />;
      case 'injury':
        return <AlertTriangle className="h-4 w-4" />;
      case 'weather':
        return <Shield className="h-4 w-4" />;
      case 'gameflow':
        return <Zap className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleFeedback = (playerId: string, feedback: 'helpful' | 'not-helpful') => {
    setUserFeedback(prev => ({ ...prev, [playerId]: feedback }));
    // In production, send to API
  };

  const toggleExpanded = (playerId: string) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse ${className}`}>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Start/Sit Recommendations
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered lineup decisions for Week {week}
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>
                  {pos === 'all' ? 'All Positions' : pos}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="confidence">Confidence</option>
              <option value="projection">Projection</option>
              <option value="tier">Tier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(player.recommendation)}`}>
                      {getRecommendationIcon(player.recommendation)}
                      <span className="ml-1 capitalize">{player.recommendation}</span>
                    </span>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {player.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{player.position} - {player.team}</span>
                        <span>•</span>
                        <span>{player.opponent}</span>
                        <span>•</span>
                        <span>{player.gameTime}</span>
                        
                        {player.injuryStatus && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {player.injuryStatus}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Projection</span>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {player.projection.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Confidence</span>
                    <div className="text-xl font-bold text-blue-600">
                      {player.confidence}%
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Risk Level</span>
                    <div className={`text-lg font-semibold capitalize ${getRiskColor(player.riskLevel)}`}>
                      {player.riskLevel}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Upside</span>
                    <div className={`text-lg font-semibold capitalize ${getUpsideColor(player.upside)}`}>
                      {player.upside}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tier</span>
                    <div className="text-xl font-bold text-purple-600">
                      {player.tier}
                    </div>
                  </div>
                </div>

                {/* Top Factors (Always Visible) */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Factors:</h4>
                  <div className="space-y-2">
                    {player.factors.slice(0, 2).map((factor, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${
                          factor.impact === 'positive' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                          factor.impact === 'negative' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {getFactorIcon(factor.category)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {factor.description}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          factor.impact === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          factor.impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : '•'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternative Options */}
                {player.alternativeOptions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Consider Instead:</h4>
                    <div className="flex flex-wrap gap-2">
                      {player.alternativeOptions.map((alt, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {alt.name}
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {alt.projection.toFixed(1)} proj
                          </span>
                          <ArrowRight className="h-3 w-3 text-blue-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={() => toggleExpanded(player.id)}
                  className="flex items-center px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {expandedPlayer === player.id ? 'Less' : 'More'} Details
                </button>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Helpful?</span>
                  <button
                    onClick={() => handleFeedback(player.id, 'helpful')}
                    className={`p-1 rounded ${
                      userFeedback[player.id] === 'helpful' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleFeedback(player.id, 'not-helpful')}
                    className={`p-1 rounded ${
                      userFeedback[player.id] === 'not-helpful' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedPlayer === player.id && (
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* All Factors */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Analysis</h4>
                    <div className="space-y-3">
                      {player.factors.map((factor, index) => (
                        <div key={index} className="border dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getFactorIcon(factor.category)}
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {factor.category}
                              </span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              factor.impact === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              factor.impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              Weight: {(factor.weight * 100).toFixed(0)}%
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {factor.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {factor.dataPoints.map((point, idx) => (
                              <span key={idx} className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matchup History & Stats */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Matchup History</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">vs {player.opponent}</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {player.matchupHistory.vsOpponent.avgPoints.toFixed(1)} avg
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last: {player.matchupHistory.vsOpponent.lastMeeting.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Defense Rank</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            #{player.matchupHistory.vsDefenseRank}
                          </div>
                        </div>
                        {player.matchupHistory.targetShare && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Target Share</span>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {player.matchupHistory.targetShare.toFixed(1)}%
                            </div>
                          </div>
                        )}
                        {player.matchupHistory.redZoneTargets && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">RZ Targets</span>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {player.matchupHistory.redZoneTargets}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Form */}
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Recent Form</h5>
                      <div className="flex items-center space-x-2">
                        {player.recentForm.map((points, idx) => (
                          <div key={idx} className={`px-2 py-1 rounded text-xs font-medium ${
                            points >= 20 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            points >= 15 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            points >= 10 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {points.toFixed(1)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No recommendations available for the selected filters.</p>
        </div>
      )}
    </div>
  );
}