'use client';

import React, { useState, useEffect } from 'react';
import {
  Award, Trophy, Star, Target, TrendingUp, Crown, 
  Medal, Zap, Fire, Shield, Gem, ChevronRight,
  Clock, Users, BarChart3, Calendar, Gift,
  Info, CheckCircle, Circle, Lock, Sparkles
} from 'lucide-react';
import AchievementSystem, { Achievement } from '@/services/gamification/achievementSystem';

interface AchievementStats {
  userId: string;
  overview: {
    totalUnlocked: number;
    totalPossible: number;
    completionRate: number;
    totalXP: number;
    totalCoins: number;
    currentLevel: number;
    xpToNextLevel: number;
  };
  byCategory: Record<string, {
    unlocked: number;
    total: number;
    rate: number;
  }>;
  byDifficulty: Record<string, {
    unlocked: number;
    total: number;
    rate: number;
  }>;
  rareAchievements: Achievement[];
  recentUnlocks: any[];
  streaks: {
    current: number;
    longest: number;
    type: string;
  }[];
  rankings: {
    global: number;
    league: number;
    percentile: number;
  };
}

interface AchievementInsight {
  userId: string;
  type: 'streak_at_risk' | 'recommended_action' | 'seasonal_opportunity' | 'rare_chance' | 'close_to_unlock';
  achievement: Achievement;
  message: string;
  progress: number;
  estimatedTimeToCompletion?: string;
  actionItems: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  potentialRewards: Achievement['rewards'];
}

interface AchievementDashboardProps {
  userId: string;
  leagueId?: string;
  className?: string;
}

