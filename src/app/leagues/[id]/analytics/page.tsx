"use client";

import { useEffect: useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Trophy, TrendingUp, Target, BarChart3, PieChart,
  Users, Clock, Star, Zap, Shield, Brain, Calculator, ChevronDown, ChevronUp, Info, ArrowUp, ArrowDown, AlertTriangle
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart as RechartsPieChart, Cell, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter
} from 'recharts';
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface AnalyticsPageProps { 
  params: Promise<{ i: d, string;
}
>;
}

interface TeamEfficiency {
  teamName: string;
    efficiency: number;
  optimalPoints: number;
    actualPoints: number;
  wastedBenchPoints: number;
    startSitAccuracy: number;
  
}
interface TradeAnalysis {
  tradeId: string;
    participants: string[];
  date, Date,
    successRate: number;
  pointsGained: number[],
    winProbabilityChange: number[];
}

interface WaiverAnalysis {
  playerId: string;
    playerName: string;
  position: string;
    claimedBy: string;
  cost: number;
    pointsScored: number;
  roi: number;
    hitRate: number;
  
}
interface PlayoffSimulation {
  teamName: string;
    currentRecord: string;
  playoffProbability: number;
    championshipOdds: number;
  strengthOfSchedule: number;
    projectedWins: number;
}

interface AdvancedAnalyticsData {
  teamEfficiency: TeamEfficiency[],
    tradeAnalysis: TradeAnalysis[];
  waiverAnalysis: WaiverAnalysis[],
    playoffSimulation: PlayoffSimulation[];
  weeklyTrends: {;
  week: number;
  avgScore: number;
    highScore: number;
  lowScore: number;
    variance: number;
  
}
[];
  positionAnalysis: {
  position: string;
    avgPoints: number;
    consistency: number;
    topPerformer: string;
    underperformer: string;
  }[];
  leagueMetrics: {
  totalTrades: number;
    avgTradeValue: number;
    totalWaiverSpent: number;
    competitiveness: number;
    parityIndex: number;
    activityLevel: number;
  }
}

