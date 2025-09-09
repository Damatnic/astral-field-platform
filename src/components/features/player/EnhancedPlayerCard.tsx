import React, { useState, memo  } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown,
  Cloud, Sun,
  CloudRain, Snowflake,
  Wind, AlertTriangle,
  Heart, Activity,
  Target, Calendar,
  BarChart3, Info,
  Shield, Sword,
  Clock, User, ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button/Button';
import { Progress } from '@/components/ui/progress';
import type { Database } from '@/types/database';

type Player = Database['public']['Tables']['players']['Row'] & {
  projections?, any,
  stats?, any,
  news?, any,
  weatherForecast?, any,
  matchupAnalysis?, any,
  restOfSeasonOutlook?, any,
  trends?, any,
}
interface EnhancedPlayerCardProps {
  player, Player,
  leagueId?, string,
  showDetailedView?, boolean,
  onPlayerSelect?: (player: Player) => void;
  onAddToWatchlist?: (playerId: string) => void;
  onTradeTarget?: (playerId: string) => void;
  
}
interface NewsItem {
  id, string,
    title, string,
  summary, string,
    timestamp, string,
  impact: 'positive' | 'negative' | 'neutral',
    source, string,
}

interface WeatherCondition {
  temperature, number,
    condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind';
  windSpeed, number,
    precipitation, number,
  impact: 'positive' | 'negative' | 'neutral';
  
}
interface MatchupAnalysis {
  difficulty: 'easy' | 'medium' | 'hard',
    rank, number,
  pointsAllowed, number,
    opponentTeam, string,
  gameLocation: 'home' | 'away',
    primetime, boolean,
}

