import { aiRouterService } from './aiRouterService';
import { aiAnalyticsService } from './aiAnalyticsService';
import { tradeAnalysisEngine } from './tradeAnalysisEngine';
import { neonDb } from '@/lib/db';

export interface TradeOpportunity {
  id: string;
  fromUserId: string;
  toUserId: string;
  proposedTrade: {
    fromUserPlayers: PlayerInTrade[];
    toUserPlayers: PlayerInTrade[];
  };
  analysis: {
    fairnessScore: number;
    fromUserValue: number;
    toUserValue: number;
    mutualBenefit: number;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
  };
  reasoning: {
    fromUserBenefits: string[];
    toUserBenefits: string[];
    whyItWorks: string;
    keyFactors: string[];
    timing: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
  marketContext: {
    trend: 'buyer_market' | 'seller_market' | 'balanced';
    competingOffers: number;
    timeRemaining: string;
  };
  discoveredAt: Date;
  priority: number;
}

export interface PlayerInTrade {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  currentValue: number;
  projectedValue: number;
  tradeReasoning: string;
}

export interface LeagueScanResult {
  totalCombinations: number;
  viableOpportunities: number;
  topOpportunities: TradeOpportunity[];
  marketInsights: MarketInsight[];
  scanDuration: number;
  lastScan: Date;
  nextScanScheduled: Date;
}

export interface MarketInsight {
  type: 'buyer_need' | 'seller_opportunity' | 'market_shift' | 'urgent_action';
  playerId?: string;
  playerName?: string;
  description: string;
  affectedUsers: string[];
  confidence: number;
  actionWindow: number; // hours
}

export interface TradePattern {
  patternType: 'positional_swap' | 'upgrade_downgrade' | 'depth_consolidation' | 'buy_low_sell_high' | 'injury_response';
  description: string;
  successRate: number;
  averageFairness: number;
  typicalTimeframe: string;
  keyIndicators: string[];
}

export interface UserTradeProfile {
  userId: string;
  tradingActivity: 'inactive' | 'conservative' | 'moderate' | 'active' | 'aggressive';
  preferredTradeTypes: string[];
  riskTolerance: number;
  responseTime: number; // average hours to respond
  acceptanceRate: number;
  lastActive: Date;
  teamNeeds: {
    position: string;
    urgency: 'low' | 'medium' | 'high';
    willingToPay: 'under' | 'fair' | 'over';
  }[];
  tradingPatterns: {
    preferredPartners: string[];
    avoidedPartners: string[];
    seasonalActivity: { [month: string]: number };
  };
}

class TradeOpportunityDetector {
  private readonly SCAN_INTERVAL_HOURS = 6;
  private readonly MAX_OPPORTUNITIES_PER_USER = 5;
  private readonly MIN_FAIRNESS_THRESHOLD = 0.7;
  private readonly MIN_MUTUAL_BENEFIT = 0.15;

  private scanningInProgress = false;
  private lastFullScan?: Date;
  private opportunityCache: Map<string, TradeOpportunity[]> = new Map();

  async scanLeagueForOpportunities(leagueId: string, focusUserId?: string): Promise<LeagueScanResult> {
    try {
      console.log(`🔍 Scanning league ${leagueId} for trade opportunities...`);
      const startTime = Date.now();

      if (this.scanningInProgress) {
        throw new Error('Scan already in progress');
      }

      this.scanningInProgress = true;

      // Get all active users in the league
      const users = await this.getLeagueUsers(leagueId);
      
      if (users.length < 2) {
        throw new Error('Need at least 2 users to scan for trades');
      }

      // Generate all possible user combinations
      const combinations = this.generateUserCombinations(users, focusUserId);
      
      console.log(`Analyzing ${combinations.length} user combinations...`);

      // Analyze each combination
      const allOpportunities: TradeOpportunity[] = [];
      
      for (const [userA, userB] of combinations) {
        const opportunities = await this.findOpportunitiesBetweenUsers(userA.id, userB.id, leagueId);
        allOpportunities.push(...opportunities);
      }

      // Rank and filter opportunities
      const rankedOpportunities = await this.rankOpportunities(allOpportunities);
      const topOpportunities = rankedOpportunities.slice(0, 20); // Top 20 overall

      // Generate market insights
      const marketInsights = await this.generateMarketInsights(allOpportunities, users);

      // Store results
      await this.storeOpportunities(topOpportunities);
      
      // Update cache
      this.updateOpportunityCache(topOpportunities);

      const scanDuration = Date.now() - startTime;
      this.lastFullScan = new Date();
      
      const result: LeagueScanResult = {
        totalCombinations: combinations.length,
        viableOpportunities: allOpportunities.length,
        topOpportunities,
        marketInsights,
        scanDuration,
        lastScan: this.lastFullScan,
        nextScanScheduled: new Date(Date.now() + this.SCAN_INTERVAL_HOURS * 60 * 60 * 1000)
      };

      await aiAnalyticsService.logEvent('league_scan_completed', {
        leagueId,
        totalCombinations: combinations.length,
        opportunities: allOpportunities.length,
        topOpportunities: topOpportunities.length,
        scanDuration
      });

      return result;

    } finally {
      this.scanningInProgress = false;
    }
  }

