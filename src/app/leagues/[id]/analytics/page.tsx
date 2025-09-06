'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Trophy, Target, Activity, Users, DollarSign, Calendar, ArrowLeft } from 'lucide-react';

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [leagueId, setLeagueId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({});
  const [timeframe, setTimeframe] = useState('season');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Trophy },
    { id: 'trends', label: 'Player Trends', icon: TrendingUp },
    { id: 'matchups', label: 'Matchups', icon: Target },
    { id: 'trades', label: 'Trade Analysis', icon: DollarSign },
    { id: 'draft', label: 'Draft Review', icon: Users }
  ];

  // Resolve params
  useEffect(() => {
    params.then(resolved => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (leagueId && user.id) {
      loadAnalytics();
    }
  }, [user, router, leagueId, timeframe]);

  const loadAnalytics = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const teamId = `team_${user.id}`;
      
      const [performance, trends, standings, matchups, trades, draft] = await Promise.all([
        fetch(`/api/analytics?type=team-performance&leagueId=${leagueId}&teamId=${teamId}&timeframe=${timeframe}`),
        fetch(`/api/analytics?type=player-trends&leagueId=${leagueId}&timeframe=${timeframe}`),
        fetch(`/api/analytics?type=league-standings&leagueId=${leagueId}`),
        fetch(`/api/analytics?type=matchup-history&leagueId=${leagueId}&teamId=${teamId}`),
        fetch(`/api/analytics?type=trade-analysis&leagueId=${leagueId}&timeframe=${timeframe}`),
        fetch(`/api/analytics?type=draft-analysis&leagueId=${leagueId}`)
      ]);

      const data = await Promise.all([
        performance.json(),
        trends.json(),
        standings.json(),
        matchups.json(),
        trades.json(),
        draft.json()
      ]);

      setAnalytics({
        performance: data[0].data,
        trends: data[1].data,
        standings: data[2].data,
        matchups: data[3].data,
        trades: data[4].data,
        draft: data[5].data
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!analytics.performance) return null;

    const { stats, positionBreakdown, trends } = analytics.performance;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-white">{(stats.winPercentage * 100).toFixed(1)}%</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.wins}-{stats.losses} record</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Points</p>
                <p className="text-2xl font-bold text-white">{stats.averagePoints.toFixed(1)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">League avg: 118.7</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">High Score</p>
                <p className="text-2xl font-bold text-white">{stats.highScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Season best</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Consistency</p>
                <p className="text-2xl font-bold text-white">{(trends.consistency * 100).toFixed(0)}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Score variance</p>
          </div>
        </div>

        {/* Weekly Scores Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.performance?.weeklyScores || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="points" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Position Breakdown */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Position Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(positionBreakdown).map(([position, data]: [string, any]) => (
              <div key={position} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">{position}</span>
                  <span className="text-xs text-gray-500">Rank #{data.rank}</span>
                </div>
                <div className="text-lg font-bold text-white">{data.points}</div>
                <div className="text-sm text-gray-400">{data.average}/week</div>
                <div className={`text-xs mt-1 ${data.rank <= 3 ? 'text-green-400' : data.rank <= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {data.rank <= 3 ? 'Strong' : data.rank <= 6 ? 'Average' : 'Weak'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerTrends = () => {
    if (!analytics.trends) return null;

    const { risingPlayers, fallingPlayers, breakoutCandidates, sleepers } = analytics.trends;

    return (
      <div className="space-y-6">
        {/* Rising Players */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Rising Players</h3>
          </div>
          <div className="space-y-3">
            {risingPlayers.map((player: any) => (
              <div key={player.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {player.position}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.name}</div>
                    <div className="text-gray-400 text-sm">{player.team}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-medium">+{player.changePercent}%</div>
                  <div className="text-gray-400 text-sm">{player.projectedPoints} proj</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Falling Players */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Falling Players</h3>
          </div>
          <div className="space-y-3">
            {fallingPlayers.map((player: any) => (
              <div key={player.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {player.position}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.name}</div>
                    <div className="text-gray-400 text-sm">{player.team}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-medium">{player.changePercent}%</div>
                  <div className="text-gray-400 text-sm">{player.projectedPoints} proj</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakout Candidates & Sleepers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Breakout Candidates</h3>
            <div className="space-y-3">
              {breakoutCandidates.map((player: any) => (
                <div key={player.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{player.name}</span>
                    <span className="text-blue-400">{player.breakoutScore}</span>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-gray-400">Opp: {player.opportunity}%</span>
                    <span className="text-gray-400">Tal: {player.talent}%</span>
                    <span className="text-gray-400">Sit: {player.situation}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Waiver Sleepers</h3>
            <div className="space-y-3">
              {sleepers.map((player: any) => (
                <div key={player.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{player.name}</span>
                    <span className="text-purple-400">{player.sleeperScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{player.ownership}% owned</span>
                    <span className="text-gray-400">Ceiling: {player.projectedCeiling}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !user || !leagueId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/leagues/${leagueId}`)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
              >
                <option value="season">Full Season</option>
                <option value="last4">Last 4 Weeks</option>
                <option value="last8">Last 8 Weeks</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && renderPlayerTrends()}
        {activeTab === 'performance' && renderOverview()}
        
        {/* Placeholder for other tabs */}
        {(activeTab === 'matchups' || activeTab === 'trades' || activeTab === 'draft') && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{tabs.find(t => t.id === activeTab)?.label} analysis coming soon...</p>
            <p className="text-gray-500 text-sm mt-2">Advanced analytics features will be available in the next update</p>
          </div>
        )}
      </div>
    </div>
  );
}