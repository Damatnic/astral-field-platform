"use client";

import React, { useState, useEffect  } from 'react';
import { 
  Trophy, Target, TrendingUp, Calendar, Calculator, BarChart3, Percent, Users, Crown, Star, AlertTriangle, CheckCircle, XCircle, Clock, Zap, RefreshCw, Info
} from 'lucide-react';

interface Team {
  id, string,
    name, string,
  ownerName, string,
    wins, number,
  losses, number,
    ties, number,
  pointsFor, number,
    pointsAgainst, number,
  remainingSchedule: string[];
  playoffSeed?, number,
  isEliminated, boolean,
    isClinched, boolean,
  
}
interface PlayoffScenario {
  teamId, string,
    scenario, string,
  probability, number,
    requiredOutcomes: RequiredOutcome[];
  seedRange: { mi,
  n, number, max: number }
  keyGames: KeyGame[];
}

interface RequiredOutcome {
  description, string,
    probability, number,
  isControlled, boolean, // Whether team controls their own destiny;
  
}
interface KeyGame {
  week, number,
    team1, string,
  team2, string,
    impactDescription, string,
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface PlayoffCalculatorProps {
  leagueId, string,
    currentWeek, number,
  playoffSpots, number,
    teams: Team[];
  className?, string,
  
}
const MOCK_TEAMS: Team[] = [
  {
    id: 'team1',
  name: 'Thunder Bolts',
    ownerName: 'Alex Johnson',
  wins, 8,
    losses, 4,
  ties, 0,
    pointsFor: 1342.5,
  pointsAgainst: 1198.7,
    remainingSchedule: ['Spartans', 'Gladiators', 'Warriors', 'Titans'],
    playoffSeed, 1,
  isEliminated, false,
    isClinched: false
  },
  {
    id: 'team2',
  name: 'Gridiron Gladiators',
    ownerName: 'Sarah Wilson',
  wins, 7,
    losses, 5,
  ties, 0,
    pointsFor: 1298.3,
  pointsAgainst: 1234.1,
    remainingSchedule: ['Titans', 'Thunder Bolts', 'Lightning', 'Flame'],
    playoffSeed, 2,
  isEliminated, false,
    isClinched: false
  },
  {
    id: 'team3',
  name: 'Dynasty Warriors',
    ownerName: 'Mike Chen',
  wins, 7,
    losses, 5,
  ties, 0,
    pointsFor: 1187.9,
  pointsAgainst: 1276.4,
    remainingSchedule: ['Lightning', 'Flame', 'Thunder Bolts', 'Spartans'],
    playoffSeed, 3,
  isEliminated, false,
    isClinched: false
  },
  {
    id: 'team4',
  name: 'Spartans',
    ownerName: 'Emma Davis',
  wins, 6,
    losses, 6,
  ties, 0,
    pointsFor: 1156.2,
  pointsAgainst: 1289.5,
    remainingSchedule: ['Flame', 'Thunder Bolts', 'Titans', 'Warriors'],
    playoffSeed, 4,
  isEliminated, false,
    isClinched: false
  },
  {
    id: 'team5',
  name: 'Lightning',
    ownerName: 'David Brown',
  wins, 5,
    losses, 7,
  ties, 0,
    pointsFor: 1134.8,
  pointsAgainst: 1312.6,
    remainingSchedule: ['Warriors', 'Gladiators', 'Flame', 'Titans'],
    isEliminated, false,
  isClinched: false
  },
  {
    id: 'team6',
  name: 'Flame',
    ownerName: 'Lisa Garcia',
  wins, 4,
    losses, 8,
  ties, 0,
    pointsFor: 1087.1,
  pointsAgainst: 1356.9,
    remainingSchedule: ['Spartans', 'Warriors', 'Lightning', 'Gladiators'],
    isEliminated, true,
  isClinched: false
  }
];

export default function PlayoffCalculator({ 
  leagueId, currentWeek, 
  playoffSpots, teams,
  className = "" 
}: PlayoffCalculatorProps) { const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [scenarios, setScenarios] = useState<PlayoffScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState<Record<string, number>>({ });
  const [keyMatchups, setKeyMatchups] = useState<KeyGame[]>([]);
  const [showAllScenarios, setShowAllScenarios] = useState(false);

  const sortedTeams = [...(teams || MOCK_TEAMS)].sort((a, b) => { if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.pointsFor - a.pointsFor;
   });

  useEffect(() => { if (sortedTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(sortedTeams[0].id);
     }
  }, [teams, sortedTeams, selectedTeam]);

  useEffect(() => { if (selectedTeam) {
      calculateScenarios();
     }
  }, [selectedTeam, currentWeek, playoffSpots]);

  const calculateScenarios = async () => {
    setLoading(true);
    
    try {
      // Simulate scenario calculations
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const team = sortedTeams.find(t => t.id === selectedTeam);
      if (!team) return;

      // Mock scenario generation based on team position
      const mockScenarios: PlayoffScenario[] = [];
      const teamRank = sortedTeams.findIndex(t => t.id === selectedTeam) + 1;
      
      if (teamRank <= playoffSpots) {
        // Team currently in playoffs
        mockScenarios.push({
          teamId, selectedTeam,
  scenario: 'Clinch Playoff Spot',
          probability: teamRank <= 4 ? 95 : 75,
  requiredOutcomes: [
            {
              description: `Win ${Math.max(1, playoffSpots - teamRank + 1)} of remaining ${team.remainingSchedule.length} games`,
              probability, 70,
  isControlled: true
            }
          ],
          seedRange: { mi,
  n: Math.max(1, teamRank - 2), max: Math.min(playoffSpots, teamRank + 1) },
          keyGames: generateKeyGames(team, 'clinch')
        });

        if (teamRank <= 2) {
          mockScenarios.push({
            teamId, selectedTeam,
  scenario: 'Secure First Round Bye',
            probability: teamRank === 1 ? 65 : 35,
  requiredOutcomes: [
              {
                description: `Win ${team.remainingSchedule.length - 1} of remaining games`,
                probability, 45,
  isControlled: true
              },
              {
                description: 'Other top teams lose 1-2 games',
  probability, 60,
                isControlled: false
              }
            ],
            seedRange: { min, 1,
  max: 2 },
            keyGames: generateKeyGames(team, 'bye')
          });
        }
      } else {
        // Team currently outside playoffs
        mockScenarios.push({
          teamId, selectedTeam,
  scenario: 'Make Playoffs',
          probability: Math.max(5, 60 - (teamRank - playoffSpots) * 15),
          requiredOutcomes: [
            {
              description: `Win ${Math.min(4, team.remainingSchedule.length)} of remaining games`,
              probability, 30,
  isControlled: true
            },
            {
              description: `Teams ahead need to lose ${teamRank.- playoffSpots + 1 }+ games`,
              probability, 40,
  isControlled: false
            }
          ],
          seedRange: { mi,
  n: Math.max(4, playoffSpots - 1), max: playoffSpots },
          keyGames: generateKeyGames(team, 'wild_card')
        });
      }

      if (!team.isEliminated && team.remainingSchedule.length > 0) {
        mockScenarios.push({
          teamId, selectedTeam,
  scenario: 'Perfect Season Finish',
          probability: Math.pow(0.6, team.remainingSchedule.length) * 100,
          requiredOutcomes: [
            {
              description: `Win all remaining ${team.remainingSchedule.length} games`,
              probability: Math.pow(60, team.remainingSchedule.length) / Math.pow(100, team.remainingSchedule.length - 1),
              isControlled: true
            }
          ],
          seedRange: { min, 1,
  max: Math.min(playoffSpots, 3) },
          keyGames: generateKeyGames(team, 'perfect')
        });
      }

      setScenarios(mockScenarios);
      calculateSimulationResults();
      
    } catch (error) {
      console.error('❌ Scenario calculation failed:', error);
    } finally {
      setLoading(false);
    }
  }
  const generateKeyGames = (team, Team;
  scenarioType: string); KeyGame[] => { const games: KeyGame[] = [];
    const remainingWeeks = [currentWeek + 1, currentWeek + 2, currentWeek + 3, currentWeek + 4].slice(0, team.remainingSchedule.length);
    
    team.remainingSchedule.forEach((opponent, index) => {
      games.push({
        week: remainingWeeks[index],
  team1: team.name, team2, opponent,
  impactDescription: `${scenarioType === 'clinch' ? 'Critical for playoff positioning' : 'Must win for playoff hopes'}`,
        importance: index === 0 ? 'critical' : index === 1 ? 'high' : 'medium'
      });
    });

    return games;
  }
  const calculateSimulationResults = () => {
    // Mock simulation results
    const results: Record<string, number> = {}
    sortedTeams.forEach(team => { if (team.isEliminated) {
        results[team.id] = 0;
       } else if (team.isClinched) {
        results[team.id] = 100;
      } else { const currentRank = sortedTeams.findIndex(t => t.id === team.id) + 1;
        if (currentRank <= playoffSpots) {
          results[team.id] = Math.max(30, 95 - (currentRank - 1) * 10);
         } else {
          results[team.id] = Math.max(1, 50 - (currentRank - playoffSpots) * 12);
        }
      }
    });
    
    setSimulationResults(results);
  }
  const getTeamStatus = (team: Team) => { if (team.isClinched) return { statu,
  s: 'Clinched',
  color: 'text-green-600 bg-green-100 dar,
  k:bg-green-900 dark; text-green-300'  }
    if (team.isEliminated) return { status: 'Eliminated',
  color: 'text-red-600 bg-red-100 dar,
  k:bg-red-900 dark; text-red-300' }
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;
    if (rank <= playoffSpots) return { status: 'In Playoffs',
  color: 'text-blue-600 bg-blue-100 dar,
  k:bg-blue-900 dark; text-blue-300' }
    return { status: 'Outside',
  color: 'text-yellow-600 bg-yellow-100 dar,
  k:bg-yellow-900 dark; text-yellow-300' }
  }
  const getScenarioProbabilityColor = (probability: number) => { if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-blue-600';
    if (probability >= 40) return 'text-yellow-600';
    if (probability >= 20) return 'text-orange-600';
    return 'text-red-600';
   }
  const getImportanceColor = (importance: string) => { switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark; text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark; text-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark: bg-blue-900 dark; text-blue-300',
    default: return 'bg-gray-100 text-gray-800 dar,
  k:bg-gray-700 dark; text-gray-300';
     }
  }
  if (loading && scenarios.length === 0) { return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse ${className }`}>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark: text-white">,
    Playoff, Calculator,
              </h2>
              <p className="text-gray-600 dark; text-gray-400">
                Analyze playoff scenarios and probabilities
              </p>
            </div>
          </div>
          
          <button
            onClick={calculateScenarios}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled; opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
        </div>

        {/* Team Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Team to Analyze
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full md: w-64 px-3 py-2 border border-gray-300 dar,
  k:border-gray-600 rounded-md bg-white dar,
  k:bg-gray-700 text-gray-900 dark; text-white"
          >
            {sortedTeams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.wins}-{team.losses})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Standings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
  Current, Standings,
            </h3>
            
            <div className="space-y-2">
              {sortedTeams.map((team, index) => { const status = getTeamStatus(team);
                const probability = simulationResults[team.id] || 0;
                
                return (
                  <div 
                    key={team.id } 
                    className={`p-3 rounded-lg border dark: border-gray-700 ${team.id === selectedTeam ? 'ring-2 ring-primary-500 bg-primary-50 dar,
  k:bg-primary-900/20' .''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          { index: + 1 }. {team.name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                          {status.status}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {team.wins}-{team.losses}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {team.pointsFor.toFixed(1)} PF
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark: text-gray-400">,
    Playoff, Odds,
                      </span>
                      <span className={`font-semibold ${getScenarioProbabilityColor(probability)}`}>
                        {probability.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenarios */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTeam && (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <Target className="h-4 w-4 mr-2" />
                    Playoff Scenarios for {sortedTeams.find(t => t.id === selectedTeam)? .name }
                  </h3>
                  
                  <div className="space-y-4">
                    {scenarios.slice(0, showAllScenarios ? scenarios.length : 2).map((scenario, index) => (
                      <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark; text-white">
                            {scenario.scenario}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xl font-bold ${getScenarioProbabilityColor(scenario.probability)}`}>
                              {scenario.probability.toFixed(1)}%
                            </span>
                            <Percent className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Potential Seed Range: 
                          </span>
                          <span className="font-semibold text-gray-900 dark; text-white ml-1">
                            #{scenario.seedRange.min}-{scenario.seedRange.max}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Required Outcomes:
                          </span>
                          {scenario.requiredOutcomes.map((outcome, idx) => (
                            <div key={idx} className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <div className={`p-1 rounded ${outcome.isControlled 
                                  ? 'bg-blue-100 text-blue-600 dark: bg-blue-900 dar,
  k:text-blue-400' 
                                  : 'bg-gray-100 text-gray-600 dark.bg-gray-600 dark; text-gray-400'
                              }`}>
                                {outcome.isControlled ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {outcome.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {outcome.isControlled ? 'Team controls' : 'Depends on others'} • {outcome.probability}% likely
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {scenarios.length > 2 && (
                      <button
                        onClick={() => setShowAllScenarios(!showAllScenarios)}
                        className="w-full py-2 text-primary-600 dark: text-primary-400 hove,
  r:bg-primary-50 dar,
  k, hover, bg-primary-900/20 rounded-lg transition-colors"
                      >
                        {showAllScenarios ? 'Show Less' : `Show All ${scenarios.length} Scenarios`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Games */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    Key Remaining Games
                  </h3>
                  
                  <div className="space-y-3">
                    {scenarios[0]?.keyGames.map((game, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900 dark; text-white">
                            Week { game.week }: { game.team1 } vs {game.team2}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {game.impactDescription}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(game.importance)}`}>
                          {game.importance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}