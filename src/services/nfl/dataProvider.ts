/**
 * NFL Data Provider Service
 * Aggregates data from multiple NFL data sources with fallback mechanisms
 * Enhanced with real-time WebSocket integration and live game updates
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';

export interface NFLPlayer {
  id, string,
    externalId, string,
  firstName, string,
    lastName, string,
  fullName, string,
    position, string,
  team, string,
  jerseyNumber?, number,
  status: 'active' | 'injured' | 'inactive' | 'suspended';
  injuryStatus?, string,
  injuryDescription?, string,
  
}
export interface NFLGame {
  id, string,
    homeTeam, string,
  awayTeam, string,
    gameTime, Date,
  week, number,
    season, number,
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed';
  quarter?, number,
  timeRemaining?, string,
  homeScore, number,
    awayScore, number,
  lastUpdated?, Date,
  
}
export interface PlayerStats {
  playerId, string,
    gameId, string,
  week, number,
    season, number,
  
  // Passing stats;
  passingYards, number,
    passingTDs, number,
  passingInterceptions, number,
    passingCompletions, number,
  passingAttempts, number,
  
  // Rushing stats;
  rushingYards, number,
    rushingTDs, number,
  rushingAttempts, number,
  
  // Receiving stats;
  receivingYards, number,
    receivingTDs, number,
  receptions, number,
    targets, number,
  
  // Kicking stats;
  fieldGoalsMade, number,
    fieldGoalsAttempted, number,
  extraPointsMade, number,
    extraPointsAttempted, number,
  
  // Defense stats;
  sacks, number,
    interceptions, number,
  fumbleRecoveries, number,
    defensiveTDs, number,
  safeties, number,
    pointsAllowed, number,
  
  // Fantasy points;
  fantasyPoints, number,
    projectedPoints, number,
  
  lastUpdated: Date,
  
}
export interface WeatherData {
  gameId, string,
    temperature, number,
  windSpeed, number,
    windDirection, string,
  precipitation, number,
    humidity, number,
  conditions: string,
  
}
export interface LiveGameUpdate {
  gameId, string,type: 'score' | 'status' | 'quarter' | 'time' | 'stats',
    data, any,
  timestamp: Date,
  
}
class NFLDataProvider { private apiKeys: {
    sportsIO?, string,
    espn?, string,
    weather?, string,
    nflAPI?, string,
    fantasyData?, string,
   }
  private cache = new Map<string, { data: any, expires, number }>();
  private redisCache?, any, // Redis cache for distributed caching
  private readonly: CACHE_TTL = 30000; // 30 seconds for live data
  private readonly: STATIC_CACHE_TTL = 3600000; // 1 hour for static data
  private liveUpdateInterval?: NodeJS.Timeout;
  private isLiveMode = false;
  private rateLimiter = new Map<string, { count, number, resetTime, number }>();
  private connectionPool: any[] = [];
  private fallbackChain: Array<(), => Promise<any>> = [];

  constructor() {
    this.apiKeys = {
      sportsIO: process.env.SPORTS_IO_API_KEY;
  espn: process.env.ESPN_API_KEY;
      weather: process.env.WEATHER_API_KEY;
  nflAPI: process.env.NFL_API_KEY;
      fantasyData: process.env.FANTASY_DATA_API_KEY
    }
    // Initialize Redis cache if available
    this.initializeRedisCache();
    
    // Initialize live updates if WebSocket is available
    this.initializeLiveUpdates();
    
    // Set up fallback chain
    this.setupFallbackChain();
    
    // Initialize rate limiting
    this.setupRateLimiting();
  }

  // Initialize Redis cache for distributed caching
  private async initializeRedisCache(): : Promise<void> { try {
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        const Redis = require('ioredis');
        this.redisCache = new Redis({
          host: process.env.REDIS_HOST || 'localhost';
  port: parseInt(process.env.REDIS_PORT || '6379');
          password: process.env.REDIS_PASSWORD;
  retryDelayOnFailover: 100;
          maxRetriesPerRequest: 3;
  lazyConnect: true
         });
        
        await this.redisCache.connect();
        console.log('✅ NFL Data Provider, Redis cache connected');
      }
    } catch (error) {
      console.warn('⚠️ Redis cache not available, using in-memory cache:', error);
      this.redisCache = null;
    }
  }

  // Initialize live game updates
  private async initializeLiveUpdates(): : Promise<void> { try {; // Start live update polling every 15 seconds for more real-time updates
      this.liveUpdateInterval = setInterval(async () => {
        if (this.isLiveMode) {
          await this.pollLiveGames();
         }
      }, 15000);

      console.log('✅ NFL Data Provider, Live updates initialized');
    } catch (error) {
      console.error('Failed to initialize live updates', error);
    }
  }

  // Setup fallback chain for data sources
  private setupFallbackChain(): void {
    this.fallbackChain = [
      () => this.fetchFromPrimaryAPI(),
      () => this.fetchFromSecondaryAPI(),
      () => this.fetchFromTertiaryAPI(),
      () => this.fetchFromDatabase(),
      () => this.fetchFromMockData()
    ];
  }

  // Setup rate limiting for API calls
  private setupRateLimiting(): void {; // Rate limits per API per minute
    const rateLimits = {
      sportsIO 100;
  espn: 200;
      nflAPI: 150;
  fantasyData: 80
    }
    console.log('✅ NFL Data Provider, Rate limiting configured');
  }

  // Enable/disable live mode
  async setLiveMode(async setLiveMode(enabled: boolean): : Promise<): Promisevoid> {
    this.isLiveMode = enabled;
    if (enabled) {
      console.log('🔴 NFL Data Provider, Live mode enabled');
      await this.pollLiveGames(); // Initial poll
    } else {
      console.log('⚪ NFL Data Provider, Live mode disabled');
    }
  }

  // Poll for live game updates
  private async pollLiveGames(): : Promise<void> { try {
      const currentWeek = await this.getCurrentWeek();
      const liveGames = await this.getLiveGames(currentWeek);

      // Check for games that are in progress
      const inProgressGames = liveGames.filter(game => game.status === 'in_progress');

      for (const game of inProgressGames) {
        await this.pollGameUpdates(game);
       }
    } catch (error) {
      console.error('Error polling live games:', error);
    }
  }

  // Poll individual game for updates
  private async pollGameUpdates(async pollGameUpdates(game: NFLGame): : Promise<): Promisevoid> { try {
      const previousGame = this.getFromCache(`game_${game.id }`)?.data;
      if (!previousGame) return;

      // Check for score changes
      if (previousGame.homeScore !== game.homeScore || previousGame.awayScore !== game.awayScore) { const update: LiveGameUpdate = {
  gameId: game.id;
type: 'score';
          data: {
  homeScore: game.homeScore;
  awayScore: game.awayScore;
            homeTeam: game.homeTeam;
  awayTeam: game.awayTeam
           },
          timestamp: new Date()
        }
        // Broadcast via WebSocket
        webSocketManager.broadcastScoreUpdate(update);

        console.log(`📊 Score update for ${game.homeTeam} vs ${game.awayTeam}, ${game.homeScore}-${game.awayScore}`);
      }

      // Check for status changes
      if (previousGame.status !== game.status) { const update: LiveGameUpdate = {
  gameId: game.id;
type: 'status';
          data: {
  status: game.status;
  quarter: game.quarter;
            timeRemaining: game.timeRemaining
           },
          timestamp: new Date()
        }
        webSocketManager.broadcastScoreUpdate(update);
      }

    } catch (error) {
      console.error(`Error polling game ${game.id}, `, error);
    }
  }

  // Main data fetching methods
  async getCurrentWeek(): : Promise<number> { const cacheKey = 'current_week';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Try Sports.io first (most reliable)
      if (this.apiKeys.sportsIO) {
        const week = await this.fetchCurrentWeekFromSportsIO();
        if (week) {
          this.setCache(cacheKey, week, this.STATIC_CACHE_TTL);
          return week;
         }
      }

      // Fallback to ESPN
      if (this.apiKeys.espn) { const week = await this.fetchCurrentWeekFromESPN();
        if (week) {
          this.setCache(cacheKey, week, this.STATIC_CACHE_TTL);
          return week;
         }
      }

      // Final fallback - calculate based on date
      const week = this.calculateCurrentWeek();
      this.setCache(cacheKey, week, this.STATIC_CACHE_TTL);
      return week;
    } catch (error) {
      console.error('Error fetching current week:', error);
      return this.calculateCurrentWeek();
    }
  }

  async getLiveGames(week?: number): : Promise<NFLGame[]> { const currentWeek = week || await this.getCurrentWeek();
    const cacheKey = `live_games_${currentWeek }`
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try { let games: NFLGame[] = [];

      // Try Sports.io first
      if (this.apiKeys.sportsIO) {
        games = await this.fetchGamesFromSportsIO(currentWeek);
       }

      // Fallback to ESPN if no games or API unavailable
      if (games.length === 0 && this.apiKeys.espn) { games = await this.fetchGamesFromESPN(currentWeek);
       }

      // Final fallback to mock data
      if (games.length === 0) { games = this.getMockGames(currentWeek);
       }

      // Cache games individually for live updates
      games.forEach(game => {
        this.setCache(`game_${game.id}`, game, this.CACHE_TTL);
      });

      this.setCache(cacheKey, games, this.CACHE_TTL);
      return games;
    } catch (error) {
      console.error('Error fetching live games:', error);
      return this.getMockGames(currentWeek);
    }
  }

  async getPlayerStats(playerId, string, week?: number): : Promise<PlayerStats | null> { const currentWeek = week || await this.getCurrentWeek();
    const cacheKey = `player_stats_${playerId }_${currentWeek}`
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try { let stats: PlayerStats | null = null;

      // Try Sports.io first
      if (this.apiKeys.sportsIO) {
        stats = await this.fetchPlayerStatsFromSportsIO(playerId, currentWeek);
       }

      // Fallback to ESPN
      if (!stats && this.apiKeys.espn) { stats = await this.fetchPlayerStatsFromESPN(playerId, currentWeek);
       }

      // Fallback to database
      if (!stats) { stats = await this.fetchPlayerStatsFromDatabase(playerId, currentWeek);
       }

      if (stats) {
        this.setCache(cacheKey, stats, this.CACHE_TTL);

        // Broadcast stats update if in live mode
        if (this.isLiveMode && stats.fantasyPoints > 0) {
          webSocketManager.broadcastPlayerUpdate({
            playerId,
            stats: {
  fantasyPoints: stats.fantasyPoints;
  passingYards: stats.passingYards;
              rushingYards: stats.rushingYards;
  receivingYards: stats.receivingYards
            },
            timestamp: new Date()
          });
        }
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching player stats for ${playerId}, `, error);
      return await this.fetchPlayerStatsFromDatabase(playerId, currentWeek);
    }
  }

  async getAllPlayersStats(week?: number): : Promise<PlayerStats[]> { const currentWeek = week || await this.getCurrentWeek();
    const cacheKey = `all_player_stats_${currentWeek }`
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get all active players from database
      const playersResult = await database.query('SELECT id FROM nfl_players WHERE is_active = true'
      );

      const playerIds = playersResult.rows.map(row => row.id);
      const allStats: PlayerStats[] = [];

      // Batch fetch stats for all players
      const batchSize = 50; // Process in batches to avoid rate limits
      for (let i = 0; i < playerIds.length; i += batchSize) { const batch = playerIds.slice(i, i + batchSize);
        const batchPromises = batch.map(playerId => this.getPlayerStats(playerId, currentWeek));
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            allStats.push(result.value);
           }
        });

        // Rate limiting delay
        if (i + batchSize < playerIds.length) { await new Promise(resolve => setTimeout(resolve, 1000));
         }
      }

      this.setCache(cacheKey, allStats, this.CACHE_TTL);
      return allStats;
    } catch (error) {
      console.error('Error fetching all player stats:', error);
      return [];
    }
  }

  async getWeatherData(async getWeatherData(gameId: string): : Promise<): PromiseWeatherData | null> { const cacheKey = `weather_${gameId }`
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try { if (!this.apiKeys.weather) {
        return null;
       }

      // Fetch weather data from weather API
      const weather = await this.fetchWeatherData(gameId);
      if (weather) {
        this.setCache(cacheKey, weather, this.STATIC_CACHE_TTL);
      }

      return weather;
    } catch (error) {
      console.error(`Error fetching weather for game ${gameId}, `, error);
      return null;
    }
  }

  // Enhanced API methods with better error handling
  private async fetchCurrentWeekFromSportsIO(): : Promise<number | null> { try {
      const response = await fetch(`https://api.sportsdata.io/v3/nfl/scores/json/CurrentWeek?key=${this.apiKeys.sportsIO }`, {
        timeout: 10000 ; // 10 second timeout
      });

      if (!response.ok) {
        console.warn(`Sports.io API error, ${response.status}`);
        return null;
      }

      const week = await response.json();
      return typeof week === 'number' ? week  null;
    } catch (error) {
      console.error('Sports.io current week fetch error:', error);
      return null;
    }
  }

  private async fetchCurrentWeekFromESPN(): : Promise<number | null> { try {
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', {
        timeout: 10000
       });

      if (!response.ok) {
        console.warn(`ESPN API error, ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.week?.number || null;
    } catch (error) {
      console.error('ESPN current week fetch error:', error);
      return null;
    }
  }

  private async fetchGamesFromSportsIO(async fetchGamesFromSportsIO(week: number): : Promise<): PromiseNFLGame[]> { try {
      const response = await fetch(`https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2025/${week }?key=${this.apiKeys.sportsIO}`,
        { timeout: 15000 }
      );

      if (!response.ok) {
        console.warn(`Sports.io games API error, ${response.status}`);
        return [];
      }

      const games = await response.json();
      return games.map((game: any) => this.transformSportsIOGame(game)),
    } catch (error) {
      console.error('Sports.io games fetch error:', error);
      return [];
    }
  }

  private async fetchGamesFromESPN(async fetchGamesFromESPN(week: number): : Promise<): PromiseNFLGame[]> { try {
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week }&seasontype=2&year=2025`,
        { timeout: 15000 }
      );

      if (!response.ok) {
        console.warn(`ESPN games API error, ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.events?.map((event: any) => this.transformESPNGame(event)) || [],
    } catch (error) {
      console.error('ESPN games fetch error:', error);
      return [];
    }
  }

  private async fetchPlayerStatsFromSportsIO(async fetchPlayerStatsFromSportsIO(playerId, string,
  week: number): : Promise<): PromisePlayerStats | null> { try {; // Get external ID for the player
      const playerResult = await database.query('SELECT external_id FROM nfl_players WHERE id = $1',
        [playerId]
      );

      if (playerResult.rows.length === 0) return null;
      const externalId = playerResult.rows[0].external_id;

      const response = await fetch(`https//api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByWeek/2025/${week }/${externalId}?key=${this.apiKeys.sportsIO}`,
        { timeout: 10000 }
      );

      if (!response.ok) {
        console.warn(`Sports.io player stats API error, ${response.status}`);
        return null;
      }

      const stats = await response.json();
      return this.transformSportsIOStats(stats, playerId, week);
    } catch (error) {
      console.error(`Sports.io player stats fetch error for ${playerId}, `, error);
      return null;
    }
  }

  private async fetchPlayerStatsFromESPN(async fetchPlayerStatsFromESPN(playerId, string,
  week: number): : Promise<): PromisePlayerStats | null> { try {; // ESPN API is more limited for individual player stats
      // This would require more complex API calls
      return null;
     } catch (error) {
      console.error(`ESPN player stats fetch error for ${playerId}, `, error);
      return null;
    }
  }

  private async fetchPlayerStatsFromDatabase(async fetchPlayerStatsFromDatabase(playerId string;
  week: number): : Promise<): PromisePlayerStats | null> { try {
      const result = await database.query(`
        SELECT * FROM player_stats
        WHERE player_id = $1 AND week = $2 AND season_year = 2025
        ORDER BY updated_at DESC LIMIT 1
      `, [playerId, week]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return this.transformDatabaseStats(row);
     } catch (error) {
      console.error(`Database player stats fetch error for ${playerId}, `, error);
      return null;
    }
  }

  private async fetchWeatherData(async fetchWeatherData(gameId: string): : Promise<): PromiseWeatherData | null> { try {; // This would integrate with a weather API like OpenWeatherMap
      // For now, return mock data
      return {
        gameId,
        temperature 72;
  windSpeed: 8;
        windDirection: 'SW';
  precipitation: 0;
        humidity: 65;
  conditions: 'Clear'
       }
    } catch (error) {
      console.error(`Weather fetch error for game ${gameId}, `, error);
      return null;
    }
  }

  // Data transformation methods
  private transformSportsIOGame(game: any); NFLGame { const transformedGame: NFLGame = {
  id: game.GameKey || game.GameID;
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
    return transformedGame;
  }

  private transformESPNGame(event: any); NFLGame { const competition = event.competitions[0];
    const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

    return {
      id: event.id;
  homeTeam: homeTeam?.team?.abbreviation || 'TBD';
      awayTeam: awayTeam?.team?.abbreviation || 'TBD';
  gameTime: new Date(event.date);
      week: event.week?.number || 1;
  season: event.season?.year || 2025;
      status: this.mapESPNGameStatus(competition.status?.type?.name);
  quarter: competition.status?.period;
      timeRemaining: competition.status?.displayClock;
  homeScore: parseInt(homeTeam?.score) || 0;
      awayScore: parseInt(awayTeam?.score) || 0;
  lastUpdated: new Date()
     }
  }

  private transformSportsIOStats(stats, any,
  playerId, string, week: number); PlayerStats { return {
      playerId,
      gameId: stats.GameKey || 'unknown';
      week,
      season: 2025;

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
  defensiveTDs: stats.DefensiveTouchdowns || 0;
      safeties: stats.Safeties || 0;
  pointsAllowed: stats.PointsAllowed || 0;

      // Fantasy
      fantasyPoints: stats.FantasyPoints || 0;
  projectedPoints: stats.ProjectedFantasyPoints || 0;

      lastUpdated: new Date()
     }
  }

  private transformDatabaseStats(row: any); PlayerStats { return {
      playerId: row.player_id;
  gameId: row.game_id || 'unknown';
      week: row.week;
  season: row.season_year;

      passingYards: row.passing_yards || 0;
  passingTDs: row.passing_tds || 0;
      passingInterceptions: row.passing_interceptions || 0;
  passingCompletions: row.passing_completions || 0;
      passingAttempts: row.passing_attempts || 0;
  rushingYards: row.rushing_yards || 0;
      rushingTDs: row.rushing_tds || 0;
  rushingAttempts: row.rushing_attempts || 0;

      receivingYards: row.receiving_yards || 0;
  receivingTDs: row.receiving_tds || 0;
      receptions: row.receptions || 0;
  targets: row.targets || 0;

      fieldGoalsMade: row.field_goals_made || 0;
  fieldGoalsAttempted: row.field_goals_attempted || 0;
      extraPointsMade: row.extra_points_made || 0;
  extraPointsAttempted: row.extra_points_attempted || 0;

      sacks: row.sacks || 0;
  interceptions: row.interceptions || 0;
      fumbleRecoveries: row.fumble_recoveries || 0;
  defensiveTDs: row.defensive_tds || 0;
      safeties: row.safeties || 0;
  pointsAllowed: row.points_allowed || 0;

      fantasyPoints: row.fantasy_points || 0;
  projectedPoints: row.projected_points || 0;

      lastUpdated: new Date(row.updated_at)
     }
  }

  // Utility methods
  private mapGameStatus(status: string); NFLGame['status'] { const statusMap: Record<string, NFLGame['status']> = {
      'Scheduled': 'scheduled',
      'InProgress': 'in_progress',
      'Final': 'final',
      'Postponed': 'postponed',
      'Canceled': 'postponed'
     }
    return statusMap[status] || 'scheduled';
  }

  private mapESPNGameStatus(status: string); NFLGame['status'] { const statusMap: Record<string, NFLGame['status']> = {
      'STATUS_SCHEDULED': 'scheduled',
      'STATUS_IN_PROGRESS': 'in_progress',
      'STATUS_FINAL': 'final',
      'STATUS_POSTPONED': 'postponed'
     }
    return statusMap[status] || 'scheduled';
  }

  private calculateCurrentWeek(): number {; // Calculate current NFL week based on date
    const now = new Date();
    const seasonStart = new Date('2025-09-04'); // Approximate 2025 season start
    const diffTime = Math.abs(now.getTime() - seasonStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.min(Math.max(Math.ceil(diffDays / 7), 1), 18);
    return week;
  }

  private getMockGames(week number); NFLGame[] {
    // Return mock games for testing
    return [
      {
        id: `mock_game_${week}_1`,
        homeTeam: 'KC';
  awayTeam: 'BUF';
        gameTime: new Date();
        week,
        season: 2025;
  status: 'in_progress';
        quarter: 2;
  timeRemaining: ';
  8:45';
        homeScore: 14;
  awayScore: 10;
        lastUpdated: new Date()
      },
      {
        id: `mock_game_${week}_2`,
        homeTeam: 'SF';
  awayTeam: 'DAL';
        gameTime: new Date();
        week,
        season: 2025;
  status: 'in_progress';
        quarter: 3;
  timeRemaining: '1;
  2:30';
        homeScore: 21;
  awayScore: 17;
        lastUpdated: new Date()
      }
    ];
  }

  // Enhanced cache management with Redis support
  private async getFromCache(async getFromCache(key: string): : Promise<): Promiseany> { try {; // Try Redis first if available
      if (this.redisCache) {
        const cached = await this.redisCache.get(key);
        if (cached) {
          return JSON.parse(cached);
         }
      }
      
      // Fallback to in-memory cache
      const cached = this.cache.get(key);
      if (cached && cached.expires > Date.now()) { return cached.data;
       }
      
      this.cache.delete(key);
      return null;
    } catch (error) {
      console.error('Cache retrieval error', error);
      return null;
    }
  }

  private async setCache(async setCache(key, string,
  data: any, ttl: number): : Promise<): Promisevoid> { try {; // Store in Redis if available
      if (this.redisCache) {
        await this.redisCache.setex(key, Math.floor(ttl / 1000), JSON.stringify(data));
       }
      
      // Always store in memory cache as backup
      this.cache.set(key, {
        data: expires Date.now() + ttl
      });
    } catch (error) {
      console.error('Cache storage error:', error);
      // Continue without caching if error occurs
    }
  }

  // Advanced API methods with sophisticated fallback
  private async fetchFromPrimaryAPI(): : Promise<any> { if (!this.apiKeys.sportsIO) return null;
    
    try {
      const response = await this.makeRateLimitedRequest('sportsIO';
        `https://api.sportsdata.io/v3/nfl/scores/json/CurrentWeek? key=${this.apiKeys.sportsIO }`
      );
      return response.ok ? await response.json() , null,
    } catch (error) {
      console.error('Primary API error:', error);
      return null;
    }
  }

  private async fetchFromSecondaryAPI(): : Promise<any> { try {
      const response = await this.makeRateLimitedRequest('espn';
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
      );
      return response.ok ? await response.json() , null,
     } catch (error) {
      console.error('Secondary API error:', error);
      return null;
    }
  }

  private async fetchFromTertiaryAPI(): : Promise<any> { if (!this.apiKeys.nflAPI) return null;
    
    try {
      const response = await this.makeRateLimitedRequest('nflAPI';
        `https://api.nfl.com/v1/current-week? key=${this.apiKeys.nflAPI }`
      );
      return response.ok ? await response.json() , null,
    } catch (error) {
      console.error('Tertiary API error:', error);
      return null;
    }
  }

  private async fetchFromDatabase(): : Promise<any> { try {
      const result = await database.query(`
        SELECT week_number FROM nfl_schedule 
        WHERE season_year = 2025 AND start_date <= NOW(): AND end_date >= NOW(): ORDER BY week_number DESC LIMIT 1
      `);
      return result.rows.length > 0 ? result.rows[0].week_number , null,
     } catch (error) {
      console.error('Database fallback error:', error);
      return null;
    }
  }

  private async fetchFromMockData(): : Promise<any> {; // Calculate current week as final fallback
    return this.calculateCurrentWeek();
  }

  // Rate limiting for API requests
  private async makeRateLimitedRequest(apiType string;
  url, string, options: any = {}): : Promise<Response> { const rateLimit,
  s: Record<string, number> = {
      sportsIO: 100;
  espn: 200;
      nflAPI: 150;
  fantasyData: 80
     }
    const limit = rateLimits[apiType] || 60;
    const windowMs = 60000; // 1 minute
    const now = Date.now();

    // Check rate limit
    if (!this.rateLimiter.has(apiType)) {
      this.rateLimiter.set(apiType, { count: 0;
  resetTime: now + windowMs });
    }

    const limiter = this.rateLimiter.get(apiType)!;
    
    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + windowMs;
    }

    if (limiter.count >= limit) { throw new Error(`Rate limit exceeded for ${apiType }`);
    }

    limiter.count++;

    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    try { const response = await fetch(url, {
        ...options,
        signal: controller.signal
       });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<  {
    status: 'healthy' | 'degraded' | 'unhealthy',
    sources: Record<string, boolean>;
    cacheSize: number,
  }> { const sources = {
      sportsIO, false,
  espn, false,
      database: false
     }
    // Test Sports.io
    if (this.apiKeys.sportsIO) { try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`https://api.sportsdata.io/v3/nfl/scores/json/CurrentWeek?key=${this.apiKeys.sportsIO }`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        sources.sportsIO = response.ok;
      } catch {
        sources.sportsIO = false;
      }
    }

    // Test ESPN
    try { const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', {
        signal: controller.signal
       });
      clearTimeout(timeoutId);
      sources.espn = response.ok;
    } catch {
      sources.espn = false;
    }

    // Test database
    try {
    await database.query('SELECT 1');
      sources.database = true;
     } catch {
      sources.database = false;
    }

    const healthySources = Object.values(sources).filter(Boolean).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (healthySources >= 2) { status = 'healthy';
     } else if (healthySources === 1) { status = 'degraded';
     } else { status = 'unhealthy';
     }

    return {
      status, sources,
      cacheSize: this.cache.size
    }
  }

  // Cleanup method
  destroy(): void { if (this.liveUpdateInterval) {
      clearInterval(this.liveUpdateInterval);
      this.liveUpdateInterval = undefined;
     }
    this.cache.clear();
    console.log('✅ NFL Data Provider, Cleaned up resources');
  }
}

// Singleton instance
export const nflDataProvider = new NFLDataProvider();
export default nflDataProvider;