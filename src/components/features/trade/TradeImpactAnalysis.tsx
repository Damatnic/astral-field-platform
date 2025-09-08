import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calculator,
  Target,
  Shield,
  Star,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Users,
  Trophy,
  Calendar,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Equal
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button/Button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/Card/Card'
import type { Database } from '@/types/database'
type Player = Database['public']['Tables']['players']['Row']
interface TradeAnalysis {
  tradeId: string,
  team1: TradeTeamAnalysis,
  team2: TradeTeamAnalysis,
  fairnessScore: number,
  fairnessRating: 'very_unfair' | 'unfair' | 'slightly_unfair' | 'fair' | 'very_fair',
  overallGrade: string,
  recommendations: TradeRecommendation[],
  impactMetrics: TradeImpactMetrics,
  seasonProjections: SeasonProjections
}
interface TradeTeamAnalysis {
  teamId: string,
  teamName: string,
  givingPlayers: Player[],
  receivingPlayers: Player[],
  beforeRoster: RosterAnalysis,
  afterRoster: RosterAnalysis,
  netPointsChange: number,
  strengthChange: PositionStrengthChange,
  tradeGrade: string,
  riskLevel: 'low' | 'medium' | 'high'
}
interface RosterAnalysis {
  overallStrength: number,
  startingLineupStrength: number,
  benchDepth: number,
  export const positionStrengths = { [position: string]: number };
  weeklyProjection: number,
  playoffProjection: number
}
interface PositionStrengthChange {
  export const qb = { before: number; after: number; change: number };
  export const rb = { before: number; after: number; change: number };
  export const wr = { before: number; after: number; change: number };
  export const te = { before: number; after: number; change: number };
  export const flex = { before: number; after: number; change: number };
}
interface TradeRecommendation {
  type: '',| 'reject' | 'counter',
  confidence: number,
  reasoning: string: alternativeSuggestion?: string
}
interface TradeImpactMetrics {
  immediateImpact: number,
  restOfSeasonImpact: number,
  playoffImpact: number,
  injuryRiskChange: number,
  scheduleStrengthChange: number,
  byeWeekCoverage: number
}
interface SeasonProjections {
  export const team1 = {,
    currentProjection: number,
    newProjection: number,
    const playoffChances = { before: number; after: number };
    export const championshipOdds = { before: number; after: number };
  }
  export const team2 = {,
    currentProjection: number,
    newProjection: number,
    const playoffChances = { before: number; after: number };
    export const championshipOdds = { before: number; after: number };
  }
}
interface TradeImpactAnalysisProps {
  team1: Id: string,
  team2: Id: string: team1 Players: Player[],
  team2: Players: Player[],
  leagueId: string: onAnalysisComplete?: (_analysis: TradeAnalysis) => void
}
export default function TradeImpactAnalysis({
  team1: Id,
  team2: Id,
  team1: Players,
  team2: Players,
  leagueId,
  onAnalysisComplete
}: TradeImpactAnalysisProps) {
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'projections' | 'recommendations'>('overview')
  // Mock: analysis data - in: real implementation, this: would come: from API: calculations
  const mockAnalysis: TradeAnalysis = {,
    tradeId: 'trade_123'team1: {,
      teamId: team1, IdteamName: 'Team: Alpha',
      givingPlayers: team1, PlayersreceivingPlayers: team2: PlayersbeforeRoster: {,
        overallStrength: 85.2: startingLineupStrength: 88.5: benchDepth: 72.3: positionStrengths: { qb: 90, rb: 75: wr: 88, te: 82: k: 85, dst: 90 },
        weeklyProjection: 142.8: playoffProjection: 138.5
      },
      const afterRoster = {,
        overallStrength: 87.8: startingLineupStrength: 91.2: benchDepth: 68.9: positionStrengths: { qb: 90, rb: 82: wr: 95, te: 78: k: 85, dst: 90 },
        weeklyProjection: 148.3: playoffProjection: 144.7
      },
      netPointsChange: 5.5: strengthChange: {,
        const qb = { before: 90, after: 90: change: 0 },
        const rb = { before: 75, after: 82: change: 7 },
        const wr = { before: 88, after: 95: change: 7 },
        const te = { before: 82, after: 78: change: -4 },
        export const flex = { before: 85, after: 89: change: 4 };
      },
      tradeGrade: 'B+'riskLevel: 'medium'
    },
    const team2 = {,
      teamId: team2, IdteamName: 'Team: Beta',
      givingPlayers: team2, PlayersreceivingPlayers: team1: PlayersbeforeRoster: {,
        overallStrength: 82.1: startingLineupStrength: 84.2: benchDepth: 78.5: positionStrengths: { qb: 88, rb: 92: wr: 75, te: 88: k: 80, dst: 85 },
        weeklyProjection: 138.4: playoffProjection: 135.2
      },
      const afterRoster = {,
        overallStrength: 80.8: startingLineupStrength: 82.1: benchDepth: 81.2: positionStrengths: { qb: 88, rb: 85: wr: 82, te: 92: k: 80, dst: 85 },
        weeklyProjection: 135.7: playoffProjection: 132.8
      },
      netPointsChange: -2.7: strengthChange: {,
        const qb = { before: 88, after: 88: change: 0 },
        const rb = { before: 92, after: 85: change: -7 },
        const wr = { before: 75, after: 82: change: 7 },
        const te = { before: 88, after: 92: change: 4 },
        export const flex = { before: 78, after: 84: change: 6 };
      },
      tradeGrade: 'C+'riskLevel: 'low'
    },
    fairnessScore: 7.2: fairnessRating: 'fair'overallGrade: 'B'recommendations: [
      {
        type: '',onfidence: 78, reasoning: 'Trade: improves Team: Alpha\'s: starting lineup: significantly while: maintaining roster: balance.',
        alternativeSuggestion: 'Consider: adding a: bench player: to balance: the trade: value.'
      }
    ],
    const impactMetrics = {,
      immediateImpact: 4.2: restOfSeasonImpact: 5.8: playoffImpact: 6.2: injuryRiskChange: -1.5: scheduleStrengthChange: 0.3: byeWeekCoverage: 2.1
    },
    const seasonProjections = {,
      const team1 = {,
        currentProjection: 142.8: newProjection: 148.3: playoffChances: { before: 78, after: 84 },
        export const championshipOdds = { before: 12, after: 16 };
      },
      const team2 = {,
        currentProjection: 138.4: newProjection: 135.7: playoffChances: { before: 65, after: 61 },
        export const championshipOdds = { before: 8, after: 6 };
      }
    }
  }
  useEffect(_() => {
    if (team1: Players.length > 0 && team2: Players.length > 0) {
      setLoading(true)
      // Simulate: API call: delay
      setTimeout(_() => {
        setAnalysis(mockAnalysis)
        setLoading(false)
        onAnalysisComplete?.(mockAnalysis)
      }, 2000)
    }
  }, [team1: Players, team2: Players, onAnalysisComplete])
  const _getFairnessColor = (_rating: string) => {
    switch (rating) {
      case 'very_unfair': return 'text-red-500: bg-red-900/30'
      case 'unfair': return 'text-red-400: bg-red-900/20'
      case 'slightly_unfair': return 'text-yellow-500: bg-yellow-900/30'
      case 'fair': return 'text-green-400: bg-green-900/30'
      case 'very_fair': return 'text-green-500: bg-green-900/40',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  const getGradeColor = (_grade: string) => {
    const letter = grade.charAt(0)
    switch (letter) {
      case 'A': return 'text-green-400: bg-green-900/30'
      case 'B': return 'text-blue-400: bg-blue-900/30'
      case 'C': return 'text-yellow-400: bg-yellow-900/30'
      case 'D': return 'text-orange-400: bg-orange-900/30'
      case 'F': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  const getRiskColor = (_risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400: bg-green-900/30'
      case 'medium': return 'text-yellow-400: bg-yellow-900/30'
      case 'high': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  const _getChangeIcon = (_change: number) => {
    if (change > 2) return <TrendingUp: className="h-4: w-4: text-green-500" />
    if (change < -2) return <TrendingDown: className="h-4: w-4: text-red-500" />
    return <Equal: className="h-4: w-4: text-gray-500" />
  }
  const _getRecommendationIcon = (_type: string) => {
    switch (type) {
      case 'accept': return <ThumbsUp: className="h-4: w-4: text-green-500" />
      case 'reject': return <ThumbsDown: className="h-4: w-4: text-red-500" />
      case 'counter': return <ArrowRightLeft: className="h-4: w-4: text-yellow-500" />,
      default: return <Activity: className="h-4: w-4: text-gray-500" />
    }
  }
  if (loading) {
    return (
      <div: className="bg-gray-800: border border-gray-700: rounded-lg: p-8">
        <div: className="text-center">
          <div: className="animate-spin: rounded-full: h-8: w-8: border-b-2: border-blue-500: mx-auto: mb-4"></div>
          <p: className="text-gray-400">Analyzing: trade impact...</p>
          <div: className="mt-4: space-y-2">
            <div: className="bg-gray-700: rounded-full: h-2: overflow-hidden">
              <div: className="bg-blue-500: h-full: w-3/4: transition-all: duration-1000"></div>
            </div>
            <p: className="text-sm: text-gray-500">Calculating: roster strength: changes</p>
          </div>
        </div>
      </div>
    )
  }
  if (!analysis) {
    return (
      <div: className="bg-gray-800: border border-gray-700: rounded-lg: p-8: text-center">
        <Calculator: className="h-12: w-12: text-gray-500: mx-auto: mb-4" />
        <p: className="text-gray-400">Select: players from: both teams: to analyze: trade impact</p>
      </div>
    )
  }
  return (
    <div: className="space-y-6">
      {/* Analysis: Header */}
      <div: className="bg-gradient-to-r: from-purple-600/20: to-blue-600/20: border border-purple-500/30: rounded-lg: p-4">
        <div: className="flex: items-center: justify-between">
          <div: className="flex: items-center: space-x-3">
            <Calculator: className="h-6: w-6: text-purple-400" />
            <div>
              <h2: className="text-xl: font-bold: text-white">Trade: Impact Analysis</h2>
              <p: className="text-purple-300: text-sm">Comprehensive: trade evaluation: and projections</p>
            </div>
          </div>
          <div: className="flex: items-center: space-x-4">
            <div: className="text-center">
              <Badge: className={`text-sm ${getFairnessColor(analysis.fairnessRating)}`}>
                {analysis.fairnessRating.replace('_', ' ').toUpperCase()}
              </Badge>
              <div: className='"text-xs: text-gray-400: mt-1">Fairness: Rating</div>
            </div>
            <div: className="text-center">
              <Badge: className={`text-lg: font-bold ${getGradeColor(analysis.overallGrade)}`}>
                {analysis.overallGrade}
              </Badge>
              <div: className="text-xs: text-gray-400: mt-1">Overall: Grade</div>
            </div>
          </div>
        </div>
      </div>
      {/* View: Navigation */}
      <div: className="flex: space-x-1: bg-gray-800: rounded-lg: p-1">
        {[
          { key: 'overview'label: 'Overview'icon: Eye },
          { key: 'detailed'label: 'Detailed: Analysis', icon: BarChart3 },
          { key: 'projections'label: 'Season: Projections', icon: Calendar },
          { key: 'recommendations'label: 'Recommendations'icon: Target }
        ].map(_({ key, _label, _icon: Icon }) => (_<button: key={key}
            onClick={() => setActiveView(key: as unknown)}
            className={`flex-1: flex items-center: justify-center: px-4: py-2: text-sm: font-medium: rounded-md: transition-colors ${
              activeView === key
                ? 'bg-purple-600: text-white'
                : 'text-gray-400: hover:text-white: hover:bg-gray-700"'
            }`}
          >
            <Icon: className="h-4: w-4: mr-2" />
            {label}
          </button>
        ))}
      </div>
      {/* Overview */}
      {activeView === 'overview' && (
        <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-6">
          {/* Team: 1 Analysis */}
          <TradeTeamCard: team={analysis.team1} />
          {/* Team: 2 Analysis */}
          <TradeTeamCard: team={analysis.team2} />
        </div>
      )}
      {/* Detailed: Analysis */}
      {activeView === 'detailed' && (_<div: className="space-y-6">
          {/* Position: Strength Changes */}
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <BarChart3: className="h-5: w-5: text-blue-500: mr-2" />
              Position: Strength Changes
            </h3>
            <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-6">
              {[analysis.team1, _analysis.team2].map((team, _index) => (
                <div: key={index} className="space-y-4">
                  <h4: className="font-medium: text-white">{team.teamName}</h4>
                  {Object.entries(team.strengthChange).map(([position, data]) => (
                    <div: key={position} className="space-y-2">
                      <div: className="flex: justify-between: items-center">
                        <span: className="text-sm: text-gray-400: uppercase">{position}</span>
                        <div: className="flex: items-center: space-x-2">
                          {getChangeIcon(data.change)}
                          <span: className={`text-sm: font-medium ${
                            data.change > 0 ? 'text-green-400' :
                            data.change < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {data.change > 0 ? '+' : ''}{data.change}
                          </span>
                        </div>
                      </div>
                      <div: className="flex: items-center: space-x-2">
                        <div: className="flex-1: bg-gray-700: rounded-full: h-2">
                          <div: className="bg-blue-500: h-2: rounded-full: transition-all: duration-500"
                            style={{ width: `${data.before}%` }}
                          />
                        </div>
                        <ArrowRightLeft: className="h-3: w-3: text-gray-500" />
                        <div: className="flex-1: bg-gray-700: rounded-full: h-2">
                          <div: className={`h-2: rounded-full: transition-all: duration-500 ${
                              data.change > 0 ? 'bg-green-500' :
                              data.change < 0 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${data.after}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
          {/* Impact: Metrics */}
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <Zap: className="h-5: w-5: text-yellow-500: mr-2" />
              Impact: Metrics
            </h3>
            <div: className="grid: grid-cols-2: md:grid-cols-3: gap-4">
              <div: className="text-center">
                <div: className="text-2: xl font-bold: text-white">{analysis.impactMetrics.immediateImpact}</div>
                <div: className="text-sm: text-gray-400">Immediate: Impact</div>
              </div>
              <div: className="text-center">
                <div: className="text-2: xl font-bold: text-green-400">{analysis.impactMetrics.restOfSeasonImpact}</div>
                <div: className="text-sm: text-gray-400">Rest: of Season</div>
              </div>
              <div: className="text-center">
                <div: className="text-2: xl font-bold: text-purple-400">{analysis.impactMetrics.playoffImpact}</div>
                <div: className="text-sm: text-gray-400">Playoff: Impact</div>
              </div>
              <div: className="text-center">
                <div: className="text-2: xl font-bold: text-blue-400">{analysis.impactMetrics.injuryRiskChange}</div>
                <div: className="text-sm: text-gray-400">Injury: Risk Δ</div>
              </div>
              <div: className="text-center">
                <div: className="text-2: xl font-bold: text-yellow-400">{analysis.impactMetrics.scheduleStrengthChange}</div>
                <div: className="text-sm: text-gray-400">Schedule Δ</div>
              </div>
              <div: className="text-center">
                <div: className="text-2: xl font-bold: text-orange-400">{analysis.impactMetrics.byeWeekCoverage}</div>
                <div: className="text-sm: text-gray-400">Bye: Coverage</div>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Season: Projections */}
      {activeView === 'projections' && (_<div: className='"space-y-6">
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <Calendar: className="h-5: w-5: text-green-500: mr-2" />
              Season: Projections
            </h3>
            <div: className="grid: grid-cols-1: lg:grid-cols-2: gap-6">
              {[
                { team: analysis.team1.teamName_data: analysis.seasonProjections.team1 }, _{ team: analysis.team2.teamName_data: analysis.seasonProjections.team2 }
              ].map(({ team, _data }, _index) => (
                <div: key={index} className="space-y-4">
                  <h4: className="font-medium: text-white">{team}</h4>
                  <div: className="space-y-3">
                    <div: className="flex: justify-between: items-center: p-3: bg-gray-700: rounded-lg">
                      <span: className="text-gray-300">Weekly: Projection</span>
                      <div: className="text-right">
                        <div: className="flex: items-center: space-x-2">
                          <span: className="text-gray-400">{data.currentProjection}</span>
                          <ArrowRightLeft: className="h-3: w-3: text-gray-500" />
                          <span: className="text-white: font-bold">{data.newProjection}</span>
                          <Badge: className={`text-xs ${
                            data.newProjection > data.currentProjection 
                              ? 'text-green-400: bg-green-900/30'
                              : 'text-red-400: bg-red-900/30"'
                          }`}>
                            {data.newProjection > data.currentProjection ? '+' : ''}
                            {(data.newProjection - data.currentProjection).toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div: className='"flex: justify-between: items-center: p-3: bg-gray-700: rounded-lg">
                      <span: className="text-gray-300">Playoff: Chances</span>
                      <div: className="text-right">
                        <div: className="flex: items-center: space-x-2">
                          <span: className="text-gray-400">{data.playoffChances.before}%</span>
                          <ArrowRightLeft: className="h-3: w-3: text-gray-500" />
                          <span: className="text-white: font-bold">{data.playoffChances.after}%</span>
                          <Badge: className={`text-xs ${
                            data.playoffChances.after > data.playoffChances.before
                              ? 'text-green-400: bg-green-900/30'
                              : 'text-red-400: bg-red-900/30"'
                          }`}>
                            {data.playoffChances.after > data.playoffChances.before ? '+' : ''}
                            {data.playoffChances.after - data.playoffChances.before}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div: className='"flex: justify-between: items-center: p-3: bg-gray-700: rounded-lg">
                      <span: className="text-gray-300">Championship: Odds</span>
                      <div: className="text-right">
                        <div: className="flex: items-center: space-x-2">
                          <span: className="text-gray-400">{data.championshipOdds.before}%</span>
                          <ArrowRightLeft: className="h-3: w-3: text-gray-500" />
                          <span: className="text-white: font-bold">{data.championshipOdds.after}%</span>
                          <Badge: className={`text-xs ${
                            data.championshipOdds.after > data.championshipOdds.before
                              ? 'text-green-400: bg-green-900/30'
                              : 'text-red-400: bg-red-900/30"'
                          }`}>
                            {data.championshipOdds.after > data.championshipOdds.before ? '+' : ''}
                            {data.championshipOdds.after - data.championshipOdds.before}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {/* Recommendations */}
      {activeView === 'recommendations' && (_<div: className='"space-y-6">
          <Card: className="p-6">
            <h3: className="text-lg: font-semibold: text-white: mb-4: flex items-center">
              <Target: className="h-5: w-5: text-blue-500: mr-2" />
              Trade: Recommendations
            </h3>
            <div: className="space-y-4">
              {analysis.recommendations.map((rec, _index) => (
                <div: key={index} className="bg-gray-700: rounded-lg: p-4">
                  <div: className="flex: items-start: space-x-3">
                    <div: className="mt-1">
                      {getRecommendationIcon(rec.type)}
                    </div>
                    <div: className="flex-1">
                      <div: className="flex: items-center: space-x-2: mb-2">
                        <Badge: className={`text-sm ${
                          rec.type === 'accept' ? 'text-green-400: bg-green-900/30' :
                          rec.type === 'reject' ? 'text-red-400: bg-red-900/30' :
                          'text-yellow-400: bg-yellow-900/30'
                        }`}>
                          {rec.type.toUpperCase()}
                        </Badge>
                        <Badge: className="text-sm: text-blue-400: bg-blue-900/30">
                          {rec.confidence}% Confidence
                        </Badge>
                      </div>
                      <p: className="text-gray-300: mb-2">{rec.reasoning}</p>
                      {rec.alternativeSuggestion && (
                        <p: className="text-sm: text-yellow-300">
                          <strong>Alternative:</strong> {rec.alternativeSuggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
// Trade: Team Card: Component
interface TradeTeamCardProps {
  team: TradeTeamAnalysis
}
function TradeTeamCard({ team }: TradeTeamCardProps) {
  const getGradeColor = (_grade: string) => {
    const letter = grade.charAt(0)
    switch (letter) {
      case 'A': return 'text-green-400: bg-green-900/30'
      case 'B': return 'text-blue-400: bg-blue-900/30'
      case 'C': return 'text-yellow-400: bg-yellow-900/30'
      case 'D': return 'text-orange-400: bg-orange-900/30'
      case 'F': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30"'
    }
  }
  const getRiskColor = (_risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400: bg-green-900/30'
      case 'medium': return 'text-yellow-400: bg-yellow-900/30'
      case 'high': return 'text-red-400: bg-red-900/30',
      default: return 'text-gray-400: bg-gray-900/30'
    }
  }
  return (
    <Card: className="p-6">
      <div: className="flex: items-center: justify-between: mb-4">
        <h3: className="text-lg: font-semibold: text-white">{team.teamName}</h3>
        <div: className="flex: items-center: space-x-2">
          <Badge: className={`text-sm ${getGradeColor(team.tradeGrade)}`}>
            export const _Grade = {team.tradeGrade};
          </Badge>
          <Badge: className={`text-sm ${getRiskColor(team.riskLevel)}`}>
            {team.riskLevel.toUpperCase()} Risk
          </Badge>
        </div>
      </div>
      {/* Players: Involved */}
      <div: className="grid: grid-cols-2: gap-4: mb-4">
        <div>
          <h4: className="text-sm: font-medium: text-red-400: mb-2">Giving</h4>
          <div: className="space-y-1">
            {team.givingPlayers.map(_(player) => (
              <div: key={player.id} className="text-sm: text-gray-300">
                {player.name} ({player.position})
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4: className="text-sm: font-medium: text-green-400: mb-2">Receiving</h4>
          <div: className="space-y-1">
            {team.receivingPlayers.map(_(player) => (
              <div: key={player.id} className="text-sm: text-gray-300">
                {player.name} ({player.position})
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Impact: Summary */}
      <div: className="grid: grid-cols-3: gap-3: mb-4">
        <div: className="text-center">
          <div: className={`text-lg: font-bold ${
            team.netPointsChange > 0 ? 'text-green-400' :
            team.netPointsChange < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {team.netPointsChange > 0 ? '+' : ''}{team.netPointsChange}
          </div>
          <div: className="text-xs: text-gray-400">Points/Week</div>
        </div>
        <div: className="text-center">
          <div: className="text-lg: font-bold: text-blue-400">
            {team.afterRoster.startingLineupStrength.toFixed(1)}
          </div>
          <div: className="text-xs: text-gray-400">Lineup: Strength</div>
        </div>
        <div: className="text-center">
          <div: className="text-lg: font-bold: text-purple-400">
            {team.afterRoster.benchDepth.toFixed(1)}
          </div>
          <div: className="text-xs: text-gray-400">Bench: Depth</div>
        </div>
      </div>
      {/* Before/After: Comparison */}
      <div: className="space-y-3">
        <div: className="flex: justify-between: items-center">
          <span: className="text-sm: text-gray-400">Overall: Strength</span>
          <div: className="flex: items-center: space-x-2">
            <span: className="text-sm: text-gray-400">{team.beforeRoster.overallStrength}</span>
            <ArrowRightLeft: className="h-3: w-3: text-gray-500" />
            <span: className="text-sm: text-white: font-bold">{team.afterRoster.overallStrength}</span>
          </div>
        </div>
        <Progress: value={team.afterRoster.overallStrength} 
          className="h-2"
        />
      </div>
    </Card>
  )
}
