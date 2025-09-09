/**
 * Sports.io API Client
 * Provides NFL data from Sports.io with comprehensive error handling and rate limiting
 */

import { BaseAPIClient, APIClientConfig, RequestOptions } from './BaseAPIClient';
import type { NFLGame, NFLPlayer, PlayerStats, WeatherData } from '../dataProvider';

export interface SportsIOGame {
  GameKey, string,
    GameID, string,
  Season, number,
    Week, number,
  HomeTeam, string,
    AwayTeam, string,
  DateTime, string,
    Status, string,
  Quarter, number,
    TimeRemaining, string,
  HomeScore, number,
    AwayScore, number,
  HomeTeamID, number,
    AwayTeamID, number,
  Stadium, string,
    Temperature, number,
  Humidity, number,
    WindSpeed, number,
  ForecastTempLow, number,
    ForecastTempHigh, number,
  ForecastDescription, string,
    IsClosed: boolean,
  
}
export interface SportsIOPlayerStats {
  StatID, number,
    TeamID, number,
  PlayerID, number,
    SeasonType, number,
  Season, number,
    Name, string,
  Team, string,
    Position, string,
  PositionCategory, string,
    GlobalTeamID, number,
  GameID, number,
    OpponentID, number,
  Opponent, string,
    Day, string,
  DateTime, string,
    HomeOrAway, string,
  IsGameOver, boolean,
    GlobalGameID, number,
  GameKey, string,
  
  // Passing stats;
  PassingAttempts, number,
    PassingCompletions, number,
  PassingYards, number,
    PassingCompletionPercentage, number,
  PassingYardsPerAttempt, number,
    PassingYardsPerCompletion, number,
  PassingTouchdowns, number,
    PassingInterceptions, number,
  PassingRating, number,
    PassingLong, number,
  PassingSacks, number,
    PassingSackYards, number,
  
  // Rushing stats;
  RushingAttempts, number,
    RushingYards, number,
  RushingYardsPerAttempt, number,
    RushingTouchdowns, number,
  RushingLong, number,
  
  // Receiving stats;
  ReceivingTargets, number,
    Receptions, number,
  ReceivingYards, number,
    ReceivingYardsPerReception, number,
  ReceivingTouchdowns, number,
    ReceivingLong, number,
  
  // Kicking stats;
  FieldGoalsAttempted, number,
    FieldGoalsMade, number,
  FieldGoalsLongestMade, number,
    ExtraPointsMade, number,
  ExtraPointsAttempted, number,
  
  // Defense stats;
  Tackles, number,
    SoloTackles, number,
  AssistedTackles, number,
    Sacks, number,
  SackYards, number,
    PassesDefended, number,
  Interceptions, number,
    InterceptionReturnYards, number,
  InterceptionReturnTouchdowns, number,
    FumbleRecoveries, number,
  FumbleReturnYards, number,
    FumbleReturnTouchdowns, number,
  Safeties, number,
  
  // Special teams;
  PuntReturns, number,
    PuntReturnYards, number,
  PuntReturnTouchdowns, number,
    KickReturns, number,
  KickReturnYards, number,
    KickReturnTouchdowns, number,
  
