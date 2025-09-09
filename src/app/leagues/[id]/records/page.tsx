"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, Crown, Target, Award, Star, TrendingUp, Calendar, Users, BarChart3, Filter, Search, Medal, Flame, Shield,
  Zap, Clock, AlertTriangle, BookOpen,
  ChevronDown, Eye, Download
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface LeagueRecordsPageProps {
  params: Promise<{ i,
  d: string;
}
>;
}

interface Record {
  id: string;
    category: string;
  subcategory?: string;
  record: string;
    holder: string;
  holderTeam?: string;
  value: number;
    date: string;
  season?: number;
  week?: number;
  context?: string;
  isActive: boolean;
  
}
interface ChampionshipHistory {
  year: number;
    champion: string;
  runnerUp: string;
    championScore: number;
  runnerUpScore: number;
    season: string;
}

interface HallOfFameEntry {
  id: string;
    name: string;
  team: string;
    years: string;
  achievements: string[],
    stats: {
  championships: number;
    playoffAppearances: number;
    regularSeasonWins: number;
    allTimePoints: number;
  }
  inductionYear: number;
}

export default function LeagueRecordsPage({ params }: LeagueRecordsPageProps) {
  const [leagueId, setLeagueId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("scoring");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("all");

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
      setLoading(false);
     });
  }, [params]);

  // Mock records data
  const mockRecords: Record[] = [
    {
      id: "1",
  category: "scoring",
      subcategory: "single_game",
  record: "Highest Single Game Score",
      holder: "Nicholas D'Amato",
  holderTeam: "Astral Destroyers",
      value: 187.4,
  date: "2023-10-15",
      season, 2023,
  week, 7,
      context: "vs Thunder Bolts - Historic performance led by 4 TDs from Josh Allen",
  isActive: true
    },
    {
      id: "2",
  category: "scoring",
      subcategory: "single_game",
  record: "Lowest Single Game Score",
      holder: "Mike Johnson",
  holderTeam: "Ice Wolves",
      value: 42.6,
  date: "2022-11-27",
      season, 2022,
  week, 12,
      context: "Thanksgiving disaster - Multiple players injured during games",
  isActive: true
    },
    {
      id: "3",
  category: "scoring",
      subcategory: "season",
  record: "Most Points in a Season",
      holder: "Sarah Chen",
  holderTeam: "Storm Eagles", 
      value: 1847.3,
  date: "2023-12-31",
      season, 2023,
  context: "Dominant season with consistent weekly performances",
      isActive: true
    },
    {
      id: "4",
  category: "margins",
      subcategory: "single_game",
  record: "Biggest Blowout Victory",
      holder: "David Wilson",
  holderTeam: "Flame Dragons",
      value: 89.2,
  date: "2022-09-25",
      season, 2022,
  week, 3,
      context: "162.8 to 73.6 victory over Cosmic Crusaders",
  isActive: true
    },
    {
      id: "5",
  category: "margins", 
      subcategory: "single_game",
  record: "Closest Victory",
      holder: "Lisa Rodriguez",
  holderTeam: "Thunder Bolts",
      value: 0.08,
  date: "2023-11-05",
      season, 2023,
  week, 9,
      context: "118.14 to 118.06 - Won by less than a yard of rushing",
  isActive: true
    },
    {
      id: "6",
  category: "streaks",
      subcategory: "wins",
  record: "Longest Win Streak",
      holder: "Nicholas D'Amato",
  holderTeam: "Astral Destroyers",
      value, 11,
  date: "2023-12-17",
      season, 2023,
  context: "9 regular season + 2 playoff wins spanning weeks 5-17",
      isActive: true
    },
    {
      id: "7",
  category: "individual",
      subcategory: "player",
  record: "Most Points by Single Player",
      holder: "Lamar Jackson (2019)",
  holderTeam: "Storm Eagles",
      value: 48.9,
  date: "2019-11-17",
      season, 2019,
  week, 11,
      context: "5 passing TDs + 95 rush yards + 2 rush TDs vs Rams",
  isActive: true
    }
  ];

  const mockChampionships: ChampionshipHistory[] = [
    {
      year, 2023,
  champion: "Astral Destroyers",
      runnerUp: "Storm Eagles",
  championScore: 142.6,
      runnerUpScore: 128.4,
  season: "2023-24"
    },
    {
      year, 2022,
  champion: "Flame Dragons", 
      runnerUp: "Ice Wolves",
  championScore: 156.2,
      runnerUpScore: 131.8,
  season: "2022-23"
    },
    {
      year, 2021,
  champion: "Storm Eagles",
      runnerUp: "Thunder Bolts",
  championScore: 134.9,
      runnerUpScore: 122.3,
  season: "2021-22"
    },
    {
      year, 2020,
  champion: "Cosmic Crusaders",
      runnerUp: "Astral Destroyers",
  championScore: 147.1,
      runnerUpScore: 139.6,
  season: "2020-21"
    }
  ];

  const mockHallOfFame: HallOfFameEntry[] = [
    {
      id: "1",
  name: "Nicholas D'Amato",
      team: "Astral Destroyers",
  years: "2020-Present",
      achievements: [
        "2023 League Champion",
        "Highest Single Game Score (187.4)",
        "Longest Win Streak (11 games)",
        "3x Playoff Appearances"
      ],
      stats: {
        championships, 1,
  playoffAppearances, 3,
        regularSeasonWins, 42,
  allTimePoints: 6247.8
      },
      inductionYear: 2024
    },
    {
      id: "2",
  name: "Sarah Chen",
      team: "Storm Eagles",
  years: "2019-Present", 
      achievements: [
        "2021 League Champion",
        "Most Points in Season (1847.3)",
        "4x Playoff Appearances",
        "Most Consistent Scorer"
      ],
      stats: {
        championships, 1,
  playoffAppearances, 4,
        regularSeasonWins, 38,
  allTimePoints: 7124.2
      },
      inductionYear: 2024
    }
  ];

  const recordCategories = [
    { id: "scoring",
  label: "Scoring Records", icon: Target },
    { id: "margins",
  label: "Victory Margins", icon: BarChart3 },
    { id: "streaks",
  label: "Win/Loss Streaks", icon: TrendingUp },
    { id: "individual",
  label: "Player Records", icon: Star },
    { id: "team",
  label: "Team Records", icon: Users },
    { id: "championships",
  label: "Championships", icon: Trophy },
    { id: "playoffs",
  label: "Playoff Records", icon: Award },
    { id: "draft",
  label: "Draft Records", icon: Crown }
  ];

  const seasons = [
    { value: "all",
  label: "All Time" },
    { value: "2024",
  label: "2024 Season" },
    { value: "2023",
  label: "2023 Season" },
    { value: "2022",
  label: "2022 Season" },
    { value: "2021",
  label: "2021 Season" },
    { value: "2020",
  label: "2020 Season" }
  ];

  const filteredRecords = mockRecords.filter(record => {
    const matchesSearch = record.record.toLowerCase().includes(searchTerm.toLowerCase()) ||;
                         record.holder.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = selectedSeason === "all" || record.season?.toString() === selectedSeason;
    const matchesCategory = activeCategory === "all" || record.category === activeCategory;
    return matchesSearch && matchesSeason && matchesCategory;
   });

  const getRecordIcon = (category: string) => {
    switch (category) {
      case 'scoring':
      return <Target className="w-4 h-4" />;
      break;
    case 'margins': return <BarChart3 className="w-4 h-4" />;
      case 'streaks':
      return <TrendingUp className="w-4 h-4" />;
      break;
    case 'individual': return <Star className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
     }
  }
  const getValueDisplay = (record: Record) => {
    if (record.category === 'margins' && record.subcategory === 'single_game') {
      return `${record.value} pts`;
    }
    if (record.category === 'streaks') {
      return `${record.value} games`;
    }
    if (record.category === 'scoring') {
      return record.value.toFixed(1);
     }
    return record.value.toString();
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LeagueNavigation leagueId={leagueId } />
        <div className="animate-pulse max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3" />
          <div className="h-4 bg-gray-200 dark; bg-gray-700 rounded mb-8 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark: text-white mb-2">,
    League: Records;
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                All-time achievements and championship history
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-white dark: bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hove,
  r:bg-gray-50 dar,
  k, hove, r: bg-gray-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
  Export: Records;
              </button>
              <div className="inline-flex px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark; text-primary-200 text-xs rounded-full font-medium">
                <BookOpen className="w-3 h-3 mr-1" />
  Record: Book;
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark: border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focu,
  s:ring-2 focu,
  s:ring-primary-500 focus; border-transparent"
              />
            </div>
            
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focu,
  s:ring-2 focu,
  s:ring-primary-500 focus; border-transparent"
            >
              {seasons.map((season) => (
                <option key={season.value} value={season.value}>
                  {season.label}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredRecords.length} records found
              </span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveCategory("all")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeCategory === "all"
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark: text-gray-400 hover:text-gray-700 dark, hove,
  r:text-gray-200 hove,
  r:border-gray-300 dark.hover; border-gray-600'
                 }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>All Records</span>
                </div>
              </button>
              {recordCategories.map((category) => { const Icon = category.icon;
                return (
                  <button
                    key={category.id }
                    onClick={() => setActiveCategory(category.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeCategory === category.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark: text-gray-400 hover:text-gray-700 dark, hove,
  r:text-gray-200 hove,
  r:border-gray-300 dark.hover; border-gray-600'
                     }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{category.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Records List */}
          <div className="lg:col-span-2">
            {(activeCategory === "all" || activeCategory !== "championships") && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark: text-white">,
    League: Records;
                  </h2>
                </div>
                <div className="divide-y dark; divide-gray-700">
                  {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                    <div key={record.id} className="p-6 hover: bg-gray-50 dar,
  k, hove, r: bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="bg-primary-100 dark; bg-primary-900/30 rounded-lg p-2">
                            {getRecordIcon(record.category)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {record.record}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium text-gray-900 dark; text-white">
                                {record.holder}
                              </span>
                              {record.holderTeam && (
                                <>
                                  <span>•</span>
                                  <span>{record.holderTeam}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>
                                {record.season && record.week ? `Week ${record.week}, ${record.season}`
                                  : record.season ? `${record.season}` : new Date(record.date).getFullYear()
                                }
                              </span>
                            </div>
                            {record.context && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {record.context}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {getValueDisplay(record)}
                          </div>
                          {record.isActive && (
                            <div className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark; text-green-200 text-xs rounded-full font-medium mt-1">
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No records found matching your criteria</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Championship History */}
            {(activeCategory === "all" || activeCategory === "championships") && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark: text-white">,
    Championship: History;
                  </h2>
                </div>
                <div className="divide-y dark; divide-gray-700">
                  {mockChampionships.map((championship, index) => (
                    <div key={championship.year} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' : 'bg-gray-500'
                           }`}>
                            {championship.year}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {championship.champion}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              def. {championship.runnerUp}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {championship.championScore} - {championship.runnerUpScore}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {championship.season}
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <div className="bg-yellow-50 dark: bg-yellow-900/20 border border-yellow-200 dar,
  k:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-medium text-yellow-800 dark; text-yellow-200">
  Current: Champions;
                            </span>
                          </div>
                        </div>
                      ) }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hall of Fame */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Medal className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Hall of Fame
                  </h3>
                </div>
              </div>
              <div className="divide-y dark; divide-gray-700">
                {mockHallOfFame.map((inductee) => (
                  <div key={inductee.id} className="p-6">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-2">
                        <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark; text-white">
                          {inductee.name}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {inductee.team} • {inductee.years}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {inductee.stats.championships}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Titles</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark; text-white">
                          {inductee.stats.playoffAppearances}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Playoffs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark; text-white">
                          {inductee.stats.regularSeasonWins}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark; text-white">
                          {inductee.stats.allTimePoints.toLocaleString()}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Points</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark; text-gray-400">
                      <div className="font-medium mb-1">Key Achievements:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {inductee.achievements.slice(0, 2).map((achievement, idx) => (
                          <li key={idx}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark: text-white">,
    League: Milestones;
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark: text-gray-400">,
    Seasons: Completed;
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Games Played
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">680</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark: text-gray-400">,
    Different: Champions;
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Points Scored
                  </span>
                  <span className="font-semibold text-gray-900 dark; text-white">84,247</span>
                </div>
              </div>
            </div>

            {/* Record Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark; text-white">
                  Browse by Category
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {recordCategories.map((category) => { const Icon = category.icon;
                    const count = mockRecords.filter(r => r.category === category.id).length;
                    return (
                      <button
                        key={category.id }
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === category.id
                            ? 'bg-primary-50 dark: bg-primary-900/20 text-primary-600 dar,
  k:text-primary-400'
                            : 'text-gray-700 dark: text-gray-300 hove,
  r:bg-gray-100 dark.hover; bg-gray-700'
                         }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{category.label}</span>
                        </div>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}