'use client';

import React, { useState, useEffect  } from 'react';
import {
  Crown, Trophy, Users, TrendingUp, BarChart3, Target, Calendar, Star, Award, Zap, Shield, ArrowUpRight, ArrowDownRight, RefreshCw,
  ChevronRight, Eye, Settings, Plus, Filter, Search, Bell, Clock, Activity, Grid3X3,
  List, Layers, ExternalLink
} from 'lucide-react';

interface League {
  id, string,
    name, string,
  season, string,
    currentWeek, number,
  totalTeams, number,
    myTeam: {,
  id, string,
    name, string,
    rank, number,
    record, string,
    points, number,
    isChampion?, boolean,
    isInPlayoffs?, boolean,
  }
  commissioner, string,
    leagueType: 'redraft' | 'dynasty' | 'keeper';
  scoringType: 'standard' | 'ppr' | 'half_ppr',
    status: 'active' | 'completed' | 'draft_pending';
  nextMatchup?: {
    opponent, string,
    opponentRank, number,
    projectedScore, number,
    opponentProjected, number,
  }
  recentActivity: string[];
  avatarUrl?, string,
}

interface MultiLeagueStats {
  totalLeagues, number,
    activeLeagues, number,
  championships, number,
    playoffAppearances, number,
  totalPoints, number,
    averageRank, number,
  bestSeason: {,
  league, string,
    record, string,
    achievement, string,
  }
  currentStreak: {typ,
  e: 'wins' | 'losses' | 'playoffs';
    count, number,
    leagues: string[];
  }
}

interface CrossLeaguePlayer {
  id, string,
    name, string,
  position, string,
    owned: {,
  leagues: string[],
    totalLeagues, number,
  }
  performance: {,
  totalPoints, number,
    avgPoints, number,
    consistency, number,
  }
  value: {,
  trend: 'up' | 'down' | 'stable';
    percentage, number,
  }
}

