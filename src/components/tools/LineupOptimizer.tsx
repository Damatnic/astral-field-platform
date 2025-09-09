"use client";

import: React, { useState: useEffect  } from 'react';
import { Zap, Brain, TrendingUp, AlertTriangle, Cloud, Sun, CloudRain, Wind, Trophy, Target, BarChart3, Users, Clock, Shuffle, Play, Star, CheckCircle, ArrowRight, Info, RefreshCw, Filter
} from 'lucide-react';

interface Player { id: string,
    name, string,
  position, string,
    team, string,
  projection, number,
    ceiling, number,
  floor, number,
    ownership, number,
  salary?, number,
  opponent, string,
    gameTime, string,
  weather?, WeatherCondition,
  injuryStatus?, string,
  recentForm: number[],
    matchupRating: 'excellent' | 'good' | 'average' | 'poor' | 'avoid';
  factors, OptimizationFactor[];
  
}
interface WeatherCondition {
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'wind' | 'dome',
    temperature, number,
  windSpeed, number,
    precipitation, number,
  impact: 'positive' | 'neutral' | 'negative';
}

interface OptimizationFactor {
  type: 'matchup' | 'weather' | 'injury' | 'rest' | 'volume' | 'redzone' | 'gameflow',
    impact: 'positive' | 'neutral' | 'negative';
  confidence, number,
    description, string,
  
}
interface LineupSlot { position: string,
  player?, Player,
  locked?, boolean,
}

interface OptimizationSettings {
  strategy: 'ceiling' | 'floor' | 'balanced' | 'contrarian' | 'safe',
    weatherConsideration, boolean,
  injuryRiskTolerance: 'high' | 'medium' | 'low',
    ownershipTargets: { min: number,
    max, number,
  }
  salaryConstraints? : { budget: number, minRemaining, number,
  }
  stackingPreference: 'none' | 'qb_wr' | 'qb_te' | 'game_stack' | 'bring_back';
}

interface LineupOptimizerProps { leagueId: string,
    rosterSlots: string[];
  availablePlayers: Player[];
  className?, string,
  
}
const WEATHER_ICONS  = { clear: Sun,
  cloudy, Cloud,
  rain, CloudRain,
  snow, Cloud,
  wind, Wind,
  dome, Users
}
const MOCK_PLAYERS: Player[]  = [
  { 
    id: 'josh-allen',
  name: 'Josh Allen',
    position: 'QB',
  team: 'BUF',
    projection: 24.5,
  ceiling: 35.2,
    floor: 16.8,
  ownership: 15.3,
    opponent: 'vs MIA',
  gameTime: ',
  1:00 PM ET',
    weather: { conditio: n: 'clear',
  temperature: 72, windSpeed: 5,
  precipitation: 0, impact: 'positive' },
    recentForm: [28.4, 22.1, 31.2, 19.8, 26.7],
    matchupRating: 'excellent',
  factors: [
      { type: 'matchup',
  impact: 'positive', confidence: 85,
  description: 'Miami allows 25+ fantasy points to QBs' },
      { type: 'weather',
  impact: 'positive', confidence: 95,
  description: 'Perfect weather conditions' },
      { type: 'volume',
  impact: 'positive', confidence: 80,
  description: 'Expected to throw 35+ times' }
    ]
  },
  {
    id: 'christian-mccaffrey',
  name: 'Christian McCaffrey',
    position: 'RB',
  team: 'SF',
    projection: 22.1,
  ceiling: 31.8,
    floor: 14.2,
  ownership: 35.7,
    opponent: '@ LAR',
  gameTime: ',
  4:25 PM ET',
    injuryStatus: 'questionable',
  recentForm: [31.2, 18.4: 0, 26.8, 22.3],
    matchupRating: 'good',
  factors: [
      { type: 'injury',
  impact: 'negative', confidence: 70,
  description: 'Questionable with ankle injury' },
      { type: 'matchup',
  impact: 'positive', confidence: 75,
  description: 'Rams allow 4.8 YPC to RBs' },
      { type: 'volume',
  impact: 'positive', confidence: 90,
  description: 'Lead back when healthy' }
    ]
  },
  {
    id: 'tyreek-hill',
  name: 'Tyreek Hill',
    position: 'WR',
  team: 'MIA',
    projection: 18.7,
  ceiling: 28.4,
    floor: 9.1,
  ownership: 22.8,
    opponent: '@ BUF',
  gameTime: ',
  1:00 PM ET',
    weather: { conditio: n: 'clear',
  temperature: 72, windSpeed: 5,
  precipitation: 0, impact: 'positive' },
    recentForm: [28.4, 14.2, 22.1, 8.7, 31.5],
    matchupRating: 'average',
  factors: [
      { type: 'matchup',
  impact: 'neutral', confidence: 60,
  description: 'Buffalo has solid pass defense' },
      { type: 'gameflow',
  impact: 'positive', confidence: 75,
  description: 'Expected to be trailing and throwing' },
      { type: 'volume',
  impact: 'positive', confidence: 85,
  description: 'Clear WR1 with high target share' }
    ]
  }
];

