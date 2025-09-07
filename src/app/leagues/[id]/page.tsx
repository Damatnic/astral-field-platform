"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Trophy, TrendingUp, Calendar, 
  Star, Award, Activity, Clock, 
  ChevronRight, Settings, MessageCircle,
  Crown, Shield, AlertTriangle, Bell,
  DollarSign, BarChart3
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";
import LeagueChat from "@/components/chat/LeagueChat";
import ActivityFeed from "@/components/activity/ActivityFeed";
import NewsFeed from "@/components/news/NewsFeed";

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

interface Team {
  id: string;
  team_name: string;
  team_abbreviation: string;
  owner_name: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
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
}

interface LeagueData {
  id: string;
  name: string;
  commissioner_name: string;
  season_year: number;
  current_week: number;
  max_teams: number;
  scoring_type: string;
  teams: Team[];
  matchups: Matchup[];
  recentActivity: any[];
}

export default function LeaguePage({ params }: LeaguePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [league, setLeague] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      fetchLeagueData();
    }
  }, [leagueId]);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) {
        throw new Error('League not found');
      }
      const data = await response.json();
      setLeague(data.league);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load league');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

  if (error || !league) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">
            {error || 'League not found'}
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate league stats
  const totalGames = league.teams.reduce((sum, team) => sum + team.wins + team.losses + team.ties, 0);
  const avgPointsFor = league.teams.reduce((sum, team) => sum + team.points_for, 0) / league.teams.length;
  const topScorer = league.teams.reduce((max, team) => team.points_for > max.points_for ? team : max);
  
  // Commissioner status (Nicholas D'Amato is commissioner)
  const isCommissioner = league.commissioner_name === "Nicholas D'Amato";
  
  // Mock pending commissioner actions
  const pendingActions = [
    { type: "trade", count: 1, message: "1 trade pending approval" },
    { type: "waiver", count: 3, message: "3 waiver claims to process" },
    { type: "scoring", count: 0, message: "No scoring corrections needed" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {league.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{league.season_year} Season</span>
            <span>•</span>
            <span>Week {league.current_week}</span>
            <span>•</span>
            <span>{league.teams.length} Teams</span>
            <span>•</span>
            <span className="capitalize">{league.scoring_type} Scoring</span>
            <span>•</span>
            <span>Commissioner: {league.commissioner_name}</span>
          </div>
        </div>

        {/* Commissioner Alerts */}
        {isCommissioner && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-bold">Commissioner Dashboard</h2>
                    <p className="text-red-100">League management and pending actions</p>
                  </div>
                </div>
                <Link
                  href={`/leagues/${leagueId}/commissioner`}
                  className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage League
                </Link>
              </div>
              
              {/* Pending Actions */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingActions.map((action, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {action.type === 'trade' && <Shield className="h-5 w-5" />}
                        {action.type === 'waiver' && <DollarSign className="h-5 w-5" />}
                        {action.type === 'scoring' && <BarChart3 className="h-5 w-5" />}
                        <span className="text-sm font-medium">{action.message}</span>
                      </div>
                      {action.count > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                          {action.count}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            href={`/leagues/${leagueId}/matchup`}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">This Week</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View your matchup</p>
          </Link>

          <Link 
            href={`/leagues/${leagueId}/roster`}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-500" />
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Team</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage roster</p>
          </Link>

          <Link 
            href={`/leagues/${leagueId}/players`}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <Star className="h-8 w-8 text-yellow-500" />
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Players</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Search & add</p>
          </Link>

          <Link 
            href={`/leagues/${leagueId}/waiver`}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8 text-purple-500" />
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Waivers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">FAAB bidding</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Week Matchups */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Week {league.current_week} Matchups
                </h2>
                <Link 
                  href={`/leagues/${leagueId}/schedule`}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {league.matchups.length > 0 ? league.matchups.map((matchup) => (
                  <div key={matchup.id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {matchup.home_team_name}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {matchup.home_score.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {matchup.away_team_name}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {matchup.away_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          matchup.is_complete 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {matchup.is_complete ? 'Final' : 'Live'}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No matchups scheduled for this week</p>
                  </div>
                )}
              </div>
            </div>

            {/* Standings Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  League Standings
                </h2>
                <Link 
                  href={`/leagues/${leagueId}/standings`}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                      <th className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Record</th>
                      <th className="text-right py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {league.teams.slice(0, 6).map((team, index) => (
                      <tr key={team.id} className="border-b dark:border-gray-700">
                        <td className="py-3">
                          <div className="flex items-center">
                            <span className="w-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </span>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {team.team_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {team.owner_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                          </span>
                        </td>
                        <td className="text-right py-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.points_for.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* League Chat */}
            <LeagueChat
              leagueId={leagueId}
              userId="current-user" // In production, get from auth
              username="Current User" // In production, get from auth
              isCommissioner={isCommissioner}
            />

            {/* League Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                League Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Games</span>
                  <span className="font-medium text-gray-900 dark:text-white">{totalGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Points/Team</span>
                  <span className="font-medium text-gray-900 dark:text-white">{avgPointsFor.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Top Scorer</span>
                  <span className="font-medium text-gray-900 dark:text-white">{topScorer.team_abbreviation}</span>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <ActivityFeed
              leagueId={leagueId}
              userId="current-user" // In production, get from auth
              maxItems={5}
              showFilters={false}
              compact={true}
            />

            {/* Fantasy News */}
            <NewsFeed
              leagueId={leagueId}
              maxItems={3}
              showFilters={false}
              compact={true}
            />

            {/* Coming Soon */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6 shadow">
              <div className="text-center">
                <Star className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  More Features Coming
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  AI insights, trade analyzer, and more advanced features are in development.
                </p>
                <div className="inline-flex px-3 py-1 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 text-xs rounded-full">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

