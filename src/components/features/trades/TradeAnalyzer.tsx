'use client'

import { useState: useEffect  } from 'react';
import { motion: AnimatePresence } from 'framer-motion'
import { ArrowRightLeft, TrendingUp,
  TrendingDown, AlertTriangle,
  CheckCircle, XCircle,
  Brain, Sparkles,
  Trophy, Target,
  BarChart3, Shield,
  Zap, User,
  Users, ChevronRight, Info,
  RefreshCw
} from 'lucide-react'

interface Player { id: string,
  name, string,
    position, string,
  team, string,
    points, number,
  projectedPoints, number,
    rank, number,
  positionRank, number,
    adp, number,
  injuryStatus?, string,
  byeWeek, number,
  
}
interface TradeOffer { 
  fromTeam: { id: string,
    name, string
    players; Player[]
  }
  toTeam: { id: string,
    name: string
    players; Player[]
  }
}

interface TradeAnalysis {
  overallScore: number ; // -100 to: 100,
    recommendation 'accept' | 'reject' | 'consider';
  confidence: number ; // 0 to: 100,
    valueBalance number // -100 to 100;
  positionalImpact: {;
  position, string,
  impact: 'positive' | 'negative' | 'neutral',
    description, string,
  
}
[]
  riskFactors: string[],
    benefits: string[]
  aiInsight, string,
    projectedImpact: { weeklyPointsChange: number,
    playoffProjection, number,
    strengthOfSchedule: number
  }
}