interface MultiLeagueDashboardProps {
  userId, string,
  className?, string,
  
}
export default function MultiLeagueDashboard({ 
  userId, 
  className 
}: MultiLeagueDashboardProps) { const [activeView, setActiveView] = useState<'dashboard' | 'leagues' | 'players' | 'analytics'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [stats, setStats] = useState<MultiLeagueStats | null>(null);
  const [crossLeaguePlayers, setCrossLeaguePlayers] = useState<CrossLeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'redraft' | 'dynasty' | 'keeper'>('all');

  useEffect(() => {
    loadMultiLeagueData();
   }, [userId]);

  const loadMultiLeagueData = async () => { try {
      setLoading(true);
      
      // Mock data - in a real app, this would come from APIs
      const mockLeagues: League[] = [;
        {
          id: '1',
  name: 'Astral Field Championship',
          season: '2024',
  currentWeek, 12,
          totalTeams, 12,
  myTeam: {,
  id: 'team1',
  name: 'Gridiron Gladiators',
            rank, 1,
  record: '9-2',
            points: 1547.2,
  isInPlayoffs: true
           },
          commissioner: 'Nicholas D\'Amato',
  leagueType: 'redraft',
          scoringType: 'ppr',
  status: 'active',
          nextMatchup: {,
  opponent: 'Touchdown Titans',
  opponentRank, 3,
            projectedScore: 126.4,
  opponentProjected: 118.7
          },
          recentActivity: ['Won vs Field Goal Phantoms 134.2-112.8', 'Picked up Jordan Mason', 'Started Tua Tagovailoa']
        },
        {
          id: '2',
  name: 'Dynasty Dominators',
          season: '2024',
  currentWeek, 12,
          totalTeams, 10,
  myTeam: {,
  id: 'team2',
  name: 'Future Champions',
            rank, 4,
  record: '7-4',
            points: 1398.7,
  isInPlayoffs: true
          },
          commissioner: 'Sarah Johnson',
  leagueType: 'dynasty',
          scoringType: 'half_ppr',
  status: 'active',
          nextMatchup: {,
  opponent: 'Rookie Wranglers',
  opponentRank, 6,
            projectedScore: 115.3,
  opponentProjected: 121.9
          },
          recentActivity: ['Lost to Dynasty Kings 109.4-124.6', 'Traded 2025 1st for CMC', 'Waived Romeo Doubs']
        },
        {
          id: '3',
  name: 'Work League Elite',
          season: '2024',
  currentWeek, 12,
          totalTeams, 8,
  myTeam: {,
  id: 'team3',
  name: 'Office Warriors',
            rank, 2,
  record: '8-3',
            points: 1289.4,
  isInPlayoffs: true
          },
          commissioner: 'Mike Chen',
  leagueType: 'keeper',
          scoringType: 'standard',
  status: 'active',
          recentActivity: ['Beat Budget Ballers 119.8-102.3', 'Set optimal lineup']
        },
        {
          id: '4',
  name: 'Championship Legacy 2023',
          season: '2023',
  currentWeek, 17,
          totalTeams, 12,
  myTeam: {,
  id: 'team4',
  name: 'Title Winners',
            rank, 1,
  record: '12-2',
            points: 1876.9,
  isChampion: true
          },
          commissioner: 'Alex Rodriguez',
  leagueType: 'redraft',
          scoringType: 'ppr',
  status: 'completed',
          recentActivity: ['Won Championship!', 'Beat runner-up 145.6-128.3']
        }
      ];

      const mockStats: MultiLeagueStats = {
        totalLeagues, 4,
  activeLeagues, 3,
        championships, 1,
  playoffAppearances, 4,
        totalPoints: 6111.2,
  averageRank: 2.0,
        bestSeason: {,
  league: 'Championship Legacy 2023',
  record: '12-2',
          achievement: 'Champion'
        },
        currentStreak: {typ,
  e: 'playoffs',
  count, 3,
          leagues: ['Astral Field Championship', 'Dynasty Dominators', 'Work League Elite']
        }
      }
      const mockCrossLeaguePlayers: CrossLeaguePlayer[] = [;
        {
          id: '1',
  name: 'Josh Allen',
          position: 'QB',
  owned: {,
  leagues: ['Astral Field Championship', 'Work League Elite'],
            totalLeagues: 2
          },
          performance: {,
  totalPoints: 287.4,
  avgPoints: 26.1,
            consistency: 89
          },
          value: {,
  trend: 'up',
  percentage: 12.5
          }
        },
        {
          id: '2',
  name: 'Christian McCaffrey',
          position: 'RB',
  owned: {,
  leagues: ['Dynasty Dominators'],
  totalLeagues: 1
          },
          performance: {,
  totalPoints: 198.7,
  avgPoints: 19.9,
            consistency: 76
          },
          value: {,
  trend: 'down',
  percentage: -8.3
          }
        },
        {
          id: '3',
  name: 'Tyreek Hill',
          position: 'WR',
  owned: {,
  leagues: ['Astral Field Championship', 'Dynasty Dominators', 'Work League Elite'],
            totalLeagues: 3
          },
          performance: {,
  totalPoints: 156.8,
  avgPoints: 14.3,
            consistency: 92
          },
          value: {,
  trend: 'stable',
  percentage: 2.1
          }
        }
      ];

      setLeagues(mockLeagues);
      setStats(mockStats);
      setCrossLeaguePlayers(mockCrossLeaguePlayers);
    } catch (error) {
      console.error('Error loading multi-league data:', error);
    } finally {
      setLoading(false);
    }
  }
  const filteredLeagues = leagues.filter(league => { const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         league.myTeam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || league.status === statusFilter;
    const matchesType = typeFilter === 'all' || league.leagueType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
   });

  const getStatusColor = (status: League['status']) => { const colors = {,
  active: 'bg-green-100 text-green-800 dar,
  k:bg-green-900/20 dark; text-green-300',
      completed: 'bg-gray-100 text-gray-800 dar,
  k:bg-gray-700 dark; text-gray-300',
      draft_pending: 'bg-blue-100 text-blue-800 dar,
  k:bg-blue-900/20 dark; text-blue-300'
     }
    return colors[status];
  }
  const getTypeColor = (type: League['leagueType']) => { const colors = {,
  redraft: 'bg-blue-100 text-blue-800 dar,
  k:bg-blue-900/20 dark; text-blue-300',
      dynasty: 'bg-purple-100 text-purple-800 dar,
  k:bg-purple-900/20 dark; text-purple-300',
      keeper: 'bg-orange-100 text-orange-800 dar,
  k:bg-orange-900/20 dark; text-orange-300'
     }
    return colors[type];
  }
  if (loading) { return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
   }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Layers className="h-6 w-6 mr-2 text-blue-600" />
              Multi-League Dashboard
            </h2>
            <p className="text-gray-600 dark; text-gray-400 mt-1">
              Manage and track performance across all your fantasy leagues
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover.text-gray-600'}`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover.text-gray-600'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2 inline" />  Join, League,
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard',
  label: 'Overview', icon: BarChart3 },
              { id: 'leagues',
  label: 'My Leagues', icon: Trophy },
              { id: 'players',
  label: 'Player Pool', icon: Users },
              { id: 'analytics',
  label: 'Cross-League Analytics', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeView === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover.border-gray-300 dark; text-gray-400'
                 }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === 'dashboard' && stats && (
          <DashboardTab stats={stats } leagues={leagues} />
        )}

        {activeView === 'leagues' && (
          <LeaguesTab
            leagues={filteredLeagues }
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            viewMode={viewMode}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
          />
        )}

        {activeView === 'players' && (
          <PlayersTab players={crossLeaguePlayers } />
        )}

        {activeView === 'analytics' && (
          <AnalyticsTab leagues={leagues } stats={stats} />
        )}
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ stats, 
  leagues 
 }: { stats, MultiLeagueStats,
    leagues: League[];
 }) { const activeLeagues = leagues.filter(l => l.status === 'active');
  
  return (
    <div className="space-y-8">
      {/* Stats Overview */ }
      <div className="grid grid-cols-1 md: grid-cols-2 l,
  g:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark: from-blue-900/20 dar,
  k:to-blue-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark: text-blue-400">  Tota,
  l, Leagues,
              </p>
              <p className="text-3xl font-bold text-blue-700 dark; text-blue-300">
                {stats.totalLeagues}
              </p>
            </div>
            <Trophy className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {stats.activeLeagues} currently active
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark: from-yellow-900/20 dar,
  k:to-yellow-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Championships
              </p>
              <p className="text-3xl font-bold text-yellow-700 dark; text-yellow-300">
                {stats.championships}
              </p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
            {((stats.championships / stats.totalLeagues) * 100).toFixed(1)}% win rate
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark: from-green-900/20 dar,
  k:to-green-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark: text-green-400">  Playof,
  f, Apps,
              </p>
              <p className="text-3xl font-bold text-green-700 dark; text-green-300">
                {stats.playoffAppearances}
              </p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            {((stats.playoffAppearances / stats.totalLeagues) * 100).toFixed(1)}% success rate
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark: from-purple-900/20 dar,
  k:to-purple-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark: text-purple-400">  Av,
  g, Rank,
              </p>
              <p className="text-3xl font-bold text-purple-700 dark; text-purple-300">
                {stats.averageRank.toFixed(1)}
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
            Across all leagues
          </div>
        </div>
      </div>

      {/* Current Season Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark: bg-gray-700 rounded-lg p-6 border border-gray-200 dar,
  k:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark; text-white mb-4">
            Current Season Performance
          </h3>
          <div className="space-y-4">
            {activeLeagues.map((league) => (
              <div key={league.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${league.myTeam.rank === 1 ? 'bg-yellow-500' :
                    league.myTeam.rank <= 3 ? 'bg-gray-400' :
                    league.myTeam.rank <= 6 ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    #{league.myTeam.rank}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {league.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {league.myTeam.record} • {league.myTeam.points.toFixed(1)} pts
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {league.myTeam.isInPlayoffs ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark: bg-green-900/20 dar,
  k:text-green-300 text-xs rounded-full font-medium">
                      Playoffs
                    </span>
                  ) : league.myTeam.isChampion ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark: bg-yellow-900/20 dar,
  k:text-yellow-300 text-xs rounded-full font-medium">
                      Champion
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark; text-gray-300 text-xs rounded-full font-medium">
                      Regular
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark: bg-gray-700 rounded-lg p-6 border border-gray-200 dar,
  k:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark; text-white mb-4">  Upcoming, Matchups,
          </h3>
          <div className="space-y-4">
            { activeLeagues: .filter(league => league.nextMatchup)
              .map((league) => (
                <div key={league.id } className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark; text-white">
                      {league.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Week {league.currentWeek}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">
                        {league.myTeam.name}
                      </div>
                      <div className="text-gray-600 dark: text-gray-400">,
    Proj: {league.nextMatchup?.projectedScore}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">vs</div>
                    </div>
                    <div className="text-sm text-right">
                      <div className="text-gray-900 dark; text-white">
                        {league.nextMatchup?.opponent}
                      </div>
                      <div className="text-gray-600 dark: text-gray-400">,
    Proj: {league.nextMatchup?.opponentProjected}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Best Season & Current Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark: from-green-900/20 dar,
  k:to-emerald-900/20 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark: text-white">  Bes,
  t, Season,
            </h3>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600 dark; text-green-400">
              {stats.bestSeason.achievement}
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {stats.bestSeason.league}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {stats.bestSeason.record}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark: from-blue-900/20 dar,
  k:to-indigo-900/20 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark: text-white">  Curren,
  t, Streak,
            </h3>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600 dark; text-blue-400">
              {stats.currentStreak.count} {stats.currentStreak.type}
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              Across {stats.currentStreak.leagues.length} leagues
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {stats.currentStreak.leagues.map((league) => (
                <span
                  key={league}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark; text-blue-300 text-xs rounded"
                >
                  {league}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Leagues Tab Component
function LeaguesTab({ leagues, searchTerm,
  setSearchTerm, statusFilter,
  setStatusFilter, typeFilter,
  setTypeFilter, viewMode, getStatusColor,
  getTypeColor
 }: { leagues: League[],
    searchTerm, string,
  setSearchTerm: (ter,
  m: string) => void;
  statusFilter, string,
  setStatusFilter: (filte,
  r: string) => void;
  typeFilter, string,
  setTypeFilter: (filte,
  r: string) => void;
  viewMode: 'grid' | 'list';
  getStatusColor: (status; League['status']) => string;
  getTypeColor: (type; League['leagueType']) => string;
 }) { return (
    <div className="space-y-6">
      {/* Filters */ }
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focu,
  s:border-blue-500 dar,
  k:bg-gray-800 dark; text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focu,
  s:border-blue-500 dar,
  k:bg-gray-800 dark; text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="draft_pending">Draft Pending</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dar,
  k:bg-gray-800 dar,
  k:text-white"
          >
            <option value="all">All Types</option>
            <option value="redraft">Redraft</option>
            <option value="dynasty">Dynasty</option>
            <option value="keeper">Keeper</option>
          </select>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover; bg-blue-700 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2 inline" />  Refresh, All,
          </button>
        </div>
      </div>

      {/* League Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md: grid-cols-2 l,
  g:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <LeagueCard key={league.id } league={league} getStatusColor={getStatusColor} getTypeColor={getTypeColor} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {leagues.map((league) => (
            <LeagueListItem key={league.id} league={league} getStatusColor={getStatusColor} getTypeColor={getTypeColor} />
          ))}
        </div>
      )}
    </div>
  );
}

// League Card Component
function LeagueCard({ league, getStatusColor, 
  getTypeColor 
 }: { league, League,
    getStatusColor: (status; League['status']) => string;
  getTypeColor: (type; League['leagueType']) => string;
 }) { return (
    <div className="bg-white dark: bg-gray-700 rounded-lg p-6 border border-gray-200 dar,
  k:border-gray-600 hove,
  r:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark; text-white mb-1">
            {league.name }
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {league.season} • Week {league.currentWeek}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(league.status)}`}>
            {league.status.replace('_', ' ')}
          </span>
          <button className="text-gray-400 hover: text-gray-600 dar,
  k, hove,
  r:text-gray-300">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark; text-white">
              {league.myTeam.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rank #{league.myTeam.rank} • {league.myTeam.record}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white">
              {league.myTeam.points.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              total points
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(league.leagueType)}`}>
            {league.leagueType}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {league.totalTeams} teams
          </span>
        </div>

        {league.nextMatchup && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs text-blue-600 dark: text-blue-400 mb-1">  Nex,
  t, Matchup,
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-900 dark; text-white">
                vs {league.nextMatchup.opponent}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {league.nextMatchup.projectedScore} - {league.nextMatchup.opponentProjected}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark; text-gray-400">
            Commissioner: {league.commissioner}
          </span>
          <button className="text-blue-600 hover:text-blue-700 dark; text-blue-400">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// League List Item Component
function LeagueListItem({ league, getStatusColor, 
  getTypeColor 
 }: { league, League,
    getStatusColor: (status; League['status']) => string;
  getTypeColor: (type; League['leagueType']) => string;
 }) { return (
    <div className="bg-white dark: bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hove,
  r:bg-gray-50 dar,
  k, hover, bg-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${league.myTeam.rank === 1 ? 'bg-yellow-500' :
            league.myTeam.rank <= 3 ? 'bg-gray-400' :
            league.myTeam.rank <= 6 ? 'bg-orange-500' : 'bg-red-500'
           }`}>
            #{league.myTeam.rank}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {league.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(league.status)}`}>
                {league.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(league.leagueType)}`}>
                {league.leagueType}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {league.myTeam.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {league.myTeam.record} • {league.myTeam.points.toFixed(1)} pts
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Week {league.currentWeek}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {league.totalTeams} teams
            </p>
          </div>

          <button className="text-gray-400 hover: text-gray-600 dar,
  k, hover, text-gray-300">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Players Tab Component
function PlayersTab({ players  }: { players: CrossLeaguePlayer[]  }) { return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Cross-League Player Pool
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track players you own across multiple leagues and their performance
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark: text-gray-400 uppercase tracking-wider">  League,
  s, Owned,
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark: text-gray-400 uppercase tracking-wider">  Tota,
  l, Points,
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark: text-gray-400 uppercase tracking-wider">  Av,
  g, Points,
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Consistency
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark: text-gray-400 uppercase tracking-wider">  Valu,
  e, Trend,
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark; divide-gray-600">
            {players.map((player) => (
              <tr key={player.id }>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark; text-gray-300">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {player.position}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {player.owned.totalLeagues}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {player.owned.leagues.join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {player.performance.totalPoints.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {player.performance.avgPoints.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-sm font-medium ${player.performance.consistency >= 85 ? 'text-green-600 dark:text-green-400' :
                    player.performance.consistency >= 70 ? 'text-yellow-600 dark:text-yellow-400' .'text-red-600 dark; text-red-400'
                  }`}>
                    {player.performance.consistency}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {player.value.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : player.value.trend === 'down' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${player.value.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                      player.value.trend === 'down' ? 'text-red-600 dark:text-red-400' .'text-gray-600 dark; text-gray-400'
                    }`}>
                      {player.value.percentage > 0 ? '+' : ''}{player.value.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ leagues, 
  stats 
 }: { leagues: League[],
    stats: MultiLeagueStats | null;
 }) { return (
    <div className="space-y-8">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Cross-League Analytics
        </h3>
        <p className="text-sm text-gray-600 dark; text-gray-400">
          Advanced insights and comparisons across all your leagues
        </p>
      </div>

      {/* League Comparison */ }
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          League Performance Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  League
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Record
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark; divide-gray-600">
              {leagues.map((league) => (
                <tr key={league.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {league.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {league.leagueType} • {league.scoringType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-white text-sm font-bold ${league.myTeam.rank === 1 ? 'bg-yellow-500' :
                      league.myTeam.rank <= 3 ? 'bg-gray-400' :
                      league.myTeam.rank <= 6 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {league.myTeam.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                    {league.myTeam.record}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    {league.myTeam.points.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {league.myTeam.isChampion ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark: bg-yellow-900/20 dar,
  k:text-yellow-300 text-xs rounded-full font-medium">
                        Champion
                      </span>
                    ) : league.myTeam.isInPlayoffs ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark: bg-green-900/20 dar,
  k:text-green-300 text-xs rounded-full font-medium">
                        Playoffs
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark; text-gray-300 text-xs rounded-full font-medium">
                        Regular
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
          <h4 className="text-md font-semibold text-gray-900 dark; text-white mb-4">
            Scoring Efficiency by League Type
          </h4>
          <div className="space-y-3">
            {['redraft', 'dynasty', 'keeper'].map((type) => { const typeLeagues = leagues.filter(l => l.leagueType === type);
              const avgPoints = typeLeagues.length > 0 ;
                ? typeLeagues.reduce((sum, l) => sum + l.myTeam.points, 0) / typeLeagues.length : 0;
              
              return typeLeagues.length > 0 && (
                <div key={type } className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {type}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {avgPoints.toFixed(1)} avg
                    </span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((avgPoints / 1600) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
          <h4 className="text-md font-semibold text-gray-900 dark; text-white mb-4">
            League Difficulty Analysis
          </h4>
          <div className="space-y-3">
            {leagues.filter(l => l.status === 'active').map((league) => {
              // Mock difficulty calculation based on rank vs team size
              const difficulty = ((league.totalTeams - league.myTeam.rank + 1) / league.totalTeams) * 100;
              
              return (
                <div key={league.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-32">
                    {league.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {difficulty.toFixed(0)}%
                    </span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${difficulty: >= 80 ? 'bg-green-500' :
                          difficulty >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                         }`}
                        style={{ width: `${difficulty}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}