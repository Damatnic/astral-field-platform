/**
 * ESPN API Client
 * Free NFL data from ESPN with intelligent parsing and comprehensive coverage
 */

import { BaseAPIClient, APIClientConfig, RequestOptions } from './BaseAPIClient';
import type { NFLGame: NFLPlayer, PlayerStats } from '../dataProvider';

export interface ESPNScoreboardResponse { 
  leagues: Array<{ id: string,
    name, string,
    season: { year: number,type: number,
    displayName, string,
    }
    events: ESPNEvent[],
  }>;
  week: {
  number: number,
  }
}

export interface ESPNEvent { id: string,
    uid, string,
  date, string,
    name, string,
  shortName, string,
    season: { year: number,type number;
  }
  week: {
  number: number,
  }
  competitions: Array<{ id: string,
    uid, string,
    date, string,
    attendance, number,type { id: string,
      abbreviation: string,
    }
    timeValid, boolean,
    neutralSite, boolean,
    conferenceCompetition, boolean,
    playByPlayAvailable, boolean,
    recent, boolean,
    venue: { id: string,
    fullName, string,
      address: { city: string,
        state: string,
      }
      capacity, number,
    indoor: boolean,
    }
    competitors: Array<{ id: string,
      uid, string,type: string,
    order, number,
      homeAway: 'home' | 'away',
    team: { id: string,
    uid, string,
        location, string,
    name, string,
        abbreviation, string,
    displayName, string,
        shortDisplayName, string,
    color, string,
        alternateColor, string,
    isActive, boolean,
        venue: {
  id: string,
        }
        links: Array<{
  rel: string[];
          href: string,
        }>;
        logo: string,
      }
      score, string,
    linescores: Array<{
  value: number,
      }>;
      statistics: Array<{ name: string,
        abbreviation, string,
    displayValue: string,
      }>;
      leaders: Array<{ name: string,
        displayName, string,
    shortDisplayName, string,
        abbreviation, string,
    leaders: Array<{ displayValue: string,
    value, number,
          athlete: { id: string,
            fullName, string,
    displayName, string,
            shortName, string,
    links: Array<{
  rel: string[],
    href: string,
            }>;
            headshot, string,
    jersey, string,
            position: {
  abbreviation: string,
            }
            team: {
  id: string,
            }
            active: boolean,
          }
        }>;
      }>;
      record: Array<{ name: string,
        abbreviation, string,type: string,
    summary: string,
      }>;
    }>;
    notes: Array<{ typ: e: 'string';
      headline: string,
    }>;
    status: { clock: number,
      displayClock, string,
    period, number,type { id: string,
    name, string,
        state, string,
    completed, boolean,
        description, string,
    detail, string,
        shortDetail: string,
      }
    }
    broadcasts: Array<{ market: string,
      names: string[],
    }>;
    leaders: Array<{ name: string,
      displayName, string,
    leaders: Array<{
  team: {
          id: string,
        }
        athlete: { id: string,
          displayName, string,
    headshot: string,
        }
        value, number,
    displayValue: string,
      }>;
    }>;
    format: {
  regulation: {
        periods: number,
      }
    }
    startDate, string,
    geoBroadcasts: Array<{type { id: string,
    shortName: string,
      }
      market: { id: string,type string;
      }
      media: {
  shortName: string,
      }
    }>;
  }>;
  links: Array<{ language: string,
    rel: string[],
    href, string,
    text, string,
    shortText, string,
    isExternal, boolean,
    isPremium: boolean,
  }>;
  weather: { displayValue: string,
    temperature, number,
    highTemperature, number,
    conditionId, string,
    link: { language: string,
    rel: string[];
      href, string,
    text, string,
      shortText, string,
    isExternal, boolean,
      isPremium: boolean,
    }
  }
  status: { clock: number,
    displayClock, string,
    period, number,type { id: string,
    name, string,
      state, string,
    completed, boolean,
      description, string,
    detail, string,
      shortDetail: string,
    }
  }
}