interface RestOfSeasonOutlook {
  difficulty, number,
    byeWeek, number,
  playoffSchedule: 'easy' | 'medium' | 'hard',
    injuryRisk: 'low' | 'medium' | 'high';
  upcomingMatchups: string[];
  
}
const EnhancedPlayerCard = memo(function EnhancedPlayerCard({ 
  player, leagueId, 
  showDetailedView = false, onPlayerSelect, onAddToWatchlist,
  onTradeTarget 
}: EnhancedPlayerCardProps) {
  const [expanded, setExpanded] = useState(showDetailedView);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'news' | 'outlook'>('overview');
  
  // Mock data - in real implementation, this would come from APIs/database
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'Player expected to return from injury this week',
      summary: 'Coach confirms player is healthy and ready to play',
      timestamp: '2 hours ago',
      impact: 'positive',
      source: 'ESPN'
     },
    {
      id: '2',
      title: 'Increased target share expected',
      summary: 'With teammate injured, more opportunities available',
      timestamp: '1 day ago',
      impact: 'positive',
      source: 'NFL.com'
    }
  ];
  
  const mockWeather: WeatherCondition = {
    temperature, 72,
    condition: 'sunny',
    windSpeed, 8,
    precipitation, 0,
    impact: 'positive'
  }
  const mockMatchup: MatchupAnalysis = {,
  difficulty: 'easy',
    rank, 28,
    pointsAllowed: 24.8,
    opponentTeam: 'BUF',
    gameLocation: 'home',
    primetime: false
  }
  const mockOutlook: RestOfSeasonOutlook = {,
  difficulty: 6.5,
    byeWeek: player.bye_week || 7,
    playoffSchedule: 'medium',
    injuryRisk: 'low',
    upcomingMatchups: ['vs BUF', '@MIA', 'vs NYJ', '@NE']
  }
  const getInjuryStatusIcon = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'OUT':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
      break;
    case 'DOUBTFUL': 
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'QUESTIONABLE':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      break;
    case 'PROBABLE': 
        return <Heart className="h-4 w-4 text-green-400" />;
      default: 
        return <Heart className="h-4 w-4 text-green-500" />;
    }
  }
  const getInjuryStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'OUT':
      return 'text-red-400 bg-red-900/30';
      break;
    case 'DOUBTFUL': 
        return 'text-red-300 bg-red-900/20';
      case 'QUESTIONABLE':
      return 'text-yellow-400 bg-yellow-900/30';
      break;
    case 'PROBABLE': 
        return 'text-green-300 bg-green-900/20';
      default: 
        return 'text-green-400 bg-green-900/30';
    }
  }
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
      return <Sun className="h-4 w-4 text-yellow-500" />;
      break;
    case 'cloudy': 
        return <Cloud className="h-4 w-4 text-gray-400" />;
      case 'rain':
      return <CloudRain className="h-4 w-4 text-blue-400" />;
      break;
    case 'snow': 
        return <Snowflake className="h-4 w-4 text-blue-300" />;
      case 'wind': 
        return <Wind className="h-4 w-4 text-gray-300" />;
      default: 
        return <Cloud className="h-4 w-4 text-gray-400" />;
    }
  }
  const getPositionColor = (position: string | null) => {
    switch (position) {
      case 'QB':
      return 'bg-red-600';
      break;
    case 'RB': 
        return 'bg-green-600';
      case 'WR':
      return 'bg-blue-600';
      break;
    case 'TE': 
        return 'bg-orange-600';
      case 'K':
      return 'bg-purple-600';
      break;
    case 'DEF': 
        return 'bg-gray-600';
      default: 
        return 'bg-gray-500';
    }
  }
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  }
  const formatStatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toFixed(1);
    return value;
  }
  return (
    <motion.div
      initial={{ opacity, 0, y: 20 }}
      animate={{ opacity, 1, y: 0 }}
      className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Main Card Content */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onPlayerSelect? .(player)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Position Badge */}
            <div className={`w-10 h-10 rounded-full ${getPositionColor(player.position)} flex items-center justify-center text-white font-bold text-sm`}>
              {player.position}
            </div>
            
            {/* Player Info */}
            <div>
              <h3 className="font-semibold text-white text-lg">
                {player.first_name} {player.last_name}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>{player.team}</span>
                {player.jersey_number && (
                  <>
                    <span>•</span>
                    <span>#{player.jersey_number}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {player.injury_status && (
              <Badge className={`${getInjuryStatusColor(player.injury_status)} border-0`}>
                {getInjuryStatusIcon(player.injury_status)}
                <span className="ml-1">{player.injury_status}</span>
              </Badge>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-400">Points</p>
            <p className="text-lg font-semibold text-white">
              {formatStatValue((player as any).fantasy_points || 0)}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-400">Proj</p>
            <p className="text-lg font-semibold text-white">
              {formatStatValue((player as any).projected_points || 0)}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded p-2">
            <p className="text-xs text-gray-400">Rank</p>
            <p className="text-lg font-semibold text-white">
              {(player as any).position_rank || '-'}
            </p>
          </div>
        </div>
        
        {/* Matchup Preview */}
        <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              {mockMatchup.gameLocation === 'home' ? 'vs' : '@'} {mockMatchup.opponentTeam}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {getWeatherIcon(mockWeather.condition)}
            <span className="text-sm text-gray-400">{mockWeather.temperature}°F</span>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-gray-700"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {(['overview', 'stats', 'news', 'outlook'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Season Stats */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Season Performance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-700/30 rounded p-2">
                        <p className="text-xs text-gray-400">Games Played</p>
                        <p className="text-white font-medium">
                          {(player as any).games_played || 0}
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2">
                        <p className="text-xs text-gray-400">Avg Points</p>
                        <p className="text-white font-medium">
                          {formatStatValue((player as any).avg_points || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Matchup Analysis */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Matchup Analysis</h4>
                    <div className="bg-gray-700/30 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Opponent Rank vs {player.position}</span>
                        <Badge variant={mockMatchup.difficulty === 'easy' ? 'default' : mockMatchup.difficulty === 'hard' ? 'destructive' : 'secondary'}>
                          {mockMatchup.rank}/32
                        </Badge>
                      </div>
                      <Progress value={(32 - mockMatchup.rank) / 32 * 100} className="h-2" />
                      <p className="text-xs text-gray-400 mt-1">
                        Allows {mockMatchup.pointsAllowed} pts/game to {player.position}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'stats' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Detailed stats coming soon...</p>
                </div>
              )}
              
              {activeTab === 'news' && (
                <div className="space-y-3">
                  {mockNews.map((item) => (
                    <div key={item.id} className="bg-gray-700/30 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-white mb-1">{item.title}</h5>
                          <p className="text-xs text-gray-400 mb-2">{item.summary}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                        {item.impact === 'positive' && <TrendingUp className="h-4 w-4 text-green-500 ml-2" />}
                        {item.impact === 'negative' && <TrendingDown className="h-4 w-4 text-red-500 ml-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'outlook' && (
                <div className="space-y-3">
                  <div className="bg-gray-700/30 rounded p-3">
                    <h5 className="text-sm font-medium text-white mb-2">Rest of Season</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Schedule Difficulty</span>
                        <Progress value={mockOutlook.difficulty * 10} className="w-24 h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Playoff Schedule</span>
                        <Badge variant={mockOutlook.playoffSchedule === 'easy' ? 'default' : mockOutlook.playoffSchedule === 'hard' ? 'destructive' : 'secondary'}>
                          {mockOutlook.playoffSchedule}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Injury Risk</span>
                        <Badge variant={mockOutlook.injuryRisk === 'low' ? 'default' : mockOutlook.injuryRisk === 'high' ? 'destructive' : 'secondary'}>
                          {mockOutlook.injuryRisk}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded p-3">
                    <h5 className="text-sm font-medium text-white mb-2">Upcoming Matchups</h5>
                    <div className="space-y-1">
                      {mockOutlook.upcomingMatchups.map((matchup, index) => (
                        <div key={index} className="text-sm text-gray-400">
                          Week {(player as any).current_week + index + 1}: {matchup}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 p-4 border-t border-gray-700">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWatchlist?.(player.id);
                }}
                className="flex-1"
              >
                <Heart className="h-4 w-4 mr-1" />
                Watchlist
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onTradeTarget?.(player.id);
                }}
                className="flex-1"
              >
                <Target className="h-4 w-4 mr-1" />
                Trade Target
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default EnhancedPlayerCard;