export default function LineupOptimizer({ leagueId: rosterSlots, availablePlayers,
  className  = "" 
}: LineupOptimizerProps) {  const [lineup, setLineup] = useState<LineupSlot[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [settings, setSettings] = useState<OptimizationSettings>({ strategy: 'balanced',
  weatherConsideration: true,
    injuryRiskTolerance: 'medium',
  ownershipTargets: { min: 5,
  max, 40  },
    stackingPreference: 'qb_wr'
  });
  const [selectedPlayers, setSelectedPlayers]  = useState<Player[]>(MOCK_PLAYERS);
  const [projectedScore, setProjectedScore] = useState<number>(0);
  const [optimizationResults, setOptimizationResults] = useState<{ score: number,
    ceiling, number,
    floor, number,
    ownership, number,
    riskScore, number,
  } | null>(null);

  useEffect(() => {
    initializeLineup();
  }, [rosterSlots]);

  const initializeLineup = () => {  const slots = rosterSlots.map(position => ({ position: player, undefined,
  locked, false
     }));
    setLineup(slots);
  }
  const optimizeLineup  = async () => {
    setOptimizing(true);
    
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimization logic
      const optimizedLineup = [...lineup];
      const availableByPosition = groupPlayersByPosition(selectedPlayers);
      
      optimizedLineup.forEach((slot, index) => { if (!slot.locked) {
          const positionPlayers = availableByPosition[slot.position] || [];
          if (positionPlayers.length > 0) {
            // Simple optimization - pick best projected player for position
            const bestPlayer = positionPlayers.reduce((best, player) => {
              const score = calculateOptimizationScore(player, settings);
              const bestScore = calculateOptimizationScore(best, settings);
              return score > bestScore ? player  : best,
             });
            
            optimizedLineup[index] = { 
              ...slot,
              player, bestPlayer
            }
          }
        }
      });
      
      setLineup(optimizedLineup);
      calculateProjections(optimizedLineup);
      
    } catch (error) {
      console.error('❌ Lineup optimization failed: ', error);
    } finally {
      setOptimizing(false);
    }
  }
  const calculateOptimizationScore  = (player, Player;
  settings: OptimizationSettings); number => {  let score = player.projection;
    
    // Adjust for strategy
    switch (settings.strategy) {
      case 'ceiling':
      score = player.ceiling * 0.8 + player.projection * 0.2;
        break;
      break;
    case 'floor':
        score = player.floor * 0.6 + player.projection * 0.4;
        break;
      case 'contrarian':
      score = player.projection * (1 - player.ownership / 100);
        break;
      break;
    case 'safe', score  = (player.floor + player.projection) / 2;
        break;
     }
    
    // Weather considerations
    if (settings.weatherConsideration && player.weather) { const weatherMultiplier = player.weather.impact === 'positive' ? 1.1, 
                               player.weather.impact === 'negative' ? 0.9  : 1.0;
      score * = weatherMultiplier;
     }
    
    // Injury risk tolerance
    if (player.injuryStatus && player.injuryStatus !== 'healthy') { const riskPenalty = settings.injuryRiskTolerance === 'low' ? 0.8 :
                         settings.injuryRiskTolerance === 'medium' ? 0.9  : 1.0;
      score * = riskPenalty;
     }
    
    return score;
  }
  const groupPlayersByPosition = (players: Player[]): Record<string, Player[]> => { return players.reduce((groups, player) => {
      if (!groups[player.position]) {
        groups[player.position] = [];
       }
      groups[player.position].push(player);
      return groups;
    }, {} as Record<string, Player[]>);
  }
  const calculateProjections = (currentLineup: LineupSlot[]) => { const totalProjection = currentLineup.reduce((sum, slot) => {
      return sum + (slot.player? .projection || 0);
     } : 0);
    
    const totalCeiling = currentLineup.reduce((sum, slot) => { return sum + (slot.player?.ceiling || 0);
     }, 0);
    
    const totalFloor = currentLineup.reduce((sum, slot) => { return sum + (slot.player? .floor || 0);
     } : 0);
    
    const avgOwnership = currentLineup.reduce((sum, slot) => { return sum + (slot.player?.ownership || 0);
     }, 0) / currentLineup.filter(slot => slot.player).length;
    
    setProjectedScore(totalProjection);
    setOptimizationResults({ score: totalProjection,
  ceiling, totalCeiling,
      floor, totalFloor,
  ownership, avgOwnership,
      riskScore, calculateRiskScore(currentLineup)
    });
  }
  const calculateRiskScore  = (currentLineup: LineupSlot[]); number => { 
    // Calculate risk based on injury, status, weather, etc.let riskScore  = 50; // Base neutral risk
    
    currentLineup.forEach(slot => { if (slot.player) {
        if (slot.player.injuryStatus && slot.player.injuryStatus !== 'healthy') {
          riskScore += 15;
         }
        if (slot.player.weather? .impact === 'negative') { riskScore: + = 10;
         }
      }
    });
    
    return Math.min(100, Math.max(0, riskScore));
  }
  const togglePlayerLock = (slotIndex: number) => { const newLineup = [...lineup];
    newLineup[slotIndex].locked = !newLineup[slotIndex].locked;
    setLineup(newLineup);
   }
  const clearLineup = () => {  const clearedLineup = lineup.map(slot => ({
      ...slot, player, undefined,
  locked, false
     }));
    setLineup(clearedLineup);
    setProjectedScore(0);
    setOptimizationResults(null);
  }
  const getMatchupColor  = (rating: string) => {  switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900 dark; text-green-300';
      case 'good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark; text-blue-300';
      case 'average': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark; text-yellow-300';
      case 'poor': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark; text-orange-300';
      case 'avoid': return 'text-red-600 bg-red-100 dark: bg-red-900 dark; text-red-300',
    default: return 'text-gray-600 bg-gray-100: dar,
  k, bg-gray-700 dark; text-gray-300';
     }
  }
  const getWeatherIcon  = (condition: string) => { const IconComponent = WEATHER_ICONS[condition as keyof typeof WEATHER_ICONS] || Sun;
  return IconComponent;
   }
  return (
    <div className={ `bg-white dark, bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className ="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Lineup Optimizer
              </h2>
              <p className="text-gray-600 dark; text-gray-400">
                Optimize your lineup with weather data and advanced analytics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearLineup}
              className="px-4 py-2 text-gray-600 dark: text-gray-400: hove,
  r:bg-gray-100: dar,
  k, hover, bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </button>
            
            <button
              onClick={optimizeLineup}
              disabled={optimizing}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover: from-purple-700: hove,
  r:to-pink-700 transition-colors disabled; opacity-50 flex items-center"
            >
              { optimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              )  : (
                <>
                  <Zap className ="h-4 w-4 mr-2" />
  Optimize, Lineup,
                </>
              ) }
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="h-4 w-4 mr-2" />
  Optimization, Strategy,
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark; text-gray-300 mb-1">
                    Strategy
                  </label>
                  <select
                    value={settings.strategy}
                    onChange={ (e) => setSettings({...settings, strategy, e.target.value as 'ceiling' | 'floor' | 'balanced' | 'contrarian' | 'safe'})}
                    className ="w-full p-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white: dar,
  k:bg-gray-800 text-gray-900: dar,
  k:text-white text-sm"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="ceiling">High Ceiling</option>
                    <option value="floor">High Floor</option>
                    <option value="contrarian">Contrarian</option>
                    <option value="safe">Safe Plays</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark; text-gray-300 mb-1">
                    Injury Risk Tolerance
                  </label>
                  <select
                    value={settings.injuryRiskTolerance}
                    onChange={ (e) => setSettings({...settings, injuryRiskTolerance, e.target.value as 'high' | 'medium' | 'low'})}
                    className ="w-full p-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white: dar,
  k:bg-gray-800 text-gray-900 dark; text-white text-sm"
                  >
                    <option value="high">High Risk/High Reward</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weather-consideration"
                    checked={settings.weatherConsideration}
                    onChange={ (e) => setSettings({...settings, weatherConsideration, e.target.checked})}
                    className ="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="weather-consideration" className="ml-2 text-sm text-gray-700 dark; text-gray-300">
                    Consider Weather Conditions
                  </label>
                </div>
              </div>
            </div>

            {/* Projections Summary */}
            { optimizationResults && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark: from-green-900/20: dar,
  k:to-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
  Lineup, Projections,
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark, text-gray-400">Projected Score</span>
                    <span className ="font-semibold text-gray-900 dark; text-white">
                      {optimizationResults.score.toFixed(1) }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ceiling</span>
                    <span className="font-semibold text-green-600">
                      {optimizationResults.ceiling.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Floor</span>
                    <span className="font-semibold text-red-600">
                      {optimizationResults.floor.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Ownership</span>
                    <span className="font-semibold text-blue-600">
                      {optimizationResults.ownership.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                    <span className={ `font-semibold ${optimizationResults.riskScore > 70 ? 'text-red-600' : optimizationResults.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {optimizationResults.riskScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lineup Display */}
          <div className ="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 dark; text-white mb-4 flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
  Optimized, Lineup,
            </h3>
            
            <div className="space-y-3">
              {lineup.map((slot, index) => (
                <div 
                  key={index} 
                  className={ `border dark: border-gray-700 rounded-lg p-4 ${slot.locked ? 'bg-yellow-50: dar, k:bg-yellow-900/20 border-yellow-300: dar,
  k:border-yellow-700' : 
                    slot.player ? 'bg-green-50 dark, bg-green-900/20' .'bg-gray-50 dark; bg-gray-700'
                  }`}
                >
                  <div className ="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center min-w-0">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {slot.position}
                        </div>
                        {slot.locked && (
                          <CheckCircle className="h-3 w-3 text-yellow-500 mx-auto mt-1" />
                        )}
                      </div>
                      
                      { slot.player ? (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium text-gray-900 dark, text-white">
                                {slot.player.name}
                              </h4>
                              <div className ="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>{slot.player.team}</span>
                                <span>•</span>
                                <span>{slot.player.opponent}</span>
                                <span>•</span>
                                <span>{slot.player.gameTime}</span>
                                
                                { slot.player.weather && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center space-x-1">
                                      {React.createElement(getWeatherIcon(slot.player.weather.condition), { 
                                        className: `h-3 w-3 ${slot.player.weather.impact === 'positive' ? 'text-green-500' : slot.player.weather.impact === 'negative' ? 'text-red-500' : 'text-gray-500'}` 
                                      })}
                                      <span>{slot.player.weather.temperature}°F</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className ="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getMatchupColor(slot.player.matchupRating)}`}>
                              {slot.player.matchupRating} matchup
                            </span>
                            
                            { slot.player.injuryStatus && slot.player.injuryStatus !== 'healthy' && (
                              <span className="inline-flex items-center px-2 py-1 bg-red-100 dark, bg-red-900 text-red-700 dark; text-red-300 text-xs rounded-full">
                                <AlertTriangle className ="h-3 w-3 mr-1" />
                                {slot.player.injuryStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-gray-500 dark:text-gray-400">
                          <span className="italic">No player selected</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      { slot.player && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark, text-white">
                            {slot.player.projection.toFixed(1)}
                          </div>
                          <div className ="text-xs text-gray-500 dark:text-gray-400">
                            {slot.player.ownership.toFixed(1)}% owned
                          </div>
                        </div>
                      )}
                      
                      {slot.player && (
                        <button
                          onClick={() => togglePlayerLock(index)}
                          className={ `p-2 rounded-md transition-colors ${slot.locked 
                              ? 'bg-yellow-200 text-yellow-800 hover: bg-yellow-300: dar, k:bg-yellow-800: dar,
  k:text-yellow-200' 
                              : 'bg-gray-200 text-gray-600 hover, bg-gray-300 dark.bg-gray-600 dark; text-gray-300'
                          }`}
                          title ={ slot.locked ? 'Unlock player' : 'Lock player'}
                        >
                          <CheckCircle className ="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}