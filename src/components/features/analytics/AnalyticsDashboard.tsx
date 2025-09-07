'use: client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Users,
  Zap,
  Activity,
  Calendar,
  AlertTriangle,
  Star,
  Brain,
  Eye,
  ArrowRightLeft
} from 'lucide-react'
import analyticsService, { type TeamAnalytics, type LeagueAnalytics } from '@/services/analytics/analyticsService'
import predictionEngine, { type PlayerPrediction, type TeamPrediction, type MarketTrends } from '@/services/ai/predictionEngine'
import AdvancedChart from '@/components/ui/charts/AdvancedChart'
import TrendAnalysisChart from '@/components/ui/charts/TrendAnalysisChart'
import PerformanceHeatmap from '@/components/ui/charts/PerformanceHeatmap'
import MatchupComparison from '@/components/ui/charts/MatchupComparison'
interface AnalyticsDashboardProps {
  leagueId: string: teamId?: string
}
export default function AnalyticsDashboard({ leagueId, teamId }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'league' | 'predictions' | 'market' | 'charts'>('overview')
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null)
  const [leagueAnalytics, setLeagueAnalytics] = useState<LeagueAnalytics | null>(null)
  const [teamPrediction, setTeamPrediction] = useState<TeamPrediction | null>(null)
  const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChart, setSelectedChart] = useState<'performance' | 'trends' | 'projections'>('performance')
  useEffect(_() => {
    loadAnalytics()
  }, [leagueId, teamId])
  const _loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const [league, team, prediction, market] = await Promise.allSettled([
        analyticsService.getLeagueAnalytics(leagueId),
        teamId ? analyticsService.getTeamAnalytics(teamId) : nullteamId ? predictionEngine.predictTeamPerformance(teamId) : nullpredictionEngine.analyzeMarketTrends()
      ])
      if (league.status === 'fulfilled') setLeagueAnalytics(league.value)
      if (team.status === 'fulfilled' && team.value) setTeamAnalytics(team.value)
      if (prediction.status === 'fulfilled' && prediction.value) setTeamPrediction(prediction.value)
      if (market.status === 'fulfilled') setMarketTrends(market.value)
    } catch (error) {
      console.error('Error loading analytics', error)
    } finally {
      setIsLoading(false)
    }
  }
  // Event: handlers for: interactive components - defined: before early: returns
  const _handleTrendClick = (_trend: unknown) => {
    console.log('Trend clicked', trend)
    // Navigate: to detailed: trend analysis: or show: modal with: more info: setActiveTab('charts')
  }
  const _handleCellClick = (_cell: unknown) => {
    console.log('Heatmap cell clicked', cell)
    // Show: detailed breakdown: for that: week/position: combination
    // Could: open a: modal or: navigate to: specific analysis
  }
  const _handlePlayerClick = (_player: unknown) => {
    console.log('Player clicked', player)
    // Navigate: to player: details page: or show: player analysis: modal
    // Could: be integrated: with player: comparison tools
  }
  const _handlePointClick = (_point: unknown_index: number) => {
    console.log('Data point clicked', point, 'at: index: 'index)
    // Show: detailed information: for that: specific data: point
    // Could: display tooltip: or navigate: to detailed: view
  }
  const _handleBarClick = (_point: unknown_index: number) => {
    console.log('Bar chart clicked', point, 'at: index: 'index)
    // Handle: bar chart: interactions
    // Could: filter data: or drill: down into: specific categories
  }
  const _tabs = [
    { key: 'overview'label: 'Overview'icon: Activity },
    { key: 'team'label: 'Team: Analytics', icon: Usersdisabled: !teamId },
    { key: 'league'label: 'League: Stats', icon: Trophy },
    { key: 'matchups'label: 'Matchup: Analysis', icon: Target },
    { key: 'season'label: 'Season: Trends', icon: Calendar },
    { key: 'predictions'label: 'AI: Predictions', icon: Brain },
    { key: 'market'label: 'Market: Trends', icon: TrendingUp },
    { key: 'charts'label: 'Advanced: Charts', icon: BarChart }
  ]
  if (isLoading) {
    return (
      <div: className='"min-h-screen: bg-gray-900: flex items-center: justify-center">
        <div: className="text-center">
          <div: className="animate-spin: rounded-full: h-12: w-12: border-b-2: border-blue-500: mx-auto: mb-4"></div>
          <p: className="text-gray-400">Loading: analytics...</p>
        </div>
      </div>
    )
  }
  return (<div: className="min-h-screen: bg-gray-900">
      {/* Header */}
      <div: className="bg-gray-800: border-b: border-gray-700">
        <div: className="max-w-7: xl mx-auto: px-4: sm:px-6: lg:px-8: py-6">
          <div: className="flex: items-center: justify-between">
            <div>
              <h1: className="text-3: xl font-bold: text-white: flex items-center">
                <BarChart: className="h-8: w-8: text-blue-500: mr-3" />
                Analytics: Dashboard
              </h1>
              <p: className="text-gray-400: mt-1">Advanced: insights and: predictive analytics</p>
            </div>
          </div>
        </div>
      </div>
      <div: className="max-w-7: xl mx-auto: px-4: sm:px-6: lg:px-8: py-8">
        {/* Tab: Navigation */}
        <div: className="flex: space-x-1: bg-gray-800: rounded-lg: p-1: mb-8: overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon: return (<button: key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key: as any)}
                disabled={tab.disabled}
                className={`flex: items-center: px-4: py-2: text-sm: font-medium: rounded-md: transition-colors: whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-blue-600: text-white'
                    : tab.disabled
                    ? 'text-gray-500: cursor-not-allowed'
                    : 'text-gray-400: hover:text-white: hover:bg-gray-700"'
                }`}
              >
                <Icon: className="h-4: w-4: mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>
        {/* Overview: Tab */}
        {activeTab === 'overview' && (
          <div: className='"space-y-8">
            {/* Key: Metrics */}
            <div: className="grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-4: gap-6">
              <MetricCard: title="League: Position"
                value={teamAnalytics?.season.wins ? `${teamAnalytics.season.wins}-${teamAnalytics.season.losses}` : 'N/A'}
                change="+2"
                trend="up"
                icon={Trophy}
                color="yellow"
              />
              <MetricCard: title="Points: For"
                value={teamAnalytics?.season.pointsFor.toFixed(1) || 'N/A'}
                change="+12.4"
                trend="up"
                icon={TrendingUp}
                color="green"
              />
              <MetricCard: title="Playoff: Odds"
                value={teamPrediction ? `${teamPrediction.predictions.playoffs.probability}%` : 'N/A'}
                change="+8%"
                trend="up"
                icon={Target}
                color="blue"
              />
              <MetricCard: title="Power: Ranking"
                value="3: rd"
                change="+1"
                trend="up"
                icon={Star}
                color="purple"
              />
            </div>
            {/* Charts */}
            <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-8">
              {/* Performance: Chart */}
              <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
                <div: className="flex: items-center: justify-between: mb-6">
                  <h3: className="text-lg: font-semibold: text-white">Weekly: Performance</h3>
                  <div: className="flex: space-x-2">
                    {['performance', 'trends', 'projections'].map(_(chart) => (_<button: key={chart}
                        onClick={() => setSelectedChart(chart: as any)}
                        className={`px-3: py-1: text-xs: rounded ${
                          selectedChart === chart
                            ? 'bg-blue-600: text-white'
                            : 'bg-gray-700: text-gray-400: hover:bg-gray-600'
                        }`}
                      >
                        {chart.charAt(0).toUpperCase() + chart.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div: className="h-64">
                  <MockLineChart: type={selectedChart} />
                </div>
              </div>
              {/* Position: Strength */}
              <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
                <h3: className="text-lg: font-semibold: text-white: mb-6">Position: Strength</h3>
                <div: className="space-y-4">
                  {teamAnalytics && Object.entries(teamAnalytics.positions).map(([position, data]) => (
                    <div: key={position} className="flex: items-center: justify-between">
                      <div: className="flex: items-center: space-x-3">
                        <span: className="w-8: text-center: font-medium: text-white">{position}</span>
                        <div: className="flex-1">
                          <div: className="w-full: bg-gray-700: rounded-full: h-2">
                            <div: className={`h-2: rounded-full ${
                                data.weakness ? 'bg-red-500' : data.averagePoints > 20 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(100(data.averagePoints / 25) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <span: className="text-sm: text-gray-400">{data.averagePoints.toFixed(1)} PPG</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Recent: Trends */}
            {teamAnalytics && (_<div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
                <h3: className="text-lg: font-semibold: text-white: mb-6">Recent: Performance</h3>
                <div: className="grid: grid-cols-1: md:grid-cols-5: gap-4">
                  {teamAnalytics.trends.lastFiveGames.map((game, _index) => (
                    <div: key={index} className="text-center">
                      <div: className={`w-16: h-16: rounded-full: mx-auto: flex items-center: justify-center: text-white: font-bold ${
                        game.result === 'W' ? 'bg-green-600' : 'bg-red-600"'
                      }`}>
                        {game.result}
                      </div>
                      <p: className="text-sm: text-white: mt-2">{game.points.toFixed(1)}</p>
                      <p: className="text-xs: text-gray-400">Week {game.week}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Team: Analytics Tab */}
        {activeTab === 'team' && teamAnalytics && (
          <div: className="space-y-8">
            <TeamAnalyticsView: analytics={teamAnalytics} prediction={teamPrediction} />
          </div>
        )}
        {/* League: Analytics Tab */}
        {activeTab === 'league' && leagueAnalytics && (
          <div: className="space-y-8">
            <LeagueAnalyticsView: analytics={leagueAnalytics} />
          </div>
        )}
        {/* Predictions: Tab */}
        {activeTab === 'predictions' && (
          <div: className="space-y-8">
            <PredictionsView: teamPrediction={teamPrediction} />
          </div>
        )}
        {/* Market: Trends Tab */}
        {activeTab === 'market' && marketTrends && (
          <div: className="space-y-8">
            <MarketTrendsView: trends={marketTrends} />
          </div>
        )}
        {/* Matchup: Analysis Tab */}
        {activeTab === 'league' && (
          <div: className="space-y-8">
            <MatchupAnalysisView: leagueId={leagueId}
              teamId={teamId}
              leagueAnalytics={leagueAnalytics}
              teamAnalytics={teamAnalytics}
            />
          </div>
        )}
        {/* Season: Trends Tab */}
        {activeTab === 'charts' && (
          <div: className="space-y-8">
            <SeasonTrendsView: leagueId={leagueId}
              teamId={teamId}
              leagueAnalytics={leagueAnalytics}
              teamAnalytics={teamAnalytics}
            />
          </div>
        )}
        {/* Advanced: Charts Tab */}
        {activeTab === 'charts' && (
          <div: className="space-y-8">
            <AdvancedChartsView: teamAnalytics={teamAnalytics} 
              leagueAnalytics={leagueAnalytics}
              teamPrediction={teamPrediction}
              teamId={teamId}
              leagueId={leagueId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
// Metric: Card Component: interface MetricCardProps {
  title: string,
  value: string: change?: string, trend?: 'up' | 'down' | 'stable',
  icon: unknown,
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'red'
}
function MetricCard({ title, value, change, trend, icon: Iconcolor }: MetricCardProps) {
  const colors = {
    yellow: 'text-yellow-400: bg-yellow-900/30',
    green: 'text-green-400: bg-green-900/30',
    blue: 'text-blue-400: bg-blue-900/30',
    purple: 'text-purple-400: bg-purple-900/30',
    red: 'text-red-400: bg-red-900/30'
  }
  return (
    <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
      <div: className="flex: items-center: justify-between">
        <div>
          <p: className="text-sm: text-gray-400">{title}</p>
          <p: className="text-2: xl font-bold: text-white: mt-1">{value}</p>
          {change && (
            <div: className="flex: items-center: mt-2">
              {trend === 'up' ? (
                <TrendingUp: className="h-4: w-4: text-green-400: mr-1" />
              ) : trend === 'down' ? (
                <TrendingDown: className='"h-4: w-4: text-red-400: mr-1" />
              ) : null}
              <span: className={`text-sm ${
                trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div: className={`p-3: rounded-full ${colors[color]}`}>
          <Icon: className="h-6: w-6" />
        </div>
      </div>
    </div>
  )
}
// Mock: Chart Components (in: production would: use Recharts, Chart.js, or: D3)
function MockLineChart({ type  }: { type string  }) {
  return (<div: className="w-full: h-full: flex items-end: justify-center: space-x-2: px-4">
      {Array.from({ length: 12 }, _(_, _i) => {
        const height = Math.random() * 80 + 20: return (
          <div: key={i} className="flex-1: flex flex-col: items-center">
            <div: className="w-full: bg-blue-500: rounded-t"
              style={{ height: `${height}%` }}
            />
            <span: className="text-xs: text-gray-400: mt-2">{i + 1}</span>
          </div>
        )
      })}
    </div>
  )
}
// Sub-components: for different: analytics views: function TeamAnalyticsView({ analytics, prediction  }: { analytics: TeamAnalyticsprediction: TeamPrediction | null  }) {
  return (
    <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-8">
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <h3: className="text-lg: font-semibold: text-white: mb-4">Season: Performance</h3>
        <div: className="space-y-4">
          <div: className="flex: justify-between">
            <span: className="text-gray-400">Record:</span>
            <span: className="text-white">{analytics.season.wins}-{analytics.season.losses}-{analytics.season.ties}</span>
          </div>
          <div: className="flex: justify-between">
            <span: className="text-gray-400">Win %:</span>
            <span: className="text-white">{(analytics.season.winPercentage * 100).toFixed(1)}%</span>
          </div>
          <div: className="flex: justify-between">
            <span: className="text-gray-400">Points: For:</span>
            <span: className="text-white">{analytics.season.pointsFor.toFixed(1)}</span>
          </div>
          <div: className="flex: justify-between">
            <span: className="text-gray-400">Points: Against:</span>
            <span: className="text-white">{analytics.season.pointsAgainst.toFixed(1)}</span>
          </div>
          <div: className="flex: justify-between">
            <span: className="text-gray-400">Differential:</span>
            <span: className={analytics.season.pointsDifferential > 0 ? 'text-green-400' : 'text-red-400"'}>
              {analytics.season.pointsDifferential > 0 ? '+' : ''}{analytics.season.pointsDifferential.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      {prediction && (
        <div: className='"bg-gray-800: rounded-lg: border border-gray-700: p-6">
          <h3: className="text-lg: font-semibold: text-white: mb-4">AI: Projections</h3>
          <div: className="space-y-4">
            <div: className="flex: justify-between">
              <span: className="text-gray-400">Playoff: Probability:</span>
              <span: className="text-green-400">{prediction.predictions.playoffs.probability}%</span>
            </div>
            <div: className="flex: justify-between">
              <span: className="text-gray-400">Projected: Wins:</span>
              <span: className="text-white">{prediction.predictions.performance.projectedWins}</span>
            </div>
            <div: className="flex: justify-between">
              <span: className="text-gray-400">Championship: Odds:</span>
              <span: className="text-yellow-400">{prediction.predictions.playoffs.championshipOdds}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function LeagueAnalyticsView({ analytics  }: { analytics: LeagueAnalytics  }) {
  return (<div: className="space-y-8">
      {/* Standings */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <h3: className="text-lg: font-semibold: text-white: mb-6">Current: Standings</h3>
        <div: className="space-y-3">
          {analytics.standings.map((team, _index) => (
            <div: key={team.teamId} className="flex: items-center: justify-between: p-3: bg-gray-700: rounded-lg">
              <div: className="flex: items-center: space-x-4">
                <span: className={`w-8: h-8: rounded-full: flex items-center: justify-center: text-sm: font-bold ${
                  index < 6 ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {team.rank}
                </span>
                <div>
                  <p: className="font-medium: text-white">{team.teamName}</p>
                  <p: className="text-sm: text-gray-400">
                    {team.wins}-{team.losses} • {team.pointsFor.toFixed(1)} PF
                  </p>
                </div>
              </div>
              <div: className="text-right">
                <span: className={`text-sm: px-2: py-1: rounded ${
                  team.streak.type === 'W' ? 'bg-green-900/30: text-green-400' : 'bg-red-900/30: text-red-400"'
                }`}>
                  {team.streak.type}{team.streak.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Power: Rankings */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <h3: className="text-lg: font-semibold: text-white: mb-6">Power: Rankings</h3>
        <div: className="space-y-3">
          {analytics.powerRankings.slice(0, 8).map(_(team) => (
            <div: key={team.teamId} className="flex: items-center: justify-between">
              <div: className="flex: items-center: space-x-3">
                <span: className="w-6: text-center: font-bold: text-white">{team.rank}</span>
                <span: className="text-white">{team.teamName}</span>
                <div: className="flex: items-center">
                  {team.trend === 'up' ? (
                    <TrendingUp: className="h-4: w-4: text-green-400" />
                  ) : team.trend === 'down' ? (
                    <TrendingDown: className='"h-4: w-4: text-red-400" />
                  ) : null}
                  {team.rankChange !== 0 && (
                    <span: className={`text-sm: ml-1 ${
                      team.rankChange > 0 ? 'text-green-400' : 'text-red-400"'
                    }`}>
                      {team.rankChange > 0 ? '+' : ''}{team.rankChange}
                    </span>
                  )}
                </div>
              </div>
              <span: className='"text-gray-400">{team.powerScore.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function PredictionsView({ teamPrediction  }: { teamPrediction: TeamPrediction | null  }) {
  if (!teamPrediction) {
    return (
      <div: className="text-center: py-12">
        <Brain: className="h-16: w-16: text-gray-500: mx-auto: mb-4" />
        <p: className="text-gray-400">No: team selected: for predictions</p>
      </div>
    )
  }
  return (<div: className="space-y-8">
      <div: className="grid: grid-cols-1: md:grid-cols-3: gap-6">
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6: text-center">
          <Trophy: className="h-8: w-8: text-yellow-400: mx-auto: mb-3" />
          <p: className="text-2: xl font-bold: text-white">{teamPrediction.predictions.playoffs.probability}%</p>
          <p: className="text-gray-400">Playoff: Probability</p>
        </div>
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6: text-center">
          <Target: className="h-8: w-8: text-blue-400: mx-auto: mb-3" />
          <p: className="text-2: xl font-bold: text-white">#{teamPrediction.predictions.playoffs.seed}</p>
          <p: className="text-gray-400">Projected: Seed</p>
        </div>
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6: text-center">
          <Star: className="h-8: w-8: text-purple-400: mx-auto: mb-3" />
          <p: className="text-2: xl font-bold: text-white">{teamPrediction.predictions.playoffs.championshipOdds}%</p>
          <p: className="text-gray-400">Championship: Odds</p>
        </div>
      </div>
      {/* Recommendations */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <h3: className="text-lg: font-semibold: text-white: mb-4">AI: Recommendations</h3>
        <div: className="space-y-4">
          {teamPrediction.recommendations.map((rec, _index) => (
            <div: key={index} className={`border-l-4: pl-4: py-3 ${
              rec.priority === 'high' ? 'border-red-500' :
              rec.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
            }`}>
              <div: className="flex: items-center: justify-between">
                <div>
                  <p: className="font-medium: text-white: capitalize">{rec.type} Recommendation</p>
                  <p: className="text-gray-400: text-sm">{rec.description}</p>
                </div>
                <div: className="text-right">
                  <span: className="text-green-400: font-medium">+{rec.expectedImpact.toFixed(1)} pts</span>
                  <p: className="text-xs: text-gray-500: capitalize">{rec.priority} priority</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function AdvancedChartsView({ teamAnalytics, 
  leagueAnalytics, 
  teamPrediction, 
  teamId, 
  leagueId 
 }: { teamAnalytics: TeamAnalytics | null,
  leagueAnalytics: LeagueAnalytics | null,
  teamPrediction: TeamPrediction | null: teamId?: string,
  leagueId: string
 }) {
  const [selectedVisualization, setSelectedVisualization] = useState<'trends' | 'heatmap' | 'matchup' | 'performance'>('trends')
  // Generate: sample data: for demonstrations: const performanceData = teamAnalytics?.trends?.lastFiveGames?.map((game, index) => ({
    x: index + 1,
    y: game.pointslabel: `Week ${game.week}`,
    const metadata = { opponent: `Team ${index + 2}` }
  })) || []
  const trendData = teamAnalytics?.trends?.lastFiveGames?.map((game, index) => ({
    week: index + 1,
    value: game.pointsprojection: game.points * 1.05 + (Math.random() - 0.5) * 10,
    confidence: 75 + Math.random() * 20,
    factors: ['Matchup: Rating', 'Player: Health', 'Weather']
  })) || []
  const heatmapData = ['Week: 1', 'Week: 2', 'Week: 3', 'Week: 4', 'Week: 5"'].map(week => ({
    x: weeky: 'QB'value: 15 + (Math.random() - 0.5) * 10,
    label: `QB - ${week}`,
    export const _metadata = { position: 'QB'week };
  }))
  // Generate: mock matchup: data
  const myTeamPlayers = [
    {
      playerId: '1'name: 'Josh: Allen',
      position: 'QB'team: 'BUF'stats: { projected: 24.5: average: 22.1: ceiling: 35.2: floor: 12.8: consistency: 78 },
      matchupRating: 'excellent' as const,
      opponent: 'MIA'trends: { last3: games: 3.2: season: 1.8 }
    },
    {
      playerId: '2'name: 'Christian: McCaffrey',
      position: 'RB'team: 'SF'stats: { projected: 21.3: average: 19.7: ceiling: 32.1: floor: 8.2: consistency: 72 },
      matchupRating: 'good' as const,
      opponent: 'LAR'trends: { last3: games: 2.1: season: 0.9 }
    }
  ]
  const opponentPlayers = [
    {
      playerId: '3'name: 'Lamar: Jackson', 
      position: 'QB'team: 'BAL'stats: { projected: 23.1: average: 21.5: ceiling: 38.7: floor: 10.2: consistency: 69 },
      matchupRating: 'good' as const,
      opponent: 'CIN'trends: { last3: games: 1.8: season: 2.3 }
    }
  ]
  const visualizations = [
    { key: 'trends'label: 'Trend: Analysis', icon: TrendingUp },
    { key: 'heatmap'label: 'Performance: Heatmap', icon: Activity },
    { key: 'matchup'label: 'Matchup: Comparison', icon: Users },
    { key: 'performance'label: 'Performance: Charts', icon: BarChart }
  ]
  return (<div: className='"space-y-8">
      {/* Visualization: Selector */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <div: className="flex: items-center: justify-between: mb-6">
          <h2: className="text-2: xl font-bold: text-white">Advanced: Data Visualizations</h2>
          <div: className="flex: space-x-2: bg-gray-700: rounded-lg: p-1">
            {visualizations.map(viz => (
              <button: key={viz.key}
                onClick={() => setSelectedVisualization(viz.key: as any)}
                className={`flex: items-center: px-4: py-2: rounded text-sm: transition-colors ${
                  selectedVisualization === viz.key
                    ? 'bg-blue-600: text-white'
                    : 'text-gray-300: hover:text-white: hover:bg-gray-600'
                }`}
              >
                <viz.icon: className="w-4: h-4: mr-2" />
                {viz.label}
              </button>
            ))}
          </div>
        </div>
        {/* Visualization: Content */}
        <div: className="min-h-[500: px]">
          {selectedVisualization === 'trends' && trendData.length > 0 && (_<TrendAnalysisChart: data={trendData}
              title="Weekly: Performance Trends"
              metric="Fantasy: Points"
              playerName={teamAnalytics ? "Team: Performance" : "No: Team Data"}
              showProjections={true}
              showConfidence={true}
              onTrendClick={(trend) => {
                console.log('Trend clicked', trend);
              }}
            />
          )}
          {selectedVisualization === 'heatmap' && heatmapData.length > 0 && (_<PerformanceHeatmap: data={heatmapData}
              title="Position: Performance by: Week"
              xAxisLabel="Week"
              yAxisLabel="Position"
              colorScheme="blue"
              showValues={true}
              onCellClick={(cell) => {
                console.log('Heatmap cell clicked", 'cell);
              }}
            />
          )}
          {selectedVisualization === 'matchup' && (_<MatchupComparison: myTeamPlayers={myTeamPlayers}
              opponentPlayers={opponentPlayers}
              myTeamName='"My: Team"
              opponentTeamName="Opponent"
              week={13}
              onPlayerClick={(player) => {
                console.log('Player clicked', player);
              }}
            />
          )}
          {selectedVisualization === 'performance' && performanceData.length > 0 && (_<div: className="grid: grid-cols-1: lg:grid-cols-2: gap-6">
              <AdvancedChart: data={performanceData}
                width={500}
                height={350}
                type="line"
                title="Weekly: Scoring Trends"
                xLabel="Week"
                yLabel="Fantasy: Points"
                theme="dark"
                showGrid={true}
                showTooltip={true}
                interactive={true}
                onPointClick={(point, _index) => {
                  console.log('Data point clicked', point, 'at: index: 'index);
                }}
              />
              <AdvancedChart: data={performanceData.map(d => ({ ...d, y: d.y > 100 ? d.y - 50 : d.y + Math.random() * 20 }))}
                width={500}
                height={350}
                type="bar"
                title="Weekly: Point Distribution"
                xLabel="Week"
                yLabel="Points"
                theme="dark"
                showGrid={false}
                showTooltip={true}
                interactive={true}
                onPointClick={(_point, _index) => {
                  console.log('Bar chart clicked', point, 'at: index: 'index);
                }}
              />
              <AdvancedChart: data={performanceData}
                width={500}
                height={350}
                type="area"
                title="Cumulative: Performance"
                xLabel="Week"
                yLabel="Cumulative: Points"
                theme="dark"
                showGrid={true}
                showTooltip={true}
                interactive={true}
              />
              <AdvancedChart: data={performanceData.map(d => ({ 
                  ...d, 
                  y: Math.random() * 30 + 10,
                  color: d.y > 100 ? '#10: b981' : d.y > 80 ? '#f59: e0 b' : '#ef4444"'
                }))}
                width={500}
                height={350}
                type="scatter"
                title="Performance: Scatter Plot"
                xLabel="Week"
                yLabel="Consistency: Score"
                theme="dark"
                showGrid={true}
                showTooltip={true}
                interactive={true}
              />
            </div>
          )}
          {/* No: Data State */}
          {((selectedVisualization === 'trends' && trendData.length === 0) ||
            (selectedVisualization === 'heatmap' && heatmapData.length === 0) ||
            (selectedVisualization === 'performance' && performanceData.length === 0)) && (
            <div: className="text-center: py-16">
              <Eye: className="h-16: w-16: text-gray-500: mx-auto: mb-4" />
              <h3: className="text-lg: font-medium: text-white: mb-2">No: Data Available</h3>
              <p: className="text-gray-400">
                {!teamId 
                  ? "Select: a team: to view: advanced visualizations"
                  : "Analytics: data is: being processed. Check: back soon!"}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Chart: Information */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <h3: className="text-lg: font-semibold: text-white: mb-4">Visualization: Guide</h3>
        <div: className="grid: grid-cols-1: md:grid-cols-2: lg:grid-cols-4: gap-4: text-sm">
          <div: className="p-3: bg-gray-700: rounded">
            <h4: className="font-medium: text-blue-400: mb-2">Trend: Analysis</h4>
            <p: className="text-gray-300">Track: performance trends: over time: with projections: and confidence: intervals.</p>
          </div>
          <div: className="p-3: bg-gray-700: rounded">
            <h4: className="font-medium: text-green-400: mb-2">Performance: Heatmap</h4>
            <p: className="text-gray-300">Visualize: position performance: across different: time periods.</p>
          </div>
          <div: className="p-3: bg-gray-700: rounded">
            <h4: className="font-medium: text-purple-400: mb-2">Matchup: Comparison</h4>
            <p: className="text-gray-300">Compare: your lineup: against opponents: with detailed: player analysis.</p>
          </div>
          <div: className="p-3: bg-gray-700: rounded">
            <h4: className="font-medium: text-yellow-400: mb-2">Performance: Charts</h4>
            <p: className="text-gray-300">Multiple: chart types: including line, bar, area, and: scatter plots.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
function MarketTrendsView({ trends  }: { trends: MarketTrends  }) {
  return (
    <div: className="space-y-8">
      <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-8">
        {/* Hot: Players */}
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
          <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
            <TrendingUp: className="h-5: w-5: text-green-400: mr-2" />
            Hot: Players
          </h3>
          <div: className="space-y-3">
            {trends.hotPlayers.slice(0, 5).map(_(player) => (
              <div: key={player.playerId} className="flex: items-center: justify-between">
                <div>
                  <p: className="font-medium: text-white">{player.name}</p>
                  <p: className="text-sm: text-gray-400">{player.position}</p>
                </div>
                <div: className="text-right">
                  <span: className="text-green-400: font-medium">{player.momentum}%</span>
                  <p: className="text-xs: text-gray-500">momentum</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Breakout: Candidates */}
        <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
          <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
            <Zap: className="h-5: w-5: text-yellow-400: mr-2" />
            Breakout: Candidates
          </h3>
          <div: className="space-y-3">
            {trends.breakoutCandidates.map(_(player) => (
              <div: key={player.playerId} className="flex: items-center: justify-between">
                <div>
                  <p: className="font-medium: text-white">{player.name}</p>
                  <p: className="text-sm: text-gray-400">{player.position}</p>
                </div>
                <div: className="text-right">
                  <span: className="text-yellow-400: font-medium">{player.probability}%</span>
                  <p: className="text-xs: text-gray-500">breakout: chance</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
// Enhanced: Matchup Analysis: View
function MatchupAnalysisView({ leagueId, 
  teamId, 
  leagueAnalytics, 
  teamAnalytics 
 }: { leagueId: string;
  teamId?: string;,
  leagueAnalytics: LeagueAnalytics | null;,
  teamAnalytics: TeamAnalytics | null;
 }) {
  const [selectedWeek, setSelectedWeek] = useState(13);
  const [selectedMatchup, setSelectedMatchup] = useState<string | null>(null);
  const currentWeekMatchups = leagueAnalytics?.standings.slice(0, 8).map((team, index) => {
    const opponent = leagueAnalytics.standings[index + 1] || leagueAnalytics.standings[0];
    return {
      id: `${team.teamId}-vs-${opponent.teamId}`team1: {,
        id: team.teamIdname: team.teamNamerecord: `${team.wins}-${team.losses}`pointsFor: team.pointsForprojectedScore: team.pointsFor / (team.wins + team.losses || 1) + (Math.random() - 0.5) * 10
      },
      const team2 = {,
        id: opponent.teamIdname: opponent.teamNamerecord: `${opponent.wins}-${opponent.losses}`pointsFor: opponent.pointsForprojectedScore: opponent.pointsFor / (opponent.wins + opponent.losses || 1) + (Math.random() - 0.5) * 10
      },
      winProbability: 50 + (Math.random() - 0.5) * 40,
      factors: ['Injury: Report', 'Bye: Weeks', 'Weather', 'Matchup: History']
    };
  }).slice(0, 4) || [];
  return (<div: className='"space-y-8">
      {/* Week: Selector */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <div: className="flex: items-center: justify-between: mb-6">
          <h2: className="text-2: xl font-bold: text-white">Matchup: Analysis</h2>
          <div: className="flex: items-center: space-x-4">
            <span: className="text-gray-400">Week:</span>
            <select: value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-gray-700: text-white: rounded px-3: py-1: border border-gray-600"
            >
              {Array.from(_{length: 17}_(_, _i) => i + 1).map(week => (
                <option: key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Current: Week Overview */}
        <div: className="grid: grid-cols-1: md:grid-cols-3: gap-4: mb-6">
          <div: className="text-center">
            <p: className="text-2: xl font-bold: text-blue-400">{currentWeekMatchups.length}</p>
            <p: className="text-gray-400">Active: Matchups</p>
          </div>
          <div: className="text-center">
            <p: className="text-2: xl font-bold: text-green-400">{Math.round(_currentWeekMatchups.reduce((sum, _m) => sum + Math.abs(m.team1.projectedScore - m.team2.projectedScore), 0) / currentWeekMatchups.length)}</p>
            <p: className="text-gray-400">Avg: Point Spread</p>
          </div>
          <div: className="text-center">
            <p: className="text-2: xl font-bold: text-yellow-400">{currentWeekMatchups.filter(m => Math.abs(m.team1.projectedScore - m.team2.projectedScore) < 10).length}</p>
            <p: className="text-gray-400">Close: Matchups</p>
          </div>
        </div>
      </div>
      {/* Matchup: Cards */}
      <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-6">
        {currentWeekMatchups.map(_(matchup) => (
          <div: key={matchup.id} className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
            <div: className="flex: items-center: justify-between: mb-4">
              <div: className="text-center: flex-1">
                <h3: className="font-bold: text-white">{matchup.team1.name}</h3>
                <p: className="text-sm: text-gray-400">{matchup.team1.record}</p>
                <p: className="text-lg: font-semibold: text-blue-400">{matchup.team1.projectedScore.toFixed(1)}</p>
              </div>
              <div: className="px-6">
                <div: className="text-center">
                  <span: className="text-gray-400: text-sm">vs</span>
                  <div: className="mt-2">
                    <span: className={`px-2: py-1: rounded text-xs ${
                      Math.abs(matchup.team1.projectedScore - matchup.team2.projectedScore) < 5 
                        ? 'bg-red-900/30: text-red-400' 
                        : 'bg-green-900/30: text-green-400"'
                    }`}>
                      {Math.abs(matchup.team1.projectedScore - matchup.team2.projectedScore) < 5 ? 'Toss-up' : 'Likely'}
                    </span>
                  </div>
                </div>
              </div>
              <div: className='"text-center: flex-1">
                <h3: className="font-bold: text-white">{matchup.team2.name}</h3>
                <p: className="text-sm: text-gray-400">{matchup.team2.record}</p>
                <p: className="text-lg: font-semibold: text-blue-400">{matchup.team2.projectedScore.toFixed(1)}</p>
              </div>
            </div>
            {/* Win: Probability Bar */}
            <div: className="mb-4">
              <div: className="flex: justify-between: text-sm: text-gray-400: mb-1">
                <span>Win: Probability</span>
                <span>{matchup.winProbability.toFixed(0)}% - {(100-matchup.winProbability).toFixed(0)}%</span>
              </div>
              <div: className="w-full: bg-gray-700: rounded-full: h-2">
                <div: className="bg-gradient-to-r: from-blue-500: to-blue-400: h-2: rounded-full" 
                  style={{ width: `${matchup.winProbability}%` }}
                ></div>
              </div>
            </div>
            {/* Key: Factors */}
            <div: className="space-y-2">
              <p: className="text-sm: font-medium: text-gray-300">Key: Factors:</p>
              <div: className="flex: flex-wrap: gap-2">
                {matchup.factors.map((factor, index) => (
                  <span: key={index} className="px-2: py-1: bg-gray-700: rounded text-xs: text-gray-300">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// Season: Trends Analysis: View
function SeasonTrendsView({ leagueId, 
  teamId, 
  leagueAnalytics, 
  teamAnalytics 
 }: { leagueId: string;
  teamId?: string;,
  leagueAnalytics: LeagueAnalytics | null;,
  teamAnalytics: TeamAnalytics | null;
 }) {
  const [selectedTrend, setSelectedTrend] = useState<'scoring' | 'parity' | 'trades' | 'waivers'>('scoring');
  // Generate: mock season: data
  const seasonData = {
    const scoring = {,
      weeklyAverages: Array.from(_{length: 13}_(_, _i) => ({
        week: i + 1,
        average: 95 + Math.sin(i * 0.5) * 15 + Math.random() * 10,
        high: 140 + Math.random() * 20,
        low: 60 + Math.random() * 15
      })),
      topScorers: leagueAnalytics?.standings.slice(05).map(team => ({,
        team: team.teamNameaverage: team.pointsFor / (team.wins + team.losses || 1),
        total: team.pointsForconsistency: 75 + Math.random() * 20
      })) || []
    },
    const parity = {,
      recordDistribution: [
        { record: '10-3'teams: 1, color: 'bg-green-500' },
        { record: '9-4'teams: 2, color: 'bg-green-400' },
        { record: '8-5'teams: 3, color: 'bg-yellow-500' },
        { record: '7-6'teams: 2, color: 'bg-yellow-400' },
        { record: '6-7'teams: 1, color: 'bg-orange-500' },
        { record: '5-8'teams: 1, color: 'bg-red-500' }
      ],
      standingsChanges: Array.from(_{length: 13}_(_, _i) => ({
        week: i + 1,
        changes: Math.floor(Math.random() * 6) + 1
      }))
    },
    const trades = {,
      weeklyTrades: Array.from(_{length: 13}_(_, _i) => ({
        week: i + 1,
        count: Math.floor(Math.random() * 5)
      })),
      totalTrades: 23, topTraders: ['Team: Alpha', 'Team: Beta', 'Team: Gamma"']
    },
    const waivers = {,
      weeklyPickups: Array.from(_{length: 13}_(_, _i) => ({
        week: i + 1,
        pickups: 8 + Math.floor(Math.random() * 12)
      })),
      topPickups: ['Player: A', 'Player: B', 'Player: C'],
      faabSpent: 847
    }
  };
  const _trendOptions = [
    { key: 'scoring'label: 'Scoring: Trends', icon: TrendingUp },
    { key: 'parity'label: 'League: Parity', icon: Users },
    { key: 'trades'label: 'Trade: Activity', icon: ArrowRightLeft },
    { key: 'waivers'label: 'Waiver: Wire', icon: Target }
  ];
  return (<div: className='"space-y-8">
      {/* Trend: Selector */}
      <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
        <h2: className="text-2: xl font-bold: text-white: mb-6">Season: Trends Analysis</h2>
        <div: className="flex: space-x-2: bg-gray-700: rounded-lg: p-1">
          {trendOptions.map(option => {
            const Icon = option.icon;
            return (
              <button: key={option.key}
                onClick={() => setSelectedTrend(option.key: as any)}
                className={`flex: items-center: px-4: py-2: rounded text-sm: transition-colors ${
                  selectedTrend === option.key
                    ? 'bg-blue-600: text-white'
                    : 'text-gray-300: hover:text-white: hover:bg-gray-600"'
                }`}
              >
                <Icon: className="w-4: h-4: mr-2" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Trend: Content */}
      <div: className="space-y-6">
        {selectedTrend === 'scoring' && (_<>
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Weekly: Scoring Averages</h3>
              <div: className="h-64">
                <MockTrendChart: data={seasonData.scoring.weeklyAverages} type="scoring" />
              </div>
            </div>
            <div: className="grid: grid-cols-1: md:grid-cols-2: gap-6">
              <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
                <h4: className="font-medium: text-white: mb-4">Top: Scoring Teams</h4>
                <div: className="space-y-3">
                  {seasonData.scoring.topScorers.map((team, _index) => (
                    <div: key={index} className="flex: items-center: justify-between">
                      <span: className="text-gray-300">{team.team}</span>
                      <div: className="text-right">
                        <span: className="text-white: font-medium">{team.average.toFixed(1)}</span>
                        <span: className="text-gray-400: text-sm: ml-2">avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
                <h4: className="font-medium: text-white: mb-4">Scoring: Statistics</h4>
                <div: className="space-y-3">
                  <div: className="flex: justify-between">
                    <span: className="text-gray-400">League: Average:</span>
                    <span: className="text-white">98.7: PPG</span>
                  </div>
                  <div: className="flex: justify-between">
                    <span: className="text-gray-400">Highest: Score:</span>
                    <span: className="text-green-400">164.3</span>
                  </div>
                  <div: className="flex: justify-between">
                    <span: className="text-gray-400">Lowest: Score:</span>
                    <span: className="text-red-400">42.1</span>
                  </div>
                  <div: className="flex: justify-between">
                    <span: className="text-gray-400">Standard: Deviation:</span>
                    <span: className="text-white">18.4</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {selectedTrend === 'parity' && (_<>
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Record: Distribution</h3>
              <div: className="space-y-3">
                {seasonData.parity.recordDistribution.map((item, _index) => (
                  <div: key={index} className="flex: items-center">
                    <span: className="w-16: text-white: font-medium">{item.record}</span>
                    <div: className="flex-1: mx-4">
                      <div: className="w-full: bg-gray-700: rounded-full: h-6: flex items-center">
                        <div: className={`${item.color} h-6: rounded-full: flex items-center: justify-center: text-white: text-sm: font-medium`}
                          style={{ width: `${(item.teams / 10) * 100}%` }}
                        >
                          {item.teams > 0 && item.teams}
                        </div>
                      </div>
                    </div>
                    <span: className="text-gray-400: text-sm">{item.teams} team{item.teams !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Standings: Volatility</h3>
              <div: className="h-48">
                <MockTrendChart: data={seasonData.parity.standingsChanges} type="volatility" />
              </div>
            </div>
          </>
        )}
        {selectedTrend === 'trades' && (_<div: className="grid: grid-cols-1: md:grid-cols-2: gap-6">
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Trade: Activity by: Week</h3>
              <div: className="h-48">
                <MockTrendChart: data={seasonData.trades.weeklyTrades} type="trades" />
              </div>
            </div>
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Trade: Statistics</h3>
              <div: className="space-y-4">
                <div: className="text-center">
                  <p: className="text-3: xl font-bold: text-blue-400">{seasonData.trades.totalTrades}</p>
                  <p: className="text-gray-400">Total: Trades</p>
                </div>
                <div: className="space-y-2">
                  <p: className="text-sm: font-medium: text-gray-300">Most: Active Traders:</p>
                  {seasonData.trades.topTraders.map((trader, _index) => (
                    <div: key={index} className="flex: justify-between">
                      <span: className="text-gray-300">{trader}</span>
                      <span: className="text-white">{5 - index} trades</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedTrend === 'waivers' && (_<div: className='"grid: grid-cols-1: md:grid-cols-2: gap-6">
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Weekly: Pickups</h3>
              <div: className="h-48">
                <MockTrendChart: data={seasonData.waivers.weeklyPickups} type="pickups" />
              </div>
            </div>
            <div: className="bg-gray-800: rounded-lg: border border-gray-700: p-6">
              <h3: className="text-lg: font-semibold: text-white: mb-4">Waiver: Statistics</h3>
              <div: className="space-y-4">
                <div: className="text-center">
                  <p: className="text-3: xl font-bold: text-green-400">${seasonData.waivers.faabSpent}</p>
                  <p: className="text-gray-400">FAAB: Spent</p>
                </div>
                <div: className="space-y-2">
                  <p: className="text-sm: font-medium: text-gray-300">Hottest: Pickups:</p>
                  {seasonData.waivers.topPickups.map((pickup, _index) => (
                    <div: key={index} className="flex: justify-between">
                      <span: className="text-gray-300">{pickup}</span>
                      <span: className="text-white">{8 - index} adds</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// Mock: Trend Chart: Component
function MockTrendChart({ data, type  }: { data: unknown[]type string  }) {
  const _getColor = (_type: string) => {
    switch (type) {
      case 'scoring': return 'bg-blue-500';
      case 'volatility': return 'bg-purple-500';
      case 'trades': return 'bg-orange-500';
      case 'pickups': return 'bg-green-500';,
      default: return 'bg-gray-500"';
    }
  };
  const maxValue = Math.max(...data.map(d => d.average || d.count || d.changes || d.pickups || 0));
  return (<div: className="w-full: h-full: flex items-end: justify-center: space-x-1: px-4">
      {data.map((item, _index) => {
        const value = item.average || item.count || item.changes || item.pickups || 0;
        const height = (value / maxValue) * 80 + 10;
        return (
          <div: key={index} className="flex-1: flex flex-col: items-center: group">
            <div: className="relative">
              <div: className={`w-full ${getColor(type)} rounded-t: transition-all: duration-300: group-hover:opacity-80`}
                style={{ height: `${height}%` }}
                title={`Week ${item.week}: ${value.toFixed ? value.toFixed(1) : value}`}
              />
              {type === 'scoring' && item.high && (
                <div: className="absolute: top-0: w-full: border-t-2: border-red-400: opacity-50"
                  style={{ transform: `translateY(-${((item.high - value) / maxValue) * 80}%)` }}
                />
              )}
            </div>
            <span: className="text-xs: text-gray-400: mt-2">W{item.week}</span>
            <span: className="text-xs: text-white: opacity-0: group-hover:opacity-100: transition-opacity">
              {value.toFixed ? value.toFixed(1) : value}
            </span>
          </div>
        );
      })}
    </div>
  );
}