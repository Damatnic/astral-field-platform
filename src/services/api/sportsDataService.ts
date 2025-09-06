export interface SportsDataPlayer {
  PlayerID: number
  Name: string
  Team: string
  Position: string
  Number: number
  College: string
  Height: string
  Weight: number
  BirthDate: string
  InjuryStatus: string
  InjuryBodyPart: string
  Active: boolean
  FantasyPosition: string
  AverageDraftPosition: number
}

export interface SportsDataTeam {
  Key: string
  TeamID: number
  Name: string
  City: string
  Conference: string
  Division: string
  FullName: string
  StadiumID: number
  ByeWeek: number
  GlobalTeamID: number
  HeadCoach: string
  PrimaryColor: string
  SecondaryColor: string
  TertiaryColor: string
}

export interface SportsDataStanding {
  Season: number
  SeasonType: number
  TeamID: number
  Key: string
  City: string
  Name: string
  Conference: string
  Division: string
  Wins: number
  Losses: number
  Ties: number
  WinPercentage: number
  DivisionWins: number
  DivisionLosses: number
  ConferenceWins: number
  ConferenceLosses: number
  PointsFor: number
  PointsAgainst: number
}

export interface SportsDataGame {
  GameID: number
  Season: number
  Week: number
  AwayTeam: string
  HomeTeam: string
  AwayScore: number
  HomeScore: number
  Quarter: string
  TimeRemaining: string
  Status: string
  DateTime: string
  GameKey: string
  GlobalGameID: number
}

