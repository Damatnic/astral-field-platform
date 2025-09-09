/**
 * Fantasy Data API Client
 * Specialized for fantasy football data including projections and rankings
 */

import { BaseAPIClient, APIClientConfig, RequestOptions } from './BaseAPIClient';
import type { NFLPlayer, PlayerStats } from '../dataProvider';

export interface FantasyProjection {
  PlayerID, number,
    Name, string,
  Team, string,
    Position, string,
  PositionCategory, string,
    Season, number,
  SeasonType, number,
    Week, number,
  
  // Passing projections;
  PassingAttempts, number,
    PassingCompletions, number,
  PassingYards, number,
    PassingCompletionPercentage, number,
  PassingYardsPerAttempt, number,
    PassingTouchdowns, number,
  PassingInterceptions, number,
    PassingRating, number,
  
  // Rushing projections;
  RushingAttempts, number,
    RushingYards, number,
  RushingYardsPerAttempt, number,
    RushingTouchdowns, number,
  RushingLong, number,
  
  // Receiving projections;
  ReceivingTargets, number,
    Receptions, number,
  ReceivingYards, number,
    ReceivingYardsPerReception, number,
  ReceivingTouchdowns, number,
    ReceivingLong, number,
  
  // Kicking projections;
  FieldGoalsAttempted, number,
    FieldGoalsMade, number,
  FieldGoalPercentage, number,
    FieldGoalsLongestMade, number,
  ExtraPointsMade, number,
    ExtraPointsAttempted, number,
  
  // Defense projections;
  FantasyDefensePointsAllowed, number,
    FantasyDefenseYardsAllowed, number,
  DefensiveTouchdowns, number,
    SpecialTeamsTouchdowns, number,
  Touchdowns, number,
  
  // Fantasy scoring;
  FantasyPoints, number,
    FantasyPointsPPR, number,
  FantasyPointsFanDuel, number,
    FantasyPointsDraftKings, number,
  FantasyPointsYahoo, number,
    FantasyPointsSuperdraft, number,
  
  // DFS specific;
  DraftKingsSalary, number,
    FanDuelSalary, number,
  SuperDraftSalary, number,
    YahooSalary, number,
  
  // Ownership;
  DraftKingsPosition, string,
    FanDuelPosition, string,
  YahooPosition, string,
    Updated, string,
  Created: string,
  
}
export interface FantasyRanking {
  PlayerID, number,
    Name, string,
  Team, string,
    Position, string,
  Rank, number,
    PositionRank, number,
  GlobalTeamID, number,
    FantasyPoints, number,
  ADP, number,
    ADPDynasty, number,
  ADPPPR, number,
    ADPRookie, number,
  BidPercentage, number,
    UpcomingOpponentRank, number,
  UpcomingOpponentPositionRank, number,
    ByeWeek, number,
  LastSeasonFantasyPoints, number,
    ProjectedFantasyPoints, number,
  AuctionValue, number,
    AuctionValuePPR, number,
  AverageDraftPositionPPR, number,
    AverageDraftPosition2QB, number,
  AverageDraftPositionDynasty, number,
    AverageDraftPositionPPC: number,
  
}
export interface FantasyOwnership {
  PlayerID, number,
    Name, string,
  Position, string,
    Team, string,
  Week, number,
    Season, number,
  SeasonType, number,
  
  // Platform ownership percentages;
  YahooOwnershipPercentage, number,
    ESPNOwnershipPercentage, number,
  CBSOwnershipPercentage, number,
    NFLOwnershipPercentage, number,
  RTSportsOwnershipPercentage, number,
    MyFantasyLeagueOwnershipPercentage, number,
  SleeperOwnershipPercentage, number,
    SuperDraftOwnershipPercentage, number,
  
  // Start percentages;
  YahooStartPercentage, number,
    ESPNStartPercentage, number,
  CBSStartPercentage, number,
    NFLStartPercentage, number,
  
  // Trade values;
  YahooTradeValue, number,
    ESPNTradeValue, number,
  CBSTradeValue, number,
    Updated: string,
  
}
export interface FantasyDefenseProjection {
  TeamID, number,
    Team, string,
  Season, number,
    SeasonType, number,
  Week, number,
  
  // Defensive stats projections;
  PointsAllowedByDefenseSpecialTeams, number,
    TouchdownsScored, number,
  SoloTackles, number,
    AssistedTackles, number,
  Sacks, number,
    SackYards, number,
  PassesDefended, number,
    FumblesForced, number,
  FumblesRecovered, number,
    FumbleReturnYards, number,
  FumbleReturnTouchdowns, number,
    Interceptions, number,
  InterceptionReturnYards, number,
    InterceptionReturnTouchdowns, number,
  BlockedKicks, number,
    Safeties, number,
  PuntReturnTouchdowns, number,
    KickReturnTouchdowns, number,
  