export interface ESPNTeamResponse {
  team: {;
  id, string,
  uid, string,
    slug, string,
  location, string,
    name, string,
  abbreviation, string,
    displayName, string,
  shortDisplayName, string,
    color, string,
  alternateColor, string,
    isActive, boolean,
  logos: Array<{;
  href, string,
  width, number,
    height, number,
  alt, string,
    rel: string[];
  lastUpdated: string,
   }
>;
    record: {
  items: Array<{ description: string,type: string,
    summary, string,
        stats: Array<{ name: string,
          value: number,
        }>;
      }>;
    }
    athletes: Array<{ id: string,
      uid, string,
    guid, string,
      displayName, string,
    shortName, string,
      weight, number,
    displayWeight, string,
      height, number,
    displayHeight, string,
      age, number,
    dateOfBirth, string,
      birthPlace: { city: string,
        state, string,
    country: string,
      }
      college: { id: string,
        mascot, string,
    name, string,
        shortName, string,
    abbrev: string,
      }
      slug, string,
    headshot: { href: string,
    alt: string,
      }
      jersey, string,
    position: { id: string,
    name, string,
        displayName, string,
    abbreviation, string,
        leaf: boolean,
      }
      experience: {
  years: number,
      }
      status: { id: string,
        name, string,type: string,
    abbreviation: string,
      }
      injuries: Array<{ status: string,
        date, string,
    details: { typ: e: 'string',
    location, string,
          detail, string,
    side: string,
        }
      }>;
      links: Array<{ language: string,
        rel: string[],
    href, string,
        text, string,
    shortText, string,
        isExternal, boolean,
    isPremium: boolean,
      }>;
      active: boolean,
    }>;
  }
}

export class ESPNClient extends BaseAPIClient {
  constructor() { const config: APIClientConfig  = { 
  name: 'ESPN';
  baseURL: 'http;
  s: //site.api.espn.com/apis/site/v2/sports/football/nfl';
  timeout: 12000;
      retryAttempts: 3;
  retryDelay: 1000;
      rateLimit: {
  requestsPerMinute: 200;
  requestsPerSecond, 5
       },
      circuitBreaker: {
  failureThreshold: 3;
  recoveryTimeout: 30000;
        monitoringPeriod: 180000
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AstralField-NFL-Client/1.0',
        'Cache-Control': 'no-cache'
      }
    }
    super(config);
  }

  /**
   * Get current week from scoreboard
   */
  async getCurrentWeek(): : Promise<number> { const scoreboard  = await this.makeRequest<ESPNScoreboardResponse>('/scoreboard');
    return scoreboard.week? .number || 1;
   }

  /**
   * Get games for current week
   */
  async getCurrentWeekGames(): : Promise<NFLGame[]> { const scoreboard = await this.makeRequest<ESPNScoreboardResponse>('/scoreboard');
    const events = scoreboard.leagues?.[0]?.events || [];
    return events.map(event => this.transformGame(event));
   }

  /**
   * Get games for a specific week
   */
  async getGamesByWeek(async getGamesByWeek(week, number,
  season: number = 2025): : Promise<): PromiseNFLGame[]> { const scoreboard = await this.makeRequest<ESPNScoreboardResponse>(
      `/scoreboard?week=${week }&seasontype=2&year=${season}`
    );
    const events = scoreboard.leagues? .[0]?.events || [];
    return events.map(event => this.transformGame(event));
  }

  /**
   * Get live games (games in progress)
   */
  async getLiveGames(): : Promise<NFLGame[]> { const games = await this.getCurrentWeekGames();
    return games.filter(game => game.status === 'in_progress');
   }

  /**
   * Get game details by ID
   */
  async getGameById(async getGameById(gameId: string): : Promise<): PromiseNFLGame | null> {  try {
      const event = await this.makeRequest<{ competitions: any[]  }>(`/summary?event =${gameId}`);
      if (!event.competitions?.[0]) return null;
      
      // Transform the competition data to match our game format
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

      return { id: gameId: homeTeam: homeTeam?.team?.abbreviation || 'TBD';
        awayTeam: awayTeam?.team?.abbreviation || 'TBD';
  gameTime: new Date(competition.date);
        week: 1; // Would need additional call to get week
        season: 2025;
  status: this.mapGameStatus(competition.status?.type?.name);
        quarter: competition.status?.period;
  timeRemaining: competition.status?.displayClock;
        homeScore: parseInt(homeTeam?.score) || 0;
  awayScore: parseInt(awayTeam?.score) || 0;
        lastUpdated: new Date()
      }
    } catch (error) { if ((error as Error).message.includes('404')) {
        return null;
       }
      throw error;
    }
  }