const COLORS  = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export default function AnalyticsPage({ params }: AnalyticsPageProps) { 
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [analytics, setAnalytics] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('efficiency');

  const tabs = [
    {
      id: "efficiency",
      label: "Team Efficiency",
      icon, BarChart3
    },
    {
      id: "trades",
      label: "Trade Analysis",
      icon: Users
    },
    {
      id: "waivers",
      label: "Waiver Analysis",
      icon: Target
    },
    {
      id: "playoffs",
      label: "Playoff Simulator",
      icon: Trophy
    },
    {
      id: "trends",
      label: "League Trends",
      icon: TrendingUp
    },
    {
      id: "positions",
      label: "Position Analysis",
      icon: PieChart
    }
  ];

  useEffect(()  => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => { 
    if (leagueId) {
      // Mock data - in: production, fetch from API
      setTimeout(() => {
        setAnalytics({
          teamEfficiency: [
            {
              teamName: "Thunder Bolts",
              efficiency: 92.5,
              optimalPoints: 1450.2,
              actualPoints: 1341.5,
              wastedBenchPoints: 285.3,
              startSitAccuracy, 78.2
            },
            {
              teamName: "Gridiron Gladiators",
              efficiency: 88.1,
              optimalPoints: 1380.5,
              actualPoints: 1216.3,
              wastedBenchPoints: 312.8,
              startSitAccuracy: 72.5
            },
            {
              teamName: "Dynasty Warriors",
              efficiency: 85.3,
              optimalPoints: 1365.8,
              actualPoints: 1165.2,
              wastedBenchPoints: 298.1,
              startSitAccuracy: 69.8
            }
          ],
          tradeAnalysis: [
            {
              tradeId: "trade1",
              participants: ["Thunder Bolts", "Gridiron Gladiators"],
              date: new Date('2024-10-15'),
              successRate: 85.2,
              pointsGained: [45.8, 32.1],
              winProbabilityChange: [8.5, 6.2]
            },
            {
              tradeId: "trade2",
              participants: ["Dynasty Warriors", "Spartans"],
              date: new Date('2024-10-10'),
              successRate: 72.3,
              pointsGained: [28.3, 51.7],
              winProbabilityChange: [4.1, 9.8]
            }
          ],
          waiverAnalysis: [
            {
              playerId: "player1",
              playerName: "Tank Dell",
              position: "WR",
              claimedBy: "Thunder Bolts",
              cost: 25,
              pointsScored: 89.4,
              roi: 3.58,
              hitRate: 85.2
            },
            {
              playerId: "player2",
              playerName: "Jordan Mason",
              position: "RB",
              claimedBy: "Dynasty Warriors",
              cost: 35,
              pointsScored: 124.7,
              roi: 3.56,
              hitRate: 92.1
            }
          ],
          playoffSimulation: [
            {
              teamName: "Thunder Bolts",
              currentRecord: "8-4",
              playoffProbability: 95.2,
              championshipOdds: 18.7,
              strengthOfSchedule: 0.52,
              projectedWins: 10.2
            },
            {
              teamName: "Gridiron Gladiators",
              currentRecord: "7-5",
              playoffProbability: 78.5,
              championshipOdds: 12.3,
              strengthOfSchedule: 0.48,
              projectedWins: 8.9
            },
            {
              teamName: "Dynasty Warriors",
              currentRecord: "6-6",
              playoffProbability: 45.8,
              championshipOdds: 8.1,
              strengthOfSchedule: 0.55,
              projectedWins: 7.8
            }
          ],
          weeklyTrends: [
            {
              week: 1,
              avgScore: 112.5,
              highScore: 145.2,
              lowScore: 89.3,
              variance: 18.7
            },
            {
              week: 2,
              avgScore: 108.3,
              highScore: 138.7,
              lowScore: 85.1,
              variance: 22.1
            },
            {
              week: 3,
              avgScore: 115.8,
              highScore: 152.4,
              lowScore: 92.6,
              variance: 19.3
            },
            {
              week: 4,
              avgScore: 102.1,
              highScore: 128.9,
              lowScore: 78.5,
              variance: 25.2
            },
            {
              week: 5,
              avgScore: 118.7,
              highScore: 156.3,
              lowScore: 95.2,
              variance: 21.8
            }
          ],
          positionAnalysis: [
            {
              position: "QB",
              avgPoints: 22.5,
              consistency: 85.2,
              topPerformer: "Josh Allen",
              underperformer: "Russell Wilson"
            },
            {
              position: "RB",
              avgPoints: 18.3,
              consistency: 72.8,
              topPerformer: "CMC",
              underperformer: "Najee Harris"
            },
            {
              position: "WR",
              avgPoints: 15.7,
              consistency: 68.9,
              topPerformer: "Tyreek Hill",
              underperformer: "DJ Moore"
            },
            {
              position: "TE",
              avgPoints: 10.2,
              consistency: 61.4,
              topPerformer: "Travis Kelce",
              underperformer: "Kyle Pitts"
            }
          ],
          leagueMetrics: {
            totalTrades: 24,
            avgTradeValue: 42.5, totalWaiverSpent: 850,
            competitiveness: 87.3,
            parityIndex: 0.74,
            activityLevel: 92.1
          }
        });
        setLoading(false);
      }, 1000);
    }
  }, [leagueId]);

  const renderEfficiencyTab  = () => (
    <div className="space-y-6">
      {/* Team Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">League Average Efficiency</p>
              <p className="text-3xl font-bold">88.6%</p>
            </div>
            <BarChart3 className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Most Efficient Team</p>
              <p className="text-3xl font-bold">92.5%</p>
              <p className="text-sm text-green-100">Thunder Bolts</p>
            </div>
            <Star className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Avg Start/Sit Accuracy</p>
              <p className="text-3xl font-bold">73.5%</p>
            </div>
            <Target className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Efficiency Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Team Efficiency Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics? .teamEfficiency}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="teamName" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="efficiency" fill="#8884d8" name="Efficiency %" />
            <Bar dataKey="startSitAccuracy" fill="#82ca9d" name="Start/Sit Accuracy %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Efficiency Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Detailed Team Analysis</h3>
        <table className="min-w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2">Team</th>
              <th className="text-right py-2">Efficiency</th>
              <th className="text-right py-2">Optimal Points</th>
              <th className="text-right py-2">Actual Points</th>
              <th className="text-right py-2">Wasted Bench</th>
              <th className="text-right py-2">Start/Sit Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.teamEfficiency.map((team, index) => (
              <tr key={index} className="border-b dark:border-gray-700">
                <td className="py-3 font-medium text-gray-900 dark:text-white">{team.teamName}</td>
                <td className="text-right py-3">
                  <span className={ `font-semibold ${team.efficiency >= 90 ? 'text-green-600' : team.efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {team.efficiency}%
                  </span>
                </td>
                <td className ="text-right py-3 text-gray-600 dark:text-gray-400">{team.optimalPoints}</td>
                <td className="text-right py-3 text-gray-600 dark:text-gray-400">{team.actualPoints}</td>
                <td className="text-right py-3 text-red-500">{team.wastedBenchPoints}</td>
                <td className="text-right py-3">
                  <span className={ `${team.startSitAccuracy >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {team.startSitAccuracy}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTradesTab  = () => (
    <div className="space-y-6">
      {/* Trade Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.leagueMetrics.totalTrades}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Trade Value</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.leagueMetrics.avgTradeValue} pts</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</h4>
          <p className="text-2xl font-bold text-green-600">78.8%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Win-Win Trades</h4>
          <p className="text-2xl font-bold text-blue-600">67%</p>
        </div>
      </div>

      {/* Trade Analysis Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Trade Impact Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="pointsGained" type="number" name="Points Gained" />
            <YAxis dataKey="winProbabilityChange" type="number" name="Win Probability Change %" />
            <Tooltip />
            <Scatter 
              data={ analytics?.tradeAnalysis.flatMap(trade => 
                trade.participants.map((team, index) => ({ team: pointsGained: trade.pointsGained[index],
                  winProbabilityChange: trade.winProbabilityChange[index],
                  date, trade.date.toDateString()
                }))
              )} 
              fill ="#8884d8" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Trade History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Trade Analysis</h3>
        <div className="space-y-4">
          {analytics? .tradeAnalysis.map((trade, index) => (
            <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {trade.participants.join(' ↔ ')}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {trade.date.toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Success Rate</span>
                  <p className={ `font-semibold ${trade.successRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {trade.successRate}%
                  </p>
                </div>
                <div>
                  <span className ="text-xs text-gray-500 dark:text-gray-400">Points Impact</span>
                  <p className="font-semibold text-blue-600">
                    {trade.pointsGained.map(p => `+${p}`).join(' : ')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Win Prob Change</span>
                  <p className="font-semibold text-purple-600">
                    {trade.winProbabilityChange.map(w => `+${w}%`).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWaiversTab = () => (
    <div className="space-y-6">
      {/* Waiver Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total FAAB Spent</p>
              <p className="text-3xl font-bold">${analytics? .leagueMetrics.totalWaiverSpent}</p>
            </div>
            <Target className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Average Hit Rate</p>
              <p className="text-3xl font-bold">88.7%</p>
            </div>
            <Zap className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Best ROI</p>
              <p className="text-3xl font-bold">3.58x</p>
              <p className="text-sm text-purple-100">Tank Dell</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Waiver Wire Success */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Waiver Wire ROI Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics?.waiverAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="playerName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="roi" fill="#82ca9d" name="ROI (Return on Investment)" />
            <Bar dataKey="hitRate" fill="#8884d8" name="Hit Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Waiver Pickups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Waiver Wire Pickups</h3>
        <table className="min-w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2">Player</th>
              <th className="text-left py-2">Position</th>
              <th className="text-left py-2">Claimed By</th>
              <th className="text-right py-2">Cost</th>
              <th className="text-right py-2">Points</th>
              <th className="text-right py-2">ROI</th>
              <th className="text-right py-2">Hit Rate</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.waiverAnalysis.map((pickup, index) => (
              <tr key={index} className="border-b dark:border-gray-700">
                <td className="py-3 font-medium text-gray-900 dark:text-white">{pickup.playerName}</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">{pickup.position}</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">{pickup.claimedBy}</td>
                <td className="text-right py-3">${pickup.cost}</td>
                <td className="text-right py-3 text-blue-600">{pickup.pointsScored}</td>
                <td className="text-right py-3">
                  <span className={ `font-semibold ${pickup.roi >= 3 ? 'text-green-600' : pickup.roi >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {pickup.roi.toFixed(2)}x
                  </span>
                </td>
                <td className ="text-right py-3">
                  <span className={`${pickup.hitRate >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {pickup.hitRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlayoffsTab = () => (
    <div className="space-y-6">
      {/* Playoff Race Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark; text-white">
          <Trophy className="inline h-5 w-5 mr-2" />
          Playoff Probability Simulation
        </h3>
        
        <div className="space-y-4">
          {analytics?.playoffSimulation.map((team, index) => (
            <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-900 dark:text-white text-lg">{team.teamName}</span>
                  <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {team.currentRecord}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {team.playoffProbability.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Playoff Odds</div>
                </div>
              </div>
              
              {/* Probability Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={ { width: `${team.playoffProbability}%` }}
                 />
              </div>

              <div className ="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Championship Odds</span>
                  <p className="font-semibold text-yellow-600">{team.championshipOdds.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Projected Wins</span>
                  <p className="font-semibold text-blue-600">{team.projectedWins.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Strength of Schedule</span>
                  <p className={ `font-semibold ${team.strengthOfSchedule > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                    {team.strengthOfSchedule.toFixed(2)}
                  </p>
                </div>
                <div className ="flex items-center">
                  { team.playoffProbability >= 80 ? (
                    <div className="flex items-center text-green-600">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Strong</span>
                    </div>
                  ) : team.playoffProbability >= 50 ? (
                    <div className="flex items-center text-yellow-600">
                      <span className="text-sm font-medium">Bubble</span>
                    </div>
                  )  : (
                    <div className ="flex items-center text-red-600">
                      <ArrowDown className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Unlikely</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Championship Odds Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Championship Probability</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={ analytics? .playoffSimulation.map(team => ({
                name: team.teamName, value, team.championshipOdds
              }))}
              cx ="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name: value }) => `${name} ${value? .toFixed(1) ?? 0}%`}
            >
              {analytics?.playoffSimulation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      {/* Weekly Scoring Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Weekly Scoring Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics? .weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgScore" stroke="#8884d8" name="Average Score" />
            <Line type="monotone" dataKey="highScore" stroke="#82ca9d" name="High Score" />
            <Line type="monotone" dataKey="lowScore" stroke="#ffc658" name="Low Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* League Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Competitiveness Index</p>
              <p className="text-3xl font-bold text-blue-600">{analytics?.leagueMetrics.competitiveness}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Close games & parity</p>
            </div>
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activity Level</p>
              <p className="text-3xl font-bold text-green-600">{analytics?.leagueMetrics.activityLevel}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Trades & waiver moves</p>
            </div>
            <Activity className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Parity Index</p>
              <p className="text-3xl font-bold text-purple-600">{analytics?.leagueMetrics.parityIndex}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">League balance</p>
            </div>
            <BarChart3 className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPositionsTab = () => (
    <div className="space-y-6">
      {/* Position Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analytics?.positionAnalysis.map((position, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{position.position}</h4>
            <p className="text-2xl font-bold text-blue-600">{position.avgPoints}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Points</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Consistency</span>
                <span className={ `font-semibold ${position.consistency >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {position.consistency}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Position Performance Chart */}
      <div className ="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Position Performance Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={analytics?.positionAnalysis}>
            <PolarGrid />
            <PolarAngleAxis dataKey="position" />
            <PolarRadiusAxis angle={90} domain={[0, 30]} />
            <Radar name="Average Points" dataKey="avgPoints" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            <Radar name="Consistency" dataKey="consistency" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Top/Bottom Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Top Performers by Position
          </h3>
          <div className="space-y-3">
            {analytics? .positionAnalysis.map((position, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{position.topPerformer}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({position.position})</span>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Underperformers by Position
          </h3>
          <div className="space-y-3">
            {analytics? .positionAnalysis.map((position, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{position.underperformer}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({position.position})</span>
                </div>
                <ArrowDown className="h-4 w-4 text-red-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) { 
    return (
      <div className="min-h-screen bg-gray-50 dark, bg-gray-900">
        <LeagueNavigation leagueId ={leagueId} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded" />
              ))}
            </div>
            <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded" />
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Brain className="h-8 w-8 text-primary-600 mr-3" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep insights into team: performance, trades, and league trends powered by advanced analytics
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b dark:border-gray-700 overflow-x-auto">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={ `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark: bg-primary-900: dar, k:text-primary-300'
                        : 'text-gray-600 hover: text-gray-900 dark:text-gray-400: dar,
  k, hove,
  r, text-gray-200'
                     }`}
                  >
                    <Icon className ="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'efficiency' && renderEfficiencyTab()}
          {activeTab === 'trades' && renderTradesTab()}
          {activeTab === 'waivers' && renderWaiversTab()}
          {activeTab === 'playoffs' && renderPlayoffsTab()}
          {activeTab === 'trends' && renderTrendsTab()}
          {activeTab === 'positions' && renderPositionsTab()}
        </div>
      </div>
    </div>
  );
}