  async findOpportunitiesBetweenUsers(
    userAId: string, 
    userBId: string, 
    leagueId: string
  ): Promise<TradeOpportunity[]> {
    try {
      // Get user rosters and team contexts
      const userARoster = await this.getUserRoster(userAId, leagueId);
      const userBRoster = await this.getUserRoster(userBId, leagueId);
      
      const userAContext = await this.getUserTeamContext(userAId, leagueId);
      const userBContext = await this.getUserTeamContext(userBId, leagueId);

      // Get trade profiles
      const userAProfile = await this.getUserTradeProfile(userAId);
      const userBProfile = await this.getUserTradeProfile(userBId);

      // Check if users are viable trade partners
      if (!this.areViableTradePartners(userAProfile, userBProfile)) {
        return [];
      }

      // Generate potential trade packages
      const tradePackages = await this.generateTradePackages(
        userARoster, 
        userBRoster, 
        userAContext, 
        userBContext
      );

      // Analyze each package
      const opportunities: TradeOpportunity[] = [];

      for (const pkg of tradePackages) {
        const analysis = await this.analyzeTradePackage(
          pkg, 
          userAContext, 
          userBContext, 
          userAProfile, 
          userBProfile
        );

        if (this.meetsOpportunityThreshold(analysis)) {
          const opportunity = await this.createTradeOpportunity(
            userAId, 
            userBId, 
            pkg, 
            analysis, 
            userAProfile, 
            userBProfile
          );
          opportunities.push(opportunity);
        }
      }

      return opportunities.slice(0, this.MAX_OPPORTUNITIES_PER_USER);

    } catch (error) {
      console.error(`Error finding opportunities between ${userAId} and ${userBId}:`, error);
      return [];
    }
  }

  private async generateTradePackages(
    rosterA: any[], 
    rosterB: any[], 
    contextA: any, 
    contextB: any
  ): Promise<any[]> {
    const packages = [];

    try {
      // AI-powered package generation
      const packagePrompt = `
        Generate creative trade packages between these two fantasy football teams:
        
        Team A Roster: ${rosterA.map(p => `${p.playerName} (${p.position})`).join(', ')}
        Team A Needs: ${contextA.needs?.map((n: any) => `${n.position} (${n.urgency} urgency)`).join(', ') || 'Balanced'}
        Team A Strengths: ${contextA.strengths?.join(', ') || 'Unknown'}
        
        Team B Roster: ${rosterB.map(p => `${p.playerName} (${p.position})`).join(', ')}
        Team B Needs: ${contextB.needs?.map((n: any) => `${n.position} (${n.urgency} urgency)`).join(', ') || 'Balanced'}
        Team B Strengths: ${contextB.strengths?.join(', ') || 'Unknown'}
        
        Generate 5 potential trade packages that:
        1. Address each team's specific needs
        2. Trade from strength to fill weakness
        3. Consider fairness and mutual benefit
        4. Range from simple 1-for-1 to complex 3-for-2 deals
        5. Include both conservative and creative options
        
        Return as JSON array with format:
        [{
          "teamAGives": ["playerName1", "playerName2"],
          "teamBGives": ["playerName3"],
          "reasoning": "Why this trade makes sense",
          "type": "upgrade_trade|depth_trade|positional_need|buy_low_sell_high"
        }]
      `;

      const response = await aiRouterService.processRequest({
        type: 'strategy',
        complexity: 'high',
        content: packagePrompt,
        userId: 'system',
        priority: 'medium'
      });

      const aiPackages = JSON.parse(response.content);
      packages.push(...aiPackages);

      // Also generate some algorithmic packages
      const algoPackages = this.generateAlgorithmicPackages(rosterA, rosterB, contextA, contextB);
      packages.push(...algoPackages);

      return packages.slice(0, 8); // Limit to 8 packages per pair

    } catch (error) {
      console.error('Error generating trade packages:', error);
      
      // Fallback to basic algorithmic generation
      return this.generateAlgorithmicPackages(rosterA, rosterB, contextA, contextB);
    }
  }