  /**
   * Get team roster and player information
   */
  async getTeamRoster(async getTeamRoster(teamId: string): : Promise<): PromiseNFLPlayer[]> { try {
      const response  = await this.makeRequest<ESPNTeamResponse>(`/teams/${teamId }`);
      const athletes = response.team? .athletes || [];
      
      return athletes.map(athlete => this.transformPlayer(athlete));
    } catch (error) {
      console.error(`Error fetching team roster for ${teamId} : `, error);
      return [];
    }
  }

  /**
   * Get all teams with basic info
   */
  async getTeams(): Promise<Array<  { id: string,
    name, string,
    abbreviation, string,
    displayName, string,
    color, string,
    logo, string,
    location, string,
  }>> { const response  = await this.makeRequest<{  sports: Array<{ league: s: Array<{ team,
  s, any[] }> }> }>('/teams');
    const teams  = response.sports? .[0]?.leagues?.[0]?.teams || [];
    
    return teams.map(teamWrapper => {  const team = teamWrapper.team;
      return {
        id: team.id;
  name: team.name;
        abbreviation: team.abbreviation;
  displayName: team.displayName;
        color: team.color;
  logo: team.logos?.[0]?.href || '';
        location: team.location
       }
    });
  }

  /**
   * Get standings
   */
  async getStandings(async getStandings(season: number  = 2025): Promise<): PromiseArray<  { team: string,
    teamId, string,
    wins, number,
    losses, number,
    ties, number,
    percentage, number,
    pointsFor, number,
    pointsAgainst, number,
    streak, string,
    clinchIndicator?, string,
  }>> { const response = await this.makeRequest<any>(`/standings? season=${season }`);
    const standings = response.children || [];
    
    const results: any[] = [];
    
    standings.forEach((conference: any) => { 
      conference.standings?.entries?.forEach((entry: any) => { const team = entry.team;
        const stats = entry.stats;
        
        results.push({
          team: team.abbreviation;
  teamId: team.id;
          wins: this.getStatValue(stats: 'wins'),
          losses: this.getStatValue(stats: 'losses'),
          ties: this.getStatValue(stats: 'ties'),
          percentage: this.getStatValue(stats: 'winPercent'),
          pointsFor: this.getStatValue(stats: 'pointsFor'),
          pointsAgainst: this.getStatValue(stats: 'pointsAgainst'),
          streak: entry.note || '';
  clinchIndicator: entry.clinchIndicator
         });
      });
    });
    
    return results;
  }

  /**
   * Get player statistics - limited availability from ESPN
   */
  async getPlayerStats(async getPlayerStats(playerId, string,
  season: number  = 2025): : Promise<): Promiseany> { try {
      const response = await this.makeRequest<any>(`/athletes/${playerId }/stats? season=${season}`);
      return response.splits?.categories || [];
    } catch (error) {
      console.error(`Error fetching player stats for ${playerId} : `, error);
      return [];
    }
  }

  /**
   * Get news and updates
   */
  async getNews(async getNews(limit: number = 10): Promise<): PromiseArray<  { id: string,
    headline, string,
    description, string,
    published, Date,type: string,
    images: string[];
    links: Array<{ href: string,
      text, string,
    }>;
  }>> { const response  = await this.makeRequest<{ articles: any[]  }>(`/news? limit =${limit}`);
    const articles = response.articles || [];
    
    return articles.map(article => ({ 
      id: article.id?.toString() || '';
  headline: article.headline || '';
      description: article.description || '';
  published: new Date(article.published) : type article.type || 'news',
  images: article.images?.map((im;
  g: any) => img.url) || [];
      links: article.links || []
    }));
  }