class SportsDataService {
  private readonly baseUrl = 'https://api.sportsdata.io/v3/nfl'
  private readonly apiKey = 'bab44477ed904140b43630a7520517e7'

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}?key=${this.apiKey}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`SportsData API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('SportsData API request failed:', error)
      throw error
    }
  }

  // Team Data
  async getAllTeams(): Promise<SportsDataTeam[]> {
    return this.makeRequest<SportsDataTeam[]>('/scores/json/Teams')
  }

  async getTeamsBasic(): Promise<SportsDataTeam[]> {
    return this.makeRequest<SportsDataTeam[]>('/scores/json/TeamsBasic')
  }

  // Player Data
  async getAllPlayers(): Promise<SportsDataPlayer[]> {
    return this.makeRequest<SportsDataPlayer[]>('/scores/json/PlayersByAvailable')
  }

  async getPlayersByTeam(team: string): Promise<SportsDataPlayer[]> {
    return this.makeRequest<SportsDataPlayer[]>(`/scores/json/PlayersBasic/${team}`)
  }

  async getFreeAgents(): Promise<SportsDataPlayer[]> {
    return this.makeRequest<SportsDataPlayer[]>('/scores/json/PlayersByFreeAgents')
  }

  async getRookiesByYear(season: number): Promise<SportsDataPlayer[]> {
    return this.makeRequest<SportsDataPlayer[]>(`/scores/json/PlayersByRookieDraftYear/${season}`)
  }

  // Season Data
  async getCurrentSeason(): Promise<number> {
    return this.makeRequest<number>('/scores/json/CurrentSeason')
  }

  async getCurrentWeek(): Promise<number> {
    return this.makeRequest<number>('/scores/json/CurrentWeek')
  }

  async getLastCompletedSeason(): Promise<number> {
    return this.makeRequest<number>('/scores/json/LastCompletedSeason')
  }

  async getUpcomingSeason(): Promise<number> {
    return this.makeRequest<number>('/scores/json/UpcomingSeason')
  }

  // Standings
  async getStandings(season: string): Promise<SportsDataStanding[]> {
    return this.makeRequest<SportsDataStanding[]>(`/scores/json/Standings/${season}`)
  }

  // Live Game Data
  async areGamesInProgress(): Promise<boolean> {
    return this.makeRequest<boolean>('/scores/json/AreAnyGamesInProgress')
  }

  async getByeWeeks(season: string): Promise<any[]> {
    return this.makeRequest<any[]>(`/scores/json/Byes/${season}`)
  }

  // Utility Methods
  async getStadiums(): Promise<any[]> {
    return this.makeRequest<any[]>('/scores/json/Stadiums')
  }

  async getReferees(): Promise<any[]> {
    return this.makeRequest<any[]>('/scores/json/Referees')
  }

  // Data transformation helpers
  transformPlayerToOurFormat(sportsDataPlayer: SportsDataPlayer) {
    return {
      name: sportsDataPlayer.Name,
      position: sportsDataPlayer.FantasyPosition || sportsDataPlayer.Position,
      nfl_team: sportsDataPlayer.Team,
      injury_status: sportsDataPlayer.InjuryStatus || null,
      bye_week: 0, // Will need to get this from team data
      stats: null,
      projections: {
        adp: sportsDataPlayer.AverageDraftPosition || null
      },
      external_id: sportsDataPlayer.PlayerID.toString(),
      jersey_number: sportsDataPlayer.Number,
      college: sportsDataPlayer.College,
      height: sportsDataPlayer.Height,
      weight: sportsDataPlayer.Weight,
      birth_date: sportsDataPlayer.BirthDate,
      active: sportsDataPlayer.Active
    }
  }

  transformTeamToOurFormat(sportsDataTeam: SportsDataTeam) {
    return {
      key: sportsDataTeam.Key,
      name: sportsDataTeam.Name,
      city: sportsDataTeam.City,
      full_name: sportsDataTeam.FullName,
      conference: sportsDataTeam.Conference,
      division: sportsDataTeam.Division,
      bye_week: sportsDataTeam.ByeWeek,
      head_coach: sportsDataTeam.HeadCoach,
      primary_color: sportsDataTeam.PrimaryColor,
      secondary_color: sportsDataTeam.SecondaryColor,
      tertiary_color: sportsDataTeam.TertiaryColor,
      stadium_id: sportsDataTeam.StadiumID,
      external_id: sportsDataTeam.TeamID.toString()
    }
  }

  // Bulk sync methods
  async syncAllPlayersToDatabase(): Promise<{ success: number; failed: number; error: string | null }> {
    try {
      const allPlayers = await this.getAllPlayers()
      const transformedPlayers = allPlayers.map(player => this.transformPlayerToOurFormat(player))
      
      // Use existing PlayerService to sync
      const { default: playerService } = await import('./playerService')
      return await playerService.syncPlayersFromExternal(transformedPlayers)
    } catch (error: any) {
      console.error('Failed to sync players from SportsData:', error)
      return { success: 0, failed: 0, error: error.message }
    }
  }

  async syncTeamPlayersToDatabase(team: string): Promise<{ success: number; failed: number; error: string | null }> {
    try {
      const teamPlayers = await this.getPlayersByTeam(team)
      const transformedPlayers = teamPlayers.map(player => this.transformPlayerToOurFormat(player))
      
      const { default: playerService } = await import('./playerService')
      return await playerService.syncPlayersFromExternal(transformedPlayers)
    } catch (error: any) {
      console.error(`Failed to sync players for team ${team}:`, error)
      return { success: 0, failed: 0, error: error.message }
    }
  }

  // Cache management
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(endpoint: string): string {
    return `sportsdata_${endpoint.replace(/\//g, '_')}`
  }

  private getCachedData<T>(endpoint: string): T | null {
    const cacheKey = this.getCacheKey(endpoint)
    const cached = this.cache.get(cacheKey)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(cacheKey)
      return null
    }
    
    return cached.data
  }

  private setCachedData(endpoint: string, data: any): void {
    const cacheKey = this.getCacheKey(endpoint)
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  private async makeRequestWithCache<T>(endpoint: string): Promise<T> {
    const cached = this.getCachedData<T>(endpoint)
    if (cached) return cached

    const data = await this.makeRequest<T>(endpoint)
    this.setCachedData(endpoint, data)
    return data
  }
}

export default new SportsDataService()