  private generateAlgorithmicPackages(rosterA: any[], rosterB: any[], contextA: any, contextB: any): any[] {
    const packages = [];

    // Simple 1-for-1 trades addressing needs
    if (contextA.needs && contextB.needs) {
      for (const needA of contextA.needs) {
        for (const needB of contextB.needs) {
          const playerFromB = rosterB.find(p => p.position === needA.position);
          const playerFromA = rosterA.find(p => p.position === needB.position);

          if (playerFromB && playerFromA) {
            packages.push({
              teamAGives: [playerFromA.playerName],
              teamBGives: [playerFromB.playerName],
              reasoning: `${needA.position} for ${needB.position} swap`,
              type: 'positional_need'
            });
          }
        }
      }
    }

    // 2-for-1 consolidation trades
    const strongPositions = this.identifyStrongPositions(rosterA, rosterB);
    for (const pos of strongPositions) {
      if (rosterA.filter(p => p.position === pos).length >= 3) {
        const tradablePlayers = rosterA.filter(p => p.position === pos).slice(1, 3);
        const targetPlayer = rosterB.find(p => p.position !== pos && p.tier > tradablePlayers[0].tier);
        
        if (targetPlayer) {
          packages.push({
            teamAGives: tradablePlayers.map(p => p.playerName),
            teamBGives: [targetPlayer.playerName],
            reasoning: `Consolidate ${pos} depth for upgrade`,
            type: 'depth_consolidation'
          });
        }
      }
    }

    return packages.slice(0, 4);
  }

  private async analyzeTradePackage(
    pkg: any, 
    contextA: any, 
    contextB: any, 
    profileA: UserTradeProfile, 
    profileB: UserTradeProfile
  ): Promise<any> {
    try {
      // Convert package to structured format for analysis
      const structuredTrade = {
        fromUserPlayers: pkg.teamAGives.map((name: string) => ({
          playerName: name,
          // Would need to look up actual player data
        })),
        toUserPlayers: pkg.teamBGives.map((name: string) => ({
          playerName: name,
          // Would need to look up actual player data
        }))
      };

      // Use existing trade analysis engine
      const tradeAnalysis = await tradeAnalysisEngine.analyzeTrade(
        'temp_trade_id',
        contextA.userId,
        contextB.userId,
        structuredTrade,
        contextA.leagueId
      );

      // Calculate mutual benefit
      const mutualBenefit = this.calculateMutualBenefit(tradeAnalysis, contextA, contextB);

      // Assess compatibility with user profiles
      const compatibility = this.assessTradeCompatibility(profileA, profileB, pkg.type);

      return {
        fairnessScore: tradeAnalysis.fairnessScore,
        fromUserValue: tradeAnalysis.fromUserValue,
        toUserValue: tradeAnalysis.toUserValue,
        mutualBenefit,
        compatibility,
        riskLevel: tradeAnalysis.riskAssessment?.level || 'medium',
        confidence: Math.min(tradeAnalysis.confidence || 0.7, compatibility),
        reasoning: pkg.reasoning,
        type: pkg.type
      };

    } catch (error) {
      console.error('Error analyzing trade package:', error);
      return {
        fairnessScore: 0.5,
        fromUserValue: 0,
        toUserValue: 0,
        mutualBenefit: 0,
        compatibility: 0.3,
        riskLevel: 'high',
        confidence: 0.3,
        reasoning: 'Analysis failed',
        type: 'unknown'
      };
    }
  }

