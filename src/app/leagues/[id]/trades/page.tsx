"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, Plus, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, Star, AlertCircle, Calendar, Filter, Search, MessageCircle, Users, 
  BarChart3, Settings, Send, Eye, Trash2, RefreshCw
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface TradesPageProps {
  params: Promise<{ id, string
}
>;
}

interface Player {
  id: string;
    name: string;
  position: string;
    team: string;
  points: number;
    avgPoints: number;
  projectedPoints: number;
    injury_status: string | null;
  bye_week: number;
    trend: 'up' | 'down' | 'stable';
  rostered_by?: string;
  rostered_team?: string;
  
}
interface Team {
  id: string;
    team_name: string;
  team_abbreviation: string;
    owner_name: string;
  record: string;
    players: Player[];
}

interface Trade {
  id: string;
    from_team: string;
  to_team: string;
    from_team_name: string;
  to_team_name: string;
    from_owner: string;
  to_owner: string;
    players_offered: Player[];
  players_requested: Player[],
    status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  created_at: string;
    expires_at: string;
  fairness_score: number;
    ai_analysis: string;
  counter_offer?: {
    players_offered: Player[],
    players_requested: Player[];
    message: string;
  }
  messages: {
  id: string;
    from: string;
    message: string;
    timestamp: string;
  }[];
  league_votes?: {
    for: number;
    against: number;
    needed: number;
  }
}

