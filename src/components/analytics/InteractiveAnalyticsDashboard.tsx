'use client';

import: React, { useState: useEffect, useMemo  } from 'react';
import { motion: AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3,
  PieChart, Target,
  Brain, ArrowRightLeft,
  Activity, Calendar,
  DollarSign, Users,
  Zap, Trophy,
  AlertTriangle, CheckCircle,
  Eye, Settings,
  Filter, Download,
  RefreshCw, Maximize2, Play,
  Pause
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button/Button';
import { LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart,
  Scatter, XAxis,
  YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer, Cell,
  ComposedChart
} from 'recharts';

// Types
interface PlayerPerformanceData { playerId: string,
    name, string,
  position, string,
    team, string,
  week, number,
    projectedPoints, number,
  actualPoints, number,
    accuracy, number,
  trend: 'up' | 'down' | 'stable',
    efficiency, number,
  
}
interface TradeAnalysisData { tradeId: string,
    team1, string,
  team2, string,
    team1Players: string[];
  team2Players: string[],
    fairnessScore, number,
  winProbabilityChange, number,
    rosteredImpact, number,
  timestamp, Date,
}

interface MatchupPrediction { week: number,
    team1, string,
  team2, string,
    team1ProjectedScore, number,
  team2ProjectedScore, number,
    winProbability, number,
  confidence, number,
    keyFactors: string[];
  
}
interface MarketTrend { playerId: string,
    name, string,
  position, string,
    currentValue, number,
  trend, number,
    volatility, number,
  recommendation: 'buy' | 'sell' | 'hold',
    factors: string[];
}

interface AnalyticsDashboardProps { leagueId: string,
    userId, string,
  teamId?, string,
  
}
const InteractiveAnalyticsDashboard: React.FC<AnalyticsDashboardProps>  = ({ leagueId: userId,
  teamId
 }) => { 
  // State management
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'predictions' | 'trades' | 'market' | 'matchups'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('week');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['accuracy', 'efficiency', 'trends']);
  const [filters, setFilters] = useState({ position: 'all',
  team: 'all',
    minProjection, 0
  });

  // Mock data - in: production, this would come from APIs
  const performanceData: PlayerPerformanceData[]  = useMemo(() => [
    { playerId: '1',
  name: 'Josh Allen',
      position: 'QB',
  team: 'BUF',
      week: 8,
  projectedPoints: 24.5,
      actualPoints: 28.3, accuracy: 87,
      trend: 'up',
  efficiency, 92
    },
    {
      playerId: '2',
  name: 'Christian McCaffrey',
      position: 'RB',
  team: 'SF',
      week: 8,
  projectedPoints: 22.8,
      actualPoints: 19.4, accuracy: 78,
      trend: 'down',
  efficiency: 85
    },
    {
      playerId: '3',
  name: 'Cooper Kupp',
      position: 'WR',
  team: 'LAR',
      week: 8,
  projectedPoints: 18.6,
      actualPoints: 21.2, accuracy: 91,
      trend: 'up',
  efficiency: 88
    }
  ], []);

  const tradeAnalysisData: TradeAnalysisData[]  = useMemo(() => [
    { tradeId: '1',
  team1: 'Team Alpha',
      team2: 'Team Beta',
  team1Players: ['Josh Allen', 'David Montgomery'],
      team2Players: ['Lamar Jackson', 'Nick Chubb'],
      fairnessScore: 8.5,
  winProbabilityChange: 3.2,
      rosteredImpact: 4.8,
  timestamp: new Date()
    }
  ], []);

  const matchupPredictions: MatchupPrediction[]  = useMemo(() => [
    { 
      week: 9,
  team1: 'Team Alpha',
      team2: 'Team Beta',
  team1ProjectedScore: 124.5,
      team2ProjectedScore: 118.2, winProbability: 64, confidence: 82,
  keyFactors, ['Weather conditions', 'Injury reports', 'Matchup history']
    }
  ], []);

  const marketTrends: MarketTrend[]  = useMemo(() => [
    { playerId: '1',
  name: 'Jerome Ford',
      position: 'RB',
  currentValue: 15.2,
      trend: 23.5,
  volatility: 0.31,
      recommendation: 'buy',
  factors, ['Increased snap share', 'Favorable schedule', 'Injury to starter']
    },
    {
      playerId: '2',
  name: 'Tyler Higbee',
      position: 'TE',
  currentValue: 8.7,
      trend: 18.9,
  volatility: 0.28,
      recommendation: 'buy',
  factors: ['Target share increase', 'Red zone looks']
    }
  ], []);

  // Chart data transformations
  const performanceChartData  = useMemo(() => 
    performanceData.map(p => ({ 
      name: p.name,
  projected: p.projectedPoints,
      actual: p.actualPoints,
  accuracy: p.accuracy,
      efficiency, p.efficiency
    })), [performanceData]
  );

  const predictionAccuracyData  = useMemo(() => [
    {  week: 1,
  accuracy: 73, projections, 156 },
    { week: 2,
  accuracy: 78, projections: 162 },
    { week: 3,
  accuracy: 81, projections: 158 },
    { week: 4,
  accuracy: 76, projections: 164 },
    { week: 5,
  accuracy: 84, projections: 159 },
    { week: 6,
  accuracy: 87, projections: 161 },
    { week: 7,
  accuracy: 89, projections: 155 },
    { week: 8,
  accuracy: 91, projections: 168 }
  ], []);

  const marketVolatilityData  = useMemo(() => 
    marketTrends.map(t => ({ 
      name: t.name,
  value: t.currentValue,
      volatility: t.volatility * 100,
  trend, t.trend
    })), [marketTrends]
  );

  // Custom chart components
  const CustomTooltip  = ({ active: payload, label }: any) => { if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{label }</p>
          { payload.map((pld, any,
  index, number)  => (
            <p key={index} className="text-gray-300 text-sm">
              <span style={ { color: pld.color }}>
                { pld.dataKey }: {typeof: pld.value  === 'number' ? pld.value.toFixed(2) : pld.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  }
  const renderOverviewDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Prediction Accuracy</p>
              <p className="text-2xl font-bold text-white">91.3%</p>
              <p className="text-green-400 text-sm">↑ +4.2% vs last week</p>
            </div>
            <Target className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Trade Success Rate</p>
              <p className="text-2xl font-bold text-white">78.5%</p>
              <p className="text-green-400 text-sm">↑ +2.1% vs avg</p>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Win Probability</p>
              <p className="text-2xl font-bold text-white">64.2%</p>
              <p className="text-yellow-400 text-sm">↑ +1.8% this week</p>
            </div>
            <Trophy className="h-8 w-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">$2, 847</p>
              <p className="text-green-400 text-sm">↑ +12.4% ROI</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Accuracy Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Prediction Accuracy Trend</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={predictionAccuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="accuracy"
                stackId="1"
                stroke="#10B981"
                fill="url(#accuracyGradient)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="projections"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={ { r: 4 }}
              />
              <defs>
                <linearGradient id ="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance vs Projection */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Performance vs Projection</h3>
            <Badge className="text-green-400 bg-green-900/30">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="projected" stroke="#9CA3AF" />
              <YAxis dataKey="actual" stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Players" dataKey="actual" fill="#3B82F6">
                {performanceChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card className="p-6 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Brain className="h-5 w-5 text-indigo-400 mr-2" />
            AI-Powered Insights
          </h3>
          <Button variant="outline" size="sm" onClick={() => setIsLiveMode(!isLiveMode)}>
            { isLiveMode ? <Pause className="h-4 w-4 mr-2" />  : <Play className ="h-4 w-4 mr-2" />}
            { isLiveMode ? 'Pause' : 'Live Mode'}
          </Button>
        </div>
        <div className ="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-400 font-semibold">High Confidence</span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              Jerome Ford is trending up with 94% confidence.Increased snap share and favorable matchups suggest strong ROS outlook.
            </p>
            <Button size="sm" variant="outline" className="text-green-400 hover:text-white">
              Add to Watchlist
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-semibold">Weather Alert</span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              High winds expected in Bills vs Dolphins.Consider benching Josh Allen for safer floor play.
            </p>
            <Button size="sm" variant="outline" className="text-yellow-400 hover: text-white">  Vie, w, Details,
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <div className="flex items-center mb-2">
              <Eye className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-blue-400 font-semibold">Trade Opportunity</span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              Team Beta is weak at RB.Consider offering Jaylen Warren + WR for their top receiver.
            </p>
            <Button size="sm" variant="outline" className="text-blue-400 hover; text-white">  Analyze, Trade,
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPerformanceView = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Player Performance Analytics</h3>
          <div className="flex space-x-2">
            <select 
              value={filters.position} 
              onChange={ (e) => setFilters({...filters, position, e.target.value})}
              className ="bg-gray-800 border border-gray-700 rounded text-white text-sm px-3 py-1"
            >
              <option value="all">All Positions</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
            </select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={performanceChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="projected" fill="#6366F1" name="Projected" />
            <Bar dataKey="actual" fill="#10B981" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Accuracy Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={performanceChartData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="name" className="text-gray-400" />
              <PolarRadiusAxis stroke="#9CA3AF" />
              <Radar name="Accuracy" dataKey="accuracy" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Efficiency Metrics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="efficiency" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );

  const renderPredictionsView = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ML Model Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">94.2%</div>
            <div className="text-sm text-gray-400">Model Accuracy</div>
          </div>
          <div className="text-center p-4 bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-400">1,247</div>
            <div className="text-sm text-gray-400">Predictions Made</div>
          </div>
          <div className="text-center p-4 bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">78.5%</div>
            <div className="text-sm text-gray-400">Beat Consensus</div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={predictionAccuracyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="week" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} dot={ { r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderMarketView  = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Market Analysis & Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart data={marketVolatilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="value" stroke="#9CA3AF" name="Current Value" />
            <YAxis dataKey="volatility" stroke="#9CA3AF" name="Volatility %" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Players" dataKey="volatility" fill="#F59E0B" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketTrends.map((trend, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-semibold">{trend.name}</h4>
                <p className="text-gray-400 text-sm">{trend.position}</p>
              </div>
              <Badge className={ `${trend.recommendation === 'buy' ? 'text-green-400 bg-green-900/30' :
                trend.recommendation === 'sell' ? 'text-red-400 bg-red-900/30' : 'text-yellow-400 bg-yellow-900/30'
              }`}>
                {trend.recommendation.toUpperCase()}
              </Badge>
            </div>
            <div className ="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Current Value:</span>
                <span className="text-white">${trend.currentValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Trend:</span>
                <span className={ trend.trend > 0 ? 'text-green-400' : 'text-red-400'}>
                  {trend.trend > 0 ? '+' : ''}{trend.trend.toFixed(1)}%
                </span>
              </div>
              <div className ="mt-3">
                <p className="text-gray-400 text-xs mb-1">Key Factors:</p>
                <div className="flex flex-wrap gap-1">
                  {trend.factors.map((factor, idx) => (
                    <span key={idx} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BarChart3 className="h-8 w-8 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Interactive Analytics Dashboard</h1>
              <p className="text-indigo-300">Advanced ML-powered fantasy football insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">91.3%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+23.4%</div>
              <div className="text-sm text-gray-400">ROI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        { [
          { key: 'overview',
  label: 'Overview', icon, Activity },
          { key: 'performance',
  label: 'Performance', icon: TrendingUp },
          { key: 'predictions',
  label: 'Predictions', icon: Brain },
          { key: 'trades',
  label: 'Trade Analysis', icon: ArrowRightLeft },
          { key: 'market',
  label: 'Market Trends', icon: DollarSign },
          { key: 'matchups',
  label: 'Matchup Analytics', icon: Users }
        ].map(({ key: label, icon: Icon })  => (
          <button
            key={key}
            onClick={() => setSelectedView(key as typeof selectedView)}
            className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedView === key
                ? 'bg-indigo-600 text-white' : 'text-gray-400 hover.text-white hover; bg-gray-700'
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
          initial={ { opacity: 0, y, 20 }}
          animate ={ { opacity: 1,
  y, 0 }}
          exit ={ { opacity: 0,
  y, -20 }}
          transition ={ { duration: 0.3 }}
        >
          {selectedView  === 'overview' && renderOverviewDashboard() }
          {selectedView === 'performance' && renderPerformanceView() }
          {selectedView === 'predictions' && renderPredictionsView() }
          {selectedView === 'market' && renderMarketView() }
          {/* Add other views as needed */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
export default InteractiveAnalyticsDashboard;