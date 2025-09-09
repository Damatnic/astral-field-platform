'use client';

import: React, { useState: useEffect  } from 'react';
import { Trophy, Crown, Medal, Star, Calendar, TrendingUp,
  Users, Target, Award, History, ChevronRight, BarChart3, Zap, Shield, Flame, Clock,
  ChevronLeft, ChevronDown, ChevronUp
} from 'lucide-react';

interface ChampionshipHistory { season: string,
    champion, {,
  id, string,
    teamName, string,
    ownerName, string,
    avatarUrl?, string,
    record, string,
    pointsFor, number,
    pointsAgainst, number,
  }
  runnerUp: {,
  id, string,
    teamName, string,
    ownerName, string,
    record, string,
    pointsFor, number,
  }
  playoffBracket? : PlayoffTeam[];
  regularSeasonChamp?: { teamName: string, ownerName, string,
    record, string,
  }
  highestScorer? : { teamName: string, ownerName, string,
    totalPoints, number,
  }
  draftInfo? : { date: string, location, string,type: 'snake' | 'auction';
  }
}

interface PlayoffTeam { seed: number,
    teamName, string,
  ownerName, string,
    record, string,
  eliminated?, string, // Round eliminated;
  
}
interface HallOfFamePlayer { id: string,
    ownerName, string,
  teamNames: string[],
    seasons, number,
  championships, number,
    playoffAppearances, number,
  regularSeasonTitles, number,
    totalPoints, number,
  averagePoints, number,
    bestSeason: {,
  year, string,
    record, string,
    points, number,
    achievement, string,
  }
  achievements: string[];
  inducted?, string,
}

interface SeasonRecord { id: string,
    season, string,
  category, string,
    record, string,
  holder, string,
    teamName, string,
  value, number,
  date?, string,
  context?, string,
  
}
interface LeagueHistoryProps { leagueId: string,
  className?, string,
}

