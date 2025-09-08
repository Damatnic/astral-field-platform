import { Player, Team, League, User } from '@/types/fantasy';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'draft' | 'season_management' | 'performance' | 'community' | 'milestone' | 'special' | 'skill' | 'streak' | 'rare';
  type: 'milestone' | 'streak' | 'seasonal' | 'career' | 'rare_event' | 'progressive';
  difficulty: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
  color: string;
  requirements: {
    conditions: AchievementCondition[];
    timeframe?: 'game' | 'week' | 'month' | 'season' | 'career';
    league?: 'any' | 'public' | 'private' | 'specific';
  };
  rewards: {
    xp: number;
    coins: number;
    badges?: string[];
    titles?: string[];
    unlocks?: string[];
    specialRewards?: SpecialReward[];
  };
  progression?: {
    current: number;
    required: number;
    tiers?: AchievementTier[];
  };
  rarity: {
    earnedBy: number; // Number of users who have earned this
    totalUsers: number;
    percentage: number;
  };
  metadata: {
    createdAt: Date;
    seasonIntroduced?: string;
    isHidden: boolean;
    isRetired: boolean;
    tags: string[];
  };
}

interface AchievementCondition {
  type: 'ranking' | 'streak' | 'comparison' | 'event' | 'combo' | 'time_based' | 'social';
  metric: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in_top' | 'consecutive' | 'within_timeframe';
  value: number | string | [number, number];
  context?: {
    position?: string;
    league?: string;
    timeframe?: string;
    opponents?: string[];
  };
}

interface AchievementTier {
  tier: number;
  name: string;
  description: string;
  requirement: number;
  rewards: Achievement['rewards'];
  icon?: string;
  color?: string;
}

interface SpecialReward {
  type: 'exclusive_content' | 'early_access' | 'premium_feature' | 'physical_reward' | 'recognition';
  name: string;
  description: string;
  value?: number;
  duration?: number; // For temporary rewards
  metadata?: Record<string, unknown>;
}

interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  tier?: number;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
  metadata?: {
    leagueId?: string;
    seasonId?: string;
    contextData?: Record<string, unknown>;
  };
  isNew: boolean; // For showing new achievement notifications
}

interface AchievementProgress {
  userId: string;
  achievementId: string;
  current: number;
  required: number;
  percentage: number;
  lastUpdated: Date;
  milestones: {
    value: number;
    unlockedAt: Date;
    tier?: number;
  }[];
  projectedCompletion?: Date;
}

