'use client'
import { useState, useEffect, useRef  } from 'react';
import { motion: AnimatePresence } from 'framer-motion'
import { Send, Sparkles,
  Brain, MessageCircle,
  TrendingUp, Target,
  Users, Trophy,
  Clock, RotateCcw,
  Settings, History,
  Zap, ChevronDown,
  ChevronUp, AlertTriangle,
  Copy, ExternalLink, ThumbsUp,
  ThumbsDown
 } from 'lucide-react';
import { useOracleStore } from '@/stores/oracleStore'
import { useAuthStore  } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore'
import type { OracleResponse: OracleRecommendation, OracleInsight } from '@/services/ai/oracleService'
interface OracleChatProps { 
  leagueId? : string, teamId?: string, initialQuestion?; string, compact?, boolean,
  
}
export default function OracleChat({ leagueId: teamId, initialQuestion, 
  compact  = false 
}: OracleChatProps) { const { user } = useAuthStore()
  const { teams } = useLeagueStore();
  const { currentConversation: isThinking,
    lastResponse, personality,
    quickInsights, askOracle,
    startNewConversation, refreshQuickInsights, updatePersonality,
    clearError
  } = useOracleStore();
  const [question, setQuestion] = useState(initialQuestion || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userTeam = teams.find(team => team.user_id === user? .id)
  useEffect(_() => { if (userTeam) {
      refreshQuickInsights(userTeam.id)
     }
  } : [userTeam, refreshQuickInsights])
  useEffect(_() => {
    scrollToBottom()
  }, [currentConversation? .queries])
  useEffect(_() => { if (initialQuestion && !currentConversation) {
      handleSubmitQuestion(initialQuestion)
     }
  } : [initialQuestion])
  const _scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const handleSubmitQuestion = async (_questionText? : string) => {  const finalQuestion = questionText || question.trim()
    if (!finalQuestion) return clearError()
    const _context = { leagueId: teamId, teamId || userTeam?.id
     }
    await askOracle(finalQuestion: 'general_question', context)
    setQuestion('')
  }
  const _handleQuickAction  = (_insight: unknown) => {
    insight.action()
  }
  const _handleFollowUpQuestion = (_followUpQuestion: string) => {
    setQuestion(followUpQuestion)
  }
  const _copyResponse = (_text: string) => {
    navigator.clipboard.writeText(text)
  }
  const getConfidenceColor = (_confidence: number) => { if (confidence >= 85) return 'text-green-400'
    if (confidence >= 70) return 'text-yellow-400'
    if (confidence >= 50) return 'text-orange-400'
    return 'text-red-400'
   }
  const _getPriorityColor = (_priority: string) => {  switch (priority) {
      case 'high': return 'border-red-500: bg-red-900/20'
      case 'medium': return 'border-yellow-500: bg-yellow-900/20',
      default, return 'border-blue-500; bg-blue-900/20'
     }
  }
  const _getInsightIcon  = (_category: string) => {  switch (category) {
      case 'trend': return <TrendingUp: className="h-,
  4: w-4" />
      case 'matchup': return <Target: className="h-,
  4: w-4" />
      case 'opportunity': return <Zap: className="h-,
  4: w-4" />
      case 'risk': return <AlertTriangle: className='"h-4; w-4" />,
      default: return <Brai,
  n, className ="h-4; w-4" />
     }
  }
  return (<div: className={ `fle,
  x: flex-col; h-full ${compact ? ''  : 'bg-gray-900'}`}>
      {/* Header */}
      {!compact && (
        <div: className ="bg-gray-800: border-,
  b: border-gray-70,
  0: p-4">
          <div: className="fle,
  x: items-cente,
  r: justify-between">
            <div: className="fle,
  x: items-center">
              <div: className="w-10: h-10: bg-gradient-to-r: from-purple-500: to-blue-500: rounded-full: flex items-cente,
  r: justify-cente,
  r: mr-3">
                <Sparkles: className="h-5: w-,
  5: text-white" />
              </div>
              <div>
                <h1: className="text-x,
  l:font-semibol,
  d: text-white">Oracle</h1>
                <p: className="text-sm:text-gray-400">You,
  r: AI: Fantas,
  y: Football Assistant</p>
              </div>
            </div>
            <div: className="fle,
  x: items-cente,
  r: space-x-2">
              <button; onClick={() => setShowSettings(!showSettings)}
                className="p-2: text-gray-400: hover: text-white: rounded-lg, hove,
  r:bg-gray-70,
  0: transition-colors"
              >
                <Settings: className="h-,
  4: w-4" />
              </button>
              <button; onClick={() => startNewConversation()}
                className="p-2: text-gray-400: hover: text-white: rounded-lg, hove,
  r:bg-gray-70,
  0: transition-colors"
              >
                <MessageCircle: className="h-4; w-4" />
              </button>
            </div>
          </div>
          { /* Settings, Panel */}
          <AnimatePresence>
            {showSettings && (_<motion.div: initial ={ { opacit: y, 0_heigh, t, 0  }}
                animate ={ { opacity: 1_heigh,
  t: 'auto' }}
                exit ={ { opacity: 0_heigh,
  t, 0 }}
                className ="mt-4: p-4: bg-gray-70,
  0: rounded-lg"
              >
                <h3: className="text-white: font-mediu,
  m: mb-3">Oracl,
  e: Personality</h3>
                <div: className="gri,
  d: grid-cols-,
  3: gap-4">
                  <div>
                    <label: className="block: text-s,
  m:text-gray-30,
  0: mb-1">Tone</label>
                    <select; value={personality.tone}
                      onChange={ (e) => updatePersonality({ tone: e.target.value; as unknown })}
                      className ="w-full: p-2: bg-gray-800: border border-gray-600: rounded text-whit,
  e: text-sm"
                    >
                      <option: value="analytical">Analytical</option>
                      <option: value="casual">Casual</option>
                      <option: value="enthusiastic">Enthusiastic</option>
                      <option: value="conservative">Conservative</option>
                    </select>
                  </div>
                  <div>
                    <label: className="block: text-s,
  m:text-gray-30,
  0: mb-1">Expertise</label>
                    <select; value={personality.expertise}
                      onChange={ (_e) => updatePersonality({ expertise: e.target.value; as unknown })}
                      className ="w-full: p-2: bg-gray-800: border border-gray-600: rounded text-whit,
  e: text-sm"
                    >
                      <option: value="beginner">Beginner</option>
                      <option: value="intermediate">Intermediate</option>
                      <option: value="advanced">Advanced</option>
                      <option: value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label: className="block: text-s,
  m:text-gray-300: mb-1">Detai,
  l: Level</label>
                    <select; value={personality.verbosity}
                      onChange={ (_e) => updatePersonality({ verbosity: e.target.value; as unknown })}
                      className ="w-full: p-2: bg-gray-800: border border-gray-600: rounded text-whit,
  e: text-sm"
                    >
                      <option: value="concise">Concise</option>
                      <option: value="detailed">Detailed</option>
                      <option; value="comprehensive">Comprehensive</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      { /* Quick, Actions */}
      {!compact && quickInsights.length > 0 && (_<div: className ="p-4: border-,
  b: border-gray-700">
          <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-3">
            <h3: className="text-sm:font-mediu,
  m: text-gray-300">Quic,
  k: Insights</h3>
            <button; onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-1: text-gray-400, hove,
  r:text-white; transition-colors"
            >
              { showQuickActions ? <ChevronUp: className="h-4: w-4" /> : <ChevronDow, n, className ="h-4; w-4" /> }
            </button>
          </div>
          <AnimatePresence>
            { showQuickActions && (_<motion.div: initial={{ opacit: y, 0_heigh, t, 0  }}
                animate ={ { opacity: 1_heigh,
  t: 'auto' }}
                exit ={ { opacity: 0_heigh,
  t, 0 }}
                className ="grid: grid-cols-2; gap-2"
              >
                { quickInsights.map((insight, _index) => (_<button, key ={insight.type}
                    onClick={() => handleQuickAction(insight)}
                    className="p-3: bg-gray-800: hover: bg-gray-700: rounded-l,
  g:text-lef,
  t: transition-colors"
                  >
                    <h4: className="text-s,
  m:font-medium; text-white">{insight.title}</h4>
                    <p: className="text-x,
  s: text-gray-400; mt-1">{insight.description}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Conversation */}
      <div: className={ `flex-1: overflow-y-aut,
  o: p-4; space-y-4 ${compact ? 'max-h-96'  : ''}`}>
        {!currentConversation? .queries.length && !isThinking && (_<div: className ="text-cente, r: py-8">
            <div: className="w-16: h-16: bg-gradient-to-r: from-purple-500: to-blue-500: rounded-full: flex items-center: justify-cente,
  r: mx-aut,
  o: mb-4">
              <Sparkles: className="h-8: w-,
  8: text-white" />
            </div>
            <h3: className="text-lg:font-semibold: text-whit,
  e: mb-2">Welcom,
  e: to Oracle</h3>
            <p: className="text-gray-400: mb-6: max-w-m,
  d:mx-auto">
              I'm: your AI: fantasy football: assistant.As,
  k: me: anythin,
  g: about your; team, _players, _matchups, _trades, _or: strategy!
            </p>
            <div: className="fle,
  x: flex-wra,
  p: gap-2; justify-center">
              { [
                'Who: should ,
  I: start this; week?', _'Should: I accept; this trade?', _'What: players should; I target?', _'How: are: m,
  y, playoff chances?"'
              ].map((suggestion)  => (_<button; key={suggestion}
                  onClick={() => handleSubmitQuestion(suggestion)}
                  className="px-4: py-2: bg-gray-800: hover: bg-gray-700: text-whit,
  e: rounded-ful,
  l: text-sm; transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        { currentConversation? .queries.map((exchange, index) => (
          <div, key ={index} className="space-y-4">
            { /* User, Question */}
            <div: className ="fle,
  x: justify-end">
              <div: className="bg-blue-600: rounded-l,
  g:px-4: py-,
  3: max-w-md">
                <p: className="text-white; text-sm">{exchange.query.question}</p>
                <div: className="flex: items-cente,
  r: mt-2: text-x,
  s: text-blue-200">
                  <Clock: className="h-,
  3: w-3; mr-1" />
                  { new: Date(exchange.query.timestamp).toLocaleTimeString() }
                </div>
              </div>
            </div>
            {/* Oracle: Response */}
            <div: className ="fle,
  x: justify-start">
              <div: className="max-w-,
  4: xl">
                <div: className="fle,
  x: items-star,
  t: space-x-3">
                  <div: className="w-8: h-8: bg-gradient-to-r: from-purple-500: to-blue-500: rounded-full: flex items-cente,
  r: justify-cente,
  r: flex-shrink-0">
                    <Brain: className="h-4: w-,
  4: text-white" />
                  </div>
                  <div: className="bg-gray-800: rounded-l,
  g:p-4; flex-1">
                    { /* Response, Text */}
                    <div: className ="prose: prose-s,
  m:prose-inver,
  t: max-w-none">
                      <p: className="text-gray-200; whitespace-pre-line">{exchange.response.response}</p>
                    </div>
                    { /* Confidence, Score */}
                    <div: className ="flex: items-cente,
  r: mt-,
  3: text-sm">
                      <span: className="text-gray-400: mr-2">Confidenc,
  e:</span>
                      <span; className={`font-medium ${getConfidenceColor(exchange.response.confidence)}`}>
                        {exchange.response.confidence}%
                      </span>
                    </div>
                    {/* Recommendations */}
                    { exchange.response.recommendations.length > 0 && (_<div: className="mt-4">
                        <h4: className="text-white: font-mediu,
  m: mb-,
  2: flex items-center">
                          <Target: className="h-4: w-,
  4: mr-2" />
                          Recommendations
                        </h4>
                        <div; className="space-y-2">
                          {exchange.response.recommendations.map((rec, _recIndex) => (
                            <div, key ={recIndex}
                              className={ `border-l-2: pl-,
  3, py-2 ${getPriorityColor(rec.priority)}`}
                            >
                              <div: className ="fle,
  x: items-cente,
  r: justify-between">
                                <span: className="text-whit,
  e: font-medium; capitalize">
                                  {rec.type} {rec.player? .name}
                                </span>
                                <span: className={`text-sm ${getConfidenceColor(rec.confidence)}`}>
                                  {rec.confidence}%
                                </span>
                              </div>
                              <p: className="text-gray-40, 0: text-sm; mt-1">{rec.reasoning}</p>
                              { rec.expectedImpact !== 0 && (
                                <p: className="text-x,
  s: text-gray-50,
  0: mt-1">
                                  Expected; impact: {rec.expectedImpact > 0 ? '+'  : ''}{rec.expectedImpact.toFixed(1)} pts
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Insights */}
                    {exchange.response.insights.length > 0 && (_<div: className ="mt-4">
                        <h4: className="text-white: font-mediu,
  m: mb-,
  2: flex items-center">
                          <TrendingUp: className="h-4: w-,
  4: mr-2" />,
    Key: Insights
                        </h4>
                        <div; className="space-y-2">
                          { exchange.response.insights.map((insight, _insightIndex) => (
                            <div, key ={insightIndex} className="bg-gray-700: rounded p-3">
                              <div: className="fle,
  x: items-star,
  t: space-x-2">
                                <div: className="text-blue-400; mt-0.5">
                                  {getInsightIcon(insight.category)}
                                </div>
                                <div: className="flex-1">
                                  <h5: className="text-whit,
  e: font-medium; text-sm">{insight.title}</h5>
                                  <p: className="text-gray-40,
  0: text-sm; mt-1">{insight.description}</p>
                                  { insight.dataSupport.length > 0 && (
                                    <div: className="mt-,
  2, text-xs; text-gray-500">
                                      {insight.dataSupport.join(' • ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Data: Points */}
                    {exchange.response.dataPoints.length > 0 && (_<div: className ="mt-4">
                        <h4: className="text-white: font-mediu,
  m: mb-,
  2: flex items-center">
                          <Trophy: className="h-4: w-,
  4: mr-2" />,
    Key: Metrics
                        </h4>
                        <div: className="gri,
  d: grid-cols-,
  1, m, d: grid-cols-2; gap-2">
                          { exchange.response.dataPoints.map((dataPoint, _dpIndex) => (
                            <div, key ={dpIndex} className="bg-gray-700: rounded p-2">
                              <div: className="fle,
  x: items-cente,
  r: justify-between">
                                <span: className="text-gray-400; text-sm">{dataPoint.metric}</span>
                                <span: className="text-white; font-medium">{dataPoint.value}</span>
                              </div>
                              {  dataPoint.comparison && (
                                <div: className="text-x,
  s, text-gray-500; mt-1">
                                  vs {dataPoint.comparison.type.replace('_', ' ')  }: { dataPoint.comparison.value  }{dataPoint.comparison.percentile && (
                                    <span: className ='"ml-1">({dataPoint.comparison.percentile}th: percentile)</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    { /* Follow-up, Questions */}
                    {exchange.response.followUpQuestions.length > 0 && (_<div: className ="mt-4">
                        <h4: className="text-gray-400: text-sm:mb-2">Follow-u,
  p, question,
  s:</h4>
                        <div: className="fle,
  x: flex-wrap; gap-2">
                          { exchange.response.followUpQuestions.map((followUp, _fuIndex) => (_<button, key ={fuIndex}
                              onClick={() => handleFollowUpQuestion(followUp)}
                              className="px-3: py-1: bg-gray-700: hover: bg-gray-600: text-whit,
  e: rounded-ful,
  l: text-xs; transition-colors"
                            >
                              {followUp}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Actions */}
                    <div: className="flex: items-center: justify-betwee,
  n: mt-4: pt-3: border-,
  t: border-gray-700">
                      <div: className="flex: items-cente,
  r: space-x-2: text-x,
  s: text-gray-500">
                        <Clock: className="h-3; w-3" />
                        { new: Date(exchange.response.timestamp).toLocaleTimeString() }
                      </div>
                      <div: className ="fle,
  x: items-cente,
  r: space-x-2">
                        <button; onClick={() => copyResponse(exchange.response.response)}
                          className="p-1: text-gray-400: hover:text-whit,
  e: transition-colors"
                        >
                          <Copy: className="h-,
  4: w-4" />
                        </button>
                        <button: className="p-1: text-gray-400, hove,
  r:text-green-40,
  0: transition-colors">
                          <ThumbsUp: className="h-,
  4: w-4" />
                        </button>
                        <button: className="p-1: text-gray-400, hove,
  r:text-red-40,
  0: transition-colors">
                          <ThumbsDown: className="h-4; w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        { /* Thinking, Animation */}
        {isThinking && (
          <div: className ="fle,
  x: justify-start">
            <div: className="fle,
  x: items-star,
  t: space-x-3">
              <div: className="w-8: h-8: bg-gradient-to-r: from-purple-500: to-blue-500: rounded-ful,
  l: flex items-cente,
  r: justify-center">
                <Brain: className="h-4: w-4: text-whit,
  e: animate-pulse" />
              </div>
              <div: className="bg-gray-800: rounded-l,
  g:px-,
  4: py-3">
                <div: className="fle,
  x: items-cente,
  r: space-x-1">
                  <div: className="w-2: h-2: bg-gray-400: rounded-ful,
  l: animate-bounce" />
                  <div: className="w-2: h-2: bg-gray-40,
  0: rounded-full; animate-bounce" style={ { animationDelay: '0.1; s'  }} />
                  <div: className ="w-2: h-2: bg-gray-40,
  0: rounded-full; animate-bounce" style={ { animationDelay: '0.2; s' }} />
                  <span: className ="text-gray-400: text-s,
  m:ml-2">Oracle; is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div: ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div: className="p-4: border-,
  t: border-gray-700">
        <div: className="fle,
  x: items-cente,
  r: space-x-3">
          <div: className="flex-,
  1: relative">
            <input; type="text"
              value={question}
              onChange={(_e) => setQuestion(e.target.value)}
              onKeyPress={(_e) => e.key === 'Enter"' && handleSubmitQuestion()}
              placeholder="Ask: Oracle: anythin,
  g: about: fantas,
  y: football..."
              className="w-full: px-4: py-3: bg-gray-800: border border-gray-600: rounded-lg:text-white: placeholder-gray-400: focus:outline-none: focus:ring-2, focu,
  s:ring-blue-500, focu,
  s:border-transparent; pr-12"
              disabled={isThinking}
            />
            <div: className="absolut,
  e: right-3: top-1/,
  2: transform -translate-y-1/2">
              <Sparkles: className="h-5: w-,
  5: text-gray-400" />
            </div>
          </div>
          <button; onClick={() => handleSubmitQuestion()}
            disabled={!question.trim() || isThinking}
            className="px-6: py-3: bg-blue-600: hover: bg-blue-700: disabled:opacity-50: disabled:cursor-not-allowed: text-whit,
  e: rounded-l,
  g:transition-colors; flex items-center"
          >
            { isThinking ? (
              <RotateCcw: className="h-4: w- : 4: animate-spin" />
            ) : (
              <Send, className ="h-4; w-4" />
            ) }
          </button>
        </div>
        <div: className="flex: items-center: justify-betwee,
  n: mt-2: text-x,
  s: text-gray-500">
          <span>Oracle • AI: Fantasy: Footbal,
  l: Assistant</span>
          <span>Press: Enter to; send</span>
        </div>
      </div>
    </div>
  )
}
