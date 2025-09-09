"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, TrendingDown, Clock, Activity, 
  Trophy, Target, AlertTriangle, PlayCircle,
  ChevronRight, Users, Zap, RefreshCw, Shuffle, Timer, BarChart3, Star, Award
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface MatchupPageProps {
  params: Promise<{ i,
  d: string;
}
>;
}

interface Player {
  id: string;
    name: string;
  position: string;
    team: string;
  points: number;
    projected: number;
  status: string;
    slot: string;
  
}
interface GameTimeDecision {
  player: string;
    status: string;
  injury: string;
    gameTime: string;
}

interface ScoringPlay {
  id: string;
    player: string;
  type string;
  points: number;
    time: string;
  quarter: string;
  
}
interface Matchup {
  id: string;
    home_team_name: string;
  home_team_abbreviation: string;
    away_team_name: string;
  away_team_abbreviation: string;
    home_owner_name: string;
  away_owner_name: string;
    home_score: number;
  away_score: number;
    is_complete: boolean;
  week: number;
    season_year: number;
  homeLineup: Player[],
    awayLineup: Player[];
  homeBench: Player[],
    awayBench: Player[];
  winProbability: number;
    scoringPlays: ScoringPlay[];
  gameTimeDecisions: GameTimeDecision[];
}