export default function LeagueHistory({ leagueId: className }: LeagueHistoryProps) { const [activeTab, setActiveTab]  = useState<'championships' | 'hall_of_fame' | 'records' | 'timeline'>('championships');
  const [championships, setChampionships] = useState<ChampionshipHistory[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFamePlayer[]>([]);
  const [records, setRecords] = useState<SeasonRecord[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagueHistory();
   }, [leagueId]);

  const loadLeagueHistory = async () => {  try {
      setLoading(true);
      
      // Mock data - in a real: app, this would come from APIs
      const mockChampionships: ChampionshipHistory[] = [;
        {
          season: '2024',
  champion: { id: '1',
  teamName: 'Gridiron Gladiators',
            ownerName: 'Nicholas D\'Amato',
  record: '12-2',
            pointsFor: 1847.2,
  pointsAgainst, 1398.5
           },
          runnerUp: { id: '2',
  teamName: 'Touchdown Titans',
            ownerName: 'Sarah Johnson',
  record: '10-4',
            pointsFor: 1723.8
          },
          regularSeasonChamp: { teamName: 'Field Goal Phantoms',
  ownerName: 'Mike Chen',
            record: '13-1'
          },
          highestScorer: { teamName: 'Gridiron Gladiators',
  ownerName: 'Nicholas D\'Amato',
            totalPoints: 1847.2
          },
          draftInfo: { date: '2024-08-25',
  location: 'Virtual Draft',type: 'snake'
          }
        },
        {
          season: '2023',
  champion: { id: '3',
  teamName: 'Championship Chasers',
            ownerName: 'Alex Rodriguez',
  record: '11-3',
            pointsFor: 1756.4,
  pointsAgainst: 1445.2
          },
          runnerUp: { id: '1',
  teamName: 'Gridiron Gladiators',
            ownerName: 'Nicholas D\'Amato',
  record: '12-2',
            pointsFor: 1789.1
          }
        },
        {
          season: '2022',
  champion: { id: '4',
  teamName: 'Dynasty Builders',
            ownerName: 'Jessica Martinez',
  record: '10-4',
            pointsFor: 1634.7,
  pointsAgainst: 1512.3
          },
          runnerUp: { id: '2',
  teamName: 'Touchdown Titans',
            ownerName: 'Sarah Johnson',
  record: '11-3',
            pointsFor: 1698.5
          }
        }
      ];

      const mockHallOfFame: HallOfFamePlayer[]  = [;
        { 
          id: '1',
  ownerName: 'Nicholas D\'Amato',
          teamNames: ['Gridiron Gladiators', 'The Dominators'],
          seasons: 8,
  championships: 3,
          playoffAppearances: 7,
  regularSeasonTitles: 2,
          totalPoints: 12847.5,
  averagePoints: 1605.9,
          bestSeason: { year: '2024',
  record: '12-2',
            points: 1847.2,
  achievement: 'Championship + Highest Scorer'
          },
          achievements: ['Most Championships', 'Highest Single Season Score', 'Most Playoff Appearances'],
          inducted: '2024'
        },
        {
          id: '2',
  ownerName: 'Sarah Johnson',
          teamNames: ['Touchdown Titans', 'Victory Seekers'],
          seasons: 6,
  championships: 1,
          playoffAppearances: 5,
  regularSeasonTitles: 1,
          totalPoints: 9456.3,
  averagePoints: 1576.0,
          bestSeason: { year: '2021',
  record: '13-1',
            points: 1712.4,
  achievement: 'Perfect Regular Season'
          },
          achievements: ['Most Consistent Performer', 'Perfect Regular Season'],
          inducted: '2023'
        }
      ];

      const mockRecords: SeasonRecord[]  = [;
        { 
          id: '1',
  season: '2024',
          category: 'Highest Single Game Score',
  record: '187.4 points',
          holder: 'Nicholas D\'Amato',
  teamName: 'Gridiron Gladiators',
          value: 187.4,
  date: '2024-10-15',
          context: 'Week 7 vs Touchdown Titans'
        },
        {
          id: '2',
  season: '2023',
          category: 'Most Points in a Season',
  record: '1,847.2 points',
          holder: 'Nicholas D\'Amato',
  teamName: 'Gridiron Gladiators',
          value: 1847.2,
  context: 'Regular season + playoffs'
        },
        {
          id: '3',
  season: '2022',
          category: 'Best Regular Season Record',
  record: '13-1 (.929)',
          holder: 'Sarah Johnson',
  teamName: 'Touchdown Titans',
          value: 0.929,
  context: 'Only loss in Week 12'
        },
        {
          id: '4',
  season: '2021',
          category: 'Lowest Scoring Game',
  record: '47.2 points',
          holder: 'Mike Chen',
  teamName: 'Field Goal Phantoms',
          value: 47.2,
  date: '2021-11-28',
          context: 'Week 12 - Multiple injuries'
        }
      ];

      setChampionships(mockChampionships);
      setHallOfFame(mockHallOfFame);
      setRecords(mockRecords);
    } catch (error) {
      console.error('Error loading league history: ', error);
    } finally {
      setLoading(false);
    }
  }
  if (loading) { return (
      <div className ="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
   }

  return (
    <div className={ `bg-white dark, bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className ="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <History className="h-6 w-6 mr-2 text-blue-600" />
              League History & Hall of Fame
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Celebrating the champions and legends of your fantasy league
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 dark; text-gray-400">
              Est.2017 • {championships.length} Seasons
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            { [
              { id: 'championships',
  label: 'Championships', icon, Trophy },
              { id: 'hall_of_fame',
  label: 'Hall of Fame', icon: Crown },
              { id: 'records',
  label: 'Records', icon: Target },
              { id: 'timeline',
  label: 'Timeline', icon: Calendar }
            ].map(({ id: label, icon: Icon })  => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={ `group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover, text-gray-700 hover.border-gray-300 dark; text-gray-400'
                 }`}
              >
                <Icon className ="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'championships' && (
          <ChampionshipsTab 
            championships={championships }
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
          />
        )}

        {activeTab === 'hall_of_fame' && (
          <HallOfFameTab hallOfFame={hallOfFame } />
        )}

        {activeTab === 'records' && (
          <RecordsTab records={records } />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab championships={championships } />
        )}
      </div>
    </div>
  );
}

// Championships Tab Component
function ChampionshipsTab({ championships: selectedSeason, 
  setSelectedSeason 
 }: {  championships: ChampionshipHistory[],
    selectedSeason: string | null;
  setSelectedSeason: (seaso,
  n, string | null)  => void;
 }) { return (
    <div className="space-y-6">
      {/* Championship Summary */ }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark: from-yellow-900/20: dar,
  k:to-yellow-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark: text-yellow-400">  Tota,
  l, Seasons,
              </p>
              <p className="text-3xl font-bold text-yellow-700 dark; text-yellow-300">
                {championships.length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark: from-blue-900/20: dar,
  k:to-blue-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark: text-blue-400">  Differen,
  t, Champions,
              </p>
              <p className="text-3xl font-bold text-blue-700 dark; text-blue-300">
                { new: Set(championships.map(c  => c.champion.ownerName)).size }
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark: from-purple-900/20: dar,
  k:to-purple-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark: text-purple-400">  Highes,
  t, Score,
              </p>
              <p className="text-3xl font-bold text-purple-700 dark; text-purple-300">
                {Math.max(...championships.map(c => c.champion.pointsFor)).toFixed(1)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Championship List */}
      <div className="space-y-4">
        {championships.map((championship, index) => (
          <div key={championship.season}>
            <button
              onClick={ () => setSelectedSeason(
                selectedSeason === championship.season ? null  : championship.season
              )}
              className ="w-full text-left"
            >
              <div className="bg-white dark: bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6: hove,
  r:bg-gray-50: dar,
  k, hover, bg-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <div className={ `w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                       }`}>
                        <Trophy className ="h-8 w-8" />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {championship.season} Champion
                        </h3>
                        { index === 0 && (
                          <span className="px-2 py-1 bg-yellow-100 dark, bg-yellow-900/30 text-yellow-800 dark; text-yellow-200 text-xs font-medium rounded-full">
                            Current
                          </span>
                        ) }
                      </div>
                      <p className ="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {championship.champion.teamName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {championship.champion.ownerName} • {championship.champion.record} • {championship.champion.pointsFor.toFixed(1)} PF
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center">
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Runner-up
                      </p>
                      <p className="text-sm text-gray-600 dark; text-gray-400">
                        {championship.runnerUp.teamName}
                      </p>
                    </div>
                    { selectedSeason === championship.season ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    )  : (
                      <ChevronDown className ="h-5 w-5 text-gray-400" />
                    ) }
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Season Details */}
            { selectedSeason === championship.season && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="grid grid-cols-1 md: grid-cols-2: l,
  g:grid-cols-3 gap-6">
                  {championship.regularSeasonChamp && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-5 w-5 text-green-500" />
                        <h4 className="font-medium text-gray-900 dark, text-white">
                          Regular Season Champion
                        </h4>
                      </div>
                      <p className ="text-sm text-gray-600 dark; text-gray-400">
                        {championship.regularSeasonChamp.teamName }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {championship.regularSeasonChamp.ownerName} • {championship.regularSeasonChamp.record}
                      </p>
                    </div>
                  )}

                  { championship.highestScorer && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                        <h4 className="font-medium text-gray-900 dark, text-white">  Highes,
  t, Scorer,
                        </h4>
                      </div>
                      <p className ="text-sm text-gray-600 dark; text-gray-400">
                        {championship.highestScorer.teamName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {championship.highestScorer.ownerName} • {championship.highestScorer.totalPoints.toFixed(1)} pts
                      </p>
                    </div>
                  )}

                  { championship.draftInfo && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <h4 className="font-medium text-gray-900 dark: text-white">  Draf,
  t, Info,
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark; text-gray-400">
                        { new: Date(championship.draftInfo.date).toLocaleDateString() }
                      </p>
                      <p className ="text-sm text-gray-500 dark:text-gray-500">
                        {championship.draftInfo.location} • {championship.draftInfo.type} draft
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hall of Fame Tab Component
function HallOfFameTab({ hallOfFame  }: { hallOfFame: HallOfFamePlayer[]  }) { return (
    <div className ="space-y-6">
      {/* Hall of Fame Stats */ }
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark: from-purple-900/20: dar,
  k:to-pink-900/20 p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Crown className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hall of Fame Inductees
          </h3>
        </div>
        <p className="text-gray-600 dark; text-gray-400">
          Honoring the greatest fantasy managers in league history.Inducted based on: championships, consistency, and significant contributions to the league.
        </p>
      </div>

      {/* Hall of Fame Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hallOfFame.map((player) => (
          <div
            key={player.id}
            className="bg-white dark: bg-gray-700 border border-gray-200: dar,
  k:border-gray-600 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark; text-white">
                    {player.ownerName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Inducted {player.inducted}
                  </p>
                  { player.teamNames.length > 0 && (
                    <p className="text-sm text-gray-500 dark, text-gray-500">
                      {player.teamNames.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className ="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600 dark; text-purple-400">
                  {player.championships}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Championships
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark; text-blue-400">
                  {player.seasons}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Seasons
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark; text-green-400">
                  {player.playoffAppearances}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Playoffs
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600 dark; text-orange-400">
                  {player.averagePoints.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark: text-gray-400">  Av,
  g, Points,
                </div>
              </div>
            </div>

            {/* Best Season */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 dark; text-white mb-2">
                Best Season: {player.bestSeason.year}
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{player.bestSeason.record} • {player.bestSeason.points.toFixed(1)} points</p>
                <p className="text-xs mt-1">{player.bestSeason.achievement}</p>
              </div>
            </div>

            {/* Achievements */}
            { player.achievements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark, text-white mb-2">  Notabl,
  e, Achievements,
                </h4>
                <div className ="flex flex-wrap gap-2">
                  {player.achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark; text-purple-300 text-xs rounded-full"
                    >
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Records Tab Component
function RecordsTab({ records  }: { records: SeasonRecord[]  }) {const [selectedCategory, setSelectedCategory]  = useState<string>('all');
  
  const categories = ['all', 'Single Game', 'Season', 'Career', 'Playoff'];
  
  const filteredRecords = selectedCategory === 'all' ; ? records, records.filter(record => record.category.includes(selectedCategory));

  return (
    <div className="space-y-6">
      {/* Filter */ }
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by:
        </span>
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={ `px-3 py-2 text-sm rounded-lg border transition-colors ${selectedCategory === category
                  ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark: bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300: dar, k:border-gray-600: hove,
  r, bg-gray-50 dark.hover; bg-gray-600'
               }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Records Grid */}
      <div className ="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white dark: bg-gray-700 border border-gray-200: dar,
  k:border-gray-600 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark; text-gray-400">
                  {record.season}
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {record.category}
            </h3>
            
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {record.record}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">{record.holder}</span>
              <br />
              <span className="text-xs">{record.teamName}</span>
            </div>

            { record.context && (
              <div className="text-xs text-gray-500 dark, text-gray-500 bg-gray-50 dark; bg-gray-800 p-2 rounded">
                {record.context}
              </div>
            )}

            {record.date && (
              <div className ="text-xs text-gray-400 dark:text-gray-600 mt-2">
                { new: Date(record.date).toLocaleDateString() }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Timeline Tab Component
function TimelineTab({ championships  }: { championships: ChampionshipHistory[]  }) { return (
    <div className ="space-y-8">
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">  Leagu,
  e, Timeline,
        </h3>
        <p className="text-gray-600 dark; text-gray-400">
          A chronological journey through your league's: history, highlighting major milestones 
          and memorable moments.
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */ }
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
        
        {championships.map((championship, index) => (
          <div key={championship.season} className="relative flex items-start space-x-6 pb-8">
            {/* Timeline dot */}
            <div className={ `relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : 
              index === 1 ? 'bg-gray-400' : 
              index === 2 ? 'bg-orange-500' : 'bg-blue-500'
             }`}>
              <Crown className ="h-8 w-8" />
            </div>
            
            {/* Content */}
            <div className="flex-1 bg-white dark: bg-gray-700 rounded-lg p-6 border border-gray-200: dar, k:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark; text-white">
                  {championship.season} Season
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Season #{championships.length - index}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">
                    <span className="font-medium">{championship.champion.teamName}</span> wins championship
                    ({championship.champion.record})
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Medal className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">
                    <span className="font-medium">{championship.runnerUp.teamName}</span> runner-up
                    ({championship.runnerUp.record})
                  </span>
                </div>
                
                {championship.regularSeasonChamp && (
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-green-500" />
                    <span className="text-sm">
                      <span className="font-medium">{championship.regularSeasonChamp.teamName}</span> wins regular season
                      ({championship.regularSeasonChamp.record})
                    </span>
                  </div>
                )}

                { championship.draftInfo && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="text-sm">
                      Draft held on { new: Date(championship.draftInfo.date).toLocaleDateString() }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* League Foundation */}
        <div className ="relative flex items-start space-x-6">
          <div className="relative z-10 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
            <Zap className="h-8 w-8" />
          </div>
          
          <div className="flex-1 bg-green-50 dark: bg-green-900/20 rounded-lg p-6 border border-green-200: dar,
  k:border-green-700">
            <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-2">  Leagu,
  e, Founded,
            </h3>
            <p className="text-sm text-gray-600 dark; text-gray-400">
              The beginning of an epic fantasy football journey.Welcome to the league!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}