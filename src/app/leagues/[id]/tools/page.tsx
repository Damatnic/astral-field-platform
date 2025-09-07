"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Zap, Brain, Calculator, TrendingUp, Target, Trophy,
  BarChart3, Users, Calendar, Star, Crown, Shield,
  RefreshCw, Info, ChevronRight
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";
import LineupOptimizer from "@/components/tools/LineupOptimizer";
import StartSitRecommendations from "@/components/tools/StartSitRecommendations";
import PlayoffCalculator from "@/components/tools/PlayoffCalculator";

interface ToolsPageProps {
  params: Promise<{ id: string }>;
}

interface FantasyTool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  premium: boolean;
  category: 'lineup' | 'analysis' | 'planning' | 'research';
  popularity: number;
  lastUpdated?: string;
}

const FANTASY_TOOLS: FantasyTool[] = [
  {
    id: 'lineup-optimizer',
    name: 'AI Lineup Optimizer',
    description: 'Optimize your lineup with weather data, matchups, and advanced analytics',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    premium: true,
    category: 'lineup',
    popularity: 95,
    lastUpdated: '5 minutes ago'
  },
  {
    id: 'start-sit',
    name: 'Start/Sit Recommendations',
    description: 'AI-powered start/sit decisions with detailed analysis and confidence ratings',
    icon: Target,
    color: 'from-green-500 to-blue-500',
    premium: true,
    category: 'lineup',
    popularity: 92
  },
  {
    id: 'playoff-calculator',
    name: 'Playoff Scenario Calculator',
    description: 'Calculate playoff odds and scenarios with Monte Carlo simulations',
    icon: Calculator,
    color: 'from-yellow-500 to-orange-500',
    premium: false,
    category: 'planning',
    popularity: 88
  },
  {
    id: 'sleeper-alerts',
    name: 'Sleeper & Breakout Alerts',
    description: 'Identify potential breakout players before they hit the mainstream',
    icon: Zap,
    color: 'from-blue-500 to-purple-500',
    premium: true,
    category: 'research',
    popularity: 84
  },
  {
    id: 'keeper-calculator',
    name: 'Keeper Value Calculator',
    description: 'Calculate optimal keeper values and dynasty rankings for future seasons',
    icon: Crown,
    color: 'from-amber-500 to-yellow-500',
    premium: true,
    category: 'planning',
    popularity: 76
  },
  {
    id: 'trade-analyzer',
    name: 'Advanced Trade Analyzer',
    description: 'Analyze trade proposals with win probability changes and long-term impact',
    icon: TrendingUp,
    color: 'from-indigo-500 to-blue-500',
    premium: true,
    category: 'analysis',
    popularity: 91
  }
];

export default function ToolsPage({ params }: ToolsPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [activeTool, setActiveTool] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
      setLoading(false);
    });
  }, [params]);

  const categories = [
    { id: 'lineup', label: 'Lineup Tools', icon: Target, description: 'Optimize your weekly lineups' },
    { id: 'analysis', label: 'Analysis Tools', icon: BarChart3, description: 'Deep dive into player & team data' },
    { id: 'planning', label: 'Planning Tools', icon: Calendar, description: 'Long-term strategy & scenarios' },
    { id: 'research', label: 'Research Tools', icon: Star, description: 'Discover hidden gems & trends' }
  ];

  const getToolsByCategory = (category: string) => {
    return FANTASY_TOOLS.filter(tool => tool.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  };

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
  };

  const renderToolCard = (tool: FantasyTool) => {
    const IconComponent = tool.icon;
    
    return (
      <div 
        key={tool.id}
        onClick={() => handleToolSelect(tool.id)}
        className={`p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group ${
          activeTool === tool.id ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${tool.color}`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex items-center space-x-2">
            {tool.premium && (
              <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-medium rounded-full">
                PRO
              </span>
            )}
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tool.popularity}%
              </span>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {tool.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {tool.description}
        </p>
        
        <div className="flex items-center justify-between">
          {tool.lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {tool.lastUpdated}
            </span>
          )}
          
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>
    );
  };

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'lineup-optimizer':
        return (
          <LineupOptimizer
            leagueId={leagueId}
            rosterSlots={['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST']}
            availablePlayers={[]}
          />
        );
      case 'start-sit':
        return (
          <StartSitRecommendations
            leagueId={leagueId}
            teamId="user-team"
            week={9}
            rosterPlayers={[]}
          />
        );
      case 'playoff-calculator':
        return (
          <PlayoffCalculator
            leagueId={leagueId}
            currentWeek={9}
            playoffSpots={6}
            teams={[]}
          />
        );
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Fantasy Tool
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Choose from our suite of AI-powered fantasy football tools to optimize your lineup, 
              analyze players, and plan your season strategy.
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-gray-800 mb-4"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-6 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
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
            <Zap className="h-8 w-8 text-primary-600 mr-3" />
            Fantasy Tools Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered tools to give you the competitive edge in fantasy football
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tools Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-4">Tools Usage This Week</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">2,847</div>
                  <div className="text-primary-100 text-sm">Lineups Optimized</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">1,923</div>
                  <div className="text-primary-100 text-sm">Scenarios Calculated</div>
                </div>
              </div>
            </div>

            {/* Categories */}
            {categories.map(category => {
              const CategoryIcon = category.icon;
              const tools = getToolsByCategory(category.id);
              
              return (
                <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <CategoryIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {tools.map(tool => {
                      const ToolIcon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolSelect(tool.id)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                            activeTool === tool.id
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <ToolIcon className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{tool.name}</div>
                            {tool.premium && (
                              <div className="text-xs text-amber-500">PRO</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{tool.popularity}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Tool Display */}
          <div className="lg:col-span-2">
            {renderActiveTool()}
          </div>
        </div>

        {/* Feature Highlights */}
        {!activeTool && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Featured Tools
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FANTASY_TOOLS.filter(tool => tool.popularity >= 90).map(renderToolCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}