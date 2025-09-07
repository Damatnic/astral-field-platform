"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Trophy, Target, TrendingUp, TrendingDown, 
  Crown, Medal, Award, BarChart3, Calendar,
  Users, Zap, ArrowUp, ArrowDown, Minus,
  ChevronRight, Star, AlertCircle, Settings
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface StandingsPageProps {
  params: Promise<{ id: string }>;
}

interface Team {
  id: string;
  rank: number;
  team_name: string;
  team_abbreviation: string;
  owner_name: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  streak: {
    type: 'W' | 'L' | 'T';
    count: number;
  };
  power_rank: number;
  power_rank_change: number;
  playoff_probability: number;
  championship_probability: number;
  remaining_schedule_strength: number;
  projected_wins: number;
  projected_losses: number;
  head_to_head: { [teamId: string]: { wins: number; losses: number; ties: number } };
  division?: string;
  clinched_playoff?: boolean;
  eliminated?: boolean;
}

interface PlayoffBracket {
  round: string;
  matchups: {
    id: string;
    team1: { id: string; name: string; seed: number };
    team2: { id: string; name: string; seed: number };
    winner?: string;
    score1?: number;
    score2?: number;
  }[];
}

interface WeeklyRecord {
  week: number;
  team_id: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
}

export default function StandingsPage({ params }: StandingsPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'standings' | 'power-rankings' | 'playoff-picture' | 'head-to-head'>('standings');
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentUserId] = useState("1"); // Nicholas D'Amato
  const [currentWeek] = useState(12);
  const [isCommissioner] = useState(true); // Nicholas D'Amato is commissioner

  // Mock standings data
  const [standings, setStandings] = useState<Team[]>([
    {
      id: "1",
      rank: 1,
      team_name: "Gridiron Gladiators",
      team_abbreviation: "GG",
      owner_name: "Nicholas D'Amato",
      wins: 9,
      losses: 3,
      ties: 0,
      points_for: 1547.2,
      points_against: 1398.5,
      streak: { type: 'W', count: 3 },
      power_rank: 2,
      power_rank_change: 1,
      playoff_probability: 95.2,
      championship_probability: 18.7,
      remaining_schedule_strength: 0.52,
      projected_wins: 10.5,
      projected_losses: 3.5,
      head_to_head: {},
      clinched_playoff: true
    },
    {
      id: "2",
      rank: 2,
      team_name: "Touchdown Titans",
      team_abbreviation: "TT",
      owner_name: "Sarah Johnson",
      wins: 8,
      losses: 4,
      ties: 0,
      points_for: 1523.8,
      points_against: 1425.1,
      streak: { type: 'L', count: 1 },
      power_rank: 1,
      power_rank_change: -1,
      playoff_probability: 87.3,
      championship_probability: 22.1,
      remaining_schedule_strength: 0.48,
      projected_wins: 9.2,
      projected_losses: 4.8,
      head_to_head: {}
    },
    {
      id: "3",
      rank: 3,
      team_name: "Field Goal Phantoms",
      team_abbreviation: "FGP",
      owner_name: "Mike Chen",
      wins: 8,
      losses: 4,
      ties: 0,
      points_for: 1489.3,
      points_against: 1456.2,
      streak: { type: 'W', count: 2 },
      power_rank: 3,
      power_rank_change: 0,
      playoff_probability: 84.1,
      championship_probability: 16.3,
      remaining_schedule_strength: 0.55,
      projected_wins: 8.8,
      projected_losses: 5.2,
      head_to_head: {}
    },
    {
      id: "4",
      rank: 4,
      team_name: "End Zone Eagles",
      team_abbreviation: "EZE",
      owner_name: "Jessica Williams",
      wins: 7,
      losses: 5,
      ties: 0,
      points_for: 1456.7,
      points_against: 1467.3,
      streak: { type: 'W', count: 1 },
      power_rank: 4,
      power_rank_change: 1,
      playoff_probability: 72.5,
      championship_probability: 11.8,
      remaining_schedule_strength: 0.49,
      projected_wins: 8.1,
      projected_losses: 5.9,
      head_to_head: {}
    },
    {
      id: "5",
      rank: 5,
      team_name: "Red Zone Raiders",
      team_abbreviation: "RZR",
      owner_name: "David Brown",
      wins: 7,
      losses: 5,
      ties: 0,
      points_for: 1423.9,
      points_against: 1478.4,
      streak: { type: 'L', count: 2 },
      power_rank: 6,
      power_rank_change: -1,
      playoff_probability: 68.2,
      championship_probability: 8.9,
      remaining_schedule_strength: 0.51,
      projected_wins: 7.8,
      projected_losses: 6.2,
      head_to_head: {}
    },
    {
      id: "6",
      rank: 6,
      team_name: "Pocket Passers",
      team_abbreviation: "PP",
      owner_name: "Amanda Davis",
      wins: 6,
      losses: 6,
      ties: 0,
      points_for: 1398.2,
      points_against: 1456.8,
      streak: { type: 'T', count: 1 },
      power_rank: 5,
      power_rank_change: 2,
      playoff_probability: 45.7,
      championship_probability: 4.2,
      remaining_schedule_strength: 0.47,
      projected_wins: 7.2,
      projected_losses: 6.8,
      head_to_head: {}
    },
    {
      id: "7",
      rank: 7,
      team_name: "Blitz Brothers",
      team_abbreviation: "BB",
      owner_name: "Chris Wilson",
      wins: 5,
      losses: 7,
      ties: 0,
      points_for: 1367.5,
      points_against: 1487.9,
      streak: { type: 'L', count: 3 },
      power_rank: 7,
      power_rank_change: 0,
      playoff_probability: 28.3,
      championship_probability: 1.8,
      remaining_schedule_strength: 0.53,
      projected_wins: 6.1,
      projected_losses: 7.9,
      head_to_head: {}
    },
    {
      id: "8",
      rank: 8,
      team_name: "Hail Mary Heroes",
      team_abbreviation: "HMH",
      owner_name: "Lisa Garcia",
      wins: 4,
      losses: 8,
      ties: 0,
      points_for: 1334.1,
      points_against: 1523.7,
      streak: { type: 'W', count: 1 },
      power_rank: 8,
      power_rank_change: 1,
      playoff_probability: 15.2,
      championship_probability: 0.6,
      remaining_schedule_strength: 0.46,
      projected_wins: 5.3,
      projected_losses: 8.7,
      head_to_head: {}
    },
    {
      id: "9",
      rank: 9,
      team_name: "Fantasy Footballers",
      team_abbreviation: "FF",
      owner_name: "Ryan Martinez",
      wins: 3,
      losses: 9,
      ties: 0,
      points_for: 1289.6,
      points_against: 1567.2,
      streak: { type: 'L', count: 5 },
      power_rank: 9,
      power_rank_change: -1,
      playoff_probability: 5.1,
      championship_probability: 0.2,
      remaining_schedule_strength: 0.50,
      projected_wins: 4.2,
      projected_losses: 9.8,
      head_to_head: {},
      eliminated: true
    },
    {
      id: "10",
      rank: 10,
      team_name: "Championship Chasers",
      team_abbreviation: "CC",
      owner_name: "Kaity Lorbecki",
      wins: 2,
      losses: 10,
      ties: 0,
      points_for: 1245.3,
      points_against: 1634.8,
      streak: { type: 'L', count: 7 },
      power_rank: 10,
      power_rank_change: 0,
      playoff_probability: 0.8,
      championship_probability: 0.1,
      remaining_schedule_strength: 0.49,
      projected_wins: 3.1,
      projected_losses: 10.9,
      head_to_head: {},
      eliminated: true
    }
  ]);

  const [playoffBracket, setPlayoffBracket] = useState<PlayoffBracket[]>([
    {
      round: "Wild Card",
      matchups: [
        {
          id: "wc1",
          team1: { id: "3", name: "Field Goal Phantoms", seed: 3 },
          team2: { id: "6", name: "Pocket Passers", seed: 6 },
        },
        {
          id: "wc2",
          team1: { id: "4", name: "End Zone Eagles", seed: 4 },
          team2: { id: "5", name: "Red Zone Raiders", seed: 5 },
        }
      ]
    },
    {
      round: "Semifinals",
      matchups: [
        {
          id: "sf1",
          team1: { id: "1", name: "Gridiron Gladiators", seed: 1 },
          team2: { id: "0", name: "WC Winner", seed: 6 },
        },
        {
          id: "sf2",
          team1: { id: "2", name: "Touchdown Titans", seed: 2 },
          team2: { id: "0", name: "WC Winner", seed: 5 },
        }
      ]
    },
    {
      round: "Championship",
      matchups: [
        {
          id: "final",
          team1: { id: "0", name: "SF Winner", seed: 1 },
          team2: { id: "0", name: "SF Winner", seed: 2 },
        }
      ]
    }
  ]);

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  const getWinPercentage = (team: Team) => {
    const totalGames = team.wins + team.losses + team.ties;
    if (totalGames === 0) return 0;
    return ((team.wins + team.ties * 0.5) / totalGames * 100);
  };

  const getPointsPerGame = (team: Team) => {
    const totalGames = team.wins + team.losses + team.ties;
    if (totalGames === 0) return 0;
    return team.points_for / totalGames;
  };

  const getStreakColor = (streak: Team['streak']) => {
    switch(streak.type) {
      case 'W': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'L': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPowerRankIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getPlayoffStatus = (team: Team) => {
    if (team.clinched_playoff) return { text: "Clinched", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" };
    if (team.eliminated) return { text: "Eliminated", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" };
    if (team.playoff_probability >= 80) return { text: "Likely", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" };
    if (team.playoff_probability >= 50) return { text: "Bubble", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" };
    return { text: "Long Shot", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              League Standings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Current standings, playoff picture, and power rankings
            </p>
          </div>
          
          {isCommissioner && (
            <div className="mt-4 lg:mt-0">
              <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                Commissioner Tools
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'standings', label: 'Standings', icon: Trophy },
              { id: 'power-rankings', label: 'Power Rankings', icon: BarChart3 },
              { id: 'playoff-picture', label: 'Playoff Picture', icon: Target },
              { id: 'head-to-head', label: 'Head-to-Head', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leader</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {standings[0]?.team_abbreviation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Playoff Spots</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {standings.filter(t => t.playoff_probability >= 80).length}/6
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Points</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(standings.reduce((sum, t) => sum + t.points_for, 0) / standings.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weeks Left</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {14 - currentWeek}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        W-L-T
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Win %
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        PF
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        PA
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        PPG
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Streak
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Playoff %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {standings.map((team, index) => (
                      <tr 
                        key={team.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          team.id === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                              index < 6 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {team.rank}
                            </span>
                            {team.rank === 1 && <Crown className="h-4 w-4 text-yellow-500 ml-2" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {team.team_abbreviation}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {team.team_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {team.owner_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.wins}-{team.losses}-{team.ties}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getWinPercentage(team).toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.points_for.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.points_against.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getPointsPerGame(team).toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStreakColor(team.streak)}`}>
                            {team.streak.type}{team.streak.count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {team.playoff_probability.toFixed(1)}%
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPlayoffStatus(team).color}`}>
                              {getPlayoffStatus(team).text}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Power Rankings Tab */}
        {activeTab === 'power-rankings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Power Rankings - Week {currentWeek}
              </h2>
              
              <div className="space-y-4">
                {standings
                  .sort((a, b) => a.power_rank - b.power_rank)
                  .map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 text-sm font-bold">
                            {team.power_rank}
                          </span>
                          {getPowerRankIcon(team.power_rank_change)}
                        </div>
                        
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {team.team_abbreviation}
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {team.team_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.wins}-{team.losses}-{team.ties} • {team.points_for.toFixed(1)} PF
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Proj: {team.projected_wins.toFixed(1)}-{team.projected_losses.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              SOS: {(team.remaining_schedule_strength * 100).toFixed(0)}%
                            </div>
                          </div>
                          
                          <div className="w-20">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${team.championship_probability * 4}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {team.championship_probability.toFixed(1)}% ship
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Playoff Picture Tab */}
        {activeTab === 'playoff-picture' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Playoff Teams */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Playoff Teams
                </h3>
                
                <div className="space-y-3">
                  {standings.slice(0, 6).map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {team.team_abbreviation}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {team.team_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {team.wins}-{team.losses}-{team.ties}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">
                          {team.playoff_probability.toFixed(1)}%
                        </div>
                        {team.clinched_playoff && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Clinched
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Playoff Bubble */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  On the Bubble
                </h3>
                
                <div className="space-y-3">
                  {standings.slice(6, 10).map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-600 text-white text-sm font-bold">
                          {index + 7}
                        </span>
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {team.team_abbreviation}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {team.team_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {team.wins}-{team.losses}-{team.ties}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          {team.playoff_probability.toFixed(1)}%
                        </div>
                        {team.eliminated && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Eliminated
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Playoff Bracket */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Playoff Bracket Preview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {playoffBracket.map((round, roundIndex) => (
                  <div key={roundIndex} className="space-y-4">
                    <h4 className="text-center font-medium text-gray-900 dark:text-white">
                      {round.round}
                    </h4>
                    
                    <div className="space-y-4">
                      {round.matchups.map((matchup) => (
                        <div key={matchup.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                ({matchup.team1.seed}) {matchup.team1.name}
                              </span>
                              {matchup.score1 && (
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {matchup.score1}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-center text-gray-400">vs</div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                ({matchup.team2.seed}) {matchup.team2.name}
                              </span>
                              {matchup.score2 && (
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {matchup.score2}
                                </span>
                              )}
                            </div>
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

        {/* Head-to-Head Tab */}
        {activeTab === 'head-to-head' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Head-to-Head Records
                </h2>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a team</option>
                  {standings.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedTeam ? (
                <div className="space-y-4">
                  {standings
                    .filter(team => team.id !== selectedTeam)
                    .map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {team.team_abbreviation}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {team.team_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {team.owner_name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            1-1-0
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last: W 127.3-98.2
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a team to view head-to-head records
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}