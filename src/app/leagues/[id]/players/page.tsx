"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, TrendingUp, TrendingDown, 
  Plus, UserX, Clock, Star, BarChart3, Users,
  ChevronLeft, ChevronRight, Check, X, AlertCircle, Trophy, Activity, Calendar, AlertTriangle, Info
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface PlayersPageProps {
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
  available, boolean,
    ownedBy: string | null;
  percentOwned: number;
    percentStarted: number;
  seasonStats: {
    passingYards?: number;
    passingTouchdowns?: number;
    rushingYards?: number;
    rushingTouchdowns?: number;
    receivingYards?: number;
    receivingTouchdowns?: number;
    receptions?: number;
    fieldGoals?: number;
    extraPoints?: number;
  }
  last3Games: number[],
    projection: number;
  adp: number;
    byeWeek: number;
  injuryStatus?: string;
  news?: string;
}

interface TrendingPlayer {
  id: string;
    name: string;
  position: string;
    team: string;
  trend: 'up' | 'down',
    addedPercent: number;
  
}
interface PlayersData {
  players: Player[],
    total: number;
  page: number;
    limit: number;
  hasNextPage, boolean,
    hasPreviousPage: boolean;
  trending: TrendingPlayer[],
    topAvailable: {
  QB: Player[],
    RB: Player[];
    WR: Player[],
    TE: Player[];
    K: Player[],
    DST: Player[];
  }
  recentNews: {
  playerId: string;
    playerName: string;
    position: string;
    team: string;
    headline: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  filters: {
  positions: string[];
    teams: string[],
    availabilityOptions: { valu,
  e: string; label: string; }[];
  }
}

export default function PlayersPage({ params }: PlayersPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [playersData, setPlayersData] = useState<PlayersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("available");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [sortBy, setSortBy] = useState("projection");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // UI State
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      fetchPlayers();
    }
  }, [leagueId, searchTerm, selectedPosition, selectedAvailability, selectedTeam, sortBy, sortOrder, currentPage]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedPosition !== 'all' && { position: selectedPosition }),
        ...(selectedAvailability !== 'all' && { availability: selectedAvailability }),
        ...(selectedTeam !== 'all' && { team: selectedTeam }),
        sortBy, sortOrder,
        page: currentPage.toString(),
        limit: '50'
     });

      const response = await fetch(`/api/leagues/${leagueId}/players? ${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
     }
      const data = await response.json();
      setPlayersData(data);
    } catch (err) {setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }
  const handlePlayerAction = async (;
    playerId, string,
    action: 'add' | 'drop' | 'claim'
  ) => {
    try {
      setActionLoading(playerId);
      const response = await fetch(`/api/leagues/${leagueId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
},
        body: JSON.stringify({
          action,
          playerId
       })
});

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
     }

      setNotification({
type: 'success',
        message: result.message
     });
      fetchPlayers(); // Refresh the list
    } catch (err) {
      setNotification({ 
type: 'error',
        message: err instanceof Error ? err.messag,
  e: 'Action failed'
     });
    } finally {
      setActionLoading(null);
    }
  }
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
  const avgLast3 = (games: number[]) => {
    return games.reduce((sum, game) => sum + game, 0) / games.length;
  }
  const formatSeasonStats = (player: Player) => {
    const stats = player.seasonStats;
    if (player.position === 'QB') {
      return `${stats.passingYards || 0}/${stats.passingTouchdowns || 0} Pass`;
    } else if (player.position === 'RB') {
      return `${stats.rushingYards || 0}/${stats.rushingTouchdowns || 0} Rush`;
    } else if (player.position === 'WR' || player.position === 'TE') {
      return `${stats.receivingYards || 0}/${stats.receivingTouchdowns || 0} Rec`;
    } else if (player.position === 'K') {
      return `${stats.fieldGoals || 0}/${stats.extraPoints || 0} FG/XP`;
    }
    return 'N/A';
  }
  const getInjuryIcon = (status?: string) => {
    if (!status || status === 'healthy') return null;
    
    switch (status) {
      case 'questionable':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      break;
    case 'doubtful':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'out':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  }
  if (loading && !playersData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !playersData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</div>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${notification.type === 'success' 
            ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200'
            : 'bg-red-100 text-red-800 dark: bg-red-900 dar,
  k:text-red-200'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 mr-2" />
          ) : (
            <X className="h-5 w-5 mr-2" />
          )}
          {notification.message}
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Player Search & Add
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and add players to your roster
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Players */}
            {playersData?.trending && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  Trending
                </h3>
                <div className="space-y-3">
                  {playersData.trending.slice(0, 5).map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-2 hover: bg-gray-50 dar,
  k, hove, r: bg-gray-700 rounded">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPositionColor(player.position)}`}>
                          {player.position}
                        </span>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {player.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {player.team}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {player.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs font-medium ${player.trend === 'up' ? 'text-green-600' : 'text-red-600'
                       }`}>
                          {player.addedPercent > 0 ? '+' : ''}{player.addedPercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Available by Position */}
            {playersData?.topAvailable && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  Top Available
                </h3>
                <div className="space-y-4">
                  {Object.entries(playersData.topAvailable).map(([position, players]) => (
                    players.length > 0 && (
                      <div key={position}>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {position}
                        </h4>
                        <div className="space-y-2">
                          {players.slice(0, 2).map((player) => (
                            <div key={player.id} className="flex items-center justify-between text-sm p-2 hover: bg-gray-50 dar,
  k, hove, r: bg-gray-700 rounded">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {player.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {player.team} • {player.projection.toFixed(1)} proj
                                </div>
                              </div>
                              {player.injuryStatus && player.injuryStatus !== 'healthy' && (
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Recent News/Injuries */}
            {playersData?.recentNews && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Activity className="h-5 w-5 text-blue-500 mr-2" />
                  Recent News
                </h3>
                <div className="space-y-3">
                  {playersData.recentNews.slice(0, 5).map((news, index) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPositionColor(news.position)}`}>
                            {news.position}
                          </span>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {news.playerName}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {news.team}
                          </span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${news.severity === 'critical' ? 'bg-red-500' :
                          news.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                       }`} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {news.headline}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(news.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Availability
                  </label>
                  <select
                    value={selectedAvailability}
                    onChange={(e) => {
                      setSelectedAvailability(e.target.value);
                      setCurrentPage(1);
                   }}
                    className="w-full p-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white dar,
  k:bg-gray-700 text-gray-900 dark; text-white"
                  >
                    {(playersData?.filters.availabilityOptions || [
                      { value: 'all', label: 'All Players' },
                      { value: 'available', label: 'Available' },
                      { value: 'owned', label: 'Owned' }
                    ]).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => {
                      setSelectedPosition(e.target.value);
                      setCurrentPage(1);
                   }}
                    className="w-full p-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white dar,
  k:bg-gray-700 text-gray-900 dark; text-white"
                  >
                    <option value="all">All Positions</option>
                    {(playersData?.filters.positions || ['QB', 'RB', 'WR', 'TE', 'K', 'DST']).map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NFL Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => {
                      setSelectedTeam(e.target.value);
                      setCurrentPage(1);
                   }}
                    className="w-full p-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white dar,
  k:bg-gray-700 text-gray-900 dark; text-white"
                  >
                    <option value="all">All Teams</option>
                    {(playersData?.filters.teams || [
                      'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',
                      'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
                      'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
                    ]).map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and ArrowUpDown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                     }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dar,
  k:text-white placeholder-gray-500 dar,
  k:placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
                  >
                    <option value="projection">Projection</option>
                    <option value="points">Avg Points</option>
                    <option value="owned">% Owned</option>
                    <option value="adp">ADP</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dar,
  k, hove,
  r:bg-gray-600"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Players Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Season Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Projection
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last 3
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Owned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark: bg-gray-800 divide-y divide-gray-200 dar,
  k:divide-gray-700">
                    {playersData?.players.map((player) => (
                      <tr key={player.id} className="hover: bg-gray-50 dar,
  k, hove, r: bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {player.name}
                                </div>
                                {getInjuryIcon(player.injuryStatus)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {player.team} • Bye: {player.byeWeek}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {player.available ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200">
                              Available
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark: bg-red-900 dar,
  k:text-red-200 mb-1">
                                Owned
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {player.ownedBy}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatSeasonStats(player)}
                          </div>
                          {player.news && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate max-w-32" title={player.news}>
                              {player.news}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {player.projection.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {avgLast3(player.last3Games).toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {player.percentOwned}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {player.percentStarted}% started
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {player.available ? (
                            <button
                              onClick={() => handlePlayerAction(player.id, 'add')}
                              disabled={actionLoading === player.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover: bg-green-700 disable,
  d:opacity-50 disable,
  d:cursor-not-allowed"
                            >
                              {actionLoading === player.id ? (
                                <Clock className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1" />
                              )}
                              Add
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePlayerAction(player.id, 'claim')}
                              disabled={actionLoading === player.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover: bg-blue-700 disable,
  d:opacity-50 disable,
  d:cursor-not-allowed"
                            >
                              {actionLoading === player.id ? (
                                <Clock className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Star className="h-4 w-4 mr-1" />
                              )}
                              Claim
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {playersData && (
                <div className="bg-gray-50 dark: bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-200 dar,
  k:border-gray-600">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    Showing {((playersData.page - 1) * playersData.limit) + 1} to {Math.min(playersData.page * playersData.limit, playersData.total)} of {playersData.total} players
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!playersData.hasPreviousPage}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark: border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disable,
  d:opacity-50 disable,
  d:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!playersData.hasNextPage}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark: border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disable,
  d:opacity-50 disable,
  d:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}