interface SeasonalChallenge {
  id: string;
  name: string;
  description: string;
  season: string;
  startDate: Date;
  endDate: Date;
  category: 'weekly' | 'monthly' | 'seasonal' | 'special_event';
  requirements: AchievementCondition[];
  rewards: Achievement['rewards'];
  leaderboard?: {
    metric: string;
    top: number;
    rewards: Record<string, Achievement['rewards']>; // position -> rewards
  };
  participants: {
    userId: string;
    progress: number;
    ranking?: number;
    completed: boolean;
  }[];
  isActive: boolean;
  metadata: {
    maxParticipants?: number;
    featured: boolean;
    difficulty: Achievement['difficulty'];
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
  recentUnlocks: UserAchievement[];
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

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement[]> = new Map();
  private userProgress: Map<string, AchievementProgress[]> = new Map();
  private seasonalChallenges: Map<string, SeasonalChallenge> = new Map();

  constructor() {
    this.initializeAchievements();
    this.initializeSeasonalChallenges();
  }

  async checkAndUpdateAchievements(config: {
    userId: string;
    context: {
      action: 'draft_pick' | 'trade' | 'waiver_claim' | 'lineup_set' | 'game_result' | 'season_end' | 'league_join';
      data: Record<string, unknown>;
      leagueId?: string;
      seasonId?: string;
    };
  }): Promise<{
    newAchievements: UserAchievement[];
    updatedProgress: AchievementProgress[];
    insights: AchievementInsight[];
  }> {
    const newAchievements: UserAchievement[] = [];
    const updatedProgress: AchievementProgress[] = [];
    const insights: AchievementInsight[] = [];

    // Get user's current achievements and progress
    const userAchievements = this.userAchievements.get(config.userId) || [];
    const userProgress = this.userProgress.get(config.userId) || [];

    // Check each achievement for potential unlocks or progress updates
    for (const achievement of this.achievements.values()) {
      // Skip if already unlocked (unless it's progressive)
      const existingAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
      if (existingAchievement && achievement.type !== 'progressive') {
        continue;
      }

      // Check if user meets requirements
      const meetsRequirements = await this.evaluateAchievementRequirements(
        achievement,
        config.userId,
        config.context
      );

      if (meetsRequirements.unlocked) {
        // Create new achievement unlock
        const userAchievement: UserAchievement = {
          userId: config.userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
          tier: meetsRequirements.tier,
          metadata: {
            leagueId: config.context.leagueId,
            seasonId: config.context.seasonId,
            contextData: config.context.data
          },
          isNew: true
        };

        newAchievements.push(userAchievement);

        // Award rewards
        await this.awardRewards(config.userId, achievement.rewards, meetsRequirements.tier);

        // Update rarity statistics
        await this.updateAchievementRarity(achievement.id);

      } else if (meetsRequirements.progress > 0) {
        // Update progress
        const existingProgress = userProgress.find(up => up.achievementId === achievement.id);
        const progressData: AchievementProgress = {
          userId: config.userId,
          achievementId: achievement.id,
          current: meetsRequirements.progress,
          required: meetsRequirements.required,
          percentage: (meetsRequirements.progress / meetsRequirements.required) * 100,
          lastUpdated: new Date(),
          milestones: existingProgress?.milestones || [],
          projectedCompletion: this.calculateProjectedCompletion(
            meetsRequirements.progress,
            meetsRequirements.required,
            existingProgress
          )
        };

        updatedProgress.push(progressData);

        // Generate insights if close to completion
        if (progressData.percentage >= 75) {
          insights.push(await this.generateAchievementInsight(achievement, progressData));
        }
      }
    }

    // Update user data
    if (newAchievements.length > 0) {
      this.userAchievements.set(config.userId, [
        ...userAchievements,
        ...newAchievements
      ]);
    }

    if (updatedProgress.length > 0) {
      const updatedUserProgress = userProgress.map(up => {
        const update = updatedProgress.find(uup => uup.achievementId === up.achievementId);
        return update || up;
      });

      // Add new progress entries
      for (const progress of updatedProgress) {
        if (!updatedUserProgress.find(up => up.achievementId === progress.achievementId)) {
          updatedUserProgress.push(progress);
        }
      }

      this.userProgress.set(config.userId, updatedUserProgress);
    }

    // Check seasonal challenges
    await this.updateSeasonalChallenges(config.userId, config.context);

    return { newAchievements, updatedProgress, insights };
  }

  async getUserAchievementStats(userId: string): Promise<AchievementStats> {
    const userAchievements = this.userAchievements.get(userId) || [];
    const userProgress = this.userProgress.get(userId) || [];

    // Calculate overview stats
    const totalUnlocked = userAchievements.length;
    const totalPossible = this.achievements.size;
    const completionRate = totalPossible > 0 ? (totalUnlocked / totalPossible) * 100 : 0;

    const totalXP = userAchievements.reduce((sum, ua) => {
      const achievement = this.achievements.get(ua.achievementId);
      return sum + (achievement?.rewards.xp || 0);
    }, 0);

    const totalCoins = userAchievements.reduce((sum, ua) => {
      const achievement = this.achievements.get(ua.achievementId);
      return sum + (achievement?.rewards.coins || 0);
    }, 0);

    const currentLevel = Math.floor(totalXP / 1000) + 1;
    const xpToNextLevel = 1000 - (totalXP % 1000);

    // Calculate category stats
    const byCategory: Record<string, {unlocked: number, total: number, rate: number}> = {};
    const categories = ['draft', 'season_management', 'performance', 'community', 'milestone', 'special', 'skill', 'streak', 'rare'];

    for (const category of categories) {
      const categoryAchievements = Array.from(this.achievements.values()).filter(a => a.category === category);
      const unlockedInCategory = userAchievements.filter(ua => {
        const achievement = this.achievements.get(ua.achievementId);
        return achievement?.category === category;
      }).length;

      byCategory[category] = {
        unlocked: unlockedInCategory,
        total: categoryAchievements.length,
        rate: categoryAchievements.length > 0 ? (unlockedInCategory / categoryAchievements.length) * 100 : 0
      };
    }

    // Calculate difficulty stats
    const byDifficulty: Record<string, {unlocked: number, total: number, rate: number}> = {};
    const difficulties = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

    for (const difficulty of difficulties) {
      const difficultyAchievements = Array.from(this.achievements.values()).filter(a => a.difficulty === difficulty);
      const unlockedInDifficulty = userAchievements.filter(ua => {
        const achievement = this.achievements.get(ua.achievementId);
        return achievement?.difficulty === difficulty;
      }).length;

      byDifficulty[difficulty] = {
        unlocked: unlockedInDifficulty,
        total: difficultyAchievements.length,
        rate: difficultyAchievements.length > 0 ? (unlockedInDifficulty / difficultyAchievements.length) * 100 : 0
      };
    }

    // Find rare achievements
    const rareAchievements = userAchievements
      .map(ua => this.achievements.get(ua.achievementId))
      .filter((a): a is Achievement => a !== undefined && a.rarity.percentage <= 10)
      .sort((a, b) => a.rarity.percentage - b.rarity.percentage)
      .slice(0, 5);

    // Get recent unlocks
    const recentUnlocks = userAchievements
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, 10);

    // Calculate streaks (placeholder)
    const streaks = [
      { current: 5, longest: 12, type: 'Weekly wins' },
      { current: 3, longest: 8, type: 'Draft success' },
      { current: 0, longest: 15, type: 'Waiver claims' }
    ];

    // Calculate rankings (placeholder)
    const rankings = {
      global: 1247,
      league: 3,
      percentile: 85
    };

    return {
      userId,
      overview: {
        totalUnlocked,
        totalPossible,
        completionRate,
        totalXP,
        totalCoins,
        currentLevel,
        xpToNextLevel
      },
      byCategory,
      byDifficulty,
      rareAchievements,
      recentUnlocks,
      streaks,
      rankings
    };
  }

