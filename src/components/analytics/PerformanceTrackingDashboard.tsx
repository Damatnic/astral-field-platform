'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  Users,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  Zap,
  Star,
  Award,
  LineChart as LineChartIcon,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button/Button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';

// Types
interface PerformanceMetrics {
  playerId: string;
  name: string;
  position: string;
  team: string;
  weeklyPerformance: WeeklyPerformance[];
  seasonStats: SeasonStats;
  trendAnalysis: TrendAnalysis;
  efficiency: EfficiencyMetrics;
  consistency: ConsistencyMetrics;
  projectionAccuracy: ProjectionAccuracy;
}

interface WeeklyPerformance {
  week: number;
  projectedPoints: number;
  actualPoints: number;
  accuracy: number;
  matchupDifficulty: 'easy' | 'moderate' | 'difficult';
  gameScript: number;
  usage: UsageMetrics;
  contextualFactors: string[];
}

interface SeasonStats {
  totalPoints: number;
  averagePoints: number;
  highScore: number;
  lowScore: number;
  gamesPlayed: number;
  consistencyScore: number;
  trendScore: number;
  projectionBeat: number; // % of weeks beating projection
}

interface TrendAnalysis {
  lastFourWeeks: number;
  lastTwoWeeks: number;
  homeVsAway: { home: number; away: number };
  byOpponent: Record<string, number>;
  byWeather: Record<string, number>;
  momentum: 'hot' | 'cold' | 'neutral';
  trendDirection: 'up' | 'down' | 'stable';
  trendStrength: number;
}

interface EfficiencyMetrics {
  pointsPerTarget: number;
  pointsPerCarry: number;
  pointsPerSnap: number;
  redZoneEfficiency: number;
  goalLineEfficiency: number;
  thirdDownUsage: number;
  situationalUsage: Record<string, number>;
}

interface ConsistencyMetrics {
  coefficient: number; // Lower = more consistent
  floorScore: number; // 25th percentile
  ceilingScore: number; // 75th percentile
  boomRate: number; // % of games > ceiling
  bustRate: number; // % of games < floor
  gameLogVariance: number;
  weekToWeekStability: number;
}

interface ProjectionAccuracy {
  overallAccuracy: number;
  weeklyAccuracies: number[];
  avgError: number;
  rmse: number;
  bias: number; // Tendency to over/under project
  accuracyTrend: 'improving' | 'declining' | 'stable';
}

interface UsageMetrics {
  snapShare: number;
  targetShare: number;
  redZoneTargets: number;
  goalLineCarries: number;
  thirdDownSnaps: number;
  twoMinuteSnaps: number;
}

interface TeamPerformance {
  teamId: string;
  teamName: string;
  weeklyScores: number[];
  projectedScores: number[];
  accuracy: number;
  consistency: number;
  trends: {
    recent: number;
    season: number;
    home: number;
    away: number;
  };
  topPerformers: PerformanceMetrics[];
  underperformers: PerformanceMetrics[];
  positionStrengths: Record<string, number>;
}

interface PerformanceTrackingProps {
  leagueId: string;
  teamId?: string;
  playerId?: string;
  timeframe: 'season' | 'recent' | 'playoffs';
}