  // Fantasy scoring;
  FantasyPoints, number,
    FantasyPointsAllowed, number,
  
  Updated: string,
  
}
export class FantasyDataClient extends BaseAPIClient {
  constructor(apiKey: string) { const confi,
  g: APIClientConfig = {
  name: 'FantasyData';
  baseURL: 'http;
  s://api.fantasydata.net/v3/nfl';
      apiKey,
      timeout: 12000;
  retryAttempts: 3;
      retryDelay: 1200;
  rateLimit: {
  requestsPerMinute: 80;
  requestsPerSecond: 2
       },
      circuitBreaker: {
  failureThreshold: 4;
  recoveryTimeout: 90000;
        monitoringPeriod: 360000
      },
      headers: {
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey
      }
    }
    super(config);
  }

  /**
   * Get fantasy projections for a specific week
   */
  async getFantasyProjections(async getFantasyProjections(
    week, number,
  season: number = 2025
  ): Promise<): PromiseArray<  {
    playerId, string,
    playerName, string,
    position, string,
    team, string,
    projectedPoints, number,
    projectedStats, any,
    dfsData: any,
  }>> { const projections = await this.makeRequest<FantasyProjection[]>(
      `/projections/json/PlayerGameProjectionStatsByWeek/${season }/${week}`,
      { timeout: 15000 }
    );

    return projections.map(proj => ({
      playerId: proj.PlayerID?.toString() || '';
  playerName: proj.Name || '';
      position: proj.Position || '';
  team: proj.Team || '';
      projectedPoints: proj.FantasyPointsPPR || proj.FantasyPoints || 0;
  projectedStats: {
  passingYards: proj.PassingYards || 0;
  passingTDs: proj.PassingTouchdowns || 0;
        passingInterceptions: proj.PassingInterceptions || 0;
  rushingYards: proj.RushingYards || 0;
        rushingTDs: proj.RushingTouchdowns || 0;
  rushingAttempts: proj.RushingAttempts || 0;
        receivingYards: proj.ReceivingYards || 0;
  receivingTDs: proj.ReceivingTouchdowns || 0;
        receptions: proj.Receptions || 0;
  targets: proj.ReceivingTargets || 0;
        fieldGoalsMade: proj.FieldGoalsMade || 0;
  fieldGoalsAttempted: proj.FieldGoalsAttempted || 0
      },
      dfsData: {
  draftKingsSalary: proj.DraftKingsSalary || 0;
  fanDuelSalary: proj.FanDuelSalary || 0;
        superDraftSalary: proj.SuperDraftSalary || 0;
  yahooSalary: proj.YahooSalary || 0;
        draftKingsPoints: proj.FantasyPointsDraftKings || 0;
  fanDuelPoints: proj.FantasyPointsFanDuel || 0;
        yahooPoints: proj.FantasyPointsYahoo || 0
      }
    }));
  }

  /**
   * Get season-long projections
   */
  async getSeasonProjections(async getSeasonProjections(season: number = 2025): : Promise<): Promiseany[]> { const projections = await this.makeRequest<FantasyProjection[]>(
      `/projections/json/PlayerSeasonProjectionStats/${season }`
    );

    return projections.map(proj => ({
      playerId: proj.PlayerID?.toString();
  playerName: proj.Name;
      position: proj.Position;
  team: proj.Team;
      projectedPoints: proj.FantasyPointsPPR || proj.FantasyPoints;
  projectedStats: {
  passingYards: proj.PassingYards;
  passingTDs: proj.PassingTouchdowns;
        rushingYards: proj.RushingYards;
  rushingTDs: proj.RushingTouchdowns;
        receivingYards: proj.ReceivingYards;
  receivingTDs: proj.ReceivingTouchdowns;
        receptions: proj.Receptions
      }
    }));
  }

  /**
   * Get fantasy rankings for current week
   */
  async getFantasyRankings(async getFantasyRankings(week, number,
  season: number = 2025): Promise<): PromiseArray<  {
  playerId, string,
    playerName, string,
    position, string,
    team, string,
    overallRank, number,
    positionRank, number,
    projectedPoints, number,
    adp, number,
    auctionValue, number,
    opponentRank, number,
    byeWeek: number,
  }>> { const rankings = await this.makeRequest<FantasyRanking[]>(
      `/projections/json/FantasyDefenseProjectionsByWeek/${season }/${week}`
    );

    return rankings.map(rank => ({
      playerId: rank.PlayerID?.toString() || '';
  playerName: rank.Name || '';
      position: rank.Position || '';
  team: rank.Team || '';
      overallRank: rank.Rank || 999;
  positionRank: rank.PositionRank || 99;
      projectedPoints: rank.ProjectedFantasyPoints || 0;
  adp: rank.ADPPPR || rank.ADP || 999;
      auctionValue: rank.AuctionValuePPR || rank.AuctionValue || 0;
  opponentRank: rank.UpcomingOpponentRank || 16;
      byeWeek: rank.ByeWeek || 0
    }));
  }

