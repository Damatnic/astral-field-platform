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

// Minimal projections/stats shapes for weekly syncs
export interface SportsDataWeeklyProjection {
  PlayerID: number
  Season: number
  SeasonType?: number
  Week: number
  Name?: string
  Team?: string
  Position?: string
  FantasyPoints?: number
  PassingYards?: number
  PassingTouchdowns?: number
  PassingInterceptions?: number
  RushingYards?: number
  RushingTouchdowns?: number
  ReceivingYards?: number
  Receptions?: number
  ReceivingTouchdowns?: number
}

export interface SportsDataWeeklyStat extends SportsDataWeeklyProjection {
  Updated?: string
}

class SportsDataService {
  private readonly baseUrl = 'https://api.sportsdata.io/v3/nfl'
  // Prefer server-side secret; fall back to public if needed (non-sensitive endpoints only)
  private get apiKey(): string {
    const key = process.env.SPORTSDATA_SECRET_KEY || process.env.NEXT_PUBLIC_SPORTSDATA_API_KEY || ''
    if (!key) {
      throw new Error('SportsData API key missing. Set SPORTSDATA_SECRET_KEY or NEXT_PUBLIC_SPORTSDATA_API_KEY')
    }
    return key
  }

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
    return this.makeRequestWithCache<SportsDataTeam[]>('/scores/json/Teams')
  }

  async getTeamsBasic(): Promise<SportsDataTeam[]> {
    return this.makeRequestWithCache<SportsDataTeam[]>('/scores/json/TeamsBasic')
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
    return this.makeRequestWithCache<number>('/scores/json/CurrentSeason')
  }

  async getCurrentWeek(): Promise<number> {
    return this.makeRequestWithCache<number>('/scores/json/CurrentWeek')
  }

  async getLastCompletedSeason(): Promise<number> {
    return this.makeRequest<number>('/scores/json/LastCompletedSeason')
  }

  async getUpcomingSeason(): Promise<number> {
    return this.makeRequest<number>('/scores/json/UpcomingSeason')
  }

  // Standings
  async getStandings(season: string): Promise<SportsDataStanding[]> {
    return this.makeRequestWithCache<SportsDataStanding[]>(`/scores/json/Standings/${season}`)
  }

  // Live Game Data
  async areGamesInProgress(): Promise<boolean> {
    return this.makeRequestWithCache<boolean>('/scores/json/AreAnyGamesInProgress')
  }

  async getByeWeeks(season: string): Promise<any[]> {
    return this.makeRequest<any[]>(`/scores/json/Byes/${season}`)
  }

  // Utility Methods
  async getStadiums(): Promise<any[]> {
    return this.makeRequestWithCache<any[]>('/scores/json/Stadiums')
  }

  async getReferees(): Promise<any[]> {
    return this.makeRequestWithCache<any[]>('/scores/json/Referees')
  }

  // Weekly projections and stats (endpoints approximate to SportsData.io paths)
  async getPlayerGameProjectionsByWeek(season: number, week: number): Promise<SportsDataWeeklyProjection[]> {
    const endpoint = `/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}`
    return this.makeRequest<SportsDataWeeklyProjection[]>(endpoint)
  }

  async getPlayerGameStatsByWeek(season: number, week: number): Promise<SportsDataWeeklyStat[]> {
    const endpoint = `/stats/json/PlayerGameStatsByWeek/${season}/${week}`
    return this.makeRequest<SportsDataWeeklyStat[]>(endpoint)
  }

  async getScoresByWeek(season: number, week: number): Promise<Pick<SportsDataGame,
    'Season'|'Week'|'AwayTeam'|'HomeTeam'|'AwayScore'|'HomeScore'|'Quarter'|'TimeRemaining'|'Status'|'DateTime'>[]> {
    const endpoint = `/scores/json/ScoresByWeek/${season}/${week}`
    return this.makeRequest(endpoint)
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

  async syncWeeklyProjectionsToDatabase(week?: number): Promise<{ success: number; failed: number; error: string | null; season?: number; week?: number }> {
    try {
      const season = await this.getCurrentSeason()
      const targetWeek = week || await this.getCurrentWeek()
      const projections = await this.getPlayerGameProjectionsByWeek(season, targetWeek)

      const { default: playerService } = await import('./playerService')

      let success = 0
      let failed = 0

      for (const p of projections) {
        try {
          const playerIdRes = await (await import('@/lib/database')).database.selectSingle('players', {
            where: { external_id: String(p.PlayerID) }
          })
          if (!playerIdRes.data) { failed++; continue }
          const playerId = playerIdRes.data.id

          const projectedStats: Record<string, number> = {}
          ;['PassingYards','PassingTouchdowns','PassingInterceptions','RushingYards','RushingTouchdowns','ReceivingYards','Receptions','ReceivingTouchdowns']
            .forEach(k => {
              const v = (p as any)[k]
              if (typeof v === 'number') projectedStats[k] = v
            })

          const resp = await playerService.updatePlayerProjections(playerId, {
            season,
            week: targetWeek,
            fantasyPoints: p.FantasyPoints || 0,
            adp: undefined,
            confidence: 0.8,
            projectedStats
          } as any)
          if (resp.error) { failed++ } else { success++ }
        } catch (e) {
          failed++
        }
      }

      return { success, failed, error: null, season, week: targetWeek }
    } catch (error: any) {
      return { success: 0, failed: 0, error: error.message }
    }
  }

  async syncWeeklyStatsToDatabase(week?: number): Promise<{ success: number; failed: number; error: string | null; season?: number; week?: number }> {
    try {
      const season = await this.getCurrentSeason()
      const targetWeek = week || await this.getCurrentWeek()
      const stats = await this.getPlayerGameStatsByWeek(season, targetWeek)

      const { default: playerService } = await import('./playerService')

      let success = 0
      let failed = 0

      for (const s of stats) {
        try {
          const playerIdRes = await (await import('@/lib/database')).database.selectSingle('players', {
            where: { external_id: String(s.PlayerID) }
          })
          if (!playerIdRes.data) { failed++; continue }
          const playerId = playerIdRes.data.id

          const statObj: any = {
            season: s.Season,
            week: s.Week,
            passingYards: s.PassingYards || 0,
            passingTDs: s.PassingTouchdowns || 0,
            passingINTs: s.PassingInterceptions || 0,
            rushingYards: s.RushingYards || 0,
            rushingTDs: s.RushingTouchdowns || 0,
            receivingYards: s.ReceivingYards || 0,
            receivingTDs: s.ReceivingTouchdowns || 0,
            receptions: (s as any).Receptions || 0,
            fantasyPoints: s.FantasyPoints || 0
          }

          const resp = await playerService.updatePlayerStats(playerId, statObj)
          if (resp.error) { failed++ } else { success++ }
        } catch (e) {
          failed++
        }
      }

      return { success, failed, error: null, season, week: targetWeek }
    } catch (error: any) {
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
