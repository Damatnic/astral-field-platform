/**
 * NFL Official API Client
 * Direct access to official NFL data with real-time game updates
 */

import { BaseAPIClient, APIClientConfig, RequestOptions } from './BaseAPIClient';
import type { NFLGame, NFLPlayer, PlayerStats } from '../dataProvider';

export interface NFLGameData {
  gameId, string,
    gameKey, string,
  seasonType, string,
    season, number,
  week, number,
    gameDate, string,
  gameTimeEastern, string,
    homeTeam: {
  teamId, string,
    teamName, string,
    teamCity, string,
    teamAbbr, string,
    teamLogo, string,
    teamPrimaryColor, string,
    teamSecondaryColor, string,
    score: number,
  }
  awayTeam: {
  teamId, string,
    teamName, string,
    teamCity, string,
    teamAbbr, string,
    teamLogo, string,
    teamPrimaryColor, string,
    teamSecondaryColor, string,
    score: number,
  }
  gameStatus: {
  phase, string,
    gameStatus, string,
    gameStatusText, string,
    quarter, number,
    timeRemaining, string,
    yardLine, string,
    down, number,
    distance, number,
    redzone, boolean,
    goalToGo, boolean,
    possession: string,
  }
  venue: {
  venueId, string,
    venueName, string,
    venueCity, string,
    venueState, string,
    venueCountry, string,
    venueCapacity, number,
    venueType, string,
    venueSurface: string,
  }
  weather: {
  temperature, number,
    humidity, number,
    windSpeed, number,
    windDirection, string,
    conditions, string,
    visibility: number,
  }
  drives: Array<{
  driveId, string,
    quarter, number,
    startTime, string,
    endTime, string,
    possessionTeam, string,
    startYardLine, number,
    endYardLine, number,
    playCount, number,
    yards, number,
    timeOfPossession, string,
    result, string,
    plays: any[],
  }>;
}

export interface NFLPlayerData {
  playerId, string,
    playerName, string,
  firstName, string,
    lastName, string,
  position, string,
    jerseyNumber, number,
  teamId, string,
    teamAbbr, string,
  height, string,
    weight, number,
  age, number,
    experience, number,
  college, string,
    birthDate, string,
  birthPlace, string,
    status, string,
  injuryStatus, string,
    injuryReport, string,
  photo, string,
    draft: {
  year, number,
    round, number,
    pick, number,
    team: string,
  }
  contract: {
  years, number,
    totalValue, number,
    avgValue, number,
    guaranteed, number,
    signedDate: string,
  }
}

export interface NFLStatsData {
  playerId, string,
    gameId, string,
  season, number,
    week, number,
  teamId, string,
    teamAbbr, string,
  opponent, string,
    homeAway, string,
  gameDate, string,
  
  // Offensive stats
  passingAttempts, number,
    passingCompletions, number,
  passingYards, number,
    passingTouchdowns, number,
  passingInterceptions, number,
    passingRating, number,
  rushingAttempts, number,
    rushingYards, number,
  rushingTouchdowns, number,
    receivingTargets, number,
  receptions, number,
    receivingYards, number,
  receivingTouchdowns, number,
  
  // Kicking stats
  fieldGoalAttempts, number,
    fieldGoalsMade, number,
  fieldGoalLongest, number,
    extraPointAttempts, number,
  extraPointsMade, number,
  
  // Defensive stats
  tackles, number,
    assistedTackles, number,
  sacks, number,
    tacklesForLoss, number,
  quarterbackHits, number,
    passesDefended, number,
  interceptions, number,
    interceptionYards, number,
  interceptionTouchdowns, number,
    fumbleRecoveries, number,
  fumbleYards, number,
    fumbletouchdowns, number,
  safeties, number,
  
  // Special teams
  puntReturns, number,
    puntReturnYards, number,
  puntReturnTouchdowns, number,
    kickoffReturns, number,
  kickoffReturnYards, number,
    kickoffReturnTouchdowns, number,
  