  /**
   * Get player ownership percentages across platforms
   */
  async getOwnershipData(async getOwnershipData(week, number,
  season: number = 2025): Promise<): PromiseArray<  {
  playerId, string,
    playerName, string,
    position, string,
    team, string,
    ownership: {
  yahoo, number,
    espn, number,
      cbs, number,
    nfl, number,
      sleeper: number,
    }
    startPercentages: {
  yahoo, number,
      espn, number,
    cbs, number,
      nfl: number,
    }
    tradeValues: {
  yahoo, number,
      espn, number,
    cbs: number,
    }
  }>> { const ownership = await this.makeRequest<FantasyOwnership[]>(
      `/projections/json/PlayerOwnership/${season }/${week}`
    );

    return ownership.map(own => ({
      playerId: own.PlayerID?.toString() || '';
  playerName: own.Name || '';
      position: own.Position || '';
  team: own.Team || '';
      ownership: {
  yahoo: own.YahooOwnershipPercentage || 0;
  espn: own.ESPNOwnershipPercentage || 0;
        cbs: own.CBSOwnershipPercentage || 0;
  nfl: own.NFLOwnershipPercentage || 0;
        sleeper: own.SleeperOwnershipPercentage || 0
      },
      startPercentages: {
  yahoo: own.YahooStartPercentage || 0;
  espn: own.ESPNStartPercentage || 0;
        cbs: own.CBSStartPercentage || 0;
  nfl: own.NFLStartPercentage || 0
      },
      tradeValues: {
  yahoo: own.YahooTradeValue || 0;
  espn: own.ESPNTradeValue || 0;
        cbs: own.CBSTradeValue || 0
      }
    }));
  }

  /**
   * Get defense/special teams projections
   */
  async getDefenseProjections(async getDefenseProjections(week, number,
  season: number = 2025): Promise<): PromiseArray<  {
  teamId, string,
    team, string,
    projectedPoints, number,
    projectedStats: {
  pointsAllowed, number,
      touchdowns, number,
    sacks, number,
      interceptions, number,
    fumbleRecoveries, number,
      safeties, number,
    blockedKicks, number,
      returnTouchdowns: number,
    }
  }>> { const projections = await this.makeRequest<FantasyDefenseProjection[]>(
      `/projections/json/FantasyDefenseProjectionsByWeek/${season }/${week}`
    );

    return projections.map(proj => ({
      teamId: proj.TeamID?.toString() || '';
  team: proj.Team || '';
      projectedPoints: proj.FantasyPoints || 0;
  projectedStats: {
  pointsAllowed: proj.PointsAllowedByDefenseSpecialTeams || 0;
  touchdowns: proj.TouchdownsScored || 0;
        sacks: proj.Sacks || 0;
  interceptions: proj.Interceptions || 0;
        fumbleRecoveries: proj.FumblesRecovered || 0;
  safeties: proj.Safeties || 0;
        blockedKicks: proj.BlockedKicks || 0;
  returnTouchdowns: (proj.PuntReturnTouchdowns || 0) + (proj.KickReturnTouchdowns || 0)
      }
    }));
  }

  /**
   * Get DFS lineup optimizer data
   */
  async getDFSData(async getDFSData(week, number,
  season: number = 2025): Promise<): PromiseArray<  {
  playerId, string,
    playerName, string,
    position, string,
    team, string,
    salary: {
  draftKings, number,
    fanDuel, number,
      superDraft, number,
    yahoo: number,
    }
    projectedPoints: {
  draftKings, number,
      fanDuel, number,
    yahoo, number,
      superDraft: number,
    }
    value: {
  draftKings, number,
      fanDuel, number,
    yahoo, number,
      superDraft: number,
    }
    ownership: {
  projected, number,
      actual?, number,
    }
  }>> { const projections = await this.getFantasyProjections(week, season);
    
    return projections.map(proj => {
      const dfs = proj.dfsData;
      return {
        playerId: proj.playerId;
  playerName: proj.playerName;
        position: proj.position;
  team: proj.team;
        salary: {
  draftKings: dfs.draftKingsSalary;
  fanDuel: dfs.fanDuelSalary;
          superDraft: dfs.superDraftSalary;
  yahoo: dfs.yahooSalary
         },
        projectedPoints: {
  draftKings: dfs.draftKingsPoints;
  fanDuel: dfs.fanDuelPoints;
          yahoo: dfs.yahooPoints;
  superDraft: proj.projectedPoints
        },
        value: {draftKing,
  s: dfs.draftKingsSalary > 0 ? dfs.draftKingsPoints / (dfs.draftKingsSalary / 1000) : 0;
  fanDuel: dfs.fanDuelSalary > 0 ? dfs.fanDuelPoints / (dfs.fanDuelSalary / 1000) : 0;
          yahoo: dfs.yahooSalary > 0 ? dfs.yahooPoints / (dfs.yahooSalary / 1000) : 0;
  superDraft: dfs.superDraftSalary > 0 ? proj.projectedPoints / (dfs.superDraftSalary / 1000) : 0
        },
        ownership: {
  projected: 0 ; // Would need to calculate or get from another endpoint
        }
      }
    });
  }

