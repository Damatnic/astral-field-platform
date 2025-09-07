"use client";

import { useState } from "react";
import { 
  Users, Search, X, TrendingUp, TrendingDown, 
  Minus, Target, Activity, Calendar, Shield,
  Award, AlertTriangle, BarChart3, Zap, Home,
  Plane, Sun, Cloud, ChevronDown, ChevronUp,
  Star, Clock, DollarSign, Hash
} from "lucide-react";

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  byeWeek: number;
  rank: number;
  projectedPoints: number;
  averagePoints: number;
  lastWeekPoints: number;
  consistency: number;
  injury?: string;
  stats: {
    gamesPlayed: number;
    targets?: number;
    touches?: number;
    redZoneTargets?: number;
    redZoneTouches?: number;
    snapPercentage: number;
    targetShare?: number;
  };
  splits: {
    home: number;
    away: number;
    vsTop10: number;
    vsBottom10: number;
  };
  trends: {
    last3: number;
    last5: number;
    season: number;
  };
  schedule: {
    week: number;
    opponent: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }[];
  expertRanking: number;
  rosteredPercentage: number;
  startPercentage: number;
}

export default function PlayerComparison() {
  const [players, setPlayers] = useState<(Player | null)[]>([null, null, null, null]);
  const [searchQuery, setSearchQuery] = useState<string[]>(['', '', '', '']);
  const [showSearch, setShowSearch] = useState<boolean[]>([false, false, false, false]);
  const [activeSlots, setActiveSlots] = useState(2);
  const [comparisonView, setComparisonView] = useState<'overview' | 'stats' | 'trends' | 'schedule'>('overview');

  // Mock player data
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      byeWeek: 10,
      rank: 1,
      projectedPoints: 24.5,
      averagePoints: 26.3,
      lastWeekPoints: 28.7,
      consistency: 92,
      stats: {
        gamesPlayed: 10,
        snapPercentage: 100,
        targets: 0,
        touches: 15,
        redZoneTouches: 8
      },
      splits: {
        home: 28.5,
        away: 24.1,
        vsTop10: 25.8,
        vsBottom10: 27.2
      },
      trends: {
        last3: 27.8,
        last5: 26.9,
        season: 26.3
      },
      schedule: [
        { week: 11, opponent: 'BUF', difficulty: 'Hard' },
        { week: 12, opponent: 'CAR', difficulty: 'Easy' },
        { week: 13, opponent: 'DEN', difficulty: 'Medium' }
      ],
      expertRanking: 1,
      rosteredPercentage: 99.9,
      startPercentage: 98.5
    },
    {
      id: '2',
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      byeWeek: 9,
      rank: 1,
      projectedPoints: 22.3,
      averagePoints: 24.1,
      lastWeekPoints: 19.8,
      consistency: 88,
      injury: 'Questionable - Knee',
      stats: {
        gamesPlayed: 9,
        snapPercentage: 85,
        targets: 58,
        touches: 198,
        redZoneTargets: 12,
        redZoneTouches: 45,
        targetShare: 18
      },
      splits: {
        home: 25.3,
        away: 22.9,
        vsTop10: 22.1,
        vsBottom10: 26.8
      },
      trends: {
        last3: 21.2,
        last5: 22.8,
        season: 24.1
      },
      schedule: [
        { week: 11, opponent: 'TB', difficulty: 'Medium' },
        { week: 12, opponent: 'SEA', difficulty: 'Hard' },
        { week: 13, opponent: 'PHI', difficulty: 'Hard' }
      ],
      expertRanking: 2,
      rosteredPercentage: 100,
      startPercentage: 99.2
    },
    {
      id: '3',
      name: 'Tyreek Hill',
      position: 'WR',
      team: 'MIA',
      byeWeek: 10,
      rank: 2,
      projectedPoints: 18.7,
      averagePoints: 19.8,
      lastWeekPoints: 24.3,
      consistency: 79,
      stats: {
        gamesPlayed: 10,
        snapPercentage: 92,
        targets: 112,
        redZoneTargets: 18,
        targetShare: 28
      },
      splits: {
        home: 21.2,
        away: 18.4,
        vsTop10: 17.9,
        vsBottom10: 22.1
      },
      trends: {
        last3: 22.4,
        last5: 20.8,
        season: 19.8
      },
      schedule: [
        { week: 11, opponent: 'LV', difficulty: 'Easy' },
        { week: 12, opponent: 'NYJ', difficulty: 'Medium' },
        { week: 13, opponent: 'WAS', difficulty: 'Easy' }
      ],
      expertRanking: 3,
      rosteredPercentage: 99.8,
      startPercentage: 97.3
    }
  ];

  const searchPlayers = (query: string): Player[] => {
    if (!query) return [];
    return mockPlayers.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.team.toLowerCase().includes(query.toLowerCase())
    );
  };

  const selectPlayer = (index: number, player: Player) => {
    const newPlayers = [...players];
    newPlayers[index] = player;
    setPlayers(newPlayers);
    
    const newShowSearch = [...showSearch];
    newShowSearch[index] = false;
    setShowSearch(newShowSearch);
    
    const newSearchQuery = [...searchQuery];
    newSearchQuery[index] = '';
    setSearchQuery(newSearchQuery);
  };

  const removePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers[index] = null;
    setPlayers(newPlayers);
  };

  const addComparisonSlot = () => {
    if (activeSlots < 4) {
      setActiveSlots(activeSlots + 1);
    }
  };

  const getStatComparison = (players: (Player | null)[], stat: keyof Player | string) => {
    const validPlayers = players.filter(p => p !== null) as Player[];
    if (validPlayers.length === 0) return null;

    const values = validPlayers.map(p => {
      if (stat.includes('.')) {
        const [parent, child] = stat.split('.');
        return (p as unknown)[parent]?.[child] || 0;
      }
      return (p as unknown)[stat] || 0;
    });

    const max = Math.max(...values);
    const min = Math.min(...values);

    return { max, min, values };
  };

  const getComparisonColor = (value: number, max: number, min: number, inverse: boolean = false) => {
    if (inverse) {
      if (value === min) return 'text-green-600 dark:text-green-400 font-bold';
      if (value === max) return 'text-red-600 dark:text-red-400';
    } else {
      if (value === max) return 'text-green-600 dark:text-green-400 font-bold';
      if (value === min) return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-700 dark:text-gray-300';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[difficulty as keyof typeof colors];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Player Comparison Tool
          </h2>
          {activeSlots < 4 && (
            <button
              onClick={addComparisonSlot}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              + Add player slot
            </button>
          )}
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          {['overview', 'stats', 'trends', 'schedule'].map(view => (
            <button
              key={view}
              onClick={() => setComparisonView(view as typeof comparisonView)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                comparisonView === view
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Player Selection */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className={`grid grid-cols-${activeSlots} gap-4`}>
          {[...Array(activeSlots)].map((_, index) => (
            <div key={index} className="relative">
              {players[index] ? (
                <div className="border dark:border-gray-600 rounded-lg p-4">
                  <button
                    onClick={() => removePlayer(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {players[index]!.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {players[index]!.position} - {players[index]!.team}
                    </div>
                    {players[index]!.injury && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        {players[index]!.injury}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => {
                      const newShowSearch = [...showSearch];
                      newShowSearch[index] = !newShowSearch[index];
                      setShowSearch(newShowSearch);
                    }}
                    className="w-full border-2 border-dashed dark:border-gray-600 rounded-lg p-8 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                  >
                    <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Add Player {index + 1}
                    </span>
                  </button>

                  {showSearch[index] && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <input
                        type="text"
                        value={searchQuery[index]}
                        onChange={(e) => {
                          const newQuery = [...searchQuery];
                          newQuery[index] = e.target.value;
                          setSearchQuery(newQuery);
                        }}
                        placeholder="Search player..."
                        className="w-full px-4 py-2 border-b dark:border-gray-600 bg-transparent text-gray-900 dark:text-white"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {searchPlayers(searchQuery[index]).map(player => (
                          <button
                            key={player.id}
                            onClick={() => selectPlayer(index, player)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {player.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {player.position} - {player.team}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Content */}
      <div className="p-6">
        {players.filter(p => p !== null).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select players to compare</p>
          </div>
        ) : (
          <>
            {/* Overview View */}
            {comparisonView === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Key Metrics</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Rank', key: 'rank', icon: <Hash className="h-4 w-4" />, inverse: true },
                      { label: 'Projected Points', key: 'projectedPoints', icon: <Target className="h-4 w-4" /> },
                      { label: 'Average Points', key: 'averagePoints', icon: <BarChart3 className="h-4 w-4" /> },
                      { label: 'Last Week', key: 'lastWeekPoints', icon: <Clock className="h-4 w-4" /> },
                      { label: 'Consistency %', key: 'consistency', icon: <Activity className="h-4 w-4" /> },
                      { label: 'Expert Rank', key: 'expertRanking', icon: <Star className="h-4 w-4" />, inverse: true },
                      { label: 'Rostered %', key: 'rosteredPercentage', icon: <Users className="h-4 w-4" /> },
                      { label: 'Start %', key: 'startPercentage', icon: <Zap className="h-4 w-4" /> }
                    ].map(metric => {
                      const comparison = getStatComparison(players, metric.key);
                      if (!comparison) return null;

                      return (
                        <div key={metric.key} className="flex items-center">
                          <div className="flex items-center gap-2 w-40">
                            {metric.icon}
                            <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                          </div>
                          <div className={`grid grid-cols-${activeSlots} gap-4 flex-1`}>
                            {players.map((player, idx) => (
                              <div key={idx} className="text-center">
                                {player ? (
                                  <span className={getComparisonColor(
                                    (player as unknown)[metric.key],
                                    comparison.max,
                                    comparison.min,
                                    metric.inverse
                                  )}>
                                    {metric.key.includes('Percentage') 
                                      ? `${(player as unknown)[metric.key]}%`
                                      : (player as unknown)[metric.key]?.toFixed?.(1) || (player as unknown)[metric.key]
                                    }
                                  </span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">-</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bye Week Alert */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Bye Weeks</span>
                  </div>
                  <div className={`grid grid-cols-${activeSlots} gap-4`}>
                    {players.map((player, idx) => (
                      <div key={idx} className="text-center">
                        {player ? (
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Week {player.byeWeek}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stats View */}
            {comparisonView === 'stats' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Usage Stats</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Games Played', key: 'stats.gamesPlayed' },
                      { label: 'Snap %', key: 'stats.snapPercentage' },
                      { label: 'Targets', key: 'stats.targets' },
                      { label: 'Touches', key: 'stats.touches' },
                      { label: 'RZ Targets', key: 'stats.redZoneTargets' },
                      { label: 'RZ Touches', key: 'stats.redZoneTouches' },
                      { label: 'Target Share %', key: 'stats.targetShare' }
                    ].map(stat => {
                      const comparison = getStatComparison(players, stat.key);
                      if (!comparison) return null;

                      return (
                        <div key={stat.key} className="flex items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-32">{stat.label}</span>
                          <div className={`grid grid-cols-${activeSlots} gap-4 flex-1`}>
                            {players.map((player, idx) => {
                              const value = stat.key.includes('.') 
                                ? (player as unknown)?.stats?.[stat.key.split('.')[1]]
                                : (player as unknown)?.[stat.key];
                              
                              return (
                                <div key={idx} className="text-center">
                                  {player && value !== undefined ? (
                                    <span className={getComparisonColor(value, comparison.max, comparison.min)}>
                                      {stat.key.includes('Share') || stat.key.includes('Percentage')
                                        ? `${value}%`
                                        : value
                                      }
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Splits */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Performance Splits</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Home', key: 'splits.home', icon: <Home className="h-4 w-4" /> },
                      { label: 'Away', key: 'splits.away', icon: <Plane className="h-4 w-4" /> },
                      { label: 'vs Top 10 D', key: 'splits.vsTop10', icon: <Shield className="h-4 w-4" /> },
                      { label: 'vs Bottom 10 D', key: 'splits.vsBottom10', icon: <Target className="h-4 w-4" /> }
                    ].map(split => {
                      const comparison = getStatComparison(players, split.key);
                      if (!comparison) return null;

                      return (
                        <div key={split.key} className="flex items-center">
                          <div className="flex items-center gap-2 w-32">
                            {split.icon}
                            <span className="text-sm text-gray-600 dark:text-gray-400">{split.label}</span>
                          </div>
                          <div className={`grid grid-cols-${activeSlots} gap-4 flex-1`}>
                            {players.map((player, idx) => {
                              const value = player?.splits?.[split.key.split('.')[1] as keyof typeof player.splits];
                              return (
                                <div key={idx} className="text-center">
                                  {player && value ? (
                                    <span className={getComparisonColor(value, comparison.max, comparison.min)}>
                                      {value.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Trends View */}
            {comparisonView === 'trends' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Performance Trends</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Last 3 Games', key: 'trends.last3' },
                      { label: 'Last 5 Games', key: 'trends.last5' },
                      { label: 'Season Average', key: 'trends.season' }
                    ].map(trend => {
                      const comparison = getStatComparison(players, trend.key);
                      if (!comparison) return null;

                      return (
                        <div key={trend.key} className="flex items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-32">{trend.label}</span>
                          <div className={`grid grid-cols-${activeSlots} gap-4 flex-1`}>
                            {players.map((player, idx) => {
                              const value = player?.trends?.[trend.key.split('.')[1] as keyof typeof player.trends];
                              return (
                                <div key={idx} className="text-center">
                                  {player && value ? (
                                    <div>
                                      <span className={getComparisonColor(value, comparison.max, comparison.min)}>
                                        {value.toFixed(1)}
                                      </span>
                                      {trend.key === 'trends.last3' && player.trends.season && (
                                        <span className="ml-2 text-xs">
                                          {value > player.trends.season ? (
                                            <TrendingUp className="inline h-3 w-3 text-green-500" />
                                          ) : value < player.trends.season ? (
                                            <TrendingDown className="inline h-3 w-3 text-red-500" />
                                          ) : (
                                            <Minus className="inline h-3 w-3 text-gray-500" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trend Chart Placeholder */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Interactive trend chart coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule View */}
            {comparisonView === 'schedule' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Upcoming Schedule</h3>
                <div className={`grid grid-cols-${activeSlots} gap-4`}>
                  {players.map((player, idx) => (
                    <div key={idx}>
                      {player ? (
                        <div className="space-y-2">
                          <div className="text-center font-medium text-gray-900 dark:text-white mb-2">
                            {player.name}
                          </div>
                          {player.schedule.map(game => (
                            <div key={game.week} className="border dark:border-gray-700 rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Week {game.week}
                                </span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(game.difficulty)}`}>
                                  {game.difficulty}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                vs {game.opponent}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 dark:text-gray-600">-</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}