  async getAchievementInsights(userId: string): Promise<AchievementInsight[]> {
    const insights: AchievementInsight[] = [];
    const userProgress = this.userProgress.get(userId) || [];
    const userAchievements = this.userAchievements.get(userId) || [];

    // Find achievements close to unlock
    for (const progress of userProgress) {
      if (progress.percentage >= 75 && progress.percentage < 100) {
        const achievement = this.achievements.get(progress.achievementId);
        if (!achievement) continue;

        insights.push({
          userId,
          type: 'close_to_unlock',
          achievement,
          message: `You're ${Math.ceil(progress.required - progress.current)} away from unlocking "${achievement.name}"!`,
          progress: progress.percentage,
          estimatedTimeToCompletion: this.estimateCompletionTime(progress),
          actionItems: this.generateActionItems(achievement, progress),
          urgency: progress.percentage >= 90 ? 'high' : 'medium',
          potentialRewards: achievement.rewards
        });
      }
    }

    // Find seasonal opportunities
    const activeSeasonalChallenges = Array.from(this.seasonalChallenges.values())
      .filter(sc => sc.isActive && new Date() <= sc.endDate);

    for (const challenge of activeSeasonalChallenges.slice(0, 3)) {
      const participant = challenge.participants.find(p => p.userId === userId);
      if (!participant?.completed) {
        insights.push({
          userId,
          type: 'seasonal_opportunity',
          achievement: this.createAchievementFromChallenge(challenge),
          message: `"${challenge.name}" ends in ${this.formatTimeRemaining(challenge.endDate)}`,
          progress: participant?.progress || 0,
          actionItems: ['Check seasonal challenge requirements', 'Optimize your strategy'],
          urgency: this.getSeasonalUrgency(challenge.endDate),
          potentialRewards: challenge.rewards
        });
      }
    }

    // Find rare achievement opportunities
    const rareAchievements = Array.from(this.achievements.values())
      .filter(a => a.rarity.percentage <= 5 && !userAchievements.find(ua => ua.achievementId === a.id))
      .slice(0, 2);

    for (const rareAchievement of rareAchievements) {
      insights.push({
        userId,
        type: 'rare_chance',
        achievement: rareAchievement,
        message: `Rare achievement opportunity: "${rareAchievement.name}" (${rareAchievement.rarity.percentage.toFixed(1)}% have this)`,
        progress: 0,
        actionItems: this.generateRareAchievementActions(rareAchievement),
        urgency: 'low',
        potentialRewards: rareAchievement.rewards
      });
    }

    return insights
      .sort((a, b) => {
        const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      })
      .slice(0, 10);
  }