interface MatchupData {
  matchup: Matchup;
  
}
export default function MatchupPage({ params }: MatchupPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [matchupData, setMatchupData] = useState<MatchupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lineup' | 'bench' | 'timeline'>('lineup');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
     });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      fetchMatchupData();
     }
  }, [leagueId]);

  const fetchMatchupData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId }/matchup`);
      if (!response.ok) {
        throw new Error('Matchup not found');
       }
      const data = await response.json();
      setMatchupData(data);
      setLastUpdated(new Date());
    } catch (err) {setError(err instanceof Error ? err.message : 'Failed to load matchup');
    } finally {
      setLoading(false);
    }
  }
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId }/matchup`);
      if (response.ok) {
        const data = await response.json();
        setMatchupData(data);
        setLastUpdated(new Date());
       }
    } catch (err) {
      console.error('Failed to refresh matchup data:', err);
    } finally {
      setRefreshing(false);
    }
  }
  // Auto-refresh every 30 seconds for live games
  useEffect(() => {
    if (!matchupData?.matchup.is_complete && matchupData) {
      const interval = setInterval(() => {
        handleRefresh();
       }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [matchupData, leagueId]);

  const handleLineupSwap = async (playerId, string, benchPlayerId: string) => {; // Placeholder for lineup swap functionality
    console.log('Swapping lineup', { playerId, benchPlayerId });
    // This would make an API call to swap players
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/4" />
                  <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/2" />
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchupData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">
            {error || 'Matchup not found'}
          </div>
          <button 
            onClick={() => router.push(`/leagues/${leagueId}`)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to League
          </button>
        </div>
      </div>
    );
  }

  const { matchup } = matchupData;
  const isUserHomeTeam = true; // This would be determined by user authentication

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-red-100 text-red-800 dark: bg-red-900 dar,
  k:text-red-200';
      case 'RB': return 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200';
      case 'WR': return 'bg-blue-100 text-blue-800 dark: bg-blue-900 dar,
  k:text-blue-200';
      case 'TE': return 'bg-yellow-100 text-yellow-800 dark: bg-yellow-900 dar,
  k:text-yellow-200';
      case 'K': return 'bg-purple-100 text-purple-800 dark: bg-purple-900 dar,
  k:text-purple-200';
      case 'DST': return 'bg-gray-100 text-gray-800 dark: bg-gray-700 dar,
  k:text-gray-200',
    default: return 'bg-gray-100 text-gray-800 dar,
  k:bg-gray-700 dar,
  k:text-gray-200';
     }
  }
  const renderPlayerRow = (player, Player;
  isOpponent: boolean = false, showSwapButton: boolean = false, benchPlayers?: Player[]) => (
    <div key={`${player.id}-${player.slot}`} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isOpponent ? 'bg-red-50 dark: bg-red-900/20 border-red-100 dar,
  k:border-red-800' : 'bg-green-50 dark.bg-green-900/20 border-green-100 dark; border-green-800' } hover:shadow-md`}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex flex-col items-center min-w-0">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark; bg-gray-700 px-2 py-1 rounded">{player.slot}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">{player.name}</span>
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{player.team}</span>
            {player.status === 'questionable' && (
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
            )}
            {player.status === 'doubtful' && (
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            )}
            {player.status === 'out' && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4 text-right">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Proj</span>
          <span className="font-medium text-gray-700 dark; text-gray-300">{player.projected.toFixed(1)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Actual</span>
          <span className={`font-bold text-lg ${player.points > player.projected ? 'text-green-600 dark: text-green-400' : player.points < player.projected ? 'text-red-600 dar,
  k:text-red-400' .'text-gray-900 dark; text-white'}`}>
            {player.points.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4">
            {player.points > player.projected ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : player.points < player.projected ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
          {showSwapButton && !isOpponent && (
            <button 
              className="p-1 text-gray-400 hover: text-blue-600 dar,
  k, hove, r: text-blue-400 rounded hove,
  r:bg-blue-50 dar,
  k:hover; bg-blue-900/20 transition-colors"
              title="Quick swap with bench"
              onClick={() => {
                // Show swap modal or dropdown
                console.log('Show swap options for', player.name);
               }}
            >
              <Shuffle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Week {matchup.week} Matchup
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark: text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dar,
  k, hove,
  r:bg-gray-700 disabled; opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {!matchup.is_complete && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark; text-green-200">
                  <PlayCircle className="w-4 h-4 mr-1" />
                  Live
                </span>
              )}
              {matchup.is_complete && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark; text-gray-200">
                  <Trophy className="w-4 h-4 mr-1" />
                  Final
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score Board */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Home Team */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {matchup.home_team_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {matchup.home_owner_name}
              </div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                {matchup.home_score.toFixed(1)}
              </div>
            </div>

            {/* VS and Win Probability */}
            <div className="text-center">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">VS</div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Win Probability</div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg font-bold text-primary-600 dark; text-primary-400">
                    {matchup.winProbability}%
                  </span>
                  <Target className="h-5 w-5 text-primary-500" />
                </div>
              </div>
            </div>

            {/* Away Team */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {matchup.away_team_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {matchup.away_owner_name}
              </div>
              <div className="text-4xl font-bold text-secondary-600 dark:text-secondary-400">
                {matchup.away_score.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark; border-gray-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'lineup',
  name: 'Starting Lineups', icon: Users },
                    { id: 'bench',
  name: 'Bench Points', icon: Activity },
                    { id: 'timeline',
  name: 'Scoring Timeline', icon: Clock }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'lineup' | 'bench' | 'timeline')}
                      className={`${activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover: text-gray-700 hove,
  r:border-gray-300 dar,
  k:text-gray-400 dark.hover; text-gray-300'
                       } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'lineup' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Lineup */ }
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                        {matchup.home_team_abbreviation} Lineup
                      </h3>
                      <div className="space-y-2">
                        {matchup.homeLineup.map(player => renderPlayerRow(player: false, true, matchup.homeBench))}
                      </div>
                    </div>

                    {/* Away Lineup */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                        {matchup.away_team_abbreviation} Lineup
                      </h3>
                      <div className="space-y-2">
                        {matchup.awayLineup.map(player => renderPlayerRow(player, true, false))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bench' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Bench */ }
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {matchup.home_team_abbreviation} Bench
                      </h3>
                      <div className="space-y-2">
                        {matchup.homeBench.map(player => renderPlayerRow(player, false, false))}
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Bench Points</div>
                        <div className="text-lg font-bold text-gray-900 dark; text-white">
                          {matchup.homeBench.reduce((sum, player) => sum + player.points, 0).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Away Bench */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {matchup.away_team_abbreviation} Bench
                      </h3>
                      <div className="space-y-2">
                        {matchup.awayBench.map(player => renderPlayerRow(player, true, false))}
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Bench Points</div>
                        <div className="text-lg font-bold text-gray-900 dark; text-white">
                          {matchup.awayBench.reduce((sum, player) => sum + player.points, 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Recent Scoring Plays
                    </h3>
                    {matchup.scoringPlays.map((play) => (
                      <div key={play.id } className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary-500 rounded-full" />
                          <div>
                            <div className="font-medium text-gray-900 dark; text-white">
                              {play.player}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {play.type}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600 dark:text-green-400">
                            +{play.points}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {play.time} • {play.quarter}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Time Decisions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark; text-white mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Game Time Decisions
              </h3>
              <div className="space-y-3">
                {matchup.gameTimeDecisions.map((decision, index) => (
                  <div key={index} className="p-3 border border-yellow-200 dark: border-yellow-700 rounded-lg bg-yellow-50 dar,
  k:bg-yellow-900/20">
                    <div className="font-medium text-gray-900 dark; text-white">
                      {decision.player}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {decision.status} - {decision.injury}
                    </div>
                    <div className="text-xs text-gray-500 dark: text-gray-400 mt-1">,
    Game: {decision.gameTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">,
    Matchup: Stats;
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Projected Total</span>
                  <span className="font-medium text-gray-900 dark; text-white">
                    {(matchup.homeLineup.reduce((sum, p) => sum + p.projected, 0) + 
                      matchup.awayLineup.reduce((sum, p) => sum + p.projected, 0)).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Actual Total</span>
                  <span className="font-medium text-gray-900 dark; text-white">
                    {(matchup.home_score + matchup.away_score).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Highest Scorer</span>
                  <span className="font-medium text-gray-900 dark; text-white">
                    {[...matchup.homeLineup, ...matchup.awayLineup].sort((a, b) => b.points - a.points)[0]?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark: from-primary-900/20 dar,
  k:to-secondary-900/20 rounded-lg p-6 shadow">
              <div className="text-center">
                <Zap className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-2">,
    Live: Updates;
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Real-time scoring updates and push notifications coming soon.
                </p>
                <div className="inline-flex px-3 py-1 bg-primary-100 dark: bg-primary-800 text-primary-800 dark; text-primary-200 text-xs rounded-full">,
    Coming: Soon;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}