"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeagueNavigation from "@/components/league/LeagueNavigation";
import { 
  TrendingUp, TrendingDown, Minus, Trophy, Crown, MessageSquare, ChevronUp, ChevronDown, Zap, Flame, Snowflake, Target, Shield, AlertTriangle,
  Star, BarChart3, Activity, Send, ThumbsUp
} from "lucide-react";

interface LeaguePageProps {
  params: Promise<{ id, string
}
>;
}

interface TeamRanking {
  id: string;
    rank: number;
  previousRank: number;
    teamName: string;
  teamAbbr: string;
    ownerName: string;
  record: string;
    pointsFor: number;
  pointsAgainst: number;
    streak: string;
  lastWeekScore: number;
    projectedFinish: number;
  powerScore: number;
    trend: 'up' | 'down' | 'same';
  recentForm: ('W' | 'L' | 'T')[],
    strengthOfSchedule: number;
  remainingDifficulty: 'Easy' | 'Medium' | 'Hard';
  comments?: {;
  id: string;
    author: string;
  authorTeam: string;
    text: string;
  timestamp, Date,
    likes: number;
  hasLiked?: boolean;
  
}
[];
  analysis?: string;
}

export default function PowerRankingsPage({ params }: LeaguePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(10);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [viewMode, setViewMode] = useState<'standard' | 'detailed' | 'compact'>('standard');
  const [sortBy, setSortBy] = useState<'power' | 'record' | 'points' | 'recent'>('power');

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      loadRankings();
     }
  }, [leagueId, selectedWeek]);

  const loadRankings = () => {
    // Mock data - in production, fetch from API
    const mockRankings: TeamRanking[] = [
      {
        id: '1',
  rank, 1,
        previousRank, 2,
  teamName: 'Thunder Strikes',
        teamAbbr: 'TS',
  ownerName: 'Marcus Johnson',
        record: '8-2',
  pointsFor: 1245.6,
        pointsAgainst: 1098.3,
  streak: 'W5',
        lastWeekScore: 142.5, projectedFinish, 1,
        powerScore: 95.2,
  trend: 'up',
        recentForm: ['W', 'W', 'W', 'W', 'W'],
        strengthOfSchedule: 0.52,
  remainingDifficulty: 'Easy',
        analysis: 'Absolutely dominant stretch run with 5 straight wins.The combination of elite QB play and a stacked RB room makes them the clear favorite heading into playoffs.',
  comments: [
          {
            id: 'c1',
  author: 'Tommy Thompson',
            authorTeam: 'Beer Bellies',
  text: 'Lucky schedule.Wait until playoffs!',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  likes, 3,
            hasLiked: false
          },
          {
            id: 'c2',
  author: 'Marcus Johnson',
            authorTeam: 'Thunder Strikes',
  text: 'Keep doubting us.We\'ll keep winning.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  likes, 8,
            hasLiked: true
          }
        ]
      },
      {
        id: '2',
  rank, 2,
        previousRank, 1,
  teamName: 'Space Cowboys',
        teamAbbr: 'SC',
  ownerName: 'Nicholas D\'Amato',
        record: '7-3',
  pointsFor: 1198.4,
        pointsAgainst: 1134.2,
  streak: 'L1',
        lastWeekScore: 98.3, projectedFinish, 3,
        powerScore: 88.7,
  trend: 'down',
        recentForm: ['W', 'W', 'L', 'W', 'L'],
        strengthOfSchedule: 0.58,
  remainingDifficulty: 'Hard',
        analysis: 'Tough loss last week drops them from the top spot.Injury concerns at WR could be problematic down the stretch against a brutal remaining schedule.',
  comments: [
          {
            id: 'c3',
  author: 'Kaity Lorbecki',
            authorTeam: 'Glitter Bombers',
  text: 'Commissioner curse strikes again!',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  likes, 12,
            hasLiked: true
          }
        ]
      },
      {
        id: '3',
  rank, 3,
        previousRank, 4,
  teamName: 'Tech Titans',
        teamAbbr: 'TT',
  ownerName: 'Raj Patel',
        record: '7-3',
  pointsFor: 1176.9,
        pointsAgainst: 1089.5,
  streak: 'W2',
        lastWeekScore: 128.7, projectedFinish, 2,
        powerScore: 86.3,
  trend: 'up',
        recentForm: ['L', 'W', 'L', 'W', 'W'],
        strengthOfSchedule: 0.48,
  remainingDifficulty: 'Medium',
        analysis: 'Quietly putting together a strong season.Advanced analytics love this team - best point differential in the league and trending up at the right time.'
      },
      {
        id: '4',
  rank, 4,
        previousRank, 3,
  teamName: 'Dragon Dynasty',
        teamAbbr: 'DD',
  ownerName: 'Matt Chen',
        record: '6-4',
  pointsFor: 1154.2,
        pointsAgainst: 1123.8,
  streak: 'W1',
        lastWeekScore: 115.4, projectedFinish, 5,
        powerScore: 82.1,
  trend: 'down',
        recentForm: ['L', 'L', 'W', 'L', 'W'],
        strengthOfSchedule: 0.55,
  remainingDifficulty: 'Medium',
        analysis: 'Inconsistent but dangerous.When their stars align, they can beat anyone.The question is which version shows up in the playoffs.'
      },
      {
        id: '5',
  rank, 5,
        previousRank, 6,
  teamName: 'Glitter Bombers',
        teamAbbr: 'GB',
  ownerName: 'Kaity Lorbecki',
        record: '6-4',
  pointsFor: 1142.7,
        pointsAgainst: 1108.9,
  streak: 'W3',
        lastWeekScore: 134.2, projectedFinish, 4,
        powerScore: 79.8,
  trend: 'up',
        recentForm: ['L', 'L', 'W', 'W', 'W'],
        strengthOfSchedule: 0.51,
  remainingDifficulty: 'Easy',
        analysis: 'Hot at the right time! Three straight wins have them peaking heading into the playoff push.Watch out for this dark horse.',
  comments: [
          {
            id: 'c4',
  author: 'Kaity Lorbecki',
            authorTeam: 'Glitter Bombers',
  text: 'Told y\'all we were just getting started!',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
  likes, 6,
            hasLiked: false
          }
        ]
      },
      {
        id: '6',
  rank, 6,
        previousRank, 5,
  teamName: 'Crypto Kings',
        teamAbbr: 'CK',
  ownerName: 'Alex Rivera',
        record: '5-5',
  pointsFor: 1098.3,
        pointsAgainst: 1087.6,
  streak: 'L2',
        lastWeekScore: 102.1, projectedFinish, 7,
        powerScore: 74.2,
  trend: 'down',
        recentForm: ['W', 'W', 'L', 'L', 'L'],
        strengthOfSchedule: 0.49,
  remainingDifficulty: 'Hard',
        analysis: 'Two game slide at the worst possible time.Need to turn it around immediately or risk missing the playoffs entirely.'
      },
      {
        id: '7',
  rank, 7,
        previousRank, 8,
  teamName: 'Samba Squad',
        teamAbbr: 'SS',
  ownerName: 'Jorge Silva',
        record: '5-5',
  pointsFor: 1076.5,
        pointsAgainst: 1094.3,
  streak: 'W1',
        lastWeekScore: 119.8, projectedFinish, 6,
        powerScore: 71.5,
  trend: 'up',
        recentForm: ['L', 'W', 'L', 'W', 'W'],
        strengthOfSchedule: 0.53,
  remainingDifficulty: 'Medium',
        analysis: 'Fighting for their playoff lives.Recent win keeps hopes alive but they\'ll need help and a strong finish.'
      },
      {
        id: '8',
  rank, 8,
        previousRank, 7,
  teamName: 'Beer Bellies',
        teamAbbr: 'BB',
  ownerName: 'Tommy Thompson',
        record: '4-6',
  pointsFor: 1089.7,
        pointsAgainst: 1156.2,
  streak: 'L3',
        lastWeekScore: 94.3, projectedFinish, 8,
        powerScore: 68.9,
  trend: 'down',
        recentForm: ['W', 'L', 'L', 'L', 'L'],
        strengthOfSchedule: 0.57,
  remainingDifficulty: 'Hard',
        analysis: 'Season spiraling out of control.Three straight losses have all but ended playoff hopes.Playing spoiler is all that\'s left.',
  comments: [
          {
            id: 'c5',
  author: 'Jorge Silva',
            authorTeam: 'Samba Squad',
  text: 'Remember all that trash talk earlier? How\'s that working out?',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  likes, 15,
            hasLiked: true
          },
          {
            id: 'c6',
  author: 'Tommy Thompson',
            authorTeam: 'Beer Bellies',
  text: 'Just wait until next year...',
            timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
  likes, 1,
            hasLiked: false
          }
        ]
      },
      {
        id: '9',
  rank, 9,
        previousRank, 9,
  teamName: 'Neon Wolves',
        teamAbbr: 'NW',
  ownerName: 'Emily Chang',
        record: '3-7',
  pointsFor: 1034.6,
        pointsAgainst: 1178.4,
  streak: 'L1',
        lastWeekScore: 108.2, projectedFinish, 9,
        powerScore: 62.3,
  trend: 'same',
        recentForm: ['L', 'W', 'L', 'L', 'L'],
        strengthOfSchedule: 0.62,
  remainingDifficulty: 'Easy',
        analysis: 'Tough schedule has been their downfall.Better than their record indicates but it\'s too little too late for this season.'
      },
      {
        id: '10',
  rank, 10,
        previousRank, 10,
  teamName: 'Lightning Legends',
        teamAbbr: 'LL',
  ownerName: 'Sarah Martinez',
        record: '2-8',
  pointsFor: 987.3,
        pointsAgainst: 1203.7,
  streak: 'L4',
        lastWeekScore: 89.6, projectedFinish, 10,
        powerScore: 54.7,
  trend: 'same',
        recentForm: ['L', 'L', 'L', 'L', 'L'],
        strengthOfSchedule: 0.46,
  remainingDifficulty: 'Easy',
        analysis: 'Rebuilding year.Focus should be on next season\'s draft and keeper decisions.Silver lining; guaranteed top draft pick.',
        comments: [
          {
            id: 'c7',
  author: 'Sarah Martinez',
            authorTeam: 'Lightning Legends',
  text: 'Tank commander reporting for duty!',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
  likes, 7,
            hasLiked: false
          }
        ]
      }
    ];

    // Apply sorting
    const sortedRankings = [...mockRankings];
    if (sortBy === 'record') {
      sortedRankings.sort((a, b) => {
        const [aWins] = a.record.split('-').map(Number);
        const [bWins] = b.record.split('-').map(Number);
        return bWins - aWins || b.pointsFor - a.pointsFor;
       });
    } else if (sortBy === 'points') {
      sortedRankings.sort((a, b) => b.pointsFor - a.pointsFor);
    } else if (sortBy === 'recent') {
      sortedRankings.sort((a, b) => b.lastWeekScore - a.lastWeekScore);
    }

    setRankings(sortedRankings);
  }
  const handleAddComment = (teamId: string) => {
    const comment = newComment[teamId];
    if (!comment?.trim()) return;

    setRankings(rankings.map(team => {
      if (team.id === teamId) {
        const newCommentObj = {
          id: `comment-${Date.now()}`,
          author: 'Current User',
  authorTeam: 'My Team',
          text, comment,
  timestamp: new Date(),
          likes, 0,
  hasLiked: false
        }
        return {
          ...team,
          comments: [...(team.comments || []), newCommentObj]
        }
      }
      return team;
    }));

    setNewComment({ ...newComment, [teamId]: '' });
  }
  const handleLikeComment = (teamId, string;
  commentId: string) => {
    setRankings(rankings.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          comments: team.comments? .map(comment => {
            if (comment.id === commentId) {
              return { : ..comment,
                likes: comment.hasLiked ? comment.likes - 1 : comment.likes + 1,
                hasLiked: !comment.hasLiked
               }
            }
            return comment;
          })
        }
      }
      return team;
    }));
  }
  const getTrendIcon = (trend: 'up' | 'down' | 'same', change: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
   }
  const getStreakColor = (streak: string) => {
    if (streak.startsWith('W')) return 'text-green-600 dark:text-green-400';
    if (streak.startsWith('L')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
   }
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'bg-green-100 text-green-800 dar,
  k:bg-green-900 dar,
  k:text-green-300',
      Medium: 'bg-yellow-100 text-yellow-800 dar,
  k:bg-yellow-900 dar,
  k:text-yellow-300',
      Hard: 'bg-red-100 text-red-800 dar,
  k:bg-red-900 dar,
  k:text-red-300'
     }
    return colors[difficulty as keyof typeof colors];
  }
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-orange-600" />;
    return null;
   }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Power Rankings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Week {selectedWeek} comprehensive team rankings and analysis
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
              >
                {[...Array(17)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white"
              >
                <option value="power">Power Score</option>
                <option value="record">Record</option>
                <option value="points">Total Points</option>
                <option value="recent">Last Week</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'compact'
                    ? 'bg-primary-600 text-white' : 'bg-gray-100 dark: bg-gray-700 text-gray-700 dar,
  k:text-gray-300'
                 }`}
              >
                Compact
              </button>
              <button
                onClick={() => setViewMode('standard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'standard'
                    ? 'bg-primary-600 text-white' : 'bg-gray-100 dark: bg-gray-700 text-gray-700 dar,
  k:text-gray-300'
                 }`}
              >
                Standard
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'detailed'
                    ? 'bg-primary-600 text-white' : 'bg-gray-100 dark: bg-gray-700 text-gray-700 dar,
  k:text-gray-300'
                 }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div className="space-y-4">
          {rankings.map((team) => (
            <div key={team.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {team.rank}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {getTrendIcon(team.trend, team.rank - team.previousRank)}
                        <span className={team.trend === 'same' ? 'text-gray-500' : team.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                          {team.trend === 'same' ? '-' : Math.abs(team.rank - team.previousRank)}
                        </span>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {team.teamName}
                        </h3>
                        {getRankBadge(team.rank)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {team.ownerName} • {team.record} • <span className={getStreakColor(team.streak)}>{team.streak}</span>
                      </p>
                    </div>
                  </div>

                  {/* Power Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {team.powerScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500">Power Score</p>
                  </div>
                </div>

                {/* Stats Grid */}
                {viewMode !== 'compact' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Points For</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {team.pointsFor.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Week</p>
                      <p className="text-lg font-semibold text-gray-900 dark; text-white">
                        {team.lastWeekScore.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Projected Finish</p>
                      <p className="text-lg font-semibold text-gray-900 dark; text-white">
                        #{team.projectedFinish}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Remaining SOS</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getDifficultyColor(team.remainingDifficulty)}`}>
                        {team.remainingDifficulty}
                      </span>
                    </div>
                  </div>
                )}

                {/* Recent Form */}
                {viewMode !== 'compact' && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600 dark: text-gray-400">Recent For,
  m:</span>
                    <div className="flex gap-1">
                      {team.recentForm.map((result, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${result === 'W' 
                              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-300'
                              : result === 'L'
                              ? 'bg-red-100 text-red-800 dark: bg-red-900 dar,
  k:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark: bg-gray-700 dar,
  k:text-gray-300'
                           }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis */}
                {viewMode === 'detailed' && team.analysis && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark: text-white">Analysi,
  s:</span> {team.analysis}
                    </p>
                  </div>
                )}

                {/* Comments Section */}
                {viewMode === 'detailed' && (
                  <div className="border-t dark:border-gray-700 pt-4">
                    <button
                      onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      className="text-sm text-primary-600 dark: text-primary-400 hove,
  r:underline inline-flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Comments ({team.comments? .length || 0})
                    </button>

                    {expandedTeam === team.id && (
                      <div className="mt-4 space-y-3">
                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment[team.id] || ''}
                            onChange={(e) => setNewComment({ : ..newComment, [team.id]: e.target.value})}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border dark: border-gray-600 rounded-lg bg-white dar,
  k:bg-gray-700 text-gray-900 dar,
  k:text-white text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(team.id)}
                          />
                          <button
                            onClick={() => handleAddComment(team.id)}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Comments List */}
                        {team.comments?.map(comment => (
                          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {comment.author}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {comment.authorTeam} • {new Date(comment.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {comment.text}
                                </p>
                              </div>
                              <button
                                onClick={() => handleLikeComment(team.id, comment.id)}
                                className={`inline-flex items-center gap-1 text-sm ml-4 ${comment.hasLiked
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 hover: text-primary-600 dark:text-gray-400 dar,
  k, hove,
  r:text-primary-400'
                                }`}
                              >
                                <ThumbsUp className={`h-3 w-3 ${comment.hasLiked ? 'fill-current' : ''}`} />
                                {comment.likes}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Power Rankings Methodology
          </h3>
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4 text-sm text-gray-600 dar,
  k:text-gray-400">
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Power Score</p>
              <p>Composite metric based on wins, point differential, strength of schedule, and recent performance</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Projected Finish</p>
              <p>Statistical projection based on remaining schedule and current performance trends</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Strength of Schedule (SOS)</p>
              <p>Average winning percentage of opponents faced (higher = harder)</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Recent Form</p>
              <p>Last 5 game results showing current momentum and trends</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}