  async createSeasonalChallenge(config: {
    name: string;
    description: string;
    season: string;
    duration: { start: Date; end: Date };
    category: SeasonalChallenge['category'];
    requirements: AchievementCondition[];
    rewards: Achievement['rewards'];
    leaderboard?: {
      metric: string;
      topRewards: Record<string, Achievement['rewards']>;
    };
    metadata?: {
      maxParticipants?: number;
      featured?: boolean;
      difficulty?: Achievement['difficulty'];
    };
  }): Promise<SeasonalChallenge> {
    const challenge: SeasonalChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: config.description,
      season: config.season,
      startDate: config.duration.start,
      endDate: config.duration.end,
      category: config.category,
      requirements: config.requirements,
      rewards: config.rewards,
      leaderboard: config.leaderboard ? {
        metric: config.leaderboard.metric,
        top: Object.keys(config.leaderboard.topRewards).length,
        rewards: config.leaderboard.topRewards
      } : undefined,
      participants: [],
      isActive: true,
      metadata: {
        maxParticipants: config.metadata?.maxParticipants,
        featured: config.metadata?.featured || false,
        difficulty: config.metadata?.difficulty || 'uncommon'
      }
    };

    this.seasonalChallenges.set(challenge.id, challenge);

    // Store in database
    await this.saveSeasonalChallenge(challenge);

    return challenge;
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Draft Achievements
      {
        id: 'draft_perfectionist',
        name: 'Draft Perfectionist',
        description: 'Draft a team where every starter finishes in the top 12 at their position',
        category: 'draft',
        type: 'milestone',
        difficulty: 'legendary',
        icon: '🏆',
        color: '#FFD700',
        requirements: {
          conditions: [{
            type: 'ranking',
            metric: 'starter_top12_rate',
            operator: 'equals',
            value: 1.0
          }],
          timeframe: 'season'
        },
        rewards: {
          xp: 2000,
          coins: 1000,
          titles: ['Draft Master'],
          badges: ['perfect_draft']
        },
        rarity: { earnedBy: 23, totalUsers: 50000, percentage: 0.046 },
        metadata: {
          createdAt: new Date(),
          isHidden: false,
          isRetired: false,
          tags: ['draft', 'perfect', 'elite']
        }
      },
      {
        id: 'value_hunter',
        name: 'Value Hunter',
        description: 'Draft 5 players who outperform their ADP by 2+ rounds',
        category: 'draft',
        type: 'milestone',
        difficulty: 'rare',
        icon: '🎯',
        color: '#4CAF50',
        requirements: {
          conditions: [{
            type: 'ranking',
            metric: 'adp_outperformers',
            operator: 'greater_than',
            value: 4
          }]
        },
        rewards: {
          xp: 750,
          coins: 400,
          titles: ['Value Seeker']
        },
        rarity: { earnedBy: 1247, totalUsers: 50000, percentage: 2.494 },
        metadata: {
          createdAt: new Date(),
          isHidden: false,
          isRetired: false,
          tags: ['draft', 'value', 'adp']
        }
      },