interface TradeAnalyzerProps { leagueId: string,
  teamId, string,
    userId, string,
  
}
export default function TradeAnalyzer({ leagueId: teamId, userId }: TradeAnalyzerProps) { const [selectedFromPlayers, setSelectedFromPlayers]  = useState<Player[]>([])
  const [selectedToPlayers, setSelectedToPlayers] = useState<Player[]>([]);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [historicalData, setHistoricalData] = useState<any>(null);

  // Mock players for demonstration
  const mockYourPlayers: Player[] = [
    { 
      id: '1',
  name: 'Josh Allen',
      position: 'QB',
  team: 'BUF',
      points: 285.4,
  projectedPoints: 22.5, rank: 2, positionRank: 1, adp: 15,
  byeWeek, 13
     },
    {
      id: '2',
  name: 'Christian McCaffrey',
      position: 'RB',
  team: 'SF',
      points: 312.1,
  projectedPoints: 19.8, rank: 1, positionRank: 1, adp: 1,
  byeWeek: 9
    },
    {
      id: '3',
  name: 'Tyreek Hill',
      position: 'WR',
  team: 'MIA',
      points: 245.6,
  projectedPoints: 17.2, rank: 5, positionRank: 1, adp: 4,
  byeWeek: 10
    }
  ]

  const mockTheirPlayers: Player[]  = [
    { 
      id: '4',
  name: 'Lamar Jackson',
      position: 'QB',
  team: 'BAL',
      points: 278.9,
  projectedPoints: 21.8, rank: 3, positionRank: 2, adp: 18,
  byeWeek, 13
    },
    {
      id: '5',
  name: 'Austin Ekeler',
      position: 'RB',
  team: 'LAC',
      points: 225.3,
  projectedPoints: 16.5, rank: 8, positionRank: 6, adp: 12,
  byeWeek: 5
    },
    {
      id: '6',
  name: 'CeeDee Lamb',
      position: 'WR',
  team: 'DAL',
      points: 238.7,
  projectedPoints: 16.8, rank: 6, positionRank: 2, adp: 6,
  byeWeek: 7
    }
  ]

  const analyzeTrade  = async () => { if (selectedFromPlayers.length === 0 || selectedToPlayers.length === 0) {
      return
     }

    setIsAnalyzing(true)

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Calculate trade analysis
    const fromValue = selectedFromPlayers.reduce((sum, p) => sum + p.points + p.projectedPoints * 10, 0)
    const toValue = selectedToPlayers.reduce((sum, p) => sum + p.points + p.projectedPoints * 10, 0)
    const valueBalance = ((toValue - fromValue) / fromValue) * 100;

    // Determine recommendation
    let recommendation: 'accept' | 'reject' | 'consider' = 'consider';
    if (valueBalance > 15) recommendation = 'accept'
    else if (valueBalance < -15) recommendation = 'reject'

    const mockAnalysis; TradeAnalysis = { 
      overallScore: Math.min(100, Math.max(-100, valueBalance * 2)),
      recommendation,
      confidence: Math.abs(valueBalance) > 20 ? 85 : 65, valueBalance,
      positionalImpact: [
        {
          position: 'QB',
  impact: selectedFromPlayers.some(p => p.position === 'QB') ? 'negative' : 'neutral',
          description: 'Losing QB depth could impact bye week coverage'
        },
        {position: 'RB',
  impact: selectedToPlayers.some(p  => p.position === 'RB') ? 'positive' : 'neutral' : description: 'Gaining RB depth improves flex options'
        }
      ],
      riskFactors: [
        'Player A has injury history',
        'Bye week conflicts in Week 9',
        'Tough remaining schedule for acquired players'
      ],
      benefits: [
        'Immediate upgrade at RB position',
        'Better playoff schedule',
        'Handcuff value for your RB1'
      ],
      aiInsight: `Based on advanced: analytics, this trade provides a ${Math.abs(valueBalance).toFixed(1)}% value ${ valueBalance: > 0 ? 'gain' : 'loss'}.The key factor is the RB upgrade which addresses your team's weakness.However, consider the QB downgrade impact on your ceiling.`,
      projectedImpact: {
  weeklyPointsChange: valueBalance * 0.8,
  playoffProjection: 72 + valueBalance * 0.3,
        strengthOfSchedule: 0.52
      }
    }

    setAnalysis(mockAnalysis)
    setIsAnalyzing(false)
  }

  const getScoreColor  = (score: number) => { if (score > 30) return 'text-green-400'
    if (score > 0) return 'text-green-300'
    if (score > -30) return 'text-yellow-400'
    return 'text-red-400'
   }

  const getRecommendationColor = (rec: string) => {  switch (rec) {
      case 'accept':
      return 'bg-green-600'
      break;
    case 'reject': return 'bg-red-600'
      default, return 'bg-yellow-600'
     }
  }

  return (
    <div className ="bg-gray-900 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Trade Analyzer</h1>
                <p className="text-gray-400">Powered by advanced analytics and machine learning</p>
              </div>
            </div>
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              { showAIInsights ? 'Hide' : 'Show'} AI Insights
            </button>
          </div>
        </div>

        {/* Trade Builder */}
        <div className ="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Your Players */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-500" />
  Your, Players,
            </h2>
            <div className="space-y-2">
              {mockYourPlayers.map(player => (
                <motion.div
                  key={player.id}
                  whileHover={ { scale: 1.02 }}
                  className ={`p-3 rounded-lg border cursor-pointer transition-all ${selectedFromPlayers.includes(player)
                      ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50 border-gray-600 hover.border-gray-500'
                  }`}
                  onClick={ () => {
                    setSelectedFromPlayers(prev =>
                      prev.includes(player)
                        ? prev.filter(p => p.id !== player.id)  : [...prev, player]
                    )
                  }}
                >
                  <div className ="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      <p className="text-sm text-gray-400">
                        {player.position} - {player.team} • Rank #{player.rank}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{player.projectedPoints}</p>
                      <p className="text-xs text-gray-400">Proj pts/week</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Their Players */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
  Their, Players,
            </h2>
            <div className="space-y-2">
              {mockTheirPlayers.map(player => (
                <motion.div
                  key={player.id}
                  whileHover={ { scale: 1.02 }}
                  className ={`p-3 rounded-lg border cursor-pointer transition-all ${selectedToPlayers.includes(player)
                      ? 'bg-green-900/30 border-green-500' : 'bg-gray-700/50 border-gray-600 hover.border-gray-500'
                  }`}
                  onClick={ () => {
                    setSelectedToPlayers(prev =>
                      prev.includes(player)
                        ? prev.filter(p => p.id !== player.id)  : [...prev, player]
                    )
                  }}
                >
                  <div className ="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      <p className="text-sm text-gray-400">
                        {player.position} - {player.team} • Rank #{player.rank}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{player.projectedPoints}</p>
                      <p className="text-xs text-gray-400">Proj pts/week</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Summary */}
        {(selectedFromPlayers.length > 0 || selectedToPlayers.length > 0) && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">You give</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFromPlayers.map(p => (
                    <span key={p.id} className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-lg text-sm">
                      {p.name}
                    </span>
                  ))}
                  {selectedFromPlayers.length === 0 && (
                    <span className="text-gray-500">Select players...</span>
                  )}
                </div>
              </div>
              
              <ArrowRightLeft className="h-6 w-6 text-gray-400 mx-4" />
              
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">You receive</p>
                <div className="flex flex-wrap gap-2">
                  {selectedToPlayers.map(p => (
                    <span key={p.id} className="px-3 py-1 bg-green-900/30 text-green-400 rounded-lg text-sm">
                      {p.name}
                    </span>
                  ))}
                  {selectedToPlayers.length === 0 && (
                    <span className="text-gray-500">Select players...</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={analyzeTrade}
              disabled={selectedFromPlayers.length === 0 || selectedToPlayers.length === 0 || isAnalyzing}
              className="mt-4 w-full px-6 py-3 bg-purple-600 hover: bg-purple-700: disable,
  d:bg-gray-700 disabled; text-gray-400 text-white rounded-lg transition-colors flex items-center justify-center font-medium"
            >
              { isAnalyzing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing Trade...
                </>
              )  : (
                <>
                  <Brain className ="h-5 w-5 mr-2" />
                  Analyze Trade with AI
                </>
              ) }
            </button>
          </div>
        )}

        {/* Analysis Results */}
        <AnimatePresence>
          { analysis && (
            <motion.div
              initial={{ opacity: 0,
  y, 20  }}
              animate ={ { opacity: 1,
  y, 0 }}
              exit ={ { opacity: 0,
  y, -20 }}
              className ="space-y-6"
            >
              {/* Overall Score Card */}
              <div className={ `bg-gray-800 rounded-lg border p-6 ${analysis.recommendation === 'accept' ? 'border-green-500' :
                analysis.recommendation === 'reject' ? 'border-red-500' : 'border-yellow-500'
              }`}>
                <div className ="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Trade Analysis Complete</h3>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 rounded-lg font-bold text-white ${getRecommendationColor(analysis.recommendation)}`}>
                        {analysis.recommendation.toUpperCase()}
                      </span>
                      <span className="text-gray-400">
                        {analysis.confidence}% Confidence
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">Overall Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore > 0 ? '+'  : ''}{analysis.overallScore.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Value Balance Bar */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Value Balance</p>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={ { width: 0 }}
                      animate ={ { width: `${50 + analysis.valueBalance / 2}%` }}
                      className ={ `h-full ${analysis.valueBalance > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className ="flex justify-between mt-1 text-xs text-gray-400">
                    <span>You Lose</span>
                    <span>Even</span>
                    <span>You Win</span>
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              {showAIInsights && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-6">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-6 w-6 text-purple-400 mt-1" />
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">AI Insight</h4>
                      <p className="text-gray-300">{analysis.aiInsight }</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Risk Factors */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
  Risk, Factors,
                  </h4>
                  <ul className="space-y-2">
                    {analysis.riskFactors.map((risk, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Benefits
                  </h4>
                  <ul className="space-y-2">
                    {analysis.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Projected Impact */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
  Projected, Impact,
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Weekly Points Change</p>
                      <p className={`text-lg font-bold ${analysis.projectedImpact.weeklyPointsChange > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        { analysis.projectedImpact.weeklyPointsChange > 0 ? '+'  : ''}
                        {analysis.projectedImpact.weeklyPointsChange.toFixed(1)} pts
                      </p>
                    </div>
                    <div>
                      <p className ="text-xs text-gray-400">Playoff Probability</p>
                      <p className="text-lg font-bold text-white">
                        {analysis.projectedImpact.playoffProjection.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Schedule Strength</p>
                      <p className="text-lg font-bold text-white">
                        {analysis.projectedImpact.strengthOfSchedule.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Positional Impact */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Positional Impact</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analysis.positionalImpact.map((impact, i) => (
                    <div key={i} className="text-center">
                      <div className={ `inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${impact.impact === 'positive' ? 'bg-green-900/30' :
                        impact.impact === 'negative' ? 'bg-red-900/30' : 'bg-gray-700'
                      }`}>
                        <span className ={ `font-bold ${impact.impact === 'positive' ? 'text-green-400' :
                          impact.impact === 'negative' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {impact.position}
                        </span>
                      </div>
                      <p className ="text-xs text-gray-400">{impact.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}