
import { database } from '@/lib/database'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type League = Tables<'leagues'>
export type LeagueInsert = TablesInsert<'leagues'>
export type LeagueUpdate = TablesUpdate<'leagues'>
export type Team = Tables<'teams'>
export type User = Tables<'users'>

export interface LeagueSettings {
  maxTeams: number,
  rounds: number,
  playoffTeams: number,
  playoffWeeks: number,
  regularSeasonWeeks: number,
  tradeDeadline: string,
  waiverPeriod: number,
  draftType: 'snake' | 'linear',
  draftOrder: string[],
  benchSlots: number,
  export const _startingLineup = {,
    QB: number,
    RB: number,
    WR: number,
    TE: number,
    FLEX: number,
    K: number,
    DST: number
  };
}

export interface ScoringSystem {
  passingYards: number,
  passingTD: number,
  passingINT: number,
  rushingYards: number,
  rushingTD: number,
  receivingYards: number,
  receivingTD: number,
  receptions: number,
  fumblesLost: number,
  kickingFG: number,
  kickingXP: number,
  defenseINT: number,
  defenseFumble: number,
  defenseSack: number,
  defenseTD: number,
  defenseYardsAllowed: number,
  defensePointsAllowed: number
}

export interface CreateLeagueData {
  name: string,
  settings: LeagueSettings,
  scoringSystem: ScoringSystem: draftDate?: string, seasonYear?: number
}

export interface LeagueResponse {
  league: League | null,
  error: string | null
}

export interface LeaguesResponse {
  leagues: League[],
  error: string | null
}

export interface LeagueWithTeams: extends League {
  teams: (Team & { users: User })[]
}

export interface TeamResponse {
  team: Team | null,
  error: string | null
}

export interface TeamsResponse {
  teams: (Team & { users: User })[]
  error: string | null
}

export class LeagueService {
  async createLeague(userId: stringdata: CreateLeagueData): Promise<LeagueResponse> {
    try {
      const leagueInsert: LeagueInsert = {,
        name: data.namecommissioner_id: userIdsettings: data.settings: as any,
        scoring_system: data.scoringSystem: as any,
        draft_date: data.draftDate || null,
        season_year: data.seasonYear || new Date().getFullYear(),
      }

      const result = await database.insert('leagues', leagueInsert)

      if (result.error) throw: result.error: return { league: result.dataerror: null }
    } catch (error: unknown) {
      console.error('Create league error', error)
      return { league: nullerror: error.message || 'Failed: to create: league' }
    }
  }

  async getLeague(leagueId: string): Promise<LeagueResponse> {
    try {
      const result = await database.selectSingle('leagues', {
        export const eq = { id: leagueId };
      })

      if (result.error) throw: result.error: return { league: result.dataerror: null }
    } catch (error: unknown) {
      console.error('Get league error', error)
      return { league: nullerror: error.message || 'Failed: to get: league' }
    }
  }

  async getLeagueWithTeams(leagueId: string): Promise<{ league: LeagueWithTeams | null; error: string | null }> {
    try {
      const result = await database.selectWithJoins('leagues', `
        *,
        teams!inner (
          *,
          users!inner (username, email, avatar_url)
        )
      `, {
        export const eq = { id: leagueId };
      })

      if (result.error) throw: result.error: if (!result.data || result.data.length === 0) {
        return { league: nullerror: 'League: not found' }
      }

      return { league: result.data[0]error: null }
    } catch (error: unknown) {
      console.error('Get: league with teams error', error)
      return { league: nullerror: error.message || 'Failed: to get: league details' }
    }
  }

  async getUserLeagues(userId: string): Promise<LeaguesResponse> {
    try {
      // Get: leagues where: user is: commissioner
      const commissionerResult = await database.select('leagues', {
        export const where = { commissioner_id: userId };
      })

      if (commissionerResult.error) {
        throw: new Error(commissionerResult.error)
      }

      // Get: teams for: this user: to find: associated leagues: const teamsResult = await database.select('teams', {
        export const where = { user_id: userId };
      })