  private async createTradeOpportunity(
    userAId: string,
    userBId: string,
    pkg: any,
    analysis: any,
    profileA: UserTradeProfile,
    profileB: UserTradeProfile
  ): Promise<TradeOpportunity> {
    
    const urgency = this.calculateUrgency(analysis, profileA, profileB);
    const marketContext = await this.getMarketContext(pkg);

    return {
      id: `opportunity_${Date.now()}_${userAId}_${userBId}`,
      fromUserId: userAId,
      toUserId: userBId,
      proposedTrade: {
        fromUserPlayers: pkg.teamAGives.map((name: string) => ({
          playerId: `player_${name}`,
          playerName: name,
          position: 'Unknown', // Would lookup real data
          team: 'Unknown',
          currentValue: 0,
          projectedValue: 0,
          tradeReasoning: 'Part of identified opportunity'
        })),
        toUserPlayers: pkg.teamBGives.map((name: string) => ({
          playerId: `player_${name}`,
          playerName: name,
          position: 'Unknown',
          team: 'Unknown',
          currentValue: 0,
          projectedValue: 0,
          tradeReasoning: 'Part of identified opportunity'
        }))
      },
      analysis: {
        fairnessScore: analysis.fairnessScore,
        fromUserValue: analysis.fromUserValue,
        toUserValue: analysis.toUserValue,
        mutualBenefit: analysis.mutualBenefit,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence
      },
      reasoning: {
        fromUserBenefits: [`Addresses ${pkg.type} opportunity`],
        toUserBenefits: [`Complements ${pkg.type} strategy`],
        whyItWorks: analysis.reasoning,
        keyFactors: ['Mutual team needs', 'Fair value exchange'],
        timing: 'Good timing based on current market'
      },
      urgency,
      marketContext,
      discoveredAt: new Date(),
      priority: this.calculatePriority(analysis, urgency)
    };
  }

  private async rankOpportunities(opportunities: TradeOpportunity[]): Promise<TradeOpportunity[]> {
    return opportunities.sort((a, b) => {
      // Primary sort by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Secondary sort by mutual benefit
      if (a.analysis.mutualBenefit !== b.analysis.mutualBenefit) {
        return b.analysis.mutualBenefit - a.analysis.mutualBenefit;
      }

      // Tertiary sort by fairness
      return b.analysis.fairnessScore - a.analysis.fairnessScore;
    });
  }

  private async generateMarketInsights(
    opportunities: TradeOpportunity[], 
    users: any[]
  ): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    try {
      // Analyze market patterns
      const playerDemand = this.analyzePlayerDemand(opportunities);
      const positionNeeds = this.analyzePositionNeeds(opportunities);
      const urgentSituations = this.identifyUrgentSituations(opportunities);

      // Generate insights from patterns
      for (const [playerId, demand] of Object.entries(playerDemand)) {
        if (demand > 0.7) {
          insights.push({
            type: 'buyer_need',
            playerId,
            playerName: playerId, // Would lookup real name
            description: `High demand player - multiple teams interested`,
            affectedUsers: opportunities
              .filter(op => op.proposedTrade.toUserPlayers.some(p => p.playerId === playerId))
              .map(op => op.toUserId),
            confidence: 0.8,
            actionWindow: 24
          });
        }
      }

      // Position scarcity insights
      for (const [position, scarcity] of Object.entries(positionNeeds)) {
        if (scarcity > 0.6) {
          insights.push({
            type: 'market_shift',
            description: `${position} scarcity creating trading opportunities`,
            affectedUsers: users.map(u => u.id),
            confidence: 0.7,
            actionWindow: 48
          });
        }
      }

      return insights.slice(0, 10); // Top 10 insights

    } catch (error) {
      console.error('Error generating market insights:', error);
      return [];
    }
  }

