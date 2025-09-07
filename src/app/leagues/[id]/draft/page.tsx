"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, Users, Trophy, Star, Play, Pause, 
  MessageCircle, Settings, TrendingUp, AlertCircle,
  Crown, Timer, Zap, Target, Filter, Search,
  CheckCircle, XCircle, RotateCcw, SkipForward
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number; // Average Draft Position
  points_projected: number;
  points_last_year: number;
  injury_status?: string;
  bye_week: number;
  tier: number;
  news?: string;
  drafted_by?: string;
  draft_position?: number;
}

interface Team {
  id: string;
  team_name: string;
  owner_name: string;
  pick_number: number;
  roster: Player[];
  draft_grade?: string;
  auto_draft: boolean;
}

interface DraftPick {
  id: string;
  pick_number: number;
  round: number;
  pick_in_round: number;
  team_id: string;
  team_name: string;
  player_id?: string;
  player_name?: string;
  player_position?: string;
  time_picked?: string;
  time_remaining?: number;
  is_current: boolean;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'chat' | 'pick' | 'system';
}

export default function DraftPage({ params }: DraftPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState("1"); // Nicholas D'Amato
  
  // Draft state
  const [draftStatus, setDraftStatus] = useState<'pre-draft' | 'active' | 'paused' | 'completed'>('active');
  const [currentPick, setCurrentPick] = useState<DraftPick | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(90); // seconds
  const [totalPicks, setTotalPicks] = useState(150); // 15 rounds × 10 teams
  
  // UI state
  const [activeTab, setActiveTab] = useState<'board' | 'my-queue' | 'chat'>('board');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState("");
  const [showTiers, setShowTiers] = useState(true);
  const [autoPickEnabled, setAutoPickEnabled] = useState(false);
  
  // Draft data
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "1", team_name: "Gridiron Gladiators", owner_name: "Nicholas D'Amato", pick_number: 1, roster: [], auto_draft: false
    },
    {
      id: "2", team_name: "Touchdown Titans", owner_name: "Sarah Johnson", pick_number: 2, roster: [], auto_draft: true
    },
    {
      id: "3", team_name: "Field Goal Phantoms", owner_name: "Mike Chen", pick_number: 3, roster: [], auto_draft: false
    },
    {
      id: "4", team_name: "End Zone Eagles", owner_name: "Jessica Williams", pick_number: 4, roster: [], auto_draft: false
    },
    {
      id: "5", team_name: "Red Zone Raiders", owner_name: "David Brown", pick_number: 5, roster: [], auto_draft: true
    },
    {
      id: "6", team_name: "Pocket Passers", owner_name: "Amanda Davis", pick_number: 6, roster: [], auto_draft: false
    },
    {
      id: "7", team_name: "Blitz Brothers", owner_name: "Chris Wilson", pick_number: 7, roster: [], auto_draft: false
    },
    {
      id: "8", team_name: "Hail Mary Heroes", owner_name: "Lisa Garcia", pick_number: 8, roster: [], auto_draft: true
    },
    {
      id: "9", team_name: "Fantasy Footballers", owner_name: "Ryan Martinez", pick_number: 9, roster: [], auto_draft: false
    },
    {
      id: "10", team_name: "Championship Chasers", owner_name: "Kaity Lorbecki", pick_number: 10, roster: [], auto_draft: false
    }
  ]);

  const [draftBoard, setDraftBoard] = useState<Player[]>([
    { id: "p1", name: "Christian McCaffrey", position: "RB", team: "SF", adp: 1.2, points_projected: 320.5, points_last_year: 285.6, bye_week: 9, tier: 1 },
    { id: "p2", name: "Austin Ekeler", position: "RB", team: "LAC", adp: 2.1, points_projected: 295.3, points_last_year: 278.1, bye_week: 5, tier: 1 },
    { id: "p3", name: "Jonathan Taylor", position: "RB", team: "IND", adp: 2.8, points_projected: 290.2, points_last_year: 310.2, injury_status: "Questionable", bye_week: 14, tier: 1 },
    { id: "p4", name: "Josh Allen", position: "QB", team: "BUF", adp: 3.5, points_projected: 315.7, points_last_year: 312.4, bye_week: 13, tier: 1 },
    { id: "p5", name: "Cooper Kupp", position: "WR", team: "LAR", adp: 4.2, points_projected: 285.9, points_last_year: 245.2, injury_status: "Probable", bye_week: 10, tier: 1 },
    { id: "p6", name: "Derrick Henry", position: "RB", team: "TEN", adp: 5.1, points_projected: 268.4, points_last_year: 198.3, bye_week: 7, tier: 2 },
    { id: "p7", name: "Davante Adams", position: "WR", team: "LV", adp: 5.8, points_projected: 275.1, points_last_year: 201.4, bye_week: 13, tier: 2 },
    { id: "p8", name: "Stefon Diggs", position: "WR", team: "BUF", adp: 6.3, points_projected: 268.7, points_last_year: 234.1, bye_week: 13, tier: 2 },
    { id: "p9", name: "Nick Chubb", position: "RB", team: "CLE", adp: 7.1, points_projected: 255.3, points_last_year: 189.7, bye_week: 5, tier: 2 },
    { id: "p10", name: "Patrick Mahomes", position: "QB", team: "KC", adp: 7.9, points_projected: 310.2, points_last_year: 298.7, bye_week: 10, tier: 2 }
  ]);

  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "c1",
      user: "System",
      message: "Draft has started! Good luck everyone!",
      timestamp: new Date().toISOString(),
      type: 'system'
    },
    {
      id: "c2", 
      user: "Sarah Johnson",
      message: "Let's do this! May the best team win!",
      timestamp: new Date().toISOString(),
      type: 'chat'
    }
  ]);

  const [myQueue, setMyQueue] = useState<Player[]>([]);

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
    } else {
      setLoading(false);
      initializeDraft();
    }
  }, [router]);

  // Timer effect
  useEffect(() => {
    if (draftStatus === 'active' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-pick for current user
            handleAutoPick();
            return 90; // Reset timer for next pick
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [draftStatus, timeRemaining]);

  const initializeDraft = () => {
    // Initialize draft picks
    const picks: DraftPick[] = [];
    const numTeams = teams.length;
    const numRounds = 15;

    for (let round = 1; round <= numRounds; round++) {
      for (let pickInRound = 1; pickInRound <= numTeams; pickInRound++) {
        const isSnakeDraft = round % 2 === 0;
        const teamIndex = isSnakeDraft ? numTeams - pickInRound : pickInRound - 1;
        const team = teams[teamIndex];
        
        picks.push({
          id: `pick-${round}-${pickInRound}`,
          pick_number: (round - 1) * numTeams + pickInRound,
          round,
          pick_in_round: pickInRound,
          team_id: team.id,
          team_name: team.team_name,
          is_current: picks.length === 0 // First pick is current
        });
      }
    }

    setDraftPicks(picks);
    setCurrentPick(picks[0]);
  };

  const handleAutoPick = () => {
    if (!currentPick) return;
    
    const availablePlayers = draftBoard.filter(p => !p.drafted_by);
    if (availablePlayers.length === 0) return;

    const bestPlayer = availablePlayers[0]; // First available player by ADP
    handlePlayerDraft(bestPlayer.id);
  };

  const handlePlayerDraft = (playerId: string) => {
    if (!currentPick) return;

    const player = draftBoard.find(p => p.id === playerId);
    if (!player || player.drafted_by) return;

    // Update player as drafted
    const updatedBoard = draftBoard.map(p => 
      p.id === playerId 
        ? { ...p, drafted_by: currentPick.team_name, draft_position: currentPick.pick_number }
        : p
    );
    setDraftBoard(updatedBoard);

    // Update teams rosters
    const updatedTeams = teams.map(t => 
      t.id === currentPick.team_id 
        ? { ...t, roster: [...t.roster, { ...player, drafted_by: t.team_name }] }
        : t
    );
    setTeams(updatedTeams);

    // Update draft pick
    const updatedPicks = draftPicks.map(pick => {
      if (pick.id === currentPick.id) {
        return {
          ...pick,
          player_id: playerId,
          player_name: player.name,
          player_position: player.position,
          time_picked: new Date().toISOString(),
          is_current: false
        };
      }
      return pick;
    });
    
    // Move to next pick
    const currentPickIndex = draftPicks.findIndex(p => p.id === currentPick.id);
    const nextPick = draftPicks[currentPickIndex + 1];
    
    if (nextPick) {
      updatedPicks[currentPickIndex + 1].is_current = true;
      setCurrentPick(nextPick);
      setTimeRemaining(90);
    } else {
      setDraftStatus('completed');
      setCurrentPick(null);
    }

    setDraftPicks(updatedPicks);

    // Add chat message
    const newMessage: ChatMessage = {
      id: `pick-${Date.now()}`,
      user: 'System',
      message: `${currentPick.team_name} selects ${player.name} (${player.position})`,
      timestamp: new Date().toISOString(),
      type: 'pick'
    };
    setChatMessages([...chatMessages, newMessage]);

    // Remove from my queue if it was there
    setMyQueue(prev => prev.filter(p => p.id !== playerId));
  };

  const addToQueue = (player: Player) => {
    if (!myQueue.some(p => p.id === player.id) && !player.drafted_by) {
      setMyQueue([...myQueue, player]);
    }
  };

  const removeFromQueue = (playerId: string) => {
    setMyQueue(prev => prev.filter(p => p.id !== playerId));
  };

  const filteredPlayers = draftBoard.filter(player => {
    if (player.drafted_by) return false;
    
    const matchesPosition = selectedPosition === 'ALL' || player.position === selectedPosition;
    const matchesSearch = searchTerm === '' || 
                         player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPosition && matchesSearch;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionColor = (position: string) => {
    switch(position) {
      case 'QB': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'RB': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'WR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'TE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'K': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'DST': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTierColor = (tier: number) => {
    switch(tier) {
      case 1: return 'border-l-4 border-red-500';
      case 2: return 'border-l-4 border-orange-500';
      case 3: return 'border-l-4 border-yellow-500';
      case 4: return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Draft Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Draft Room
                </h1>
              </div>
              
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                draftStatus === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                draftStatus === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                draftStatus === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {draftStatus.charAt(0).toUpperCase() + draftStatus.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-6">
              {/* Current Pick Info */}
              {currentPick && (
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Current Pick</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    Round {currentPick.round}, Pick {currentPick.pick_number}
                  </div>
                  <div className="text-sm text-primary-600 dark:text-primary-400">
                    {currentPick.team_name}
                  </div>
                </div>
              )}

              {/* Timer */}
              {draftStatus === 'active' && (
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Time Left</div>
                  <div className={`text-2xl font-bold ${
                    timeRemaining <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              )}

              {/* Draft Progress */}
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Draft Progress</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {draftPicks.filter(p => p.player_id).length} / {totalPicks}
                </div>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${(draftPicks.filter(p => p.player_id).length / totalPicks) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Pick Alert */}
          {currentPick?.team_id === currentUserId && draftStatus === 'active' && (
            <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-primary-900 dark:text-primary-100 font-medium">
                    It's your turn to pick!
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoPickEnabled}
                      onChange={(e) => setAutoPickEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-primary-700 dark:text-primary-300">Auto-pick</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Draft Board */}
          <div className="xl:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex">
                  {[
                    { id: 'board', label: 'Draft Board', icon: Trophy },
                    { id: 'my-queue', label: `My Queue (${myQueue.length})`, icon: Star },
                    { id: 'chat', label: 'Draft Chat', icon: MessageCircle }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as 'board' | 'my-queue' | 'chat')}
                      className={`group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Draft Board Tab */}
                {activeTab === 'board' && (
                  <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search players..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="ALL">All Positions</option>
                        <option value="QB">QB</option>
                        <option value="RB">RB</option>
                        <option value="WR">WR</option>
                        <option value="TE">TE</option>
                        <option value="K">K</option>
                        <option value="DST">DST</option>
                      </select>

                      <button
                        onClick={() => setShowTiers(!showTiers)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          showTiers 
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Tiers
                      </button>
                    </div>

                    {/* Player List */}
                    <div className="space-y-2">
                      {filteredPlayers.slice(0, 50).map((player, index) => (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            showTiers ? getTierColor(player.tier) : ''
                          } ${player.drafted_by ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                              {Math.floor(player.adp)}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 text-xs rounded ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                              
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {player.name}
                                  </span>
                                  {player.injury_status && (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {player.team} • Bye {player.bye_week} • {player.points_projected.toFixed(1)} proj
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!player.drafted_by && (
                              <>
                                <button
                                  onClick={() => addToQueue(player)}
                                  disabled={myQueue.some(p => p.id === player.id)}
                                  className="p-2 text-gray-400 hover:text-yellow-500 disabled:opacity-50"
                                  title="Add to queue"
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                                
                                {currentPick?.team_id === currentUserId && (
                                  <button
                                    onClick={() => handlePlayerDraft(player.id)}
                                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                                  >
                                    Draft
                                  </button>
                                )}
                              </>
                            )}
                            
                            {player.drafted_by && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Pick {player.draft_position}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Queue Tab */}
                {activeTab === 'my-queue' && (
                  <div className="space-y-4">
                    {myQueue.length === 0 ? (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Your Queue is Empty
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Add players to your queue from the draft board to prioritize your picks.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myQueue.map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="text-lg font-bold text-primary-600 dark:text-primary-400 w-8">
                                {index + 1}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 text-xs rounded ${getPositionColor(player.position)}`}>
                                  {player.position}
                                </span>
                                
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {player.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {player.team} • ADP {player.adp.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {currentPick?.team_id === currentUserId && (
                                <button
                                  onClick={() => handlePlayerDraft(player.id)}
                                  className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                                >
                                  Draft
                                </button>
                              )}
                              
                              <button
                                onClick={() => removeFromQueue(player.id)}
                                className="p-2 text-red-400 hover:text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    <div className="h-96 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto">
                      <div className="space-y-3">
                        {chatMessages.map((message) => (
                          <div key={message.id} className="flex space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  message.type === 'system' ? 'text-blue-600 dark:text-blue-400' :
                                  message.type === 'pick' ? 'text-green-600 dark:text-green-400' :
                                  'text-gray-900 dark:text-white'
                                }`}>
                                  {message.user}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              const newMessage: ChatMessage = {
                                id: `msg-${Date.now()}`,
                                user: "Nicholas D'Amato",
                                message: input.value,
                                timestamp: new Date().toISOString(),
                                type: 'chat'
                              };
                              setChatMessages([...chatMessages, newMessage]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Teams & Draft Order */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Draft Order
              </h3>
              <div className="space-y-3">
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      currentPick?.team_id === team.id 
                        ? 'bg-primary-50 border-2 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {team.pick_number}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {team.team_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {team.owner_name}
                          {team.auto_draft && (
                            <span className="ml-1 text-blue-500">(Auto)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {team.roster.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        picked
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Picks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Picks
              </h3>
              <div className="space-y-3">
                {draftPicks
                  .filter(pick => pick.player_name)
                  .slice(-5)
                  .reverse()
                  .map((pick) => (
                    <div key={pick.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {pick.player_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {pick.team_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {pick.pick_number}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${getPositionColor(pick.player_position || '')}`}>
                          {pick.player_position}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* My Team */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                My Roster
              </h3>
              <div className="space-y-2">
                {teams.find(t => t.id === currentUserId)?.roster.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Pick {player.draft_position}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No players drafted yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}