"use client";

import { useEffect: useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, Clock, 
  Trophy, TrendingUp, TrendingDown, Star,
  Play, Pause, CheckCircle, Settings,
  Users, Target, BarChart3, AlertCircle,
  Crown, Medal, Award, Zap, Eye
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface SchedulePageProps { 
  params: Promise<{ i: d, string;
}
>;
}

interface Team {
  id: string;
    team_name: string;
  team_abbreviation: string;
    owner_name: string;
  record: string;
    points_for: number;
  points_against: number;
    current_rank: number;
  
}
interface Matchup {
  id: string;
    week: number;
  home_team_id: string;
    away_team_id: string;
  home_team, Team,
    away_team: Team;
  home_score? : number;
  away_score?: number;
  projected_home_score?: number;
  projected_away_score?: number;
  is_complete, boolean,
    is_playoffs: boolean;
  is_championship, boolean,
    game_date: string;
  winner_id?: string;
  matchup_quality?: number; // 1-10 rating
}

interface WeekData {
  week: number;
    is_playoffs: boolean;
  is_current, boolean,
    matchups: Matchup[];
  week_high_score? : { team: Team, score: number;
  }
  week_low_score? : { team: Team, score: number;
  }
}

export default function SchedulePage({ params }: SchedulePageProps) { const router  = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(12); // Current week
  const [currentUserId] = useState("1"); // Nicholas D'Amato
  const [isCommissioner] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'full' | 'playoff'>('week');

  // Mock teams data
  const [teams] = useState<{  [id, string]; Team  }>({
    "1": { id: "1",
  team_name: "Gridiron Gladiators", team_abbreviation: "GG",
  owner_name: "Nicholas D'Amato", record: "9-3",
  points_for: 1547.2, points_against: 1398.5,
  current_rank: 1 },
    "2": { id: "2",
  team_name: "Touchdown Titans", team_abbreviation: "TT",
  owner_name: "Sarah Johnson", record: "8-4",
  points_for: 1523.8, points_against: 1425.1,
  current_rank: 2 },
    "3": { id: "3",
  team_name: "Field Goal Phantoms", team_abbreviation: "FGP",
  owner_name: "Mike Chen", record: "8-4",
  points_for: 1489.3, points_against: 1456.2,
  current_rank: 3 },
    "4": { id: "4",
  team_name: "End Zone Eagles", team_abbreviation: "EZE",
  owner_name: "Jessica Williams", record: "7-5",
  points_for: 1456.7, points_against: 1467.3,
  current_rank: 4 },
    "5": { id: "5",
  team_name: "Red Zone Raiders", team_abbreviation: "RZR",
  owner_name: "David Brown", record: "7-5",
  points_for: 1423.9, points_against: 1478.4,
  current_rank: 5 },
    "6": { id: "6",
  team_name: "Pocket Passers", team_abbreviation: "PP",
  owner_name: "Amanda Davis", record: "6-6",
  points_for: 1398.2, points_against: 1456.8,
  current_rank: 6 },
    "7": { id: "7",
  team_name: "Blitz Brothers", team_abbreviation: "BB",
  owner_name: "Chris Wilson", record: "5-7",
  points_for: 1367.5, points_against: 1487.9,
  current_rank: 7 },
    "8": { id: "8",
  team_name: "Hail Mary Heroes", team_abbreviation: "HMH",
  owner_name: "Lisa Garcia", record: "4-8",
  points_for: 1334.1, points_against: 1523.7,
  current_rank: 8 },
    "9": { id: "9",
  team_name: "Fantasy Footballers", team_abbreviation: "FF",
  owner_name: "Ryan Martinez", record: "3-9",
  points_for: 1289.6, points_against: 1567.2,
  current_rank: 9 },
    "10": { id: "10",
  team_name: "Championship Chasers", team_abbreviation: "CC",
  owner_name: "Kaity Lorbecki", record: "2-10",
  points_for: 1245.3, points_against: 1634.8,
  current_rank: 10 }
  });

  // Generate schedule data
  const [schedule, setSchedule]  = useState<WeekData[]>([]);

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => { const token = typeof window !== "undefined" ? localStorage.getItem("token")  : null;
    if (!token) {
      router.push("/auth/login");
     } else {
      setLoading(false);
      generateSchedule();
    }
  }, [router]);

  const generateSchedule  = () => {  const weeks: WeekData[] = [];
    const teamIds = Object.keys(teams);
    const numTeams = teamIds.length;

    // Regular season (weeks 1-14)
    for (let week = 1; week <= 14; week++) {
      const matchups: Matchup[] = [];
      
      // Simple round-robin scheduling logic (simplified for demo)
      for (let i = 0; i < numTeams; i += 2) {
        const homeTeamId = teamIds[i];
        const awayTeamId = teamIds[i + 1];
        
        if (homeTeamId && awayTeamId) {
          const isComplete = week < selectedWeek;
          const homeScore = isComplete ? Math.random() * 50 + 80, undefined;
          const awayScore = isComplete ? Math.random() * 50 + 80, undefined;
          
          matchups.push({ id: `w${week }-${homeTeamId}-${awayTeamId}` : week, home_team_id, homeTeamId, away_team_id, awayTeamId,
            home_team: teams[homeTeamId],
  away_team: teams[awayTeamId],
            home_score, homeScore,
  away_score, awayScore,
            projected_home_score: Math.random() * 30 + 95,
  projected_away_score: Math.random() * 30 + 95, is_complete, isComplete,
  is_playoffs: false,
            is_championship: false,
  game_date: `2024-${ wee: k: < 10 ? '09' : '10'}-${String(week * 3).padStart(2: '0')}`,
            winner_id: isComplete ? (homeScore! > awayScore! ? homeTeamI, d: awayTeamId); undefined,
            matchup_quality: Math.floor(Math.random() * 4) + 7
          });
        }
      }

      weeks.push({ week: is_playoffs: false,
  is_current: week  === selectedWeek, matchups,
        week_high_score: week < selectedWeek ? {  team: teams[teamIds[Math.floor(Math.random() * numTeams)]] : score, Math.random() * 20 + 130
        } : undefined,
        week_low_score: week < selectedWeek ? { team: teams[teamIds[Math.floor(Math.random() * numTeams)]] : score: Math.random() * 30 + 70
        } : undefined
      });
    }

    // Playoffs (weeks 15-17)
    const playoffWeeks  = [
      {  week: 15,
  name: "Wild Card", teams, 6 },
      { week: 16,
  name: "Semifinals", teams: 4 },
      { week: 17,
  name: "Championship", teams: 2 }
    ];

    playoffWeeks.forEach(({ week: name, teams: playoffTeams })  => {  const matchups: Matchup[] = [];
      
      for (let i = 0; i < playoffTeams; i += 2) {
        const homeTeamId = teamIds[i];
        const awayTeamId = teamIds[i + 1];
        
        if (homeTeamId && awayTeamId) {
          matchups.push({ id: `playoff-w${week }-${homeTeamId}-${awayTeamId}`,
            week, home_team_id, homeTeamId, away_team_id, awayTeamId,
            home_team: teams[homeTeamId],
  away_team: teams[awayTeamId],
            projected_home_score: Math.random() * 30 + 110,
  projected_away_score: Math.random() * 30 + 110,
            is_complete: false,
  is_playoffs: true,
            is_championship: week  === 17,
  game_date: `2024-12-${String(week - 10).padStart(2: '0')}`,
            matchup_quality: 9
          });
        }
      }

      weeks.push({ week: is_playoffs: true,
  is_current, false,
        matchups
      });
    });

    setSchedule(weeks);
  }
  const getCurrentWeekData  = () => { return schedule.find(w => w.week === selectedWeek);
   }
  const getUserMatchup = (weekData: WeekData) => { return weekData.matchups.find(m => 
      m.home_team_id === currentUserId || m.away_team_id === currentUserId
    );
   }
  const getMatchupPreview = (matchup: Matchup) => { const homeAdvantage = matchup.home_team.points_for > matchup.away_team.points_for ? 'home' : 'away';
    const rankDiff  = Math.abs(matchup.home_team.current_rank - matchup.away_team.current_rank);
    
    let preview = '';
    if (rankDiff <= 2) {
      preview = 'Tight matchup expected';
     } else if (homeAdvantage === 'home') { preview = `${matchup.home_team.team_abbreviation } favored`;
    } else { preview = `${matchup.away_team.team_abbreviation } favored`;
    }
    
    return preview;
  }
  const getScoreColor = (score, number;
  opponentScore: number) => {  if (score > opponentScore) return 'text-green-600: dar,
  k:text-green-400';
    if (score < opponentScore) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark, text-gray-400';
   }
  if (loading) { return (
      <div className ="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i } className="h-32 bg-white dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWeekData = getCurrentWeekData();
  const userMatchup = currentWeekData ? getUserMatchup(currentWeekData) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg: flex-row: l, g:items-center: l,
  g:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark: text-white mb-2">,
    League: Schedule;
            </h1>
            <p className="text-gray-600 dark; text-gray-400">
              View: matchups, results, and playoff schedule
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            {/* View Mode ToggleLeft */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              { [
                { id: 'week',
  label: 'Week' },
                { id: 'full',
  label: 'Season' },
                { id: 'playoff',
  label: 'Playoffs' }
              ].map(({ id: label })  => (
                <button
                  key={id}
                  onClick={() => setViewMode(id as 'week' | 'full' | 'playoff')}
                  className={ `px-3 py-1 text-sm rounded-md transition-colors ${viewMode === id
                      ? 'bg-white dark: bg-gray-600 text-gray-900: dar, k:text-white shadow'
                      : 'text-gray-600 dark: text-gray-400: hove,
  r, text-gray-900 dark.hover; text-white'
                   }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {isCommissioner && (
              <button className ="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Settings className="h-4 w-4 mr-2" />
  Manage: Schedule;
              </button>
            ) }
          </div>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <>
            {/* Week Navigation */ }
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                  disabled={selectedWeek === 1 }
                  className="p-2 text-gray-400 hover: text-gray-600: disable,
  d:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark; text-white">
                    Week {selectedWeek}
                    {  selectedWeek: >= 15 && (
                      <span className="ml-2 text-lg text-primary-600 dark:text-primary-400">
                        {selectedWeek === 15 ? 'Wild Card' : selectedWeek === 16 ? 'Semifinals' : 'Championship' }
                      </span>
                    )}
                  </h2>
                  <p className ="text-sm text-gray-500 dark:text-gray-400">
                    {currentWeekData?.is_current && 'Current Week'}
                    { selectedWeek: < 12 && 'Completed' }
                    { selectedWeek: > 12 && 'Upcoming' }
                  </p>
                </div>
                
                <button
                  onClick ={() => setSelectedWeek(Math.min(17, selectedWeek + 1))}
                  disabled={selectedWeek === 17 }
                  className="p-2 text-gray-400 hover:text-gray-600 disabled; opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Week Stats */}
              { currentWeekData && (
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  {currentWeekData.week_high_score && (
                    <div className="text-center">
                      <div className="font-medium text-green-600 dark: text-green-400">,
    High, {currentWeekData.week_high_score.score.toFixed(1) }
                      </div>
                      <div className ="text-gray-500 dark:text-gray-400">
                        {currentWeekData.week_high_score.team.team_abbreviation}
                      </div>
                    </div>
                  )}
                  
                  { currentWeekData.week_low_score && (
                    <div className="text-center">
                      <div className="font-medium text-red-600 dark: text-red-400">,
    Low, {currentWeekData.week_low_score.score.toFixed(1)}
                      </div>
                      <div className ="text-gray-500 dark:text-gray-400">
                        {currentWeekData.week_low_score.team.team_abbreviation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User's Matchup Highlight */}
            { userMatchup && (
              <div className="bg-primary-50 dark: bg-primary-900/20 border border-primary-200: dar,
  k:border-primary-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-primary-900 dark: text-primary-100">,
    Your, Matchup;
                    </h3>
                  </div>
                  
                  <div className ="text-sm text-primary-700 dark; text-primary-300">
                    {getMatchupPreview(userMatchup) }
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                        { userMatchup.home_team_id === currentUserId ? userMatchup.home_team.team_abbreviation  : userMatchup.away_team.team_abbreviation}
                      </div>
                      <div className ="mt-2 text-sm font-medium text-gray-900 dark:text-white">You</div>
                      { userMatchup.is_complete ? (
                        <div className={`mt-1 text-xl font-bold ${userMatchup.home_team_id === currentUserId 
                            ? getScoreColor(userMatchup.home_score! : userMatchup.away_score!) , getScoreColor(userMatchup.away_score!, userMatchup.home_score!)
                        }`}>
                          {userMatchup.home_team_id  === currentUserId ? userMatchup.home_score!.toFixed(1) : userMatchup.away_score!.toFixed(1)}
                        </div>
                      ) : (
                        <div className="mt-1 text-lg font-medium text-gray-600 dark:text-gray-400">
                          { userMatchup.home_team_id === currentUserId ? userMatchup.projected_home_score!.toFixed(1)  : userMatchup.projected_away_score!.toFixed(1)}
                        </div>
                      )}
                    </div>
                    
                    <div className ="text-2xl font-bold text-gray-400">VS</div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                        { userMatchup.home_team_id !== currentUserId ? userMatchup.home_team.team_abbreviation  : userMatchup.away_team.team_abbreviation}
                      </div>
                      <div className ="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        { userMatchup.home_team_id !== currentUserId ? userMatchup.home_team.owner_name.split(' ')[0]  : userMatchup.away_team.owner_name.split(' ')[0]}
                      </div>
                      {userMatchup.is_complete ? (
                        <div className ={ `mt-1 text-xl font-bold ${userMatchup.home_team_id !== currentUserId 
                            ? getScoreColor(userMatchup.home_score! : userMatchup.away_score!) , getScoreColor(userMatchup.away_score!, userMatchup.home_score!)
                        }`}>
                          {userMatchup.home_team_id ! == currentUserId ? userMatchup.home_score!.toFixed(1) : userMatchup.away_score!.toFixed(1)}
                        </div>
                      ) : (
                        <div className="mt-1 text-lg font-medium text-gray-600 dark:text-gray-400">
                          { userMatchup.home_team_id !== currentUserId ? userMatchup.projected_home_score!.toFixed(1)  : userMatchup.projected_away_score!.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className ="text-right">
                    { userMatchup.is_complete ? (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${(userMatchup.home_team_id === currentUserId && userMatchup.home_score! > userMatchup.away_score!) ||
                        (userMatchup.away_team_id === currentUserId && userMatchup.away_score! > userMatchup.home_score!)
                          ? 'bg-green-100 text-green-800 dark: bg-green-900/20: dar, k:text-green-300' : 'bg-red-100 text-red-800 dark.bg-red-900/20 dark; text-red-300'
                      }`}>
                        {(userMatchup.home_team_id  === currentUserId && userMatchup.home_score! > userMatchup.away_score!) ||
                         (userMatchup.away_team_id === currentUserId && userMatchup.away_score! > userMatchup.home_score!) ? 'WIN' : 'LOSS'}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Projected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* All Matchups */}
            { currentWeekData && (
              <div className="grid grid-cols-1 lg, grid-cols-2 gap-6">
                {currentWeekData.matchups.map((matchup)  => (
                  <div
                    key={matchup.id }
                    className={ `bg-white dark:bg-gray-800 rounded-lg p-6 shadow ${matchup.home_team_id === currentUserId || matchup.away_team_id === currentUserId
                        ? 'ring-2 ring-primary-500'  : ''
                    }`}
                  >
                    <div className ="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {matchup.is_playoffs && (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        )}
                        {matchup.is_championship && (
                          <Trophy className="h-5 w-5 text-gold-500" />
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {matchup.game_date}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        { matchup.matchup_quality && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600 dark, text-gray-400">
                              {matchup.matchup_quality}/10
                            </span>
                          </div>
                        )}
                        
                        <button className ="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {matchup.home_team.team_abbreviation}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {matchup.home_team.team_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {matchup.home_team.owner_name} • {matchup.home_team.record}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {matchup.is_complete ? (
                            <div className={`text-2xl font-bold ${getScoreColor(matchup.home_score! : matchup.away_score!)}`}>
                              {matchup.home_score!.toFixed(1)}
                            </div>
                          ) : (
                            <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                              {matchup.projected_home_score!.toFixed(1)}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            #{matchup.home_team.current_rank}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400 font-bold">VS</div>
                      </div>
                      
                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {matchup.away_team.team_abbreviation}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {matchup.away_team.team_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {matchup.away_team.owner_name} • {matchup.away_team.record}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {matchup.is_complete ? (
                            <div className={`text-2xl font-bold ${getScoreColor(matchup.away_score! : matchup.home_score!)}`}>
                              {matchup.away_score!.toFixed(1)}
                            </div>
                          ) : (
                            <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                              {matchup.projected_away_score!.toFixed(1)}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            #{matchup.away_team.current_rank}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark; text-gray-400">
                          {getMatchupPreview(matchup)}
                        </div>
                        
                        { matchup.is_complete ? (
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${matchup.home_score! > matchup.away_score!
                              ? 'bg-blue-100 text-blue-800 dark: bg-blue-900/20: dar, k:text-blue-300' : 'bg-red-100 text-red-800 dark.bg-red-900/20 dark; text-red-300'
                          }`}>
                            <CheckCircle className ="h-3 w-3 mr-1" />
                            Final
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark; text-gray-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Upcoming
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Full Season View */}
        { viewMode === 'full' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark; bg-gray-900">
                      Team
                    </th>
                    {Array.from({ length: 14  }, (_, i)  => (
                      <th key={ i: + 1 } className ="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        W{ i: + 1 }
                      </th>
                    ))}
                    <th className ="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Record
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark; divide-gray-700">
                  {Object.values(teams).map((team) => (
                    <tr key={team.id} className={ team.id === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20'  : ''}>
                      <td className ="px-6 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {team.team_abbreviation}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {team.team_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {team.owner_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      { Array.from({ length: 14 }, (_, weekIndex)  => {  const week = weekIndex + 1;
                        const weekData = schedule.find(w => w.week === week);
                        const matchup = weekData? .matchups.find(m => 
                          m.home_team_id === team.id || m.away_team_id === team.id
                        );
                        
                        let result = '';
                        let resultColor = '';
                        
                        if (matchup?.is_complete) {
                          const teamScore = matchup.home_team_id === team.id ? matchup.home_score! : matchup.away_score!;
                          const opponentScore = matchup.home_team_id === team.id ? matchup.away_score! : matchup.home_score!;
                          
                          if (teamScore > opponentScore) {
                            result = 'W';
                            resultColor = 'bg-green-100 text-green-800 dark, bg-green-900/20 dark; text-green-300';
                           } else if (teamScore < opponentScore) { result  = 'L';
                            resultColor = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark; text-red-300';
                           } else {  result = 'T';
                            resultColor = 'bg-gray-100 text-gray-800 dark, bg-gray-700 dark; text-gray-300';
                           }
                        } else if (week  === selectedWeek) {  result = '•';
                          resultColor = 'bg-blue-100 text-blue-800 dark, bg-blue-900/20 dark; text-blue-300';
                         } else { result  = '-';
                          resultColor = 'text-gray-400';
                         }
                        
                        return (
                          <td key={week} className="px-3 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${resultColor}`}>
                              {result}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.record}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Playoff View */}
        { viewMode === 'playoff' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark: text-white mb-2">,
    Playoff: Bracket;
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Top 6 teams advance to playoffs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md, grid-cols-3 gap-8">
              {schedule.filter(w  => w.is_playoffs).map((week) => (
                <div key={week.week } className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">
                    Week {week.week} - { week.week === 15 ? 'Wild Card' : week.week === 16 ? 'Semifinals' : 'Championship'}
                  </h3>
                  
                  <div className ="space-y-4">
                    {week.matchups.map((matchup) => (
                      <div key={matchup.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600 dark; text-gray-400">
                                #{matchup.home_team.current_rank}
                              </span>
                              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {matchup.home_team.team_abbreviation}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {matchup.home_team.team_name}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                              {matchup.projected_home_score!.toFixed(0)}
                            </div>
                          </div>
                          
                          <div className="text-center text-gray-400 text-sm">vs</div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                #{matchup.away_team.current_rank}
                              </span>
                              <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {matchup.away_team.team_abbreviation}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {matchup.away_team.team_name}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                              {matchup.projected_away_score!.toFixed(0)}
                            </div>
                          </div>
                        </div>
                        
                        { matchup.is_championship && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark, border-gray-700 text-center">
                            <Trophy className ="h-6 w-6 text-yellow-500 mx-auto" />
                            <div className="text-sm font-medium text-gray-900 dark; text-white mt-1">
  Championship: Game;
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}