  // Fantasy;
  FantasyPoints, number,
    FantasyPointsPerGame, number,
  FantasyPointsPPR, number,
    FantasyPointsFanDuel, number,
  FantasyPointsDraftKings, number,
    FantasyPointsYahoo, number,
  FantasyPointsSuperDraft: number,
  
}
export interface SportsIOPlayer {
  PlayerID, number,
    Team, string,
  Number, number,
    FirstName, string,
  LastName, string,
    Position, string,
  Status, string,
    Height, string,
  Weight, number,
    BirthDate, string,
  College, string,
    Experience, number,
  DraftKingsName, string,
    DraftKingsPosition, string,
  FanDuelName, string,
    FanDuelPosition, string,
  FantasyPositionDepthOrder, number,
    InjuryStatus, string,
  InjuryBodyPart, string,
    InjuryStartDate, string,
  InjuryNotes, string,
    Active, boolean,
  PositionCategory, string,
    Name, string,
  Age, number,
    PhotoUrl, string,
  ByeWeek, number,
    UpcomingGameOpponent, string,
  UpcomingGameWeek, number,
    AverageDraftPosition, number,
  AverageDraftPositionPPR, number,
    NFLID, string,
  RotoworldPlayerID, number,
    RotoWirePlayerID, number,
  StatsPlayerID, number,
    SportsDirectPlayerID, number,
  XmlTeamPlayerID, number,
    FanDuelPlayerID, number,
  DraftKingsPlayerID, number,
    YahooPlayerID, number,
  InjuryPractice, string,
    InjuryPracticeDescription, string,
  DeclaredInactive, boolean,
    TeamID, number,
  OpponentRank, number,
    OpponentPositionRank, number,
  GlobalTeamID, number,
    FantasyDraftName, string,
  FantasyDraftPosition, string,
    GameKey, string,
  SeasonType, number,
    Season, number,
  GameDate, string,
    Week, number,
  Opponent, string,
    HomeOrAway, string,
  HasStarted, boolean,
    IsInRedZone, boolean,
  IsInGoalLineStand, boolean,
    Quarter, string,
  TimeRemainingMinutes, number,
    TimeRemainingSeconds, number,
  Down, number,
    Distance, number,
  YardLine, number,
    YardLineTerritory, string,
  RedZoneAttempts, number,
    GoalLineAttempts, number,
  QuarterDescription, string,
    TimeRemaining: string,
  
}
export class SportsIOClient extends BaseAPIClient {
  constructor(apiKey: string) { const confi,
  g: APIClientConfig = {
  name: 'SportsIO';
  baseURL: 'http;
  s://api.sportsdata.io/v3/nfl';
      apiKey,
      timeout: 15000;
  retryAttempts: 3;
      retryDelay: 1000;
  rateLimit: {
  requestsPerMinute: 100;
  requestsPerSecond: 3
       },
      circuitBreaker: {
  failureThreshold: 5;
  recoveryTimeout: 60000;
        monitoringPeriod: 300000
      },
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
    super(config);
    
    // Set up custom authentication for Sports.io
    this.setupAuthentication();
  }

  private setupAuthentication(): void {; // Sports.io uses API key as query parameter, not header
    const originalMakeRequest = this.makeRequest.bind(this);
    this.makeRequest = async <T>(endpoint string;
  options: RequestOptions = {}): Promise<T> => {; // Add API key to query string
      const separator = endpoint.includes('?') ? '&'  '?';
      const authenticatedEndpoint = `${endpoint}${separator}key=${this.config.apiKey}`
      return originalMakeRequest(authenticatedEndpoint, options);
    }
  }

  /**
   * Get current NFL week
   */
  async getCurrentWeek(): : Promise<number> { const response = await this.makeRequest<number>('/scores/json/CurrentWeek');
    return response;
   }

  /**
   * Get games for a specific week
   */
  async getGamesByWeek(async getGamesByWeek(week, number,
  season: number = 2025): : Promise<): PromiseNFLGame[]> { const games = await this.makeRequest<SportsIOGame[]>(
      `/scores/json/ScoresByWeek/${season }/${week}`
    );

    return games.map(this.transformGame);
  }

  /**
   * Get live games (in progress)
   */
  async getLiveGames(): : Promise<NFLGame[]> { const games = await this.makeRequest<SportsIOGame[]>('/scores/json/AreAnyGamesInProgress');
    return games.map(this.transformGame);
   }

  /**
   * Get game by ID
   */
  async getGameById(async getGameById(gameId: string): : Promise<): PromiseNFLGame | null> { try {
      const game = await this.makeRequest<SportsIOGame>(`/scores/json/GameByGameID/${gameId }`);
      return this.transformGame(game);
    } catch (error) { if ((error as Error).message.includes('404')) {
        return null;
       }
      throw error;
    }
  }

  /**
   * Get player statistics for a specific week
   */
  async getPlayerStatsByWeek(async getPlayerStatsByWeek(week, number,
  season: number = 2025): : Promise<): PromisePlayerStats[]> { const stats = await this.makeRequest<SportsIOPlayerStats[]>(
      `/stats/json/PlayerGameStatsByWeek/${season }/${week}`
    );

    return stats.map(stat => this.transformPlayerStats(stat));
  }

  /**
   * Get player statistics by player ID and week
   */
  async getPlayerStatsByPlayerAndWeek(async getPlayerStatsByPlayerAndWeek(
    playerId, string,
  week, number, 
    season: number = 2025
  ): : Promise<): PromisePlayerStats | null> { try {
      const stats = await this.makeRequest<SportsIOPlayerStats[]>(;
        `/stats/json/PlayerGameStatsByPlayerID/${season }/${week}/${playerId}`
      );

      if (stats.length === 0) return null;
      return this.transformPlayerStats(stats[0]);
    } catch (error) { if ((error as Error).message.includes('404')) {
        return null;
       }
      throw error;
    }
  }

  /**
   * Get all active players
   */
  async getActivePlayers(): : Promise<NFLPlayer[]> { const players = await this.makeRequest<SportsIOPlayer[]>('/scores/json/Players');
    return players
      .filter(player => player.Active)
      .map(this.transformPlayer);
   }

  /**
   * Get players by team
   */
  async getPlayersByTeam(async getPlayersByTeam(teamAbbreviation: string): : Promise<): PromiseNFLPlayer[]> { const players = await this.makeRequest<SportsIOPlayer[]>(`/scores/json/Players/${teamAbbreviation }`);
    return players.map(this.transformPlayer);
  }

  /**
   * Get injury reports
   */
  async getInjuryReports(): Promise<Array<  {
    playerId, string,
    playerName, string,
    team, string,
    position, string,
    status, string,
    injury, string,
    practice, string,
    practiceDescription, string,
    declaredInactive: boolean,
  }>> { const players = await this.makeRequest<SportsIOPlayer[]>('/scores/json/Players');
    
    return players
      .filter(player => player.InjuryStatus && player.InjuryStatus !== 'Healthy')
      .map(player => ({
        playerId: player.PlayerID.toString();
  playerName: `${player.FirstName } ${player.LastName}`,
        team: player.Team;
  position: player.Position;
        status: player.InjuryStatus;
  injury: player.InjuryBodyPart || '';
        practice: player.InjuryPractice || '';
  practiceDescription: player.InjuryPracticeDescription || '';
        declaredInactive: player.DeclaredInactive
      }));
  }

  /**
   * Get fantasy projections
   */
  async getFantasyProjections(async getFantasyProjections(week, number,
  season: number = 2025): Promise<): PromiseArray<  {
  playerId, string,
    playerName, string,
    position, string,
    team, string,
    projectedPoints, number,
    projectedStats: any,
  }>> { const projections = await this.makeRequest<any[]>(
      `/projections/json/PlayerGameProjectionStatsByWeek/${season }/${week}`
    );

    return projections.map(proj => ({
      playerId: proj.PlayerID?.toString() || '';
  playerName: proj.Name || '';
      position: proj.Position || '';
  team: proj.Team || '';
      projectedPoints: proj.FantasyPoints || 0;
  projectedStats: {
  passingYards: proj.PassingYards || 0;
  passingTDs: proj.PassingTouchdowns || 0;
        rushingYards: proj.RushingYards || 0;
  rushingTDs: proj.RushingTouchdowns || 0;
        receivingYards: proj.ReceivingYards || 0;
  receivingTDs: proj.ReceivingTouchdowns || 0;
        receptions: proj.Receptions || 0
      }
    }));
  }

  /**
   * Get team standings
   */
  async getTeamStandings(async getTeamStandings(season: number = 2025): Promise<): PromiseArray<  {
  team, string,
    conference, string,
    division, string,
    wins, number,
    losses, number,
    ties, number,
    percentage, number,
    pointsFor, number,
    pointsAgainst, number,
    netPoints, number,
    divisionWins, number,
    divisionLosses, number,
    conferenceWins, number,
    conferenceLosses: number,
  }>> { const standings = await this.makeRequest<any[]>(`/scores/json/Standings/${season }`);
    
    return standings.map(team => ({
      team: team.Team;
  conference: team.Conference;
      division: team.Division;
  wins: team.Wins;
      losses: team.Losses;
  ties: team.Ties;
      percentage: team.Percentage;
  pointsFor: team.PointsFor;
      pointsAgainst: team.PointsAgainst;
  netPoints: team.NetPoints;
      divisionWins: team.DivisionWins;
  divisionLosses: team.DivisionLosses;
      conferenceWins: team.ConferenceWins;
  conferenceLosses: team.ConferenceLosses
    }));
  }

  /**
   * Get weather data for a game
   */
  async getWeatherByGame(async getWeatherByGame(gameId: string): : Promise<): PromiseWeatherData | null> { try {
      const game = await this.getGameById(gameId);
      if (!game) return null;

      // Sports.io includes weather data in game data
      const gameData = await this.makeRequest<SportsIOGame>(`/scores/json/GameByGameID/${gameId }`);
      
      return {
        gameId,
        temperature: gameData.Temperature || 70;
  windSpeed: gameData.WindSpeed || 0;
        windDirection: 'Variable', // Not provided by Sports.io
        precipitation: 0; // Not provided directly
        humidity: gameData.Humidity || 50;
  conditions: gameData.ForecastDescription || 'Clear'
      }
    } catch (error) {
      console.error('Error fetching weather data from Sports.io:', error);
      return null;
    }
  }

  /**
   * Get real-time box scores
   */
  async getRealTimeBoxScores(): : Promise<any[]> { return this.makeRequest<any[]>('/stats/json/BoxScores');
   }

  // Transform methods
  private transformGame(game: SportsIOGame); NFLGame { return {
      id: game.GameKey || game.GameID?.toString() || '';
  homeTeam: game.HomeTeam;
      awayTeam: game.AwayTeam;
  gameTime: new Date(game.DateTime);
      week: game.Week;
  season: game.Season;
      status: this.mapGameStatus(game.Status);
  quarter: game.Quarter;
      timeRemaining: game.TimeRemaining;
  homeScore: game.HomeScore || 0;
      awayScore: game.AwayScore || 0;
  lastUpdated: new Date()
     }
  }

  private transformPlayer(player: SportsIOPlayer); NFLPlayer { return {
      id: player.PlayerID?.toString() || '';
  externalId: player.PlayerID?.toString() || '';
      firstName: player.FirstName;
  lastName: player.LastName;
      fullName: player.Name || `${player.FirstName } ${player.LastName}`,
      position: player.Position;
  team: player.Team;
      jerseyNumber: player.Number;
  status: this.mapPlayerStatus(player.Status, player.InjuryStatus),
      injuryStatus: player.InjuryStatus || undefined;
  injuryDescription: player.InjuryNotes || undefined
    }
  }

  private transformPlayerStats(stats: SportsIOPlayerStats); PlayerStats { return {
      playerId: stats.PlayerID?.toString() || '';
  gameId: stats.GameKey || '';
      week: stats.Season, // Note: This needs to be mapped correctly from API
      season; stats.Season,

      // Passing
      passingYards: stats.PassingYards || 0;
  passingTDs: stats.PassingTouchdowns || 0;
      passingInterceptions: stats.PassingInterceptions || 0;
  passingCompletions: stats.PassingCompletions || 0;
      passingAttempts: stats.PassingAttempts || 0;

      // Rushing
      rushingYards: stats.RushingYards || 0;
  rushingTDs: stats.RushingTouchdowns || 0;
      rushingAttempts: stats.RushingAttempts || 0;

      // Receiving
      receivingYards: stats.ReceivingYards || 0;
  receivingTDs: stats.ReceivingTouchdowns || 0;
      receptions: stats.Receptions || 0;
  targets: stats.ReceivingTargets || 0;

      // Kicking
      fieldGoalsMade: stats.FieldGoalsMade || 0;
  fieldGoalsAttempted: stats.FieldGoalsAttempted || 0;
      extraPointsMade: stats.ExtraPointsMade || 0;
  extraPointsAttempted: stats.ExtraPointsAttempted || 0;

      // Defense
      sacks: stats.Sacks || 0;
  interceptions: stats.Interceptions || 0;
      fumbleRecoveries: stats.FumbleRecoveries || 0;
  defensiveTDs: (stats.InterceptionReturnTouchdowns || 0) + (stats.FumbleReturnTouchdowns || 0);
      safeties: stats.Safeties || 0;
  pointsAllowed: 0; // Not available in individual player stats

      // Fantasy
      fantasyPoints: stats.FantasyPoints || 0;
  projectedPoints: 0; // Not available in stats endpoint

      lastUpdated: new Date()
     }
  }

  private mapGameStatus(status: string); NFLGame['status'] { const statusMap: Record<string, NFLGame['status']> = {
      'Scheduled': 'scheduled',
      'InProgress': 'in_progress',
      'Final': 'final',
      'F': 'final',
      'Postponed': 'postponed',
      'Canceled': 'postponed',
      'Suspended': 'postponed'
     }
    return statusMap[status] || 'scheduled';
  }

  private mapPlayerStatus(status, string, injuryStatus?: string): NFLPlayer['status'] { if (injuryStatus) {
      const injuryMap: Record<string, NFLPlayer['status']> = {
        'Questionable': 'injured',
        'Doubtful': 'injured',
        'Out': 'inactive',
        'IR': 'inactive',
        'PUP': 'inactive',
        'Suspended': 'suspended'
       }
      return injuryMap[injuryStatus] || 'injured';
    }
    
    return status === 'Active' ? 'active' : 'inactive';
  }
}