"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Star, TrendingUp, TrendingDown, 
  Plus, Minus, AlertTriangle, Heart,
  BarChart3, Calendar, Activity, Settings,
  ChevronRight, ExternalLink, Info
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface RosterPageProps {
  params: Promise<{ id: string }>;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  roster_position: string;
  projected_points?: number;
  season_points?: number;
  injury_status?: string;
  bye_week?: number;
  projections?: {
    points?: number;
    week?: number;
  };
}

interface Team {
  id: string;
  team_name: string;
  team_abbreviation: string;
  owner_name: string;
}

interface RosterData {
  team: Team;
  roster: Player[];
  rosterSettings: Record<string, number>;
  currentWeek: number;
}

export default function RosterPage({ params }: RosterPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'lineup' | 'bench'>('lineup');

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      fetchRosterData();
    }
  }, [leagueId]);

  const fetchRosterData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}/roster`);
      if (!response.ok) {
        throw new Error('Failed to fetch roster');
      }
      const data = await response.json();
      setRosterData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  const getPlayersByPosition = (position: string) => {
    if (!rosterData) return [];
    if (position === 'BENCH') {
      return rosterData.roster.filter(p => p.roster_position === 'BENCH');
    }
    return rosterData.roster.filter(p => p.roster_position === position);
  };

  const getPositionColor = (position: string) => {
    const colors = {
      QB: 'bg-purple-100 text-purple-800 border-purple-200',
      RB: 'bg-green-100 text-green-800 border-green-200',
      WR: 'bg-blue-100 text-blue-800 border-blue-200',
      TE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      FLEX: 'bg-orange-100 text-orange-800 border-orange-200',
      DST: 'bg-gray-100 text-gray-800 border-gray-200',
      K: 'bg-red-100 text-red-800 border-red-200',
      BENCH: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[position as keyof typeof colors] || colors.BENCH;
  };

  const getInjuryStatusIcon = (status: string) => {
    switch (status) {
      case 'questionable':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'doubtful':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'out':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const renderRosterSlot = (position: string, maxSlots: number) => {
    const players = getPlayersByPosition(position);
    const slots = [];

    for (let i = 0; i < maxSlots; i++) {
      const player = players[i];
      
      slots.push(
        <div
          key={`${position}-${i}`}
          className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded border ${getPositionColor(position)}`}>
              {position}
            </span>
            {player && (
              <div className="flex items-center space-x-1">
                {getInjuryStatusIcon(player.injury_status || '')}
                <button className="text-gray-400 hover:text-gray-600">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {player ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900">{player.name}</h4>
                <span className="text-xs text-gray-500">{player.team}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`px-1.5 py-0.5 rounded text-xs ${getPositionColor(player.position)}`}>
                  {player.position}
                </span>
                <span className="text-gray-600">{(player.projected_points || player.projections?.points || 0).toFixed(1)} pts</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Season: {(player.season_points || 0).toFixed(1)}</span>
                <span>Bye: {player.bye_week}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Plus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Empty slot</p>
              <button className="mt-2 text-xs text-primary-600 hover:text-primary-700">
                Add Player
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          {position === 'FLEX' ? 'FLEX (RB/WR/TE)' : position}
          <span className="ml-2 text-sm font-normal text-gray-500">({maxSlots})</span>
        </h3>
        <div className="grid gap-4">
          {slots}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LeagueNavigation leagueId={leagueId} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rosterData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LeagueNavigation leagueId={leagueId} />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">
            {error || 'Failed to load roster'}
          </div>
          <button 
            onClick={fetchRosterData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {rosterData.team.team_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Owned by {rosterData.team.owner_name} • Week {rosterData.currentWeek}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              href={`/leagues/${leagueId}/players`}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Link>
            <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Roster Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rosterData.roster
                    .filter(p => p.roster_position !== 'BENCH')
                    .reduce((sum, p) => sum + (p.projected_points || 0), 0)
                    .toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Season Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rosterData.roster.reduce((sum, p) => sum + (p.season_points || 0), 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Injury Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rosterData.roster.filter(p => p.injury_status !== 'healthy').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bye Week Players</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rosterData.roster.filter(p => p.bye_week === rosterData.currentWeek).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('lineup')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'lineup'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Starting Lineup
            </button>
            <button
              onClick={() => setSelectedTab('bench')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'bench'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Bench ({getPlayersByPosition('BENCH').length})
            </button>
          </nav>
        </div>

        {/* Roster Content */}
        {selectedTab === 'lineup' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {Object.entries(rosterData.rosterSettings)
              .filter(([pos]) => pos !== 'BENCH' && pos !== 'IR')
              .map(([position, count]) => (
                <div key={position}>
                  {renderRosterSlot(position, count)}
                </div>
              ))}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Bench Players ({getPlayersByPosition('BENCH').length}/{rosterData.rosterSettings.BENCH})
              </h3>
              <div className="flex items-center space-x-2">
                <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  ArrowUpDown by projected
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  ArrowUpDown by season
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPlayersByPosition('BENCH').map((player) => (
                <div key={player.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {player.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {player.position} • {player.team}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getInjuryStatusIcon(player.injury_status || '')}
                      <button className="text-gray-400 hover:text-red-600">
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Projected: {(player.projected_points || 0).toFixed(1)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Season: {(player.season_points || 0).toFixed(1)}
                    </span>
                  </div>

                  {player.bye_week === rosterData.currentWeek && (
                    <div className="mt-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                      On bye this week
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/leagues/${leagueId}/waiver`}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Star className="h-6 w-6 text-yellow-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Waiver Wire</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Find available players</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              href={`/leagues/${leagueId}/trades`}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Activity className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Trade Center</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Propose trades</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <button className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Info className="h-6 w-6 text-purple-500 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Roster Analysis</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
              </div>
              <div className="ml-auto px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded">
                Soon
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