      // Performance Achievements
      {
        id: 'weekly_warrior',
        name: 'Weekly Warrior',
        description: 'Score the highest points in your league for 5 consecutive weeks',
        category: 'performance',
        type: 'streak',
        difficulty: 'epic',
        icon: '⚔️',
        color: '#FF5722',
        requirements: {
          conditions: [{
            type: 'streak',
            metric: 'weekly_league_leader',
            operator: 'consecutive',
            value: 5
          }]
        },
        rewards: {
          xp: 1500,
          coins: 750,
          titles: ['Weekly Dominator'],
          specialRewards: [{
            type: 'exclusive_content',
            name: 'Warrior Badge Border',
            description: 'Special animated border for profile'
          }]
        },
        progression: {
          current: 0,
          required: 5,
          tiers: [
            { tier: 1, name: 'Hot Streak', description: '3 consecutive weeks', requirement: 3, rewards: { xp: 500, coins: 200 } },
            { tier: 2, name: 'On Fire', description: '4 consecutive weeks', requirement: 4, rewards: { xp: 1000, coins: 400 } },
            { tier: 3, name: 'Weekly Warrior', description: '5 consecutive weeks', requirement: 5, rewards: { xp: 1500, coins: 750 } }
          ]
        },
        rarity: { earnedBy: 156, totalUsers: 50000, percentage: 0.312 },
        metadata: {
          createdAt: new Date(),
          isHidden: false,
          isRetired: false,
          tags: ['performance', 'streak', 'weekly']
        }
      },

      // Season Management
      {
        id: 'waiver_wizard',
        name: 'Waiver Wire Wizard',
        description: 'Pick up 3 players from waivers who finish top 24 at their position',
        category: 'season_management',
        type: 'milestone',
        difficulty: 'rare',
        icon: '🧙‍♂️',
        color: '#9C27B0',
        requirements: {
          conditions: [{
            type: 'ranking',
            metric: 'waiver_top24_players',
            operator: 'greater_than',
            value: 2
          }]
        },
        rewards: {
          xp: 800,
          coins: 500,
          titles: ['Waiver Wizard']
        },
        rarity: { earnedBy: 892, totalUsers: 50000, percentage: 1.784 },
        metadata: {
          createdAt: new Date(),
          isHidden: false,
          isRetired: false,
          tags: ['waiver', 'management', 'pickups']
        }
      },

      // Community Achievements
      {
        id: 'helpful_advisor',
        name: 'Helpful Advisor',
        description: 'Have 50 of your forum posts receive upvotes',
        category: 'community',
        type: 'milestone',
        difficulty: 'uncommon',
        icon: '💡',
        color: '#2196F3',
        requirements: {
          conditions: [{
            type: 'social',
            metric: 'upvoted_posts',
            operator: 'greater_than',
            value: 49
          }]
        },
        rewards: {
          xp: 600,
          coins: 300,
          badges: ['community_helper']
        },
        progression: {
          current: 0,
          required: 50,
          tiers: [
            { tier: 1, name: 'Good Contributor', description: '10 upvoted posts', requirement: 10, rewards: { xp: 100, coins: 50 } },
            { tier: 2, name: 'Valued Member', description: '25 upvoted posts', requirement: 25, rewards: { xp: 300, coins: 150 } },
            { tier: 3, name: 'Helpful Advisor', description: '50 upvoted posts', requirement: 50, rewards: { xp: 600, coins: 300 } }
          ]
        },
        rarity: { earnedBy: 3421, totalUsers: 50000, percentage: 6.842 },
        metadata: {
          createdAt: new Date(),
          isHidden: false,
          isRetired: false,
          tags: ['community', 'helpful', 'forum']
        }
      },