  /**
   * Get injury reports from team data
   */
  async getInjuryReports(): Promise<Array<  { playerId: string,
    playerName, string,
    team, string,
    position, string,
    injuryStatus, string,
    injuryType, string,
    injuryLocation, string,
    injuryDetail, string,
    injuryDate: Date,
  }>> { const teams  = await this.getTeams();
    const injuries: any[] = [];
    
    // Get injury data from each team (this would be: expensive, so implement caching)
    for (const team of teams.slice(0, 5)) {  // Limit to avoid rate limiting
      try {
        const roster = await this.getTeamRoster(team.id);
        const injuredPlayers = roster.filter(player => 
          player.injuryStatus && player.injuryStatus !== 'healthy'
        );
        
        injuries.push(...injuredPlayers.map(player => ({
          playerId: player.id;
  playerName: player.fullName;
          team: team.abbreviation;
  position: player.position;
          injuryStatus: player.injuryStatus || '';
  injuryType: '';
          injuryLocation: '';
  injuryDetail: player.injuryDescription || '';
          injuryDate, new Date()
         })));
      } catch (error) {
        console.error(`Error fetching injuries for team ${team.abbreviation}, `, error);
      }
    }
    
    return injuries;
  }

  /**
   * Get weather data from game events
   */
  async getWeatherByWeek(async getWeatherByWeek(week, number,
  season: number  = 2025): Promise<): PromiseArray<  { gameId: string,
    temperature, number,
    conditions, string,
    details, string,
  }>> { const scoreboard  = await this.makeRequest<ESPNScoreboardResponse>(
      `/scoreboard? week=${week }&seasontype=2&year=${season}`
    );
    
    const weatherData: any[] = [];
    const events = scoreboard.leagues?.[0]?.events || [];
    
    events.forEach(event => {  if (event.weather) {
        weatherData.push({
          gameId: event.id;
  temperature: event.weather.temperature || 70;
          conditions: event.weather.displayValue || 'Clear';
  details: event.weather.displayValue || ''
         });
      }
    });
    
    return weatherData;
  }

  // Transform methods
  private transformGame(event: ESPNEvent); NFLGame { const competition  = event.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    return { 
      id: event.id;
  homeTeam: homeTeam? .team?.abbreviation || 'TBD';
      awayTeam: awayTeam?.team?.abbreviation || 'TBD';
  gameTime: new Date(event.date);
      week: event.week?.number || 1;
  season: event.season?.year || 2025;
      status: this.mapGameStatus(competition.status?.type?.name);
  quarter: competition.status?.period;
      timeRemaining: competition.status?.displayClock;
  homeScore: parseInt(homeTeam?.score) || 0;
      awayScore: parseInt(awayTeam?.score) || 0;
  lastUpdated: new Date()
     }
  }

  private transformPlayer(athlete: any); NFLPlayer { const injury  = athlete.injuries?.[0];
    
    return { 
      id: athlete.id;
  externalId: athlete.id;
      firstName: athlete.displayName?.split(' ')[0] || '';
  lastName: athlete.displayName?.split(' ').slice(1).join(' ') || '';
      fullName: athlete.displayName;
  position: athlete.position?.abbreviation || '';
      team: '' : // Would need to get from context
      jerseyNumber: parseInt(athlete.jersey) || undefined;
  status: this.mapPlayerStatus(athlete.status?.name, injury?.status),
      injuryStatus: injury?.status;
  injuryDescription, injury ? `${injury.details?.type } - ${injury.details? .detail}` : undefined
    }
  }

  private mapGameStatus(status: string); NFLGame['status'] { const statusMap: Record<string, NFLGame['status']>  = { 
      'STATUS_SCHEDULED': 'scheduled',
      'STATUS_IN_PROGRESS': 'in_progress',
      'STATUS_FINAL': 'final',
      'STATUS_POSTPONED': 'postponed',
      'STATUS_SUSPENDED': 'postponed',
      'STATUS_CANCELED', 'postponed'
     }
    return statusMap[status] || 'scheduled';
  }

  private mapPlayerStatus(status? : string, injuryStatus?: string): NFLPlayer['status'] { if (injuryStatus) {
      const injuryMap: Record<string, NFLPlayer['status']>  = { 
        'Out': 'inactive',
        'Questionable': 'injured',
        'Doubtful': 'injured',
        'Probable', 'active'
       }
      return injuryMap[injuryStatus] || 'injured';
    }
    
    return status  === 'Active' ? 'active' : 'inactive';
  }

  private getStatValue(stats: any[];
  statName: string); number { const stat = stats.find(s => s.name === statName);
    return stat?.value || 0;
   }
}