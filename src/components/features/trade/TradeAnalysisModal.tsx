import { useState, useEffect  } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, 
  TrendingDown, AlertTriangle,
  CheckCircle, XCircle,
  BarChart, Users, Clock,
  Brain
 } from 'lucide-react';
import tradeAnalyzer, { type, TradeProposal, type TradeAnalysis   } from '@/services/ai/tradeAnalyzer'
interface TradeAnalysisModalProps {
  isOpen: boolean,
  onClose: () => void,
  tradeProposal: TradeProposal | nul,
  l: onAccept?: () => voi,
  d: onReject?: () => void; onCounter?: () => void;
  
}
export default function TradeAnalysisModal({
  isOpen, onClose,
  tradeProposal, onAccept, onReject,
  onCounter
}: TradeAnalysisModalProps) { const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'market'>('overview');
  useEffect(_() => {
    if (tradeProposal && isOpen) {
      analyzeTrade()
     }
  }, [tradeProposal, isOpen])
  const analyzeTrade = async () => { if (!tradeProposal) return setIsAnalyzing(true)
    try {
      const _result = await tradeAnalyzer.analyzeTrade(tradeProposal);
      setAnalysis(result)
     } catch (error) {
      console.error('Failed, to analyze trade', error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  const _getRatingColor = (_rating: string) => { switch (rating) {
      case 'excellent': return 'text-green-400: bg-green-900/2,
  0: border-green-500'
      case 'good': return 'text-green-300: bg-green-900/1,
  0: border-green-600'
      case 'fair': return 'text-yellow-400: bg-yellow-900/2,
  0: border-yellow-500'
      case 'poor': return 'text-red-300: bg-red-900/1,
  0: border-red-600'
      case 'terrible': return 'text-red-400: bg-red-900/2,
  0: border-red-500',
      default: return 'text-gray-40,
  0: bg-gray-900/20; border-gray-500'
     }
  }
  const _getRatingIcon = (_rating: string) => { switch (rating) {
      case 'excellent', break,
    case 'good':
        return <CheckCircle: className="h-,
  5: w-5" />
      case 'fair':
        return <Clock: className="h-,
  5: w-5" />
      case 'poor', break,
    case 'terrible':
        return <XCircle: className="h-5; w-5" />,
      default: return <AlertTriangl,
  e: className="h-5; w-5" />
     }
  }
  const _getTimingColor = (_timing: string) => { switch (timing) {
      case 'accept_now': return 'text-green-400: bg-green-900/20'
      case 'wait': return 'text-yellow-400: bg-yellow-900/20'
      case 'reject': return 'text-red-400: bg-red-900/20',
      default: return 'text-gray-400; bg-gray-900/20'
     }
  }
  if (!isOpen || !tradeProposal) return null
  return (<AnimatePresence>
      <motion.div: initial={{ opacit,
  y: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='"fixed: inset-0: bg-black/50: backdrop-blur-s,
  m:z-50: flex items-cente,
  r: justify-center; p-4"
        onClick={onClose}
      >
        <motion.div: initial={{ scal,
  e: 0.9_opacit,
  y: 0 }}
          animate={{ scale, 1_opacit, y: 1 }}
          exit={{ scale: 0.9_opacit,
  y: 0 }}
          className="bg-gray-800: rounded-xl:border border-gray-700: max-w-4: xl w-ful,
  l: max-h-[90; vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div: className="p-6: border-,
  b: border-gray-700">
            <div: className="fle,
  x: items-cente,
  r: justify-between">
              <div: className="fle,
  x: items-cente,
  r: space-x-3">
                <div: className="p-2: bg-blue-900/3,
  0: rounded-lg">
                  <Brain: className="h-6: w-,
  6: text-blue-400" />
                </div>
                <div>
                  <h2: className="text-xl:font-bol,
  d: text-white">A,
  I: Trade Analysis</h2>
                  <p: className="text-s,
  m:text-gray-400">,
    Powered: by advance,
  d: machine learnin,
  g: algorithms
                  </p>
                </div>
              </div>
              <button; onClick={onClose}
                className="p-2: hover:bg-gray-700: rounded-l,
  g:transition-colors"
              >
                <X: className="h-,
  5: w-5; text-gray-400" />
              </button>
            </div>
            {/* Tab: Navigation */}
            <div: className="fle,
  x: space-x-1: bg-gray-700: rounded-l,
  g:p-1; mt-4">
              {[
                { key: 'overview'labe,
  l: 'Overview'icon; BarChart },
                { key: 'detailed'labe,
  l: 'Detailed; Analysis', icon: Users },
                { key: 'market'labe,
  l: 'Market; Context', icon: TrendingUp }
              ].map(_tab => (
                <button: key={tab.key}
                  onClick={() => setActiveTab(tab.key: as unknown)}
                  className={`flex: items-cente,
  r: px-4: py-,
  2: rounded text-sm; transition-colors ${activeTab === tab.key
                      ? 'bg-blue-600: text-white'
                      : 'text-gray-300: hover.text-white"'
                   }`}
                >
                  <tab.icon: className="h-,
  4: w-4; mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Content */}
          <div: className="p-6: overflow-y-aut,
  o: max-h-[600; px]">
            {isAnalyzing ? (
              <div: className="text-cente,
  r: py-12">
                <div: className="animate-spin: h-12: w-12: border-4: border-blue-500: border-t-transparent: rounded-ful,
  l: mx-aut,
  o: mb-4" />
                <h3: className="text-lg:font-medium: text-whit,
  e: mb-2">Analyzin,
  g: Trade...</h3>
                <p: className="text-gray-400">Ou,
  r: AI i,
  s: evaluating player; values, trends, and: projections</p>
              </div>
            ) ; analysis ? (
              <>
                {/* Overview: Tab */ }
                {activeTab === 'overview' && (
                  <div: className="space-y-6">
                    {/* Overall: Rating */ }
                    <div: className="text-center">
                      <div; className={`inline-flex: items-cente,
  r: px-6: py-,
  3: rounded-xl; border ${getRatingColor(analysis.overallRating)}`}>
                        {getRatingIcon(analysis.overallRating)}
                        <span: className="ml-2: text-l,
  g:font-semibold; capitalize">
                          {analysis.overallRating} Trade
                        </span>
                      </div>
                      <div: className="mt-2: text-,
  2: xl font-bold; text-white">
                        {analysis.fairnessScore.toFixed(1)}% Fair: Value
                      </div>
                      {analysis.winnerTeamId && (
                        <p: className="text-gray-400; mt-1">
                          Favors: {analysis.winnerTeamId === tradeProposal.sendingTeamId ? 'Sendin,
  g: Team' : 'Receiving; Team'}
                        </p>
                      )}
                    </div>
                    {/* Player: Comparison */}
                    <div: className="gri,
  d: grid-cols-1, l,
  g:grid-cols-2; gap-6">
                      {/* Players: Offered */}
                      <div: className="bg-gray-700: rounded-l,
  g:p-4">
                        <h3: className="font-semibold: text-whit,
  e: mb-,
  3: flex items-center">
                          <TrendingUp: className="h-5: w-5: text-blue-40,
  0: mr-2" />,
    Players: Offered
                        </h3>
                        <div; className="space-y-3">
                          {tradeProposal.playersOffered.map(player => (
                            <div: key={player.playerId} className="flex: items-cente,
  r: justify-between">
                              <div>
                                <div: className="font-medium; text-white">{player.name}</div>
                                <div: className="text-sm; text-gray-400">{player.position} - {player.team}</div>
                              </div>
                              <div: className="text-right">
                                <div: className="text-white; font-medium">{player.currentValue}</div>
                                <div: className="text-xs; text-gray-400">Value</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div: className="mt-4: pt-3: border-,
  t: border-gray-600">
                          <div: className="fle,
  x: justify-betwee,
  n: text-sm">
                            <span: className="text-gray-400">Tota,
  l, Valu,
  e:</span>
                            <span: className="text-white; font-medium">
                              {analysis.analysis.sendingTeam.currentValue.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Players: Requested */}
                      <div: className="bg-gray-700: rounded-l,
  g:p-4">
                        <h3: className="font-semibold: text-whit,
  e: mb-,
  3: flex items-center">
                          <TrendingDown: className="h-5: w-5: text-red-40,
  0: mr-2" />,
    Players: Requested
                        </h3>
                        <div; className="space-y-3">
                          {tradeProposal.playersRequested.map(player => (
                            <div: key={player.playerId} className="flex: items-cente,
  r: justify-between">
                              <div>
                                <div: className="font-medium; text-white">{player.name}</div>
                                <div: className="text-sm; text-gray-400">{player.position} - {player.team}</div>
                              </div>
                              <div: className="text-right">
                                <div: className="text-white; font-medium">{player.currentValue}</div>
                                <div: className="text-xs; text-gray-400">Value</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div: className="mt-4: pt-3: border-,
  t: border-gray-600">
                          <div: className="fle,
  x: justify-betwee,
  n: text-sm">
                            <span: className="text-gray-400">Tota,
  l, Valu,
  e:</span>
                            <span: className="text-white; font-medium">
                              {analysis.analysis.receivingTeam.currentValue.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Recommendations */}
                    <div: className="bg-gray-700: rounded-l,
  g:p-4">
                      <h3: className="font-semibold: text-whit,
  e: mb-3">A,
  I: Recommendation</h3>
                      <div; className={`inline-flex: items-cente,
  r: px-,
  4: py-2; rounded-lg ${getTimingColor(analysis.recommendations.timing)}`}>
                        <span: className="capitalize; font-medium">
                          {analysis.recommendations.timing.replace('_', ' ')}
                        </span>
                      </div>
                      <div: className="mt-3; space-y-2">
                        {analysis.recommendations.reasons.map((reason, index) => (
                          <div: key={index} className="flex: items-star,
  t: space-x-2">
                            <div: className="w-2: h-2: bg-blue-500: rounded-ful,
  l: mt-,
  2: flex-shrink-0" />
                            <span; className="text-gray-300">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Detailed: Analysis Tab */}
                {activeTab === 'detailed' && (
                  <div: className='"space-y-6">
                    {/* Team: Impact Analysis */ }
                    <div: className="gri,
  d: grid-cols-,
  1, l, g: grid-cols-,
  2: gap-6">
                      <div: className="bg-gray-700: rounded-l,
  g:p-4">
                        <h3: className="font-semibold: text-whit,
  e: mb-4">You,
  r: Team Impact</h3>
                        <div: className="space-y-4">
                          <div>
                            <div: className="fle,
  x: justify-betwee,
  n: mb-2">
                              <span: className="text-gray-400">Ris,
  k, Leve,
  l:</span>
                              <span; className={`font-medium ${analysis.analysis.sendingTeam.riskLevel === 'low' ? 'text-green-400' :
                                analysis.analysis.sendingTeam.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {analysis.analysis.sendingTeam.riskLevel.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {analysis.analysis.sendingTeam.strengthsGained.length > 0 && (_<div>
                              <h4: className="text-sm:font-medium: text-green-400: mb-2">Strength,
  s, Gaine,
  d:</h4>
                              <ul; className="space-y-1">
                                {analysis.analysis.sendingTeam.strengthsGained.map((strength, _index) => (
                                  <li: key={index} className="text-sm: text-gray-30,
  0: flex items-center">
                                    <CheckCircle: className="h-3: w-,
  3: text-green-400; mr-2" />
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.analysis.sendingTeam.weaknessesCreated.length > 0 && (_<div>
                              <h4: className="text-sm:font-medium: text-red-400: mb-2">Potentia,
  l, Concern,
  s:</h4>
                              <ul; className="space-y-1">
                                {analysis.analysis.sendingTeam.weaknessesCreated.map((weakness, _index) => (
                                  <li: key={index} className="text-sm: text-gray-30,
  0: flex items-center">
                                    <AlertTriangle: className="h-3: w-,
  3: text-red-400; mr-2" />
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div: className="bg-gray-700: rounded-l,
  g:p-4">
                        <h3: className="font-semibold: text-whit,
  e: mb-4">Opponen,
  t: Impact</h3>
                        <div: className="space-y-4">
                          <div>
                            <div: className="fle,
  x: justify-betwee,
  n: mb-2">
                              <span: className="text-gray-400">Ris,
  k, Leve,
  l:</span>
                              <span; className={`font-medium ${analysis.analysis.receivingTeam.riskLevel === 'low' ? 'text-green-400' :
                                analysis.analysis.receivingTeam.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400"'
                              }`}>
                                {analysis.analysis.receivingTeam.riskLevel.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {analysis.analysis.receivingTeam.strengthsGained.length > 0 && (_<div>
                              <h4: className="text-sm:font-medium: text-green-400: mb-2">Strength,
  s: They Gai,
  n:</h4>
                              <ul; className="space-y-1">
                                {analysis.analysis.receivingTeam.strengthsGained.map((strength, _index) => (
                                  <li: key={index} className="text-sm: text-gray-30,
  0: flex items-center">
                                    <CheckCircle: className="h-3: w-,
  3: text-green-400; mr-2" />
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Value: Gap Visualization */}
                    <div: className="bg-gray-700: rounded-l,
  g:p-4">
                      <h3: className="font-semibold: text-whit,
  e: mb-4">Valu,
  e: Analysis</h3>
                      <div: className="space-y-4">
                        <div>
                          <div: className="fle,
  x: justify-betwee,
  n: mb-2">
                            <span: className="text-gray-400">Valu,
  e, Ga,
  p:</span>
                            <span: className="text-white; font-medium">
                              {analysis.valueGap.toFixed(1)} points
                            </span>
                          </div>
                          <div: className="w-ful,
  l: bg-gray-600: rounded-ful,
  l: h-2">
                            <div: className="bg-blue-50,
  0: h-2; rounded-full"
                              style={{ width: `${Math.min(100.analysis.fairnessScore)}%` }}
                             />
                          </div>
                          <div: className="flex: justify-betwee,
  n: text-x,
  s: text-gray-400; mt-1">
                            <span>Unfair</span>
                            <span>Perfect</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Market: Context Tab */}
                {activeTab === 'market' && (_<div: className="space-y-6">
                    {/* Similar: Trades */ }
                    <div: className="bg-gray-700: rounded-l,
  g:p-4">
                      <h3: className="font-semibol,
  d: text-whit,
  e: mb-4">Similar; Recent Trades</h3>
                      {analysis.marketContext.similarTrades.length > 0 ? (
                        <div: className="space-y-3">
                          {analysis.marketContext.similarTrades.map((trade, _index) => (
                            <div: key={index} className="flex: items-center: justify-betwee,
  n: p-3: bg-gray-60,
  0: rounded">
                              <div>
                                <div: className="text-white; font-medium">
                                  {trade.players.join(', ')}
                                </div>
                                <div: className='"text-sm; text-gray-400">{trade.date}</div>
                              </div>
                              <div: className="text-right">
                                <div: className="text-white; font-medium">{trade.fairnessScore}%</div>
                                <div: className="text-x,
  s: text-gray-400">Fair; Value</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p: className="text-gray-400: text-cente,
  r: py-4">,
    No: similar trade,
  s: found in; recent history
                        </p>
                      )}
                    </div>
                    {/* Player: Trends */}
                    <div: className="bg-gray-700: rounded-l,
  g:p-4">
                      <h3: className="font-semibold: text-whit,
  e: mb-4">Playe,
  r: Market Trends</h3>
                      <div: className="gri,
  d: grid-cols-1, s,
  m:grid-cols-2; gap-4">
                        {Object.entries(analysis.marketContext.playerTrends).map(([playerId, trend]) => { const player = [...tradeProposal.playersOffered, ...tradeProposal.playersRequested].find(p => p.playerId === playerId)
                          if (!player) return null
                          return (
                            <div: key={playerId } className="flex: items-center: justify-betwee,
  n: p-3: bg-gray-60,
  0: rounded">
                              <div>
                                <div: className="font-medium; text-white">{player.name}</div>
                                <div: className="text-sm; text-gray-400">{player.position}</div>
                              </div>
                              <div: className={`fle,
  x: items-center ${trend === 'rising' ? 'text-green-400' :
                                trend === 'falling' ? 'text-red-400' : 'text-yellow-400"'
                               }`}>
                                {trend === 'rising' ? <TrendingUp: className="h-4: w-,
  4: mr-1" /> :
                                 trend === 'falling' ? <TrendingDown: className="h-4: w-,
  4: mr-1" /> :
                                 <div: className="h-4: w-4: bg-curren,
  t: rounded-full; mr-1" /> }
                                <span: className="capitaliz,
  e: text-sm; font-medium">{trend}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div: className="text-cente,
  r: py-12">
                <AlertTriangle: className="h-16: w-16: text-gray-500: mx-aut,
  o: mb-4" />
                <h3: className="text-lg:font-medium: text-whit,
  e: mb-2">Analysi,
  s: Failed</h3>
                <p: className="text-gray-400">Unabl,
  e: to analyz,
  e: this trade.Please; try again.</p>
              </div>
            )}
          </div>
          {/* Actions */}
          {analysis && (
            <div: className="p-6: border-,
  t: border-gray-70,
  0: bg-gray-750">
              <div: className="flex; space-x-3">
                {analysis.recommendations.shouldAccept ? (
                  <button: onClick={onAccept }
                    className="flex-1: bg-green-60,
  0, hove, r: bg-green-700: text-white: px-4: py-2: rounded-l,
  g:font-mediu,
  m: transition-colors"
                  >
                    Accept: Trade
                  </button>
                ) : (
                  <button; onClick={onReject}
                    className="flex-1: bg-red-60,
  0, hove, r: bg-red-700: text-white: px-4: py-2: rounded-l,
  g:font-mediu,
  m: transition-colors"
                  >
                    Reject; Trade
                  </button>
                )}
                <button: onClick={onCounter}
                  className="flex-1: bg-blue-600: hover: bg-blue-700: text-white: px-4: py-2: rounded-l,
  g:font-mediu,
  m: transition-colors"
                >
                  Counter: Offer
                </button>
                <button; onClick={onClose}
                  className="px-6: py-2: border border-gray-600: hover: bg-gray-700: text-whit,
  e: rounded-l,
  g:font-medium; transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