export default function AchievementDashboard({ 
  userId, 
  leagueId, 
  className 
}: AchievementDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'insights' | 'leaderboard'>('overview');
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [insights, setInsights] = useState<AchievementInsight[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'in_progress'>('all');
  
  const achievementSystem = new AchievementSystem();

  useEffect(() => {
    loadAchievementData();
  }, [userId, leagueId]);

  useEffect(() => {
    filterAchievements();
  }, [achievements, categoryFilter, difficultyFilter, statusFilter]);

  const loadAchievementData = async () => {
    try {
      setLoading(true);
      
      // In a real app, these would be API calls
      const [statsData, insightsData] = await Promise.all([
        achievementSystem.getUserAchievementStats(userId),
        achievementSystem.getAchievementInsights(userId)
      ]);

      setStats(statsData);
      setInsights(insightsData);
      
      // Get all achievements (would come from API)
      const allAchievements = Array.from((achievementSystem as any).achievements.values());
      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAchievements = () => {
    if (!achievements) return;
    
    let filtered = [...achievements];
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }
    
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(a => a.difficulty === difficultyFilter);
    }
    
    if (statusFilter !== 'all') {
      // This would be based on user's actual achievement data
      // For demo purposes, showing all as available to unlock
    }
    
    setFilteredAchievements(filtered);
  };

  const getDifficultyColor = (difficulty: Achievement['difficulty']) => {
    const colors = {
      common: 'bg-gray-100 text-gray-700 border-gray-200',
      uncommon: 'bg-green-100 text-green-700 border-green-200',
      rare: 'bg-blue-100 text-blue-700 border-blue-200',
      epic: 'bg-purple-100 text-purple-700 border-purple-200',
      legendary: 'bg-orange-100 text-orange-700 border-orange-200',
      mythic: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[difficulty];
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    const icons = {
      draft: Trophy,
      season_management: Target,
      performance: TrendingUp,
      community: Users,
      milestone: Star,
      special: Crown,
      skill: Zap,
      streak: Fire,
      rare: Gem
    };
    return icons[category] || Award;
  };

  const getUrgencyColor = (urgency: AchievementInsight['urgency']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[urgency];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              Achievement Center
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your fantasy football accomplishments and unlock rewards
            </p>
          </div>
          
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-500">
                Level {stats.overview.currentLevel}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stats.overview.totalXP.toLocaleString()} XP
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'insights', label: 'Insights', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && stats && (
          <OverviewTab stats={stats} />
        )}

        {activeTab === 'achievements' && (
          <AchievementsTab
            achievements={filteredAchievements}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            getDifficultyColor={getDifficultyColor}
            getCategoryIcon={getCategoryIcon}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsTab
            insights={insights}
            getUrgencyColor={getUrgencyColor}
            getCategoryIcon={getCategoryIcon}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ stats }: { stats: AchievementStats }) {
  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Level
              </p>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.overview.currentLevel}
              </p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-600 dark:text-yellow-400">Progress</span>
              <span className="text-yellow-700 dark:text-yellow-300">
                {stats.overview.xpToNextLevel} XP to next level
              </span>
            </div>
            <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-900/30 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((1000 - stats.overview.xpToNextLevel) / 1000) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Achievements
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {stats.overview.totalUnlocked}
              </p>
            </div>
            <Award className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400">Completion</span>
              <span className="text-blue-700 dark:text-blue-300">
                {stats.overview.completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900/30 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.overview.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Total XP
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {stats.overview.totalXP.toLocaleString()}
              </p>
            </div>
            <Zap className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Coins
              </p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {stats.overview.totalCoins.toLocaleString()}
              </p>
            </div>
            <Gift className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Progress by Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.byCategory).map(([category, data]) => (
            <div key={category} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {category.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data.unlocked}/{data.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.rate}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {data.rate.toFixed(1)}% complete
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Achievements
        </h3>
        {stats.recentUnlocks.length > 0 ? (
          <div className="space-y-3">
            {stats.recentUnlocks.slice(0, 5).map((unlock, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Achievement Unlocked
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recently earned - keep up the great work!
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent achievements</p>
            <p className="text-sm">Keep playing to unlock your first achievement!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Achievements Tab Component
function AchievementsTab({
  achievements,
  categoryFilter,
  setCategoryFilter,
  difficultyFilter,
  setDifficultyFilter,
  statusFilter,
  setStatusFilter,
  getDifficultyColor,
  getCategoryIcon
}: {
  achievements: Achievement[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  getDifficultyColor: (difficulty: Achievement['difficulty']) => string;
  getCategoryIcon: (category: Achievement['category']) => any;
}) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="draft">Draft</option>
              <option value="season_management">Season Management</option>
              <option value="performance">Performance</option>
              <option value="community">Community</option>
              <option value="milestone">Milestone</option>
              <option value="special">Special</option>
              <option value="rare">Rare</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All</option>
              <option value="unlocked">Unlocked</option>
              <option value="in_progress">In Progress</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => {
          const IconComponent = getCategoryIcon(achievement.category);
          const isUnlocked = Math.random() > 0.7; // Demo: random unlock status
          
          return (
            <div
              key={achievement.id}
              className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                isUnlocked
                  ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'
                  : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                      isUnlocked ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                  >
                    {achievement.icon || <IconComponent className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      {achievement.name}
                      {isUnlocked && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
                      {!isUnlocked && <Lock className="h-4 w-4 ml-2 text-gray-400" />}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(achievement.difficulty)}`}>
                      {achievement.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {achievement.description}
              </p>

              {/* Rewards */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rewards
                </h4>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {achievement.rewards.xp} XP
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Gift className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {achievement.rewards.coins} coins
                    </span>
                  </div>
                </div>
                
                {achievement.rewards.titles && achievement.rewards.titles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {achievement.rewards.titles.map((title) => (
                      <span
                        key={title}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress bar for demo */}
              {!isUnlocked && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-gray-700 dark:text-gray-300">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: '67%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Insights Tab Component
function InsightsTab({
  insights,
  getUrgencyColor,
  getCategoryIcon
}: {
  insights: AchievementInsight[];
  getUrgencyColor: (urgency: AchievementInsight['urgency']) => string;
  getCategoryIcon: (category: Achievement['category']) => any;
}) {
  return (
    <div className="space-y-6">
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights.map((insight, index) => {
            const IconComponent = getCategoryIcon(insight.achievement.category);
            
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {insight.achievement.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(insight.urgency)}`}>
                        {insight.urgency}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {insight.message}
                    </p>
                    
                    {insight.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="text-gray-700 dark:text-gray-300">{insight.progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${insight.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {insight.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recommended Actions:
                        </h4>
                        <ul className="space-y-1">
                          {insight.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <ChevronRight className="h-3 w-3 mr-1 mt-0.5 text-gray-400" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No insights available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Keep playing to generate personalized achievement insights!
          </p>
        </div>
      )}
    </div>
  );
}

// Leaderboard Tab Component
function LeaderboardTab() {
  const leaderboardData = [
    { rank: 1, username: 'FantasyKing', level: 47, xp: 47250, achievements: 89 },
    { rank: 2, username: 'GridironGuru', level: 42, xp: 42180, achievements: 76 },
    { rank: 3, username: 'ChampionChaser', level: 39, xp: 39450, achievements: 71 },
    { rank: 4, username: 'TrophyHunter', level: 36, xp: 36890, achievements: 64 },
    { rank: 5, username: 'AchievementAce', level: 34, xp: 34560, achievements: 58 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Achievement Hunters
        </h3>
        
        <div className="space-y-4">
          {leaderboardData.map((player) => (
            <div
              key={player.rank}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  player.rank === 1 ? 'bg-yellow-500' :
                  player.rank === 2 ? 'bg-gray-400' :
                  player.rank === 3 ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {player.rank}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {player.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Level {player.level} • {player.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.achievements}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}