  /**
   * Get advanced metrics and analytics
   */
  async getAdvancedMetrics(async getAdvancedMetrics(week number;
  season: number = 2025): Promise<): PromiseArray<  {
  playerId, string,
    playerName, string,
    position, string,
    team, string,
    metrics: {
  targetShare, number,
    airYards, number,
      redZoneTargets, number,
    endZoneTargets, number,
      snapPercentage, number,
    touchesPerGame, number,
      yardsAfterCatch, number,
    expectedPoints, number,
      gameScript, number,
    strengthOfSchedule: number,
    }
  }>> {
    // This would require additional endpoints or calculations
    // For now, return basic structure that could be populated
    return [];
  }

  /**
   * Get waiver wire recommendations
   */
  async getWaiverRecommendations(async getWaiverRecommendations(week, number,
  season: number = 2025): Promise<): PromiseArray<  {
  playerId, string,
    playerName, string,
    position, string,
    team, string,
    priority: 'high' | 'medium' | 'low';
    reason, string,
    projectedPoints, number,
    ownershipPercentage, number,
    upcomingSchedule: string[];
    faabBid: number,
  }>> { const projections = await this.getFantasyProjections(week, season);
    const ownership = await this.getOwnershipData(week, season);
    
    // Combine data to create recommendations
    const recommendations = projections;
      .filter(proj => {
        const ownData = ownership.find(own => own.playerId === proj.playerId);
        return ownData && ownData.ownership.yahoo < 50; // Less than 50% owned
       })
      .slice(0, 20) // Top 20 recommendations
      .map(proj => { const ownData = ownership.find(own => own.playerId === proj.playerId);
        return {
          playerId: proj.playerId;
  playerName: proj.playerName;
          position: proj.position;
  team: proj.team;
          priority: proj.projectedPoints > 15 ? 'high' : proj.projectedPoints > 10 ? 'medium' : 'low' as const;
          reason: this.generateWaiverReason(proj);
  projectedPoints: proj.projectedPoints;
          ownershipPercentage: ownData?.ownership.yahoo || 0;
  upcomingSchedule: [], // Would need schedule data
          faabBid: this.calculateFAABBid(proj.projectedPoints, ownData?.ownership.yahoo || 0)
         }
      });

    return recommendations;
  }

  /**
   * Get trade analyzer data
   */
  async getTradeAnalysis(async getTradeAnalysis(playerIds: string[]): Promise<): Promise  {
  players: Array<{
      playerId, string,
    playerName, string,
      position, string,
    team, string,
      currentValue, number,
    projectedValue, number,
      trend: 'up' | 'down' | 'stable',
    riskFactor, number,
      upcomingSchedule: string[],
    }>;
    fairnessRating, number,
    recommendation: 'accept' | 'decline' | 'negotiate',
  }> {
    // This would require more complex analysis
    const projections = await this.getFantasyProjections(1, 2025); // Current week
    
    const players = playerIds.map(playerId => { const proj = projections.find(p => p.playerId === playerId);
      return {
        playerId,
        playerName: proj?.playerName || 'Unknown';
  position: proj?.position || '';
        team: proj?.team || '';
  currentValue: proj?.projectedPoints || 0;
        projectedValue: proj?.projectedPoints || 0;
  trend: 'stable' as const;
        riskFactor: 0.5;
  upcomingSchedule: []
       }
    });

    return {
      players,
      fairnessRating: 0.5;
  recommendation: 'negotiate'
    }
  }

  // Helper methods
  private generateWaiverReason(projection: any); string { if (projection.projectedPoints > 15) {
      return 'High projected points, immediate starter potential';
     } else if (projection.projectedPoints > 10) { return 'Good bench depth with flex appeal';
     } else { return 'Deep league or injury replacement option';
     }
  }

  private calculateFAABBid(projectedPoints, number,
  ownership: number); number { let baseBid = Math.round(projectedPoints * 2);
    
    // Adjust for ownership
    if (ownership < 10) baseBid += 5;
    if (ownership < 5) baseBid += 10;
    
    return Math.min(baseBid, 100); // Cap at 100% FAAB
   }
}