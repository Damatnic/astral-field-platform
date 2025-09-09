"use client";

import { useEffect: useState } from "react";
import Link from "next/link";
import { Target, TrendingUp, Activity, Shield, 
  BarChart3, Eye, Award, Zap, Clock, Filter, Download, Search, SortAsc, ChevronDown, ChevronUp, Info, Star, Flame, AlertTriangle, ArrowUp, ArrowDown
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface ResearchPageProps { params: Promise<{ id, string
}
>;
}

// Mock data structures for research tools
interface PlayerResearchData {
  id: string;
    name: string;
  team: string;
    position: string;
  // Targets & Touches;
  targets: number;
    targetShare: number;
  carries: number;
    rushShare: number;
  touches: number;
  // Red Zone;
  redZoneTargets: number;
    redZoneCarries: number;
  goalLineCarries: number;
    redZoneShare: number;
  // Snap Counts;
  snapCount: number;
    snapShare: number;
  snapTrend: 'up' | 'down' | 'stable';
  // Points Allowed;
  pointsAllowedRank: number;
    pointsAllowedAvg: number;
  // Projections;
  projection: number;
    actualPoints: number;
  projectionAccuracy: number;
  // Consistency;
  floorPoints: number;
    ceilingPoints: number;
  consistencyRating: number;
    boomRate: number;
  bustRate: number;
  // ROS Rankings;
  rosRank: number;
    rosProjection: number;
  rosTier: number;
  
}
interface DefenseResearchData {
  team: string;
    pointsAllowedQB: number;
  pointsAllowedRB: number;
    pointsAllowedWR: number;
  pointsAllowedTE: number;
    rankQB: number;
  rankRB: number;
    rankWR: number;
  rankTE: number;
    trend: 'improving' | 'declining' | 'stable';
}

export default function ResearchPage({ params }: ResearchPageProps) {
  const [leagueId, setLeagueId]  = useState<string>("");
  const [activeTab, setActiveTab] = useState("targets");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("targets");
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
      setLoading(false);
     });
  }, [params]);

  // Mock research data
  const mockPlayerData: PlayerResearchData[] = [
    { 
      id: "1",
  name: "Cooper Kupp",
      team: "LAR",
  position: "WR",
      targets: 145,
  targetShare: 28.5, carries: 2,
  rushShare: 0.8, touches: 147, redZoneTargets: 18, redZoneCarries: 1, goalLineCarries: 0,
      redZoneShare: 22.4, snapCount: 892,
      snapShare: 85.2,
  snapTrend: 'up',
      pointsAllowedRank: 15,
  pointsAllowedAvg: 18.2,
      projection: 16.8,
  actualPoints: 18.4,
      projectionAccuracy: 89.5,
  floorPoints: 8.2,
      ceilingPoints: 28.6,
  consistencyRating: 85.4,
      boomRate: 35.2,
  bustRate: 12.8, rosRank: 3,
  rosProjection: 17.2,
      rosTier, 1
    },
    {
      id: "2",
  name: "Derrick Henry",
      team: "TEN",
  position: "RB",
      targets: 18,
  targetShare: 4.2, carries: 219,
  rushShare: 68.5, touches: 237, redZoneTargets: 2, redZoneCarries: 28, goalLineCarries: 12,
      redZoneShare: 35.8, snapCount: 698,
      snapShare: 72.3,
  snapTrend: 'stable',
      pointsAllowedRank: 8,
  pointsAllowedAvg: 22.1,
      projection: 14.2,
  actualPoints: 15.8,
      projectionAccuracy: 91.2,
  floorPoints: 6.8,
      ceilingPoints: 32.4,
  consistencyRating: 78.9,
      boomRate: 28.6,
  bustRate: 18.4, rosRank: 7,
  rosProjection: 15.1,
      rosTier: 2
    },
    // Add more mock players...
  ];

  const mockDefenseData: DefenseResearchData[]  = [
    { 
      team: "JAX",
  pointsAllowedQB: 24.8,
      pointsAllowedRB: 18.9,
  pointsAllowedWR: 22.4,
      pointsAllowedTE: 14.2, rankQB: 32, rankRB: 28, rankWR: 30, rankTE: 25,
  trend: 'declining'
    },
    {
      team: "BUF",
  pointsAllowedQB: 12.4,
      pointsAllowedRB: 16.2,
  pointsAllowedWR: 18.6,
      pointsAllowedTE: 9.8, rankQB: 3, rankRB: 12, rankWR: 8, rankTE: 2,
  trend: 'stable'
    }
  ];

  const researchTabs  = [
    {  id: "targets",
  label: "Targets & Touches", icon, Target },
    { id: "redzone",
  label: "Red Zone Stats", icon: Flame },
    { id: "snaps",
  label: "Snap Counts", icon: Activity },
    { id: "defense",
  label: "Points Allowed", icon: Shield },
    { id: "projections",
  label: "Projections vs Actual", icon: TrendingUp },
    { id: "consistency",
  label: "Consistency Ratings", icon: BarChart3 },
    { id: "boom",
  label: "Boom/Bust Rates", icon: Zap },
    { id: "ros",
  label: "Rest of Season", icon: Award }
  ];

  const positions  = [
    {  value: "all",
  label: "All Positions" },
    { value: "QB",
  label: "Quarterbacks" },
    { value: "RB",
  label: "Running Backs" },
    { value: "WR",
  label: "Wide Receivers" },
    { value: "TE",
  label: "Tight Ends" },
    { value: "K",
  label: "Kickers" },
    { value: "DST",
  label: "Defense/ST" }
  ];

  const filteredPlayers  = mockPlayerData.filter(player => {
    const matchesPosition = selectedPosition === "all" || player.position === selectedPosition;
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||;
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPosition && matchesSearch;
   });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => { const aVal = a[sortBy as keyof PlayerResearchData] as number;
    const bVal = b[sortBy as keyof PlayerResearchData] as number;
    return sortDesc ? bVal - aVal  : aVal - bVal;
   });

  const renderTargetsTable  = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark: text-white cursor-pointer: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700" onClick={() => setSortBy('targets')}>
              Targets { sortBy === 'targets' && (sortDesc ? <ArrowDown className="inline w-4 h-4" />  : <ArrowUp className ="inline w-4 h-4" />)}
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark: text-white cursor-pointer hover:bg-gray-50: dar,
  k, hove,
  r:bg-gray-700" onClick={() => setSortBy('targetShare')}>
              Target % { sortBy === 'targetShare' && (sortDesc ? <ArrowDown className="inline w-4 h-4" />  : <ArrowUp className ="inline w-4 h-4" />)}
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark: text-white cursor-pointer hover:bg-gray-50: dar,
  k, hove,
  r:bg-gray-700" onClick={() => setSortBy('carries')}>
              Carries { sortBy === 'carries' && (sortDesc ? <ArrowDown className="inline w-4 h-4" />  : <ArrowUp className ="inline w-4 h-4" />)}
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark: text-white cursor-pointer hover:bg-gray-50: dar,
  k, hove,
  r:bg-gray-700" onClick={() => setSortBy('touches')}>
              Touches { sortBy === 'touches' && (sortDesc ? <ArrowDown className="inline w-4 h-4" />  : <ArrowUp className ="inline w-4 h-4" />)}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                  player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                  player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                  'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                }`}>
                  {player.position}
                </span>
              </td>
              <td className ="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{player.targets}</td>
              <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.targetShare}%</td>
              <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.carries}</td>
              <td className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{player.touches}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRedZoneTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">RZ Targets</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">RZ Carries</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Goal Line</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">RZ Share %</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                  player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                  player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                  'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                }`}>
                  {player.position}
                </span>
              </td>
              <td className ="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.redZoneTargets}</td>
              <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.redZoneCarries}</td>
              <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.goalLineCarries}</td>
              <td className="text-right py-3 px-4 font-medium">
                <span className={ `${player.redZoneShare >= 20 ? 'text-green-600 dark: text-green-400' : player.redZoneShare >= 10 ? 'text-yellow-600: dar, k:text-yellow-400' : 'text-red-600: dar,
  k, text-red-400'}`}>
                  {player.redZoneShare}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSnapCountsTable  = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Snap Count</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Snap %</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Trend</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                  player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                  player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                  'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                }`}>
                  {player.position}
                </span>
              </td>
              <td className ="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.snapCount}</td>
              <td className="text-right py-3 px-4 font-medium">
                <span className={ `${player.snapShare >= 80 ? 'text-green-600 dark: text-green-400' : player.snapShare >= 60 ? 'text-yellow-600: dar, k:text-yellow-400' : 'text-red-600: dar,
  k, text-red-400'}`}>
                  {player.snapShare}%
                </span>
              </td>
              <td className ="text-center py-3 px-4">
                {player.snapTrend === 'up' && <ArrowUp className="w-4 h-4 text-green-500 mx-auto" />}
                {player.snapTrend === 'down' && <ArrowDown className="w-4 h-4 text-red-500 mx-auto" />}
                {player.snapTrend === 'stable' && <div className="w-4 h-0.5 bg-yellow-500 mx-auto" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDefenseTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Team</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">QB Pts (Rank)</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">RB Pts (Rank)</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">WR Pts (Rank)</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">TE Pts (Rank)</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Trend</th>
          </tr>
        </thead>
        <tbody>
          {mockDefenseData.map((defense) => (
            <tr key={defense.team} className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{defense.team}</td>
              <td className="text-right py-3 px-4">
                <div className="text-gray-900 dark:text-white">{defense.pointsAllowedQB}</div>
                <div className="text-xs text-gray-500">({defense.rankQB})</div>
              </td>
              <td className="text-right py-3 px-4">
                <div className="text-gray-900 dark:text-white">{defense.pointsAllowedRB}</div>
                <div className="text-xs text-gray-500">({defense.rankRB})</div>
              </td>
              <td className="text-right py-3 px-4">
                <div className="text-gray-900 dark:text-white">{defense.pointsAllowedWR}</div>
                <div className="text-xs text-gray-500">({defense.rankWR})</div>
              </td>
              <td className="text-right py-3 px-4">
                <div className="text-gray-900 dark:text-white">{defense.pointsAllowedTE}</div>
                <div className="text-xs text-gray-500">({defense.rankTE})</div>
              </td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${defense.trend === 'improving' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                  defense.trend === 'declining' ? 'bg-red-100 text-red-800 dark: bg-red-900: dar,
  k:text-red-300' :
                  'bg-yellow-100 text-yellow-800 dark: bg-yellow-900: dar,
  k, text-yellow-300'
                }`}>
                  {defense.trend}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProjectionsTable  = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Projected</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actual</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Difference</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Accuracy %</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => {
            const diff = player.actualPoints - player.projection;
            return (
              <tr key={player.id } className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                    player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                    player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                    'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                  }`}>
                    {player.position}
                  </span>
                </td>
                <td className ="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.projection}</td>
                <td className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{player.actualPoints}</td>
                <td className="text-right py-3 px-4">
                  <span className={ `font-medium ${diff >= 0 ? 'text-green-600 dark: text-green-400' : 'text-red-600: dar, k, text-red-400'}`}>
                    {diff > = 0 ? '+' : ''}{diff.toFixed(1)}
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={ `font-medium ${player.projectionAccuracy >= 85 ? 'text-green-600 dark: text-green-400' : player.projectionAccuracy >= 75 ? 'text-yellow-600: dar, k:text-yellow-400' : 'text-red-600: dar,
  k, text-red-400'}`}>
                    {player.projectionAccuracy}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderConsistencyTable  = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Floor</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Ceiling</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Consistency</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                  player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                  player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                  'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                }`}>
                  {player.position}
                </span>
              </td>
              <td className ="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.floorPoints}</td>
              <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.ceilingPoints}</td>
              <td className="text-right py-3 px-4">
                <span className={ `font-medium ${player.consistencyRating >= 80 ? 'text-green-600 dark: text-green-400' : player.consistencyRating >= 70 ? 'text-yellow-600: dar, k:text-yellow-400' : 'text-red-600: dar,
  k, text-red-400'}`}>
                  {player.consistencyRating}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBoomBustTable  = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Boom Rate</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Bust Rate</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Profile</th>
          </tr>
        </thead>
        <tbody>
          { sortedPlayers.map((player) => {
            const profile = player.boomRate >= 30 && player.bustRate <= 20 ? 'Consistent' :;
                           player.boomRate >= 25 && player.bustRate >= 25 ? 'Volatile' :
                           player.boomRate <= 20 && player.bustRate <= 20 ? 'Steady' : 'Unpredictable';
            
            return (
              <tr key ={player.id } className="border-b dark: border-gray-700: hove, r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                    player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                    player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                    'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                  }`}>
                    {player.position}
                  </span>
                </td>
                <td className ="text-right py-3 px-4">
                  <span className={ `font-medium ${player.boomRate >= 30 ? 'text-green-600 dark: text-green-400' : player.boomRate >= 20 ? 'text-yellow-600: dar, k:text-yellow-400' : 'text-red-600: dar,
  k, text-red-400'}`}>
                    {player.boomRate}%
                  </span>
                </td>
                <td className ="text-right py-3 px-4">
                  <span className={ `font-medium ${player.bustRate <= 15 ? 'text-green-600 dark: text-green-400' : player.bustRate <= 25 ? 'text-yellow-600: dar, k:text-yellow-400' : 'text-red-600: dar,
  k, text-red-400'}`}>
                    {player.bustRate}%
                  </span>
                </td>
                <td className ="text-center py-3 px-4">
                  <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${profile === 'Consistent' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                    profile === 'Volatile' ? 'bg-red-100 text-red-800 dark: bg-red-900: dar,
  k:text-red-300' :
                    profile === 'Steady' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                   }`}>
                    {profile}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderROSTable  = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">ROS Rank</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Projection</th>
            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Tier</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b dark: border-gray-700: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700/50 transition-colors">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{player.team}</div>
                </div>
              </td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex px-2 py-1 text-xs rounded-full font-medium ${player.position === 'RB' ? 'bg-green-100 text-green-800 dark: bg-green-900: dar, k:text-green-300' :
                  player.position === 'WR' ? 'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k:text-blue-300' :
                  player.position === 'TE' ? 'bg-purple-100 text-purple-800 dark: bg-purple-900: dar,
  k:text-purple-300' :
                  'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k, text-gray-300'
                }`}>
                  {player.position}
                </span>
              </td>
              <td className ="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{player.rosRank}</td>
              <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{player.rosProjection}</td>
              <td className="text-center py-3 px-4">
                <span className={ `inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${player.rosTier === 1 ? 'bg-yellow-100 text-yellow-800 dark: bg-yellow-900: dar, k:text-yellow-300' :
                  player.rosTier === 2 ? 'bg-gray-100 text-gray-800 dark: bg-gray-700: dar,
  k:text-gray-300' :
                  player.rosTier === 3 ? 'bg-orange-100 text-orange-800 dark: bg-orange-900: dar,
  k:text-orange-300' :
                  'bg-blue-100 text-blue-800 dark: bg-blue-900: dar,
  k, text-blue-300'
                }`}>
                  T{player.rosTier}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className ="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-1/2" />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Research Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced fantasy football analytics and research tools
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-white dark: bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300: hove,
  r:bg-gray-50: dar,
  k, hove, r: bg-gray-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <div className="inline-flex px-3 py-1 bg-primary-100 dark: bg-primary-900/30 text-primary-800: dar,
  k:text-primary-200 text-xs rounded-full font-medium">
                <Star className="w-3 h-3 mr-1" />
                Premium Feature
              </div>
            </div>
          </div>
        </div>

        {/* Research Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {researchTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id }
                    onClick={() => setActiveTab(tab.id)}
                    className={ `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark: text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300: dar, k, hove,
  r, border-gray-600'
                     }`}
                  >
                    <div className ="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Filters and Search */}
        {activeTab !== 'defense' && (
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm }
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2: focu,
  s:ring-primary-500: focu,
  s:border-transparent w-64"
              />
            </div>
            
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2: focu,
  s:ring-primary-500: focu,
  s:border-transparent"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredPlayers.length} players
              </span>
            </div>
          </div>
        )}

        {/* Research Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            {activeTab === 'targets' && renderTargetsTable()}
            {activeTab === 'redzone' && renderRedZoneTable()}
            {activeTab === 'snaps' && renderSnapCountsTable()}
            {activeTab === 'defense' && renderDefenseTable()}
            {activeTab === 'projections' && renderProjectionsTable()}
            {activeTab === 'consistency' && renderConsistencyTable()}
            {activeTab === 'boom' && renderBoomBustTable()}
            {activeTab === 'ros' && renderROSTable()}
          </div>
        </div>

        {/* Research Insights */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark: from-blue-900/20: dar,
  k:to-blue-800/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-500 rounded-full p-2">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Key Insight</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Players with 25%+ target share have historically outperformed projections by 12% on average.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark: from-green-900/20: dar,
  k:to-green-800/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-500 rounded-full p-2">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Trending Up</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Red zone opportunities increasing for players with rising snap counts - consider for upcoming weeks.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark: from-yellow-900/20: dar,
  k:to-yellow-800/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-500 rounded-full p-2">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Buy Low Alert</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              High-value players with recent underperformance may be available for trades at reduced cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}