export default function TradesPage({ params }: TradesPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("1"); // Nicholas D'Amato
  const [activeTab, setActiveTab] = useState<'propose' | 'active' | 'history'>('propose');
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [offeredPlayers, setOfferedPlayers] = useState<Player[]>([]);
  const [requestedPlayers, setRequestedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showTradeAnalyzer, setShowTradeAnalyzer] = useState(false);
  
  // Mock data for demonstration
  const [teams, setTeams] = useState<Team[]>([;
    {
      id: "1",
  team_name: "Gridiron Gladiators",
      team_abbreviation: "GG",
  owner_name: "Nicholas D'Amato",
      record: "8-4",
  players: [
        { id: "p1",
  name: "Josh Allen", position: "QB",
  team: "BUF", points: 312.4,
  avgPoints: 26.0, projectedPoints: 24.8, injury_status, null, bye_week, 12,
  trend: 'up'  },
        { id: "p2",
  name: "Christian McCaffrey", position: "RB",
  team: "SF", points: 285.6,
  avgPoints: 23.8, projectedPoints: 22.1, injury_status, null, bye_week, 9,
  trend: 'stable' },
        { id: "p3",
  name: "Tyreek Hill", position: "WR",
  team: "MIA", points: 245.2,
  avgPoints: 20.4, projectedPoints: 18.9, injury_status, null, bye_week, 6,
  trend: 'down' }
      ]
    },
    {
      id: "2",
  team_name: "Touchdown Titans",
      team_abbreviation: "TT",
  owner_name: "Sarah Johnson",
      record: "7-5",
  players: [
        { id: "p4",
  name: "Patrick Mahomes", position: "QB",
  team: "KC", points: 298.7,
  avgPoints: 24.9, projectedPoints: 26.2, injury_status, null, bye_week, 10,
  trend: 'up' },
        { id: "p5",
  name: "Derrick Henry", position: "RB",
  team: "TEN", points: 198.3,
  avgPoints: 16.5, projectedPoints: 15.8,
  injury_status: "Questionable", bye_week, 7,
  trend: 'down' },
        { id: "p6",
  name: "Davante Adams", position: "WR",
  team: "LV", points: 201.4,
  avgPoints: 16.8, projectedPoints: 17.3, injury_status, null, bye_week, 13,
  trend: 'stable' }
      ]
    }
  ]);

  const [trades, setTrades] = useState<Trade[]>([;
    {
      id: "t1",
  from_team: "1",
      to_team: "2",
  from_team_name: "Gridiron Gladiators",
      to_team_name: "Touchdown Titans",
  from_owner: "Nicholas D'Amato",
      to_owner: "Sarah Johnson",
  players_offered: [
        { id: "p3",
  name: "Tyreek Hill", position: "WR",
  team: "MIA", points: 245.2,
  avgPoints: 20.4, projectedPoints: 18.9, injury_status, null, bye_week, 6,
  trend: 'down' }
      ],
      players_requested: [
        { id: "p6",
  name: "Davante Adams", position: "WR",
  team: "LV", points: 201.4,
  avgPoints: 16.8, projectedPoints: 17.3, injury_status, null, bye_week, 13,
  trend: 'stable' }
      ],
      status: 'pending',
  created_at: '2024-12-01T1,
  0, 0, 0: 00Z',
  expires_at: '2024-12-08,
  T10, 0,
  0:00Z',
  fairness_score: 7.8,
      ai_analysis: "This trade favors the offering team slightly.Tyreek Hill has higher season totals but shows declining trend, while Adams has been more consistent recently.",
      messages: [
        {
          id: "m1",
  from: "Nicholas D'Amato",
          message: "Hey Sarah, interested in swapping WRs? Hill for Adams straight up?",
          timestamp: '2024-12-01,
  T10, 0,
  0:00Z'
        }
      ]
    }
  ]);

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => {const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
     } else {
      setLoading(false);
    }
  }, [router]);

  const currentTeam = teams.find(t => t.id === currentUserId);
  const otherTeams = teams.filter(t => t.id !== currentUserId);
  
  const selectedTeamData = teams.find(t => t.id === selectedTeam);
  
  const filteredPlayers = selectedTeamData?.players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||;
                         player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !positionFilter || player.position === positionFilter;
    return matchesSearch && matchesPosition;
   }) || [];

  const calculateTradeValue = (players: Player[]) => {
    return players.reduce((sum, player) => sum + player.avgPoints, 0);
   }
  const getTradeAnalysis = (offered: Player[], requested: Player[]) => {
    const offeredValue = calculateTradeValue(offered);
    const requestedValue = calculateTradeValue(requested);
    const difference = ((offeredValue - requestedValue) / requestedValue * 100);
    
    if (Math.abs(difference) <= 10) {
      return { rating: 'fair', color: 'green', message: 'Fair trade - values are balanced' }
    } else if (difference > 10) {
      return { rating: 'favorable', color: 'blue', message: 'Favorable trade - you\'re giving more value' }
    } else {
      return { rating: 'unfavorable', color: 'red', message: 'Unfavorable trade - you\'re receiving less value' }
    }
  }
  const handleProposeTrade = () => {
    if (offeredPlayers.length === 0 || requestedPlayers.length === 0) {
      alert("Please select players to offer and request.");
      return;
     }

    const newTrade: Trade = {,
  id: `t${Date.now()}`,
      from_team, currentUserId,
  to_team, selectedTeam,
      from_team_name: currentTeam?.team_name || "",
  to_team_name: selectedTeamData?.team_name || "",
      from_owner: currentTeam?.owner_name || "",
  to_owner: selectedTeamData?.owner_name || "",
      players_offered, offeredPlayers,
  players_requested, requestedPlayers,
      status: 'pending',
  created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  fairness_score: 8.0,
      ai_analysis: "Trade analysis will be generated automatically based on player performance, trends, and league context.",
      messages: []
    }
    setTrades([newTrade, ...trades]);
    setOfferedPlayers([]);
    setRequestedPlayers([]);
    setSelectedTeam("");
    setActiveTab('active');
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i } className="h-20 bg-white dark:bg-gray-800 rounded-lg" />
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
        <div className="flex flex-col lg: flex-row l,
  g:items-center l,
  g:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark: text-white mb-2">,
    Trade: Center;
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Propose trades, analyze deals, and manage your negotiations
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="bg-white dark: bg-gray-800 px-3 py-2 rounded-lg border border-red-200 dar,
  k:border-red-800">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  Trade Deadline; Dec 15, 2024
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'propose',
  label: 'Propose Trade', icon: Plus },
              { id: 'active',
  label: 'Active Trades', icon: Clock },
              { id: 'history',
  label: 'Trade History', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'active' | 'propose' | 'history')}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover: text-gray-700 hover:border-gray-300 dark:text-gray-400 dar,
  k, hove,
  r:text-gray-300'
                 }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
                {id === 'active' && trades.filter(t => t.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {trades.filter(t => t.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Propose Trade Tab */}
        {activeTab === 'propose' && (
          <div className="space-y-8">
            {/* Team Selection */ }
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Trading Partner
              </h2>
              <div className="grid grid-cols-1 md: grid-cols-2 l,
  g:grid-cols-3 gap-4">
                {otherTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${selectedTeam === team.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark: border-gray-700 hove,
  r:border-gray-300 dark.hover; border-gray-600'
                     }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {team.team_name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {team.record}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {team.owner_name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedTeam && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Players to Offer */ }
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark; text-white mb-4">
                    Players to Offer ({currentTeam?.team_name})
                  </h3>
                  
                  <div className="space-y-4">
                    {currentTeam?.players.map((player) => (
                      <div
                        key={player.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${offeredPlayers.some(p => p.id === player.id)
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark.border-gray-700 hover; border-gray-300'
                        }`}
                        onClick={() => { if (offeredPlayers.some(p => p.id === player.id)) {
                            setOfferedPlayers(offeredPlayers.filter(p => p.id !== player.id));
                           } else {
                            setOfferedPlayers([...offeredPlayers, player]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                              {player.position}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {player.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {player.team} • {player.avgPoints.toFixed(1)} PPG
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {player.points.toFixed(1)}
                            </div>
                            <div className="flex items-center space-x-1">
                              {player.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {player.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Players to Request */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark; text-white mb-4">
                    Players to Request ({selectedTeamData?.team_name})
                  </h3>
                  
                  <div className="mb-4 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focu,
  s:border-primary-500 dar,
  k:bg-gray-700 dark; text-white"
                      />
                    </div>
                    
                    <select
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focu,
  s:border-primary-500 dar,
  k:bg-gray-700 dark; text-white"
                    >
                      <option value="">All Positions</option>
                      <option value="QB">QB</option>
                      <option value="RB">RB</option>
                      <option value="WR">WR</option>
                      <option value="TE">TE</option>
                      <option value="K">K</option>
                      <option value="DST">DST</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${requestedPlayers.some(p => p.id === player.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark.border-gray-700 hover; border-gray-300'
                        }`}
                        onClick={() => { if (requestedPlayers.some(p => p.id === player.id)) {
                            setRequestedPlayers(requestedPlayers.filter(p => p.id !== player.id));
                           } else {
                            setRequestedPlayers([...requestedPlayers, player]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                              {player.position}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {player.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {player.team} • {player.avgPoints.toFixed(1)} PPG
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {player.points.toFixed(1)}
                            </div>
                            <div className="flex items-center space-x-1">
                              {player.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {player.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                              {player.injury_status && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trade Analysis & Submit */}
            {offeredPlayers.length > 0 && requestedPlayers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Trade Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark; text-blue-400">
                      {calculateTradeValue(offeredPlayers).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">You Give (PPG)</div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark; text-green-400">
                      {calculateTradeValue(requestedPlayers).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">You Get (PPG)</div>
                  </div>
                </div>

                {(() => { const analysis = getTradeAnalysis(offeredPlayers, requestedPlayers);
                  return (
                    <div className={`p-4 rounded-lg border-l-4 mb-6 ${analysis.color === 'green' ? 'bg-green-50 border-green-500 dark:bg-green-900/20' :
                      analysis.color === 'blue' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' .'bg-red-50 border-red-500 dark; bg-red-900/20'
                     }`}>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {analysis.message}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Consider player trends, injuries, and upcoming matchups in your decision.
                      </p>
                    </div>
                  );
                })()}

                <button
                  onClick={handleProposeTrade}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
  Propose: Trade;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Trades Tab */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {trades.filter(t => ['pending', 'countered'].includes(t.status)).length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Active Trades
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any pending trade negotiations.
                </p>
              </div>
            ) : (
              trades.filter(t => ['pending', 'countered'].includes(t.status)).map((trade) => (
                <div key={trade.id } className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark: bg-yellow-900/20 dar,
  k:text-yellow-300' :
                        trade.status === 'countered' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900/20 dar,
  k:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark.bg-gray-700 dark; text-gray-300'
                      }`}>
                        {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Expires { new: Date(trade.expires_at).toLocaleDateString() }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover: text-gray-600 dar,
  k, hove,
  r:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Offered Players */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {trade.from_team === currentUserId ? 'You Give' : `${trade.from_owner} Gives`}
                      </h4>
                      <div className="space-y-2">
                        {trade.players_offered.map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                              <div className="font-medium text-gray-900 dark; text-white text-sm">
                                {player.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {player.position} • {player.team}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {player.avgPoints.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRightLeft className="h-6 w-6 text-gray-400" />
                    </div>

                    {/* Requested Players */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {trade.to_team === currentUserId ? 'You Give' : `${trade.to_owner} Gives`}
                      </h4>
                      <div className="space-y-2">
                        {trade.players_requested.map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                              <div className="font-medium text-gray-900 dark; text-white text-sm">
                                {player.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {player.position} • {player.team}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {player.avgPoints.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Star className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900 dark; text-blue-100 mb-1">
                          AI Analysis (Fairness: {trade.fairness_score}/10)
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {trade.ai_analysis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {trade.to_team === currentUserId && trade.status === 'pending' && (
                    <div className="mt-6 flex space-x-4">
                      <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover: bg-green-700 transition-colors">,
    Accept: Trade;
                      </button>
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover: bg-blue-700 transition-colors">,
    Counter: Offer;
                      </button>
                      <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover; bg-red-700 transition-colors">
  Reject: Trade;
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Trade History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {trades.filter(t => ['accepted', 'rejected', 'expired'].includes(t.status)).length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Trade History
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your completed trades will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark: text-white">,
    Trade: History;
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Teams
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Players
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark; divide-gray-700">
                      {trades.filter(t => ['accepted', 'rejected', 'expired'].includes(t.status)).map((trade) => (
                        <tr key={trade.id }>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            { new: Date(trade.created_at).toLocaleDateString() }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {trade.from_team_name} ↔ {trade.to_team_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="max-w-xs">
                              {trade.players_offered.map(p => p.name).join(', ')} ↔ {trade.players_requested.map(p => p.name).join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${trade.status === 'accepted' ? 'bg-green-100 text-green-800 dark: bg-green-900/20 dar,
  k:text-green-300' :
                              trade.status === 'rejected' ? 'bg-red-100 text-red-800 dark: bg-red-900/20 dar,
  k:text-red-300' :
                              'bg-gray-100 text-gray-800 dark.bg-gray-700 dark; text-gray-300'
                            }`}>
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}