      // Rare/Special Achievements
      {
        id: 'perfect_season',
        name: 'Perfect Season',
        description: 'Go undefeated in the regular season and win the championship',
        category: 'rare',
        type: 'rare_event',
        difficulty: 'mythic',
        icon: '👑',
        color: '#E91E63',
        requirements: {
          conditions: [
            {
              type: 'ranking',
              metric: 'regular_season_wins',
              operator: 'equals',
              value: 13 // Assuming 13-game regular season
            },
            {
              type: 'event',
              metric: 'championship_winner',
              operator: 'equals',
              value: true
            }
          ],
          timeframe: 'season'
        },
        rewards: {
          xp: 5000,
          coins: 2500,
          titles: ['Perfect Champion', 'Undefeated'],
          badges: ['perfect_season', 'mythic_achievement'],
          specialRewards: [{
            type: 'physical_reward',
            name: 'Custom Championship Ring',
            description: 'Physical championship ring shipped to winner'
          }]
        },
        rarity: { earnedBy: 7, totalUsers: 50000, percentage: 0.014 },
        metadata: {
          createdAt: new Date(),
          isHidden: false,
          isRetired: false,
          tags: ['perfect', 'championship', 'undefeated', 'mythic']
        }
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeSeasonalChallenges(): void {
    // Initialize with current season challenges
    const currentSeason = '2024';

    const challenges: SeasonalChallenge[] = [
      {
        id: 'week1_prophet',
        name: 'Week 1 Prophet',
        description: 'Correctly predict the top scorer in Week 1',
        season: currentSeason,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-15'),
        category: 'weekly',
        requirements: [{
          type: 'event',
          metric: 'correct_weekly_prediction',
          operator: 'equals',
          value: true,
          context: { timeframe: 'week1' }
        }],
        rewards: {
          xp: 500,
          coins: 250,
          badges: ['prophet']
        },
        participants: [],
        isActive: true,
        metadata: {
          featured: true,
          difficulty: 'uncommon'
        }
      },
      {
        id: 'thanksgiving_feast',
        name: 'Thanksgiving Feast',
        description: 'Score 200+ points during Thanksgiving week',
        season: currentSeason,
        startDate: new Date('2024-11-25'),
        endDate: new Date('2024-12-01'),
        category: 'weekly',
        requirements: [{
          type: 'ranking',
          metric: 'weekly_points',
          operator: 'greater_than',
          value: 199.99,
          context: { timeframe: 'thanksgiving_week' }
        }],
        rewards: {
          xp: 750,
          coins: 400,
          titles: ['Feast Master']
        },
        participants: [],
        isActive: false, // Will become active closer to date
        metadata: {
          featured: true,
          difficulty: 'rare'
        }
      }
    ];

    challenges.forEach(challenge => {
      this.seasonalChallenges.set(challenge.id, challenge);
    });
  }

  // Helper methods for achievement evaluation and management
  private async evaluateAchievementRequirements(
    achievement: Achievement,
    userId: string,
    context: unknown
  ): Promise<{
    unlocked: boolean;
    progress: number;
    required: number;
    tier?: number;
  }> {
    // This would contain complex logic to evaluate achievement conditions
    // For now, return placeholder data
    return {
      unlocked: false,
      progress: Math.floor(Math.random() * 80),
      required: 100,
      tier: 1
    };
  }

  private async awardRewards(userId: string, rewards: Achievement['rewards'], tier?: number): Promise<void> {
    // Award XP, coins, badges, titles, etc.
    // This would integrate with the user's profile and virtual currency system
    console.log(`Awarding rewards to user ${userId}:`, rewards);
  }

  private async updateAchievementRarity(achievementId: string): Promise<void> {
    const achievement = this.achievements.get(achievementId);
    if (achievement) {
      achievement.rarity.earnedBy += 1;
      achievement.rarity.percentage = (achievement.rarity.earnedBy / achievement.rarity.totalUsers) * 100;
    }
  }

  private calculateProjectedCompletion(current: number, required: number, existingProgress?: AchievementProgress): Date | undefined {
    if (!existingProgress || existingProgress.milestones.length < 2) {
      return undefined;
    }

    // Calculate average progress rate from milestones
    const recentMilestones = existingProgress.milestones.slice(-2);
    const timeDiff = recentMilestones[1].unlockedAt.getTime() - recentMilestones[0].unlockedAt.getTime();
    const progressDiff = recentMilestones[1].value - recentMilestones[0].value;

    if (progressDiff <= 0) return undefined;

    const progressRate = progressDiff / timeDiff; // progress per millisecond
    const remainingProgress = required - current;
    const estimatedTimeMs = remainingProgress / progressRate;

    return new Date(Date.now() + estimatedTimeMs);
  }

  private async generateAchievementInsight(achievement: Achievement, progress: AchievementProgress): Promise<AchievementInsight> {
    const remaining = progress.required - progress.current;

    return {
      userId: progress.userId,
      type: 'close_to_unlock',
      achievement,
      message: `You're ${remaining} away from unlocking "${achievement.name}"!`,
      progress: progress.percentage,
      estimatedTimeToCompletion: progress.projectedCompletion 
        ? this.formatTimeRemaining(progress.projectedCompletion)
        : 'Unknown',
      actionItems: this.generateActionItems(achievement, progress),
      urgency: progress.percentage >= 90 ? 'high' : 'medium',
      potentialRewards: achievement.rewards
    };
  }

  private generateActionItems(achievement: Achievement, progress: AchievementProgress): string[] {
    // Generate contextual action items based on achievement type and progress
    const actions: string[] = [];

    if (achievement.category === 'draft') {
      actions.push('Review player rankings and ADP data');
      actions.push('Practice with mock drafts');
    } else if (achievement.category === 'season_management') {
      actions.push('Monitor waiver wire for value pickups');
      actions.push('Review your roster for upgrade opportunities');
    } else if (achievement.category === 'performance') {
      actions.push('Optimize your starting lineup');
      actions.push('Check player matchups and projections');
    } else if (achievement.category === 'community') {
      actions.push('Participate in forum discussions');
      actions.push('Share helpful advice with other users');
    }

    return actions;
  }

  private estimateCompletionTime(progress: AchievementProgress): string {
    if (progress.projectedCompletion) {
      return this.formatTimeRemaining(progress.projectedCompletion);
    }

    // Fallback estimation
    const remainingProgress = progress.required - progress.current;
    const progressPercentage = progress.percentage;

    if (progressPercentage >= 90) return '1-2 weeks';
    if (progressPercentage >= 75) return '2-4 weeks';
    if (progressPercentage >= 50) return '1-2 months';
    return '2+ months';
  }

  private formatTimeRemaining(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return 'Now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Less than 1h';
  }

  private getSeasonalUrgency(endDate: Date): AchievementInsight['urgency'] {
    const timeRemaining = endDate.getTime() - Date.now();
    const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);

    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 3) return 'high';
    if (daysRemaining <= 7) return 'medium';
    return 'low';
  }

  private createAchievementFromChallenge(challenge: SeasonalChallenge): Achievement {
    return {
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      category: 'special',
      type: 'seasonal',
      difficulty: challenge.metadata.difficulty,
      icon: '🎯',
      color: '#FF9800',
      requirements: {
        conditions: challenge.requirements,
        timeframe: 'season'
      },
      rewards: challenge.rewards,
      rarity: { earnedBy: 0, totalUsers: 1000, percentage: 0 },
      metadata: {
        createdAt: new Date(),
        isHidden: false,
        isRetired: false,
        tags: ['seasonal', 'challenge']
      }
    };
  }

  private generateRareAchievementActions(achievement: Achievement): string[] {
    return [
      `Research ${achievement.name} requirements`,
      'Plan your strategy carefully',
      'Monitor your progress regularly',
      'Consider the risk vs reward'
    ];
  }

  private async updateSeasonalChallenges(userId: string, context: unknown): Promise<void> {
    // Update progress on active seasonal challenges
    for (const challenge of this.seasonalChallenges.values()) {
      if (!challenge.isActive || new Date() > challenge.endDate) continue;

      // Check if user meets challenge requirements
      // This would contain complex logic similar to achievement evaluation
    }
  }

  private async saveSeasonalChallenge(challenge: SeasonalChallenge): Promise<void> {
    // Save to database
    console.log('Saving seasonal challenge:', challenge.name);
  }
}

export default AchievementSystem;