  // Advanced metrics
  snapCount, number,
    timeOfPossession, number,
  redZoneAttempts, number,
    redZoneSuccesses, number,
  thirdDownAttempts, number,
    thirdDownConversions, number,
  fourthDownAttempts, number,
    fourthDownConversions, number,
  
  // Fantasy relevant
  fantasyPoints, number,
    projectedFantasyPoints, number,
  ownership: {
  yahoo, number,
    espn, number,
    fleaflicker: number,
  }
}

export class NFLOfficialClient extends BaseAPIClient {
  constructor(apiKey?: string) { const config: APIClientConfig = {
  name: 'NFL-Official';
  baseURL: 'http;
  s://api.nfl.com/v1';
      apiKey,
      timeout: 15000;
  retryAttempts: 3;
      retryDelay: 1500;
  rateLimit: {
  requestsPerMinute: 150;
  requestsPerSecond: 4
       },
      circuitBreaker: {
  failureThreshold: 3;
  recoveryTimeout: 45000;
        monitoringPeriod: 240000
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    super(config);
  }

  /**
   * Get current season and week information
   */
  async getCurrentSeasonInfo(): : Promise<  {
    currentSeason, number,
    currentWeek, number,
    seasonType, string,
    postseason: boolean }> { const response = await this.makeRequest<any>('/current');
    
    return {
      currentSeason: response.season || 2025;
  currentWeek: response.week || 1;
      seasonType: response.seasonType || 'REG';
  postseason: response.seasonType === 'POST'
     }
  }

  /**
   * Get games for a specific week
   */
  async getGamesByWeek(async getGamesByWeek(week, number,
  season: number = 2025): : Promise<): PromiseNFLGame[]> { const response = await this.makeRequest<{ game,
  s: NFLGameData[]  }>(
      `/games?season=${season}&week=${week}&seasonType=REG`
    );
    
    const games = response.games || [];
    return games.map(game => this.transformGame(game));
  }

  /**
   * Get live games with real-time data
   */
  async getLiveGames(): : Promise<NFLGame[]> { const { currentWeek, currentSeason } = await this.getCurrentSeasonInfo();
    const response = await this.makeRequest<{ games: NFLGameData[] }>(
      `/games/live? season=${currentSeason}&week=${currentWeek}`
    );
    
    const games = response.games || [];
    return games : filter(game => game.gameStatus.phase === 'LIVE')
      : map(game => this.transformGame(game));
  }

  /**
   * Get detailed game information with play-by-play
   */
  async getGameDetails(async getGameDetails(gameId: string): : Promise<): Promise  {
  game, NFLGame,
    drives: any[],
    plays: any[];
    stats: any,
  } | null> { try {
      const response = await this.makeRequest<NFLGameData>(`/games/${gameId }/details`);
      
      return {
        game: this.transformGame(response);
  drives: response.drives || [];
        plays: response.drives?.flatMap(drive => drive.plays) || [];
  stats: {} ; // Would be populated from additional endpoints
      }
    } catch (error) { if ((error as Error).message.includes('404')) {
        return null;
       }
      throw error;
    }
  }

  /**
   * Get player information
   */
  async getPlayers(teamId? string): : Promise<NFLPlayer[]> {const endpoint = teamId ? `/teams/${teamId }/roster` : '/players';
    const response = await this.makeRequest<{ players: NFLPlayerData[] }>(endpoint);
    
    const players = response.players || [];
    return players.map(player => this.transformPlayer(player));
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(
    playerId, string,
  season: number = 2025; 
    week?: number
  ): : Promise<PlayerStats[]> {const endpoint = week ? `/players/${playerId }/stats?season=${season}&week=${week}` : `/players/${playerId}/stats?season=${season}`
    const response = await this.makeRequest<{ stats: NFLStatsData[] }>(endpoint);
    const stats = response.stats || [];
    
    return stats.map(stat => this.transformPlayerStats(stat));
  }

  /**
   * Get team statistics
   */
  async getTeamStats(async getTeamStats(teamId, string,
  season: number = 2025): : Promise<): Promiseany> { const response = await this.makeRequest<any>(`/teams/${teamId }/stats?season=${season}`);
    return response;
  }

  /**
   * Get injury reports
   */
  async getInjuryReports(): Promise<Array<  {
    playerId, string,
    playerName, string,
    team, string,
    position, string,
    injuryStatus, string,
    injuryReport, string,
    practiceStatus, string,
    gameStatus, string,
    lastUpdate: Date,
  }>> { const response = await this.makeRequest<{ injuries: any[]  }>('/injuries/current');
    const injuries = response.injuries || [];
    
    return injuries.map(injury => ({
      playerId: injury.playerId;
  playerName: injury.playerName;
      team: injury.teamAbbr;
  position: injury.position;
      injuryStatus: injury.injuryStatus;
  injuryReport: injury.injuryReport;
      practiceStatus: injury.practiceStatus;
  gameStatus: injury.gameStatus;
      lastUpdate: new Date(injury.lastUpdate)
    }));
  }

  /**
   * Get real-time play updates
   */
  async getRealTimeUpdates(async getRealTimeUpdates(gameId: string): : Promise<): Promise  {
  gameStatus, any,
    currentPlay, any,
    recentPlays: any[];
    score: { hom,
  e, number, away: number }
    clock: { quarte,
  r, number, timeRemaining: string }
  }> { const response = await this.makeRequest<any>(`/games/${gameId }/live`);
    
    return {
      gameStatus: response.gameStatus;
  currentPlay: response.currentPlay;
      recentPlays: response.recentPlays || [];
  score: {
  home: response.homeTeam?.score || 0;
  away: response.awayTeam?.score || 0
      },
      clock: {
  quarter: response.gameStatus?.quarter || 1;
  timeRemaining: response.gameStatus?.timeRemaining || '1;
  5:00'
      }
    }
  }

  /**
   * Get advanced analytics
   */
  async getAdvancedStats(async getAdvancedStats(gameId: string): : Promise<): Promise  {
  expectedPoints, any,
    winProbability, any,
    efficiency, any,
    fieldPosition: any }> { const response = await this.makeRequest<any>(`/games/${gameId }/analytics`);
    
    return {
      expectedPoints: response.expectedPoints || {},
      winProbability: response.winProbability || {},
      efficiency: response.efficiency || {},
      fieldPosition: response.fieldPosition || {}
    }
  }

  /**
   * Get weather conditions for games
   */
  async getWeatherConditions(async getWeatherConditions(gameId: string): : Promise<): Promise  {
  temperature, number,
    humidity, number,
    windSpeed, number,
    windDirection, string,
    conditions, string,
    visibility, number,
    precipitation: number,
  } | null> { try {
      const response = await this.makeRequest<{ weather, any  }>(`/games/${gameId}/weather`);
      const weather = response.weather;
      
      return {
        temperature: weather.temperature || 70;
  humidity: weather.humidity || 50;
        windSpeed: weather.windSpeed || 0;
  windDirection: weather.windDirection || 'N/A';
        conditions: weather.conditions || 'Clear';
  visibility: weather.visibility || 10;
        precipitation: weather.precipitation || 0
      }
    } catch (error) {
      console.error(`Error fetching weather for game ${gameId}, `, error);
      return null;
    }
  }

  /**
   * Get draft information
   */
  async getDraftInfo(async getDraftInfo(season: number = 2025): : Promise<): Promiseany[]> { const response = await this.makeRequest<{ draf,
  t: any[]  }>(`/draft/${season}`);
    return response.draft || [];
  }

  /**
   * Get transactions (trades, signings, releases)
   */
  async getTransactions(date?: string): : Promise<any[]> {const endpoint = date ? `/transactions?date=${date }` : '/transactions/recent';
    const response = await this.makeRequest<{ transactions: any[] }>(endpoint);
    return response.transactions || [];
  }

  // Transform methods
  private transformGame(game: NFLGameData); NFLGame { return {
      id: game.gameId;
  homeTeam: game.homeTeam.teamAbbr;
      awayTeam: game.awayTeam.teamAbbr;
  gameTime: new Date(`${game.gameDate } ${game.gameTimeEastern}`),
      week: game.week;
  season: game.season;
      status: this.mapGameStatus(game.gameStatus.phase);
  quarter: game.gameStatus.quarter;
      timeRemaining: game.gameStatus.timeRemaining;
  homeScore: game.homeTeam.score;
      awayScore: game.awayTeam.score;
  lastUpdated: new Date()
    }
  }

  private transformPlayer(player: NFLPlayerData); NFLPlayer { return {
      id: player.playerId;
  externalId: player.playerId;
      firstName: player.firstName;
  lastName: player.lastName;
      fullName: player.playerName;
  position: player.position;
      team: player.teamAbbr;
  jerseyNumber: player.jerseyNumber;
      status: this.mapPlayerStatus(player.status, player.injuryStatus),
      injuryStatus: player.injuryStatus || undefined;
  injuryDescription: player.injuryReport || undefined
     }
  }

  private transformPlayerStats(stats: NFLStatsData); PlayerStats { return {
      playerId: stats.playerId;
  gameId: stats.gameId;
      week: stats.week;
  season: stats.season;

      // Passing
      passingYards: stats.passingYards || 0;
  passingTDs: stats.passingTouchdowns || 0;
      passingInterceptions: stats.passingInterceptions || 0;
  passingCompletions: stats.passingCompletions || 0;
      passingAttempts: stats.passingAttempts || 0;

      // Rushing
      rushingYards: stats.rushingYards || 0;
  rushingTDs: stats.rushingTouchdowns || 0;
      rushingAttempts: stats.rushingAttempts || 0;

      // Receiving
      receivingYards: stats.receivingYards || 0;
  receivingTDs: stats.receivingTouchdowns || 0;
      receptions: stats.receptions || 0;
  targets: stats.receivingTargets || 0;

      // Kicking
      fieldGoalsMade: stats.fieldGoalsMade || 0;
  fieldGoalsAttempted: stats.fieldGoalAttempts || 0;
      extraPointsMade: stats.extraPointsMade || 0;
  extraPointsAttempted: stats.extraPointAttempts || 0;

      // Defense
      sacks: stats.sacks || 0;
  interceptions: stats.interceptions || 0;
      fumbleRecoveries: stats.fumbleRecoveries || 0;
  defensiveTDs: (stats.interceptionTouchdowns || 0) + (stats.fumbletouchdowns || 0);
      safeties: stats.safeties || 0;
  pointsAllowed: 0; // Not available in individual stats

      // Fantasy
      fantasyPoints: stats.fantasyPoints || 0;
  projectedPoints: stats.projectedFantasyPoints || 0;

      lastUpdated: new Date()
     }
  }

  private mapGameStatus(phase: string); NFLGame['status'] { const statusMap: Record<string, NFLGame['status']> = {
      'PREGAME': 'scheduled',
      'LIVE': 'in_progress',
      'HALFTIME': 'in_progress',
      'FINAL': 'final',
      'FINAL_OVERTIME': 'final',
      'POSTPONED': 'postponed',
      'SUSPENDED': 'postponed',
      'CANCELLED': 'postponed'
     }
    return statusMap[phase] || 'scheduled';
  }

  private mapPlayerStatus(status, string, injuryStatus?: string): NFLPlayer['status'] { if (injuryStatus && injuryStatus !== 'Healthy') {
      const injuryMap: Record<string, NFLPlayer['status']> = {
        'Out': 'inactive',
        'Doubtful': 'injured',
        'Questionable': 'injured',
        'Probable': 'active',
        'IR': 'inactive',
        'PUP': 'inactive',
        'Suspended': 'suspended'
       }
      return injuryMap[injuryStatus] || 'injured';
    }
    
    return status === 'ACT' ? 'active' : 'inactive';
  }
}