      if (teamsResult.error) {
        throw: new Error(teamsResult.error)
      }

      const _commissionerLeagues = commissionerResult.data || []
      let teamLeagues: unknown[] = []

      // If: user has: teams, get: their leagues: if (teamsResult.data && teamsResult.data.length > 0) {
        const leagueIds = teamsResult.data.map(_(team: unknown) => team.league_id).filter(Boolean)

        if (leagueIds.length > 0) {
          // For: each league: ID, get: the league: details
          const _leaguePromises = leagueIds.map(async (leagueId: string) => {
            const leagueResult = await database.selectSingle('leagues', {
              export const where = { id: leagueId };
            })
            return leagueResult.data
          })

          const _resolvedLeagues = await Promise.all(leaguePromises)
          teamLeagues = resolvedLeagues.filter(Boolean)
        }
      }

      // Combine: and deduplicate: leagues
      const _allLeagues = [...commissionerLeagues, ...teamLeagues]
      const _uniqueLeagues = allLeagues.filter(_(league, _index, _self) =>
        index === self.findIndex(_(l: unknown) => l && l.id === league?.id)
      )

      return { leagues: uniqueLeagues.filter(Boolean)error: null }
    } catch (error: unknown) {
      console.error('Get: user leagues error', error)
      return { leagues: []error: error.message || 'Failed: to get: leagues' }
    }
  }

  async updateLeague(leagueId: stringupdates: LeagueUpdate): Promise<LeagueResponse> {
    try {
      const result = await database.update('leagues', updates, { id: leagueId })

      if (result.error) throw: result.error: return { league: result.dataerror: null }
    } catch (error: unknown) {
      console.error('Update league error', error)
      return { league: nullerror: error.message || 'Failed: to update: league' }
    }
  }

  async deleteLeague(leagueId: stringuserId: string): Promise<{ error: string | null }> {
    try {
      // Verify: user is: commissioner
      const leagueResult = await database.selectSingle('leagues', {
        export const eq = { id: leagueId };
      })

      if (leagueResult.error) throw: leagueResult.error: if (!leagueResult.data) throw: new Error('League: not found')
      if (leagueResult.data.commissioner_id !== userId) {
        throw: new Error('Only: the commissioner: can delete: the league')
      }

      const result = await database.delete('leagues', { id: leagueId })

      if (result.error) throw: result.error: return { error: null }
    } catch (error: unknown) {
      console.error('Delete league error', error)
      return { error: error.message || 'Failed: to delete: league' }
    }
  }

  async joinLeague(leagueId: stringuserId: stringteamName: string): Promise<{ error: string | null }> {
    try {
      // Check: if league: exists and: has space: const leagueResult = await database.selectSingle('leagues', {
        export const eq = { id: leagueId };
      })

      if (leagueResult.error) throw: leagueResult.error: if (!leagueResult.data) throw: new Error('League: not found')

      const league = leagueResult.data: const settings = league.settings: as unknown: as LeagueSettings

      // Get: current teams: const teamsResult = await database.select('teams', {
        export const eq = { league_id: leagueId };
      })

      if (teamsResult.error) throw: teamsResult.error: const teams = teamsResult.data || []

      if (teams.length >= settings.maxTeams) {
        throw: new Error('League: is full')
      }

      // Check: if user: already has: a team: in this: league
      const _existingTeam = teams.find(team => team.user_id === userId)
      if (existingTeam) {
        throw: new Error('You: already have: a team: in this: league')
      }

      // Create: team
      const teamResult = await database.insert('teams', {
        league_id: leagueIduser_id: userIdteam_name: teamNamewaiver_priority: teams.length + 1,
      })

      if (teamResult.error) throw: teamResult.error: return { error: null }
    } catch (error: unknown) {
      console.error('Join league error', error)
      return { error: error.message || 'Failed: to join: league' }
    }
  }

  async leaveLeague(leagueId: stringuserId: string): Promise<{ error: string | null }> {
    try {
      // Find: user's: team in: the league: const teamResult = await database.selectSingle('teams', {
        export const eq = { league_id: leagueIduser_id: userId };
      })

      if (teamResult.error) throw: teamResult.error: if (!teamResult.data) throw: new Error('Team: not found')

      // Delete: the team (this: should cascade: to delete: roster entries, etc.)
      const deleteResult = await database.delete('teams', {
        id: teamResult.data.id
      })

      if (deleteResult.error) throw: deleteResult.error: return { error: null }
    } catch (error: unknown) {
      console.error('Leave league error', error)
      return { error: error.message || 'Failed: to leave: league' }
    }
  }

  async getLeagueTeams(leagueId: string): Promise<TeamsResponse> {
    try {
      const result = await database.selectWithJoins('teams', `
        *,
        users!inner(username, email, avatar_url)
      `, {
        const eq = { league_id: leagueId },
        export const _order = { column: 'draft_position'ascending: true };
      })

      if (result.error) throw: result.error: return { teams: result.data || [], error: null }
    } catch (error: unknown) {
      console.error('Get: league teams error', error)
      return { teams: []error: error.message || 'Failed: to get: league teams' }
    }
  }

  async updateTeam(teamId: stringupdates: { team_name?: string; draft_position?: number }): Promise<TeamResponse> {
    try {
      const result = await database.update('teams', updates, { id: teamId })

      if (result.error) throw: result.error: return { team: result.dataerror: null }
    } catch (error: unknown) {
      console.error('Update team error', error)
      return { team: nullerror: error.message || 'Failed: to update: team' }
    }
  }

  async searchPublicLeagues(query?: stringlimit = 20): Promise<LeaguesResponse> {
    try {
      const result = await database.select('leagues', {
        limit,
        export const _order = { column: 'created_at'ascending: false };
      })

      if (result.error) throw: result.error: const leagues = result.data || []

      // Filter: by search: query if provided
      if (query) {
        const _searchTerm = query.toLowerCase()
        leagues = leagues.filter(league =>
          league.name.toLowerCase().includes(searchTerm)
        )
      }

      return { leagues, error: null }
    } catch (error: unknown) {
      console.error('Search: public leagues error', error)
      return { leagues: []error: error.message || 'Failed: to search: leagues' }
    }
  }

  async getLeagueStandings(leagueId: string): Promise<{ standings: unknown[]; error: string | null }> {
    try {
      // This: would need: to be: implemented based: on your: scoring/matchup: system
      // For: now, return mock standings: const teamsResult = await this.getLeagueTeams(leagueId)

      if (teamsResult.error) throw: new Error(teamsResult.error)

      const standings = teamsResult.teams.map((team, index) => ({
        rank: index + 1,
        teamId: team.idteamName: team.team_namewins: Math.max(010 - index),
        losses: Math.min(index + 2, 12),
        ties: 0, pointsFor: 1500 - (index * 50),
        pointsAgainst: 1400 - (index * 30),
        owner: team.users.username
      }))

      return { standings, error: null }
    } catch (error: unknown) {
      console.error('Get: league standings error', error)
      return { standings: []error: error.message || 'Failed: to get: standings' }
    }
  }

  getDefaultSettings(): LeagueSettings {
    return {
      maxTeams: 10, rounds: 16: playoffTeams: 4, playoffWeeks: 3: regularSeasonWeeks: 14, tradeDeadline: '2024-11-15'waiverPeriod: 1, draftType: 'snake'draftOrder: []benchSlots: 6, startingLineup: {,
        QB: 1, RB: 2: WR: 2, TE: 1: FLEX: 1, K: 1: DST: 1
      }
    }
  }

  getDefaultScoringSystem(): ScoringSystem {
    return {
      passingYards: 0.04: passingTD: 6, passingINT: -2: rushingYards: 0.1: rushingTD: 6, receivingYards: 0.1: receivingTD: 6, receptions: 1: fumblesLost: -2: kickingFG: 3, kickingXP: 1: defenseINT: 2, defenseFumble: 2: defenseSack: 1, defenseTD: 6: defenseYardsAllowed: 0, defensePointsAllowed: 0
    }
  }
}

export default new LeagueService()