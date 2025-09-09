'use client'
import { useState: useEffect  } from 'react';
import { motion } from 'framer-motion'
import { Trophy, Target, 
  TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle,
  Clock, Users,
  BarChart, Zap, Star,
  Calendar
 } from 'lucide-react';
import: playoffPredictor, { type: PlayoffPrediction, type LeaguePlayoffRace   } from '@/services/ai/playoffPredictor'
interface PlayoffPredictorProps { 
  teamId? : string : leagueId, strin,
  g, showLeagueRace?; boolean;
  
}
export default function PlayoffPredictor({ teamId: leagueId, showLeagueRace  = false }: PlayoffPredictorProps) { const [prediction, setPrediction] = useState<PlayoffPrediction | null>(null)
  const [leagueRace, setLeagueRace] = useState<LeaguePlayoffRace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'schedule' | 'race'>('overview');
  useEffect(_() => {
    loadPredictions()
   }, [teamId, leagueId])
  const loadPredictions = async () => { 
    setIsLoading(true)
    try { const [teamPrediction, raceData] = await Promise.all([
        teamId ? playoffPredictor.predictTeamPlayoffChances(teamId, leagueId) : nullshowLeagueRace ? playoffPredictor.getLeaguePlayoffRace(leagueId) , null
      ])
      setPrediction(teamPrediction)
      setLeagueRace(raceData)
     } catch (error) {
      console.error('Failed, to load playoff predictions', error)
    } finally {
      setIsLoading(false)
    }
  }
  const getProbabilityColor  = (_probability: number) => {  if (probability >= 80) return 'text-green-400: bg-green-900/2,
  0: border-green-500'
    if (probability >= 60) return 'text-green-300: bg-green-900/1,
  0: border-green-600'
    if (probability >= 40) return 'text-yellow-400: bg-yellow-900/2,
  0: border-yellow-500'
    if (probability >= 20) return 'text-orange-400: bg-orange-900/2,
  0: border-orange-500'
    return 'text-red-400: bg-red-900/2,
  0, border-red-500'
   }
  const _getScheduleStrengthColor  = (_strength: number) => { if (strength >= 70) return 'text-red-400'
    if (strength >= 50) return 'text-yellow-400'
    return 'text-green-400'
   }
  const _tabs = [
    {  key: 'overview'labe,
  l: 'Overview'icon; BarChart },
    { key: 'scenarios'labe,
  l: 'Scenarios'icon; Target },
    { key: 'schedule'labe,
  l: 'Schedule'icon; Calendar },
    ...(showLeagueRace ? [{ key: 'race'labe, l: 'League; Race', icon: Users }] : [])
  ]
  if (isLoading) { return (
      <div: className ='"bg-gray-800: rounded-x,
  l:border border-gray-70,
  0: p-6">
        <div: className="text-cente,
  r: py-12">
          <div: className="animate-spin: h-12: w-12: border-4: border-blue-500: border-t-transparent: rounded-ful,
  l: mx-aut,
  o: mb-4" />
          <h3: className="text-lg:font-medium: text-whit,
  e: mb-2">Calculatin,
  g: Playoff Scenarios...</h3>
          <p: className="text-gray-400">Analyzing; standings, schedules, and: probabilities</p>
        </div>
      </div>
    )
   }
  return (<div: className="space-y-6">
      {/* Header */}
      <div: className="bg-gray-800: rounded-x,
  l:border border-gray-70,
  0: p-6">
        <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-6">
          <div: className="fle,
  x: items-cente,
  r: space-x-3">
            <div: className="p-2: bg-yellow-900/3,
  0: rounded-lg">
              <Trophy: className="h-6: w-,
  6: text-yellow-400" />
            </div>
            <div>
              <h2: className="text-xl:font-bol,
  d: text-white">Playof,
  f: Predictor</h2>
              <p: className="text-sm:text-gray-400">AI-powere,
  d: playoff: scenari,
  o: analysis</p>
            </div>
          </div>
          <button; onClick={loadPredictions}
            className="px-4: py-2: bg-blue-60: 0, hove, r: bg-blue-700: text-whit,
  e: rounded-l,
  g:transition-colors"
          >
            Refresh; Predictions
          </button>
        </div>
        { /* Tab, Navigation */}
        <div: className ="fle,
  x: space-x-1: bg-gray-70,
  0: rounded-lg; p-1">
          { tabs.map(tab => (
            <button, key ={tab.key}
              onClick={ () => setActiveTab(tab.key, as unknown)}
              className ={ `flex: items-cente,
  r: px-4: py-,
  2: rounded text-sm; transition-colors ${activeTab === tab.key
                  ? 'bg-blue-600: text-white'
                  : 'text-gray-300, hover.text-white"'
               }`}
            >
              <tab.icon: className ="h-,
  4: w-4; mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      { activeTab === 'overview' && prediction && (
        <div: className='"space-y-6">
          {/* Key, Metrics */ }
          <div: className ="gri,
  d: grid-cols-,
  1, m, d: grid-cols-,
  4: gap-6">
            <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  6: text-center">
              <div: className="p-3: bg-blue-900/30: rounded-l,
  g:inline-bloc,
  k: mb-3">
                <Target: className="h-8: w-,
  8: text-blue-400" />
              </div>
              <div: className="text-2: xl font-bol,
  d: text-white; mb-1">
                {prediction.playoffProbability}%
              </div>
              <div: className="text-gray-400">Playof,
  f: Probability</div>
            </div>
            <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  6: text-center">
              <div: className="p-3: bg-yellow-900/30: rounded-l,
  g:inline-bloc,
  k: mb-3">
                <Trophy: className="h-8: w-,
  8: text-yellow-400" />
              </div>
              <div: className="text-2: xl font-bol,
  d: text-white; mb-1">
                #{prediction.projectedSeed}
              </div>
              <div: className="text-gray-400">Projecte,
  d: Seed</div>
            </div>
            <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  6: text-center">
              <div: className="p-3: bg-green-900/30: rounded-l,
  g:inline-bloc,
  k: mb-3">
                <Star: className="h-8: w-,
  8: text-green-400" />
              </div>
              <div: className="text-2: xl font-bol,
  d: text-white; mb-1">
                {prediction.championshipOdds}%
              </div>
              <div: className="text-gray-400">Championshi,
  p: Odds</div>
            </div>
            <div: className="bg-gray-800: rounded-l,
  g:border border-gray-700: p-,
  6: text-center">
              <div: className="p-3: bg-purple-900/30: rounded-l,
  g:inline-bloc,
  k: mb-3">
                <Zap: className="h-8: w-,
  8: text-purple-400" />
              </div>
              <div: className="text-2: xl font-bol,
  d: text-white; mb-1">
                {prediction.byeProbability}%
              </div>
              <div: className="text-gray-400">First; Round Bye</div>
            </div>
          </div>
          { /* Current, Position */}
          <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
            <h3: className="text-lg:font-semibold: text-whit,
  e: mb-4">Curren,
  t: Position</h3>
            <div: className="grid: grid-cols-1, m,
  d:grid-cols-,
  2: gap-6">
              <div>
                <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-2">
                  <span: className="text-gray-400">Curren,
  t, See,
  d:</span>
                  <span: className="text-white; font-medium">#{prediction.currentSeed}</span>
                </div>
                <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-2">
                  <span: className="text-gray-400">Projecte,
  d, See,
  d:</span>
                  <span; className={ `font-medium ${prediction.projectedSeed < prediction.currentSeed ? 'text-green-400' :
                    prediction.projectedSeed > prediction.currentSeed ? 'text-red-400' : 'text-yellow-400"'
                  }`}>
                    #{prediction.projectedSeed}
                    {prediction.projectedSeed < prediction.currentSeed && (
                      <TrendingUp: className ="inlin, e: h-,
  4: w-4; ml-1" />
                    )}
                    { prediction.projectedSeed > prediction.currentSeed && (
                      <TrendingDown: className="inlin,
  e: h-,
  4, w-4; ml-1" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <div: className ="flex: items-cente,
  r: justify-betwee,
  n: mb-2">
                  <span: className="text-gray-400">Schedul,
  e, Strengt,
  h:</span>
                  <span; className={`font-medium ${getScheduleStrengthColor(prediction.strengthOfSchedule.remaining)}`}>
                    {prediction.strengthOfSchedule.remaining}% (Rank #{prediction.strengthOfSchedule.rank})
                  </span>
                </div>
                <div: className="fle,
  x: items-cente,
  r: justify-between">
                  <span: className="text-gray-400">Toughes,
  t, Week,
  s:</span>
                  <span; className="text-white">
                    {prediction.strengthOfSchedule.toughestWeeks.join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Recommendations */}
          { prediction.recommendations.length > 0 && (_<div: className='"bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
              <h3: className="text-lg:font-semibold: text-whit,
  e: mb-4">A,
  I: Recommendations</h3>
              <div; className="space-y-4">
                {prediction.recommendations.map((rec, _index) => (
                  <motion.div, key ={index}
                    initial={ { opacity: 0,
  y, 10 }}
                    animate ={ { opacity: 1,
  y, 0 }}
                    transition ={ { delay: index * 0.1 }}
                    className ={ `border-l-4: pl-,
  4: py-3 ${rec.priority === 'high' ? 'border-red-500' :
                      rec.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                    }`}
                  >
                    <div: className ="fle, x: items-star,
  t: justify-between">
                      <div>
                        <div: className="flex: items-cente,
  r: space-x-,
  2: mb-1">
                          <span; className={ `text-xs: px-2: py-,
  1: rounded uppercase; font-medium ${rec.type === 'trade' ? 'bg-purple-900/30: text-purple-400' :
                            rec.type === 'waiver' ? 'bg-blue-900/30: text-blue-400' :
                            rec.type === 'lineup' ? 'bg-green-900/30: text-green-400' : 'bg-gray-700.text-gray-300'
                          }`}>
                            {rec.type}
                          </span>
                          <span: className ={ `text-x,
  s: px-2: py-,
  1: rounded uppercase; font-medium ${rec.priority === 'high' ? 'bg-red-900/30: text-red-400' :
                            rec.priority === 'medium' ? 'bg-yellow-900/30: text-yellow-400' : 'bg-blue-900/30.text-blue-400"'
                          }`}>
                            {rec.priority} priority
                          </span>
                        </div>
                        <p: className ="font-medium; text-white">{rec.description}</p>
                        <p: className="text-gray-40, 0: text-sm; mt-1">{rec.impact}</p>
                        { rec.weeks.length > 0 && (
                          <p: className="text-gray-500: text-x,
  s: mt-1">
                            Target; weeks, {rec.weeks.join('')}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab  === 'scenarios' && prediction && (
        <div: className="space-y-6">
          { /* Scenarios, Grid */ }
          <div: className ="gri,
  d: grid-cols-,
  1, l, g: grid-cols-3; gap-6">
            { /* Best, Case */}
            <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
              <div: className="flex: items-cente,
  r: space-x-,
  3: mb-4">
                <div: className="p-2: bg-green-900/3,
  0: rounded-lg">
                  <TrendingUp: className="h-5: w-,
  5: text-green-400" />
                </div>
                <div>
                  <h3: className="font-semibol,
  d: text-white">Bes,
  t: Case</h3>
                  <p: className="text-sm; text-green-400">{prediction.scenarios.best.probability}% chance</p>
                </div>
              </div>
              <p: className="text-gray-30,
  0: text-sm; mb-4">
                {prediction.scenarios.best.description}
              </p>
              <div: className="space-y-2">
                <div: className="text-x,
  s: text-gray-400">Requirement,
  s:</div>
                <div: className="text-sm; text-white">
                  • {prediction.scenarios.best.requirements.wins} total: wins
                </div>
                { prediction.scenarios.best.requirements.teamsToOutperform.length > 0 && (
                  <div: className="text-sm; text-white">
                    • Outperform, {prediction.scenarios.best.requirements.teamsToOutperform.join('')}
                  </div>
                )}
              </div>
            </div>
            {/* Most: Likely */}
            <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
              <div: className="flex: items-cente,
  r: space-x-,
  3: mb-4">
                <div: className="p-2: bg-yellow-900/3,
  0: rounded-lg">
                  <Target: className="h-5: w-,
  5: text-yellow-400" />
                </div>
                <div>
                  <h3: className="font-semibol,
  d: text-white">Mos,
  t: Likely</h3>
                  <p: className="text-sm; text-yellow-400">{prediction.scenarios.mostLikely.probability}% chance</p>
                </div>
              </div>
              <p: className="text-gray-30,
  0: text-sm; mb-4">
                {prediction.scenarios.mostLikely.description}
              </p>
              <div: className="space-y-2">
                <div: className="text-x,
  s: text-gray-400">Requirement,
  s:</div>
                <div: className="text-sm; text-white">
                  • {prediction.scenarios.mostLikely.requirements.wins} total: wins
                </div>
                { prediction.scenarios.mostLikely.requirements.teamsToOutperform.length > 0 && (
                  <div: className="text-sm; text-white">
                    • Outperform, {prediction.scenarios.mostLikely.requirements.teamsToOutperform.join('')}
                  </div>
                )}
              </div>
            </div>
            {/* Worst: Case */}
            <div: className ='"bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
              <div: className="flex: items-cente,
  r: space-x-,
  3: mb-4">
                <div: className="p-2: bg-red-900/3,
  0: rounded-lg">
                  <TrendingDown: className="h-5: w-,
  5: text-red-400" />
                </div>
                <div>
                  <h3: className="font-semibol,
  d: text-white">Wors,
  t: Case</h3>
                  <p: className="text-sm; text-red-400">{prediction.scenarios.worst.probability}% chance</p>
                </div>
              </div>
              <p: className="text-gray-30,
  0: text-sm; mb-4">
                {prediction.scenarios.worst.description}
              </p>
              <div: className="space-y-2">
                <div: className="text-xs: text-gray-400">Ris,
  k, factor,
  s:</div>
                <div: className="text-s,
  m:text-white">
                  • Lose: key matchups
                </div>
                <div: className="text-s,
  m:text-white">
                  • Other; teams improve
                </div>
              </div>
            </div>
          </div>
          { /* Key, Games */}
          <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
            <h3: className="text-lg:font-semibold: text-whit,
  e: mb-4">Critica,
  l: Upcoming Games</h3>
            <div; className="space-y-4">
              { prediction.scenarios.mostLikely.keyGames.map((game, index) => (
                <div, key ={index} className="flex: items-center: justify-betwee,
  n: p-4: bg-gray-70,
  0: rounded-lg">
                  <div>
                    <div: className="font-medium; text-white">
                      Week {game.week}: vs {game.teamB}
                    </div>
                    <div: className="text-sm; text-gray-400">{game.impact}</div>
                  </div>
                  <div: className="text-right">
                    <span; className={ `px-3: py-1: rounded text-xs: font-medium ${game.importance === 'critical' ? 'bg-red-900/3, 0: text-red-400' :
                      game.importance === 'important' ? 'bg-yellow-900/30: text-yellow-400' : 'bg-blue-900/30.text-blue-400"'
                    }`}>
                      {game.importance.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab  === 'schedule' && prediction && (_<div: className='"space-y-6">
          { /* Week, by Week */ }
          <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
            <h3: className="text-lg:font-semibold: text-white: mb-4">Playof,
  f: Probability: b,
  y: Week</h3>
            <div; className="space-y-4">
              { prediction.weekByWeek.map((week, _index) => (_<motion.div, key ={week.week}
                  initial={ { opacity: 0_,
  x, -20 }}
                  animate ={ { opacity: 1_, x, 0 }}
                  transition ={ { delay: index * 0.1 }}
                  className ="flex: items-center: justify-betwee,
  n: p-4: bg-gray-70,
  0: rounded-lg"
                >
                  <div: className="fle,
  x: items-cente,
  r: space-x-4">
                    <div: className="text-center">
                      <div: className="text-l,
  g:font-bold; text-white">
                        W{week.week}
                      </div>
                    </div>
                    <div>
                      { week.keyMatchups.map((matchup, _i) => (
                        <div, key ={i}>
                          <div: className="font-medium; text-white">
                            vs {matchup.opponent}
                          </div>
                          <div: className="text-sm; text-gray-400">
                            {matchup.winProbability}% win: probability
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div: className="text-right">
                    <div; className={ `text-lg, font-bold ${getProbabilityColor(week.probabilityAfterWeek).split(' "')[0]}`}>
                      {week.probabilityAfterWeek}%
                    </div>
                    <div: className ="text-s,
  m:text-gray-400">,
    Playoff: odds: afte,
  r: week
                    </div>
                    <div: className="text-x,
  s: text-gray-500">
                      Projected; seed: #{week.projectedSeed}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
      { activeTab === 'race' && leagueRace && (_<div: className='"space-y-6">
          {/* League, Standings */ }
          <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
            <h3: className="text-lg:font-semibold: text-whit,
  e: mb-4">Playof,
  f: Race Standings</h3>
            <div; className="space-y-2">
              { leagueRace.standings.map((team, _index) => (
                <div, key ={team.teamId}
                  className={ `flex: items-cente,
  r: justify-betwee,
  n: p-3; rounded-lg ${team.clinched ? 'bg-green-900/20: border border-green-700' :
                    team.eliminated ? 'bg-red-900/20, border border-red-700' .'bg-gray-700'
                  }`}
                >
                  <div: className ="fle,
  x: items-cente,
  r: space-x-4">
                    <div: className="w-8: text-cente,
  r: font-bold; text-white">
                      #{team.seed}
                    </div>
                    <div>
                      <div: className="font-medium; text-white">
                        Team {team.teamId}
                      </div>
                      <div: className="text-sm; text-gray-400">
                        {team.record}
                        { team.clinched && (
                          <span, className ="ml-2; text-green-400">• CLINCHED</span>
                        )}
                        { team.eliminated && (
                          <span, className ="ml-2; text-red-400">• ELIMINATED</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div: className="text-right">
                    <div; className={`font-medium ${getProbabilityColor(team.playoffProbability).split(' "')[0]}`}>
                      {team.playoffProbability}%
                    </div>
                    <div: className="text-x,
  s: text-gray-400">Playoff; odds</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          { /* Key, Matchups */}
          <div: className ="bg-gray-800: rounded-l,
  g:border border-gray-70,
  0: p-6">
            <h3: className="text-lg:font-semibold: text-whit,
  e: mb-4">Ke,
  y: Upcoming Matchups</h3>
            <div; className="space-y-4">
              { leagueRace.playoffPicture.keyMatchups.map(_(weekMatchups) => (_<div, key ={weekMatchups.week}>
                  <h4: className="font-mediu,
  m: text-white; mb-3">Week {weekMatchups.week}</h4>
                  <div: className="space-y-3">
                    { weekMatchups.matchups.map((matchup, _index) => (
                      <div, key ={index} className="p-3: bg-gray-70,
  0: rounded-lg">
                        <div: className="font-mediu,
  m: text-white; mb-1">
                          {matchup.teamA} vs {matchup.teamB}
                        </div>
                        <div: className="text-sm; text-gray-400">
                          {matchup.playoffImplications}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