  // Helper methods
  private generateUserCombinations(users: any[], focusUserId?: string): [any, any][] {
    const combinations: [any, any][] = [];

    if (focusUserId) {
      const focusUser = users.find(u => u.id === focusUserId);
      if (focusUser) {
        for (const user of users) {
          if (user.id !== focusUserId) {
            combinations.push([focusUser, user]);
          }
        }
      }
    } else {
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          combinations.push([users[i], users[j]]);
        }
      }
    }

    return combinations;
  }

  private areViableTradePartners(profileA: UserTradeProfile, profileB: UserTradeProfile): boolean {
    // Check if users are active enough to trade
    if (profileA.tradingActivity === 'inactive' || profileB.tradingActivity === 'inactive') {
      return false;
    }

    // Check if they've avoided each other
    if (profileA.tradingPatterns.avoidedPartners.includes(profileB.userId) ||
        profileB.tradingPatterns.avoidedPartners.includes(profileA.userId)) {
      return false;
    }

    return true;
  }

  private meetsOpportunityThreshold(analysis: any): boolean {
    return analysis.fairnessScore >= this.MIN_FAIRNESS_THRESHOLD &&
           analysis.mutualBenefit >= this.MIN_MUTUAL_BENEFIT &&
           analysis.confidence >= 0.6;
  }

  private calculateMutualBenefit(tradeAnalysis: any, contextA: any, contextB: any): number {
    // Calculate how much both teams benefit from the trade
    const benefitA = tradeAnalysis.fromUserBenefit || 0;
    const benefitB = tradeAnalysis.toUserBenefit || 0;
    
    return Math.min(benefitA, benefitB); // Mutual benefit is limited by the lesser benefit
  }

  private assessTradeCompatibility(profileA: UserTradeProfile, profileB: UserTradeProfile, tradeType: string): number {
    let compatibility = 0.5; // Base compatibility

    // Preferred trade types alignment
    if (profileA.preferredTradeTypes.includes(tradeType)) compatibility += 0.2;
    if (profileB.preferredTradeTypes.includes(tradeType)) compatibility += 0.2;

    // Risk tolerance compatibility
    const riskDiff = Math.abs(profileA.riskTolerance - profileB.riskTolerance);
    compatibility += (1 - riskDiff) * 0.1;

    // Response time compatibility (faster responders are more compatible)
    const avgResponseTime = (profileA.responseTime + profileB.responseTime) / 2;
    compatibility += Math.max(0, (72 - avgResponseTime) / 72) * 0.1; // 72 hour max

    return Math.min(1, Math.max(0, compatibility));
  }

  private calculateUrgency(analysis: any, profileA: UserTradeProfile, profileB: UserTradeProfile): 'low' | 'medium' | 'high' | 'critical' {
    let urgencyScore = 0;

    // High mutual benefit = higher urgency
    if (analysis.mutualBenefit > 0.3) urgencyScore += 2;
    else if (analysis.mutualBenefit > 0.2) urgencyScore += 1;

    // Market timing factors
    if (analysis.type === 'injury_response') urgencyScore += 2;
    if (analysis.type === 'buy_low_sell_high') urgencyScore += 1;

    // User activity levels
    if (profileA.tradingActivity === 'aggressive' || profileB.tradingActivity === 'aggressive') {
      urgencyScore += 1;
    }

    if (urgencyScore >= 4) return 'critical';
    if (urgencyScore >= 3) return 'high';
    if (urgencyScore >= 2) return 'medium';
    return 'low';
  }

  private calculatePriority(analysis: any, urgency: string): number {
    let priority = 0;

    // Base score from analysis quality
    priority += analysis.fairnessScore * 30;
    priority += analysis.mutualBenefit * 40;
    priority += analysis.confidence * 20;

    // Urgency multiplier
    const urgencyMultiplier = {
      'critical': 1.5,
      'high': 1.3,
      'medium': 1.1,
      'low': 1.0
    };

    priority *= urgencyMultiplier[urgency] || 1.0;

    return Math.round(priority);
  }

  private identifyStrongPositions(rosterA: any[], rosterB: any[]): string[] {
    // Identify positions where teams have depth
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const strongPositions: string[] = [];

    for (const pos of positions) {
      const countA = rosterA.filter(p => p.position === pos).length;
      const countB = rosterB.filter(p => p.position === pos).length;
      
      if (countA >= 3 || countB >= 3) {
        strongPositions.push(pos);
      }
    }

    return strongPositions;
  }

  private analyzePlayerDemand(opportunities: TradeOpportunity[]): { [playerId: string]: number } {
    const demand: { [playerId: string]: number } = {};
    const playerCounts: { [playerId: string]: number } = {};

    // Count how often each player appears in trades
    opportunities.forEach(op => {
      op.proposedTrade.fromUserPlayers.forEach(p => {
        playerCounts[p.playerId] = (playerCounts[p.playerId] || 0) + 1;
      });
      op.proposedTrade.toUserPlayers.forEach(p => {
        playerCounts[p.playerId] = (playerCounts[p.playerId] || 0) + 1;
      });
    });

    // Calculate demand scores
    const maxCount = Math.max(...Object.values(playerCounts));
    for (const [playerId, count] of Object.entries(playerCounts)) {
      demand[playerId] = maxCount > 0 ? count / maxCount : 0;
    }

    return demand;
  }

  private analyzePositionNeeds(opportunities: TradeOpportunity[]): { [position: string]: number } {
    const needs: { [position: string]: number } = {};
    
    // This would analyze position-specific trade frequency
    return {
      'RB': 0.7,
      'WR': 0.5,
      'QB': 0.3,
      'TE': 0.4
    };
  }

  private identifyUrgentSituations(opportunities: TradeOpportunity[]): TradeOpportunity[] {
    return opportunities.filter(op => op.urgency === 'critical' || op.urgency === 'high');
  }

  private async getMarketContext(pkg: any): Promise<any> {
    return {
      trend: 'balanced' as const,
      competingOffers: 0,
      timeRemaining: '7 days until trade deadline'
    };
  }

  // Database interaction methods
  private async getLeagueUsers(leagueId: string): Promise<any[]> {
    const result = await neonDb.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN league_memberships lm ON u.id = lm.user_id
      WHERE lm.league_id = $1 AND lm.is_active = true
    `, [leagueId]);

    return result.rows;
  }

  private async getUserRoster(userId: string, leagueId: string): Promise<any[]> {
    const result = await neonDb.query(`
      SELECT p.id as player_id, p.name as player_name, p.position, p.nfl_team
      FROM user_rosters ur
      JOIN players p ON ur.player_id = p.id
      WHERE ur.user_id = $1 AND ur.league_id = $2
    `, [userId, leagueId]);

    return result.rows.map(row => ({
      playerId: row.player_id,
      playerName: row.player_name,
      position: row.position,
      team: row.nfl_team,
      tier: 1 // Would calculate actual tier
    }));
  }

  private async getUserTeamContext(userId: string, leagueId: string): Promise<any> {
    // Would analyze team needs, strengths, weaknesses
    return {
      userId,
      leagueId,
      needs: [
        { position: 'RB', urgency: 'high' },
        { position: 'WR', urgency: 'medium' }
      ],
      strengths: ['QB', 'TE'],
      record: { wins: 5, losses: 3 },
      playoffChances: 0.73
    };
  }

  private async getUserTradeProfile(userId: string): Promise<UserTradeProfile> {
    try {
      const result = await neonDb.query(`
        SELECT * FROM user_trade_profiles WHERE user_id = $1
      `, [userId]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          userId,
          tradingActivity: row.trading_activity || 'moderate',
          preferredTradeTypes: row.preferred_trade_types || ['positional_need'],
          riskTolerance: row.risk_tolerance || 0.5,
          responseTime: row.response_time || 24,
          acceptanceRate: row.acceptance_rate || 0.3,
          lastActive: new Date(row.last_active || Date.now()),
          teamNeeds: row.team_needs || [],
          tradingPatterns: row.trading_patterns || {
            preferredPartners: [],
            avoidedPartners: [],
            seasonalActivity: {}
          }
        };
      }

      // Return default profile for new users
      return {
        userId,
        tradingActivity: 'moderate',
        preferredTradeTypes: ['positional_need', 'upgrade_downgrade'],
        riskTolerance: 0.5,
        responseTime: 24,
        acceptanceRate: 0.3,
        lastActive: new Date(),
        teamNeeds: [],
        tradingPatterns: {
          preferredPartners: [],
          avoidedPartners: [],
          seasonalActivity: {}
        }
      };

    } catch (error) {
      console.error(`Error getting trade profile for ${userId}:`, error);
      throw error;
    }
  }

  private async storeOpportunities(opportunities: TradeOpportunity[]): Promise<void> {
    for (const opportunity of opportunities) {
      try {
        await neonDb.query(`
          INSERT INTO trade_opportunities (
            id, from_user_id, to_user_id, proposed_trade, analysis,
            reasoning, urgency, market_context, discovered_at, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            analysis = EXCLUDED.analysis,
            reasoning = EXCLUDED.reasoning,
            urgency = EXCLUDED.urgency,
            market_context = EXCLUDED.market_context,
            priority = EXCLUDED.priority
        `, [
          opportunity.id,
          opportunity.fromUserId,
          opportunity.toUserId,
          JSON.stringify(opportunity.proposedTrade),
          JSON.stringify(opportunity.analysis),
          JSON.stringify(opportunity.reasoning),
          opportunity.urgency,
          JSON.stringify(opportunity.marketContext),
          opportunity.discoveredAt,
          opportunity.priority
        ]);
      } catch (error) {
        console.error(`Error storing opportunity ${opportunity.id}:`, error);
      }
    }
  }

  private updateOpportunityCache(opportunities: TradeOpportunity[]): void {
    // Group opportunities by user
    const userOpportunities = new Map<string, TradeOpportunity[]>();

    for (const opportunity of opportunities) {
      // Add to from_user's opportunities
      if (!userOpportunities.has(opportunity.fromUserId)) {
        userOpportunities.set(opportunity.fromUserId, []);
      }
      userOpportunities.get(opportunity.fromUserId)!.push(opportunity);

      // Add to to_user's opportunities
      if (!userOpportunities.has(opportunity.toUserId)) {
        userOpportunities.set(opportunity.toUserId, []);
      }
      userOpportunities.get(opportunity.toUserId)!.push(opportunity);
    }

    this.opportunityCache = userOpportunities;
  }

  // Public interface methods
  async getUserOpportunities(userId: string, limit: number = 10): Promise<TradeOpportunity[]> {
    try {
      // Check cache first
      const cached = this.opportunityCache.get(userId);
      if (cached) {
        return cached.slice(0, limit);
      }

      // Query database
      const result = await neonDb.query(`
        SELECT * FROM trade_opportunities
        WHERE (from_user_id = $1 OR to_user_id = $1)
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY priority DESC, discovered_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        proposedTrade: row.proposed_trade,
        analysis: row.analysis,
        reasoning: row.reasoning,
        urgency: row.urgency,
        marketContext: row.market_context,
        discoveredAt: new Date(row.discovered_at),
        priority: row.priority
      }));

    } catch (error) {
      console.error(`Error getting opportunities for ${userId}:`, error);
      return [];
    }
  }

  async scheduleNextScan(leagueId: string, delayHours: number = 6): Promise<void> {
    // In a real implementation, this would schedule a background job
    console.log(`📅 Scheduling next scan for league ${leagueId} in ${delayHours} hours`);
  }

  async getLastScanResults(leagueId: string): Promise<LeagueScanResult | null> {
    try {
      const result = await neonDb.query(`
        SELECT * FROM league_scan_results 
        WHERE league_id = $1 
        ORDER BY scan_completed_at DESC 
        LIMIT 1
      `, [leagueId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        totalCombinations: row.total_combinations,
        viableOpportunities: row.viable_opportunities,
        topOpportunities: [], // Would need to fetch separately
        marketInsights: row.market_insights || [],
        scanDuration: row.scan_duration,
        lastScan: new Date(row.scan_completed_at),
        nextScanScheduled: new Date(row.next_scan_scheduled)
      };

    } catch (error) {
      console.error('Error getting last scan results:', error);
      return null;
    }
  }
}

export const tradeOpportunityDetector = new TradeOpportunityDetector();