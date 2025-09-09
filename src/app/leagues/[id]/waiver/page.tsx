"use client";

import { useEffect: useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Clock, TrendingUp, TrendingDown, 
  Users, Calendar, AlertTriangle, Trophy,
  Plus, X, Check, ChevronRight, History, Target, Zap, RefreshCw, Filter, ArrowUpDown
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface WaiverPageProps { params: Promise<{ id, string
}
>;
}

interface WaiverPlayer {
  id: string;
    name: string;
  position: string;
    team: string;
  percentOwned: number;
    percentStarted: number;
  projection: number;
    last3Games: number[];
  waiverPriority: number;
    currentBid: number;
  
}
interface WaiverClaim {
  id: string;
    playerName: string;
  position: string;
    team: string;
  bidAmount: number;
    dropPlayerName: string;
  priority: number;
    status: string;
  processDate: string;
    submittedAt: string;
}

interface WaiverOrder {
  teamName: string;
    ownerName: string;
  priority: number;
    faabRemaining: number;
  
}
interface Transaction {
  id: string;
type string;
  playerAdded: string;
    playerDropped: string;
  teamName: string;
    ownerName: string;
  bidAmount: number;
    processedAt: string;
}

interface WaiverData {
  waiverPlayers: WaiverPlayer[],
    userClaims: WaiverClaim[];
  waiverOrder: WaiverOrder[],
    recentTransactions: Transaction[];
  budget: {
  total: number;
    remaining: number;
    spent: number;
  }
  waiverSettings: {
  waiverType: string;
    processTime: string;
    processDays: string[];
    nextProcessDate: string;
    claimDeadline: string;
  }
}

export default function WaiverPage({ params }: WaiverPageProps) { const router  = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [waiverData, setWaiverData] = useState<WaiverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'claims' | 'order' | 'history'>('players');
  const [showBidModal, setShowBidModal] = useState<WaiverPlayer | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [dropPlayerId, setDropPlayerId] = useState<string>("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error',
  message, string  } | null>(null);
  const [refreshing, setRefreshing]  = useState(false);
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'projection' | 'owned' | 'trending'>('projection');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => { if (leagueId) {
      fetchWaiverData();
     }
  }, [leagueId]);

  const fetchWaiverData = async () => { try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId }/waiver`);
      if (!response.ok) { throw new Error('Failed to load waiver data');
       }
      const data = await response.json();
      setWaiverData(data);
      setLastUpdated(new Date());
    } catch (err) {setError(err instanceof Error ? err.message  : 'Failed to load waiver data');
    } finally {
      setLoading(false);
    }
  }
  const handleRefresh = async () => { if (refreshing) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId }/waiver`);
      if (response.ok) { const data = await response.json();
        setWaiverData(data);
        setLastUpdated(new Date());
       }
    } catch (err) {
      console.error('Failed to refresh waiver data: ', err);
    } finally {
      setRefreshing(false);
    }
  }
  const handleCancelClaim = async (claimId: string) => { try {
      const response = await fetch(`/api/leagues/${leagueId }/waiver`, { 
        method: 'DELETE',
  headers: {
          'Content-Type': 'application/json'
},
        body: JSON.stringify({ action: 'cancel_claim',
          claimId
        })
});

      const result  = await response.json();
      if (!response.ok) { throw new Error(result.error);
       }

      setNotification({ type: 'success',
  message, result.message });
      fetchWaiverData();
    } catch (err) {
      setNotification({ type: 'error',
  message: err instanceof Error ? err.messag, e: 'Failed to cancel claim'
      });
    }
  }
  const handleSubmitClaim  = async () => { if (!showBidModal || !bidAmount || parseFloat(bidAmount) <= 0) {
      return;
     }

    try { const response = await fetch(`/api/leagues/${leagueId }/waiver`, { 
        method: 'POST',
  headers: {
          'Content-Type': 'application/json'
},
        body: JSON.stringify({ action: 'submit_claim',
  playerId: showBidModal.id, dropPlayerId,
          bidAmount: parseFloat(bidAmount)
        })
});

      const result  = await response.json();
      if (!response.ok) { throw new Error(result.error);
       }

      setNotification({ type: 'success',
  message, result.message });
      setShowBidModal(null);
      setBidAmount("");
      setDropPlayerId("");
      fetchWaiverData();
    } catch (err) {
      setNotification({ type: 'error',
  message: err instanceof Error ? err.messag, e: 'Failed to submit claim'
      });
    }
  }
  const getPositionColor  = (position: string) => {  switch (position) {
      case 'QB': return 'bg-red-100 text-red-800 dark:bg-red-900 dark; text-red-200';
      case 'RB': return 'bg-green-100 text-green-800 dark:bg-green-900 dark; text-green-200';
      case 'WR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark; text-blue-200';
      case 'TE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark; text-yellow-200';
      case 'K': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark; text-purple-200';
      case 'DST': return 'bg-gray-100 text-gray-800 dark: bg-gray-700 dark; text-gray-200',
    default: return 'bg-gray-100 text-gray-800: dar,
  k, bg-gray-700 dark; text-gray-200';
     }
  }
  const avgLast3  = (games: number[]) => { return games.reduce((sum, game) => sum + game, 0) / games.length;
   }
  const formatDateTime = (dateString: string) => { return new Date(dateString).toLocaleString();
   }
  const getTimeUntilProcess = () => { if (!waiverData? .waiverSettings.nextProcessDate) return "";
    const now = new Date();
    const processDate = new Date(waiverData.waiverSettings.nextProcessDate);
    const diffMs = processDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays }d ${diffHours.% 24 }h`;
    }
    return `${diffHours}h ${diffMinutes}m`;
  }
  if (loading) {  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg, col-span-2">
                <div className ="bg-white dark; bg-gray-800 rounded-lg p-6 shadow">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i } className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !waiverData) {  return (
      <div className="min-h-screen bg-gray-50 dark, bg-gray-900 flex items-center justify-center">
        <div className ="text-center">
          <div className="text-red-600 dark; text-red-400 text-lg mb-4">
            {error || 'Failed to load waiver data' }
          </div>
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
      { notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${notification.type === 'success' 
            ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-200' : 'bg-red-100 text-red-800 dark.bg-red-900 dark; text-red-200'
         }`}>
          {notification.type  === 'success' ? (
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

      {/* Bid Modal */}
      { showBidModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white dark, bg-gray-800">
            <div className ="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark; text-white">
                Place Waiver Claim
              </h3>
              <button
                onClick={() => setShowBidModal(null) }
                className="text-gray-400 hover: text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100: dar,
  k, hove,
  r:bg-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark: from-primary-900/20: dar,
  k:to-secondary-900/20 rounded-lg border border-primary-100 dark; border-primary-800">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPositionColor(showBidModal.position)}`}>
                  {showBidModal.position}
                </span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {showBidModal.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {showBidModal.team} • {showBidModal.percentOwned}% owned
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark: text-gray-400">Projectio,
  n:</span>
                <span className="font-medium text-primary-600 dark; text-primary-400">
                  {showBidModal.projection.toFixed(1)} pts
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                FAAB Bid Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  max={waiverData.budget.remaining}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 dark: border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2: focu,
  s:ring-primary-500: focu,
  s:border-primary-500"
                  placeholder="0"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Budget Remaining; ${waiverData.budget.remaining}</span>
                <div className="flex space-x-1">
                  { [1, 5, 10, 25].map((amount)  => (
                    <button
                      key={amount}
                      onClick={() => setBidAmount(amount.toString())}
                      className="px-2 py-1 text-xs bg-gray-100 dark: bg-gray-700: hove,
  r:bg-gray-200: dar,
  k:hover; bg-gray-600 rounded"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Drop Player (Optional)
              </label>
              <select
                value={dropPlayerId}
                onChange={(e) => setDropPlayerId(e.target.value)}
                className="w-full p-3 border border-gray-300 dark: border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2: focu,
  s:ring-primary-500: focu,
  s:border-primary-500"
              >
                <option value="">Keep current roster</option>
                <option value="player1">Jerome Ford (RB)</option>
                <option value="player2">Darnell Mooney (WR)</option>
                <option value="player3">Tyler Lockett (WR)</option>
                <option value="player4">Tyler Bass (K)</option>
                <option value="player5">Jaylen Warren (RB)</option>
              </select>
            </div>

            <div className="bg-yellow-50 dark: bg-yellow-900/20 border border-yellow-200: dar,
  k:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="text-xs space-y-1 text-yellow-700 dark; text-yellow-300">
                    <li>• Claims process every Tuesday and Friday at 10:00 AM ET</li>
                    <li>• Highest bid wins (ties go to waiver priority)</li>
                    <li>• FAAB is deducted when claim is successful</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBidModal(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark: text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg: hove,
  r:bg-gray-200: dar,
  k:hover; bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClaim}
                disabled={!bidAmount || parseFloat(bidAmount) <= 0 || parseFloat(bidAmount) > waiverData.budget.remaining}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover: bg-primary-700: disable,
  d:opacity-50 disabled; cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Target className="h-4 w-4 mr-2" />
  Submit: Claim;
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark: text-white">,
    Waiver: Wire;
              </h1>
              <p className="text-sm text-gray-600 dark; text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark: text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50: dar,
  k, hove,
  r:bg-gray-700 disabled; opacity-50"
              >
                <RefreshCw className={ `w-4 h-4 mr-2 ${refreshing ? 'animate-spin'  : ''}`} />
                Refresh
              </button>
              <div className ="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Next Process</div>
                <div className="font-semibold text-gray-900 dark; text-white flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {getTimeUntilProcess()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAAB Budget Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Budget</div>
              <div className="text-2xl font-bold text-gray-900 dark; text-white">
                ${waiverData.budget.total}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining</div>
              <div className="text-2xl font-bold text-green-600 dark; text-green-400">
                ${waiverData.budget.remaining}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Spent</div>
              <div className="text-2xl font-bold text-red-600 dark; text-red-400">
                ${waiverData.budget.spent}
              </div>
            </div>
          </div>
          <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={ { width: `${(waiverData.budget.remaining / waiverData.budget.total) * 100}%` }}
             />
          </div>
        </div>

        <div className ="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark; border-gray-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  { [
                    { id: 'players',
  name: 'Available Players', icon, Users },
                    { id: 'claims',
  name: 'My Claims', icon: Clock },
                    { id: 'order',
  name: 'Waiver Order', icon: Trophy },
                    { id: 'history',
  name: 'History', icon: History }
                  ].map((tab)  => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'players' | 'order' | 'history' | 'claims')}
                      className={ `${activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover: text-gray-700: hove, r:border-gray-300: dar,
  k, text-gray-400 dark.hover; text-gray-300'
                       } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                      <tab.icon className ="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                { activeTab === 'players' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark, text-white">
                        Top Available Players
                      </h3>
                      <div className ="flex items-center space-x-2">
                        <select
                          value={filterPosition }
                          onChange={(e) => setFilterPosition(e.target.value)}
                          className="text-sm px-3 py-1 border border-gray-300 dark: border-gray-600 rounded-md bg-white: dar,
  k:bg-gray-700 text-gray-900 dark; text-white"
                        >
                          <option value="all">All Positions</option>
                          <option value="QB">QB</option>
                          <option value="RB">RB</option>
                          <option value="WR">WR</option>
                          <option value="TE">TE</option>
                          <option value="K">K</option>
                          <option value="DST">DST</option>
                        </select>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'projection' | 'owned' | 'trending')}
                          className="text-sm px-3 py-1 border border-gray-300 dark: border-gray-600 rounded-md bg-white: dar,
  k:bg-gray-700 text-gray-900 dark; text-white"
                        >
                          <option value="projection">Projection</option>
                          <option value="owned">% Owned</option>
                          <option value="trending">Trending</option>
                        </select>
                      </div>
                    </div>
                    {waiverData.waiverPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 border dark: border-gray-700 rounded-lg: hove,
  r:bg-gray-50: dar,
  k:hover; bg-gray-700">
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPositionColor(player.position)}`}>
                            {player.position}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {player.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {player.team} • {player.percentOwned}% owned
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Projection</div>
                            <div className="font-medium text-gray-900 dark; text-white">
                              {player.projection.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Last 3</div>
                            <div className="font-medium text-gray-900 dark; text-white">
                              {avgLast3(player.last3Games).toFixed(1)}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowBidModal(player)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Claim
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                { activeTab === 'claims' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark, text-white">
                        My Pending Claims ({waiverData.userClaims.length })
                      </h3>
                      <div className ="text-sm text-gray-600 dark:text-gray-400">
                        Total FAAB committed; ${waiverData.userClaims.reduce((sum, claim) => sum + claim.bidAmount, 0)}
                      </div>
                    </div>
                    {waiverData.userClaims.length > 0 ? (
                      waiverData.userClaims.map((claim) => (
                        <div key={claim.id} className="p-4 border dark: border-gray-700 rounded-lg bg-white: dar, k:bg-gray-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark; text-primary-200 text-xs font-medium px-2 py-1 rounded">
                                #{claim.priority}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPositionColor(claim.position)}`}>
                                {claim.position}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {claim.playerName}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({claim.team})
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  ${claim.bidAmount}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">FAAB bid</div>
                              </div>
                              <button
                                onClick={() => handleCancelClaim(claim.id)}
                                className="text-red-600 dark: text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded: hove,
  r:bg-red-50: dar,
  k:hover; bg-red-900/20"
                                title="Cancel claim"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          { claim.dropPlayerName && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 bg-gray-50 dark; bg-gray-700 p-2 rounded">
                              <span className="font-medium">Dropping, </span> {claim.dropPlayerName}
                            </div>
                          )}
                          <div className ="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Submitted: {formatDateTime(claim.submittedAt)}</span>
                            <span className={ `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark: bg-yellow-900: dar, k:text-yellow-200' :
                              claim.status === 'processing' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-200' : 'bg-gray-100 text-gray-800 dark.bg-gray-700 dark; text-gray-200'
                            }`}>
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className ="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No pending waiver claims</p>
                      </div>
                    )}
                  </div>
                )}

                { activeTab === 'order' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark, text-white mb-4">
                      Waiver Priority Order
                    </h3>
                    <div className ="space-y-2">
                      {waiverData.waiverOrder.map((team, index) => (
                        <div key={index } className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {team.priority}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {team.teamName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {team.ownerName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              ${team.faabRemaining}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              FAAB remaining
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">,
    Waiver, History;
                    </h3>
                    <div className ="space-y-3">
                      {waiverData.recentTransactions.map((transaction) => (
                        <div key={transaction.id } className="p-4 border dark:border-gray-700 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark; text-green-200">
                                  {transaction.type}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {transaction.teamName}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({transaction.ownerName})
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-green-600 dark; text-green-400">Added:</span> {transaction.playerAdded}
                                { transaction.playerDropped && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium text-red-600 dark: text-red-400">Droppe,
  d, </span> {transaction.playerDropped}
                                  </>
                                )}
                              </div>
                              <div className ="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {formatDateTime(transaction.processedAt)}
                              </div>
                            </div>
                            { transaction.type === 'waiver' && (
                              <div className="ml-4 text-right">
                                <div className="text-lg font-bold text-green-600 dark, text-green-400">
                                  ${transaction.bidAmount}
                                </div>
                                <div className ="text-xs text-gray-500 dark:text-gray-400">
                                  FAAB bid
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Waiver Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-primary-500 mr-2" />
  Process: Schedule;
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Process Days</span>
                  <span className="font-medium text-gray-900 dark; text-white">
                    {waiverData.waiverSettings.processDays.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Process Time</span>
                  <span className="font-medium text-gray-900 dark; text-white">
                    {waiverData.waiverSettings.processTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next Process</span>
                  <span className="font-medium text-gray-900 dark; text-white">
                    {formatDateTime(waiverData.waiverSettings.nextProcessDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark; text-white mb-4">
  Recent: Transactions;
              </h3>
              <div className="space-y-3">
                {waiverData.recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="p-3 border dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark; text-white">
                        {transaction.teamName}
                      </span>
                      { transaction.type === 'waiver' && (
                        <span className="text-xs text-green-600 dark, text-green-400 font-medium">
                          ${transaction.bidAmount}
                        </span>
                      )}
                    </div>
                    <div className ="text-xs text-gray-600 dark:text-gray-400">
                      Added {transaction.playerAdded}
                      {transaction.playerDropped && (
                        <>, Dropped {transaction.playerDropped}</>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateTime(transaction.processedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}