const PerformanceTrackingDashboard: React.FC<PerformanceTrackingProps> = ({
  leagueId,
  teamId,
  playerId,
  timeframe = 'season'
}) => {
  // State management
  const [selectedView, setSelectedView] = useState<'overview' | 'player' | 'team' | 'comparison' | 'trends'>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(playerId || null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(teamId || null);
  const [selectedMetric, setSelectedMetric] = useState<'points' | 'accuracy' | 'consistency' | 'efficiency'>('points');
  const [timeRange, setTimeRange] = useState<'all' | 'recent' | 'playoffs'>(timeframe);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production would come from APIs
  const performanceData: PerformanceMetrics[] = useMemo(() => [
    {
      playerId: '1',
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      weeklyPerformance: Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        projectedPoints: 22 + Math.random() * 6,
        actualPoints: 20 + Math.random() * 10,
        accuracy: 75 + Math.random() * 20,
        matchupDifficulty: ['easy', 'moderate', 'difficult'][Math.floor(Math.random() * 3)] as 'easy' | 'moderate' | 'difficult',
        gameScript: -5 + Math.random() * 10,
        usage: {
          snapShare: 0.95 + Math.random() * 0.05,
          targetShare: 0.0,
          redZoneTargets: 0,
          goalLineCarries: 1 + Math.random() * 2,
          thirdDownSnaps: 8 + Math.random() * 4,
          twoMinuteSnaps: 4 + Math.random() * 3
        },
        contextualFactors: ['Home game', 'Good weather']
      })),
      seasonStats: {
        totalPoints: 185.4,
        averagePoints: 23.2,
        highScore: 34.6,
        lowScore: 12.8,
        gamesPlayed: 8,
        consistencyScore: 87,
        trendScore: 92,
        projectionBeat: 62.5
      },
      trendAnalysis: {
        lastFourWeeks: 25.1,
        lastTwoWeeks: 27.8,
        homeVsAway: { home: 25.6, away: 20.8 },
        byOpponent: { 'vs_MIA': 28.4, 'vs_NYJ': 31.2 },
        byWeather: { 'clear': 24.8, 'rain': 19.6 },
        momentum: 'hot',
        trendDirection: 'up',
        trendStrength: 8.5
      },
      efficiency: {
        pointsPerTarget: 0.0,
        pointsPerCarry: 0.45,
        pointsPerSnap: 0.24,
        redZoneEfficiency: 87,
        goalLineEfficiency: 92,
        thirdDownUsage: 95,
        situationalUsage: { 'redZone': 0.95, 'goalLine': 0.88, 'thirdDown': 0.95 }
      },
      consistency: {
        coefficient: 0.32,
        floorScore: 18.5,
        ceilingScore: 28.7,
        boomRate: 25,
        bustRate: 12.5,
        gameLogVariance: 45.8,
        weekToWeekStability: 78
      },
      projectionAccuracy: {
        overallAccuracy: 87.5,
        weeklyAccuracies: [85, 90, 82, 88, 91, 85, 89, 86],
        avgError: 2.8,
        rmse: 4.1,
        bias: 1.2,
        accuracyTrend: 'improving'
      }
    }
    // Add more mock players...
  ], []);

  const teamPerformance: TeamPerformance = useMemo(() => ({
    teamId: selectedTeam || 'team_1',
    teamName: 'Team Alpha',
    weeklyScores: [124.5, 118.9, 132.1, 109.8, 145.2, 128.7, 119.4, 136.8],
    projectedScores: [122.8, 121.5, 128.9, 115.2, 140.1, 125.3, 123.7, 131.9],
    accuracy: 89.2,
    consistency: 82.5,
    trends: {
      recent: 128.4,
      season: 126.9,
      home: 132.1,
      away: 121.7
    },
    topPerformers: performanceData.slice(0, 3),
    underperformers: [],
    positionStrengths: {
      QB: 92,
      RB: 78,
      WR: 85,
      TE: 71,
      K: 88,
      DST: 82
    }
  }), [performanceData, selectedTeam]);

  // Chart data transformations
  const weeklyPerformanceChart = useMemo(() => {
    if (selectedPlayer && performanceData.length > 0) {
      const player = performanceData.find(p => p.playerId === selectedPlayer);
      if (player) {
        return player.weeklyPerformance.map(week => ({
          week: week.week,
          projected: Math.round(week.projectedPoints * 10) / 10,
          actual: Math.round(week.actualPoints * 10) / 10,
          accuracy: week.accuracy,
          difficulty: week.matchupDifficulty
        }));
      }
    }
    return [];
  }, [selectedPlayer, performanceData]);

  const consistencyChart = useMemo(() => 
    performanceData.slice(0, 6).map(player => ({
      name: player.name,
      consistency: player.consistency.coefficient,
      floor: player.consistency.floorScore,
      ceiling: player.consistency.ceilingScore,
      average: player.seasonStats.averagePoints
    })), [performanceData]
  );

  const efficiencyRadarData = useMemo(() => {
    if (selectedPlayer) {
      const player = performanceData.find(p => p.playerId === selectedPlayer);
      if (player) {
        return [
          { metric: 'Points/Snap', value: player.efficiency.pointsPerSnap * 100, fullMark: 50 },
          { metric: 'Red Zone Eff', value: player.efficiency.redZoneEfficiency, fullMark: 100 },
          { metric: 'Goal Line Eff', value: player.efficiency.goalLineEfficiency, fullMark: 100 },
          { metric: 'Consistency', value: player.consistency.weekToWeekStability, fullMark: 100 },
          { metric: 'Accuracy', value: player.projectionAccuracy.overallAccuracy, fullMark: 100 },
          { metric: 'Trend', value: player.trendAnalysis.trendStrength * 10, fullMark: 100 }
        ];
      }
    }
    return [];
  }, [selectedPlayer, performanceData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-gray-300 text-sm">
              <span style={{ color: pld.color }}>
                {pld.dataKey}: {typeof pld.value === 'number' ? pld.value.toFixed(1) : pld.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render methods
  const renderOverviewDashboard = () => (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Accuracy</p>
              <p className="text-2xl font-bold text-white">87.2%</p>
              <p className="text-green-400 text-sm flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                +2.1% vs last period
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Consistency Score</p>
              <p className="text-2xl font-bold text-white">82.5</p>
              <p className="text-green-400 text-sm flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                Stable trend
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Top Performers</p>
              <p className="text-2xl font-bold text-white">8</p>
              <p className="text-purple-400 text-sm">Beating projections</p>
            </div>
            <Trophy className="h-8 w-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Trend Score</p>
              <p className="text-2xl font-bold text-white">91.3</p>
              <p className="text-yellow-400 text-sm flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Hot streak
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Weekly Performance Tracking</h3>
            <div className="flex space-x-2">
              <select 
                value={selectedPlayer || ''}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded text-white text-sm px-3 py-1"
              >
                <option value="">Select Player</option>
                {performanceData.map(player => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {weeklyPerformanceChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={weeklyPerformanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="projected"
                  fill="url(#projectedGradient)"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <defs>
                  <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a player to view performance</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Consistency Analysis</h3>
            <Badge className="text-blue-400 bg-blue-900/30">Season</Badge>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={consistencyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="average" stroke="#9CA3AF" name="Avg Points" />
              <YAxis dataKey="consistency" stroke="#9CA3AF" name="Consistency" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Players" dataKey="consistency" fill="#F59E0B">
                {consistencyChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.consistency < 0.4 ? '#10B981' : entry.consistency < 0.6 ? '#F59E0B' : '#EF4444'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Performance Leaders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Performance Leaders</h3>
          <div className="flex space-x-2">
            {['points', 'accuracy', 'consistency', 'efficiency'].map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric as typeof selectedMetric)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedMetric === metric
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceData.slice(0, 6).map((player, index) => (
            <motion.div
              key={player.playerId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-700 rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedPlayer(player.playerId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">{player.name}</h4>
                  <p className="text-sm text-gray-400">{player.position} • {player.team}</p>
                </div>
                <div className="text-right">
                  {index < 3 && <Award className="h-5 w-5 text-yellow-400 mb-1" />}
                  <Badge className={`text-xs ${
                    player.trendAnalysis.momentum === 'hot' ? 'text-green-400 bg-green-900/30' :
                    player.trendAnalysis.momentum === 'cold' ? 'text-red-400 bg-red-900/30' :
                    'text-gray-400 bg-gray-900/30'
                  }`}>
                    {player.trendAnalysis.momentum.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Avg Points</p>
                  <p className="text-white font-semibold">{player.seasonStats.averagePoints.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Accuracy</p>
                  <p className="text-white font-semibold">{player.projectionAccuracy.overallAccuracy.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Consistency</p>
                  <p className="text-white font-semibold">{player.consistency.weekToWeekStability}</p>
                </div>
                <div>
                  <p className="text-gray-400">Trend</p>
                  <p className={`font-semibold flex items-center ${
                    player.trendAnalysis.trendDirection === 'up' ? 'text-green-400' :
                    player.trendAnalysis.trendDirection === 'down' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {player.trendAnalysis.trendDirection === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                     player.trendAnalysis.trendDirection === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                     <Minus className="h-3 w-3 mr-1" />}
                    {player.trendAnalysis.trendStrength.toFixed(1)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderPlayerDetailView = () => {
    if (!selectedPlayer) {
      return (
        <Card className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Select a player to view detailed performance analysis</p>
        </Card>
      );
    }

    const player = performanceData.find(p => p.playerId === selectedPlayer);
    if (!player) return null;

    return (
      <div className="space-y-6">
        {/* Player Header */}
        <Card className="p-6 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">{player.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                <p className="text-indigo-300">{player.position} • {player.team}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={`${
                    player.trendAnalysis.momentum === 'hot' ? 'text-green-400 bg-green-900/30' :
                    player.trendAnalysis.momentum === 'cold' ? 'text-red-400 bg-red-900/30' :
                    'text-gray-400 bg-gray-900/30'
                  }`}>
                    {player.trendAnalysis.momentum.toUpperCase()}
                  </Badge>
                  <Badge className="text-purple-400 bg-purple-900/30">
                    Rank #{Math.floor(Math.random() * 20) + 1}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{player.seasonStats.averagePoints.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">Avg Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{player.projectionAccuracy.overallAccuracy.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={weeklyPerformanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="projected"
                  fill="url(#projectedGradient)"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Efficiency Radar</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={efficiencyRadarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" className="text-gray-400 text-xs" />
                <PolarRadiusAxis stroke="#9CA3AF" />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4">
            <h4 className="font-semibold text-white mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Season Stats
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Points</span>
                <span className="text-white">{player.seasonStats.totalPoints.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">High Score</span>
                <span className="text-green-400">{player.seasonStats.highScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Low Score</span>
                <span className="text-red-400">{player.seasonStats.lowScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Beat Projection</span>
                <span className="text-white">{player.seasonStats.projectionBeat.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-white mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Consistency
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Floor (25th)</span>
                <span className="text-white">{player.consistency.floorScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ceiling (75th)</span>
                <span className="text-white">{player.consistency.ceilingScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Boom Rate</span>
                <span className="text-green-400">{player.consistency.boomRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bust Rate</span>
                <span className="text-red-400">{player.consistency.bustRate}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-white mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Recent Trends
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Last 4 Weeks</span>
                <span className="text-white">{player.trendAnalysis.lastFourWeeks.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last 2 Weeks</span>
                <span className="text-white">{player.trendAnalysis.lastTwoWeeks.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Home Avg</span>
                <span className="text-white">{player.trendAnalysis.homeVsAway.home.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Away Avg</span>
                <span className="text-white">{player.trendAnalysis.homeVsAway.away.toFixed(1)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Activity className="h-8 w-8 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Performance Tracking Dashboard</h1>
              <p className="text-indigo-300">Historical analysis and performance insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">87.2%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+5.8%</div>
              <div className="text-sm text-gray-400">Improvement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'player', label: 'Player Analysis', icon: Users },
          { key: 'team', label: 'Team Performance', icon: Trophy },
          { key: 'comparison', label: 'Comparisons', icon: LineChartIcon },
          { key: 'trends', label: 'Trends', icon: TrendingUp }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedView(key as typeof selectedView)}
            className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedView === key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedView === 'overview' && renderOverviewDashboard()}
          {selectedView === 'player' && renderPlayerDetailView()}
          {/* Add other views as needed */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PerformanceTrackingDashboard;