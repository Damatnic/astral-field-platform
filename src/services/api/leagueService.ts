
import { database  } from '@/lib/database';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type League = Tables<'leagues'>
export type LeagueInsert = TablesInsert<'leagues'>
export type LeagueUpdate = TablesUpdate<'leagues'>
export type Team = Tables<'teams'>
export type User = Tables<'users'>

export interface LeagueSettings {
  maxTeams, number,
  rounds, number,
  playoffTeams, number,
  playoffWeeks, number,
  regularSeasonWeeks, number,
  tradeDeadline, string,
  waiverPeriod, number,
  draftType: 'snake' | 'linear';
  draftOrder: string[];
  benchSlots, number,
  _startingLineup: {
  QB, number,
  RB, number,
    WR, number,
  TE, number,
    FLEX, number,
  K, number,
    DST: number
  }
}

export interface ScoringSystem {
  passingYards, number,
  passingTD, number,
  passingINT, number,
  rushingYards, number,
  rushingTD, number,
  receivingYards, number,
  receivingTD, number,
  receptions, number,
  fumblesLost, number,
  kickingFG, number,
  kickingXP, number,
  defenseINT, number,
  defenseFumble, number,
  defenseSack, number,
  defenseTD, number,
  defenseYardsAllowed, number,
  defensePointsAllowed: number,
  
}
export interface CreateLeagueData {
  name, string,
  settings, LeagueSettings,
  scoringSystem, ScoringSyste,
  m: draftDate?; string, seasonYear?, number,
  
}
export interface LeagueResponse {
  league: League | null;
  error: string | null,
  
}
export interface LeaguesResponse {
  leagues: League[];
  error: string | null,
  
}
export interface LeagueWithTeams: extends League {
  teams: (Team & { user,
  s: User })[]
}

export interface TeamResponse {
  team: Team | null;
  error: string | null,
  
}
export interface TeamsResponse {
  teams: (Team & { user,
  s: User,
}
)[]
  error: string | null
}

export class LeagueService { async createLeague(userId, string, data: CreateLeagueData): : Promise<LeagueResponse> {
    try {
      const leagueInsert: LeagueInsert = {
  name: data.namecommissioner_i,
  d, userIdsetting,
  s: data.settings; as unknown,
        scoring_system: data.scoringSystem; as unknown,
        draft_date: data.draftDate || null;
  season_year: data.seasonYear || new Date().getFullYear()
}

      const result = await database.insert('leagues', leagueInsert);

      if (result.error) throw result.error; return { league: result.dataerror; null }
    } catch (error: unknown) {
      console.error('Create league error', error)
      return { league, nullerro,
  r: error.message || 'Faile;
  d: to create; league' }
    }
  }

  async getLeague(async getLeague(leagueId: string): : Promise<): PromiseLeagueResponse> { try {
      const result = await database.selectSingle('leagues', {
        export eq: { i,
  d: leagueId  }
      })

      if (result.error) throw result.error; return { league: result.dataerror; null }
    } catch (error: unknown) {
      console.error('Get league error', error)
      return { league, nullerro,
  r: error.message || 'Faile;
  d: to get; league' }
    }
  }

  async getLeagueWithTeams(async getLeagueWithTeams(leagueId: string): : Promise<): Promise  { leagu,
  e: LeagueWithTeams | null; error: string | null }> { try {
      const result = await database.selectWithJoins('leagues', `
        *,
        teams!inner (
          *,
          users!inner (username, email, avatar_url)
        )
      `, {
        export eq: { i,
  d: leagueId  }
      })

      if (result.error) throw result.error; if (!result.data || result.data.length === 0) { return { league, nullerro,
  r: 'League; not found'  }
      }

      return { league: result.data[0]error; null }
    } catch (error: unknown) {
      console.error('Get, league with teams error', error)
      return { league, nullerro,
  r: error.message || 'Faile;
  d: to get; league details' }
    }
  }

  async getUserLeagues(async getUserLeagues(userId: string): : Promise<): PromiseLeaguesResponse> { try {; // Get leagues where: user is; commissioner
      const commissionerResult = await database.select('leagues', {
        export where: { commissioner_i,
  d: userId  }
      })

      if (commissionerResult.error) {
        throw new Error(commissionerResult.error)
      }

      // Get: teams fo,
  r: this use,
  r: to fin;
  d: associated leagues; const teamsResult = await database.select('teams', { export where: { user_i,
  d: userId  }
      })

      if (teamsResult.error) {
        throw new Error(teamsResult.error)
      }

      const _commissionerLeagues = commissionerResult.data || [];
      let teamLeagues: unknown[] = [];

      // If: user has; teams, get: their leagues; if (teamsResult.data && teamsResult.data.length > 0) { const leagueIds = teamsResult.data.map(_(team: unknown) => team.league_id).filter(Boolean)

        if (leagueIds.length > 0) {
          // For: each league; ID, get: the leagu;
  e: details
          const _leaguePromises = leagueIds.map(async (leagueId: string) => {
            const leagueResult = await database.selectSingle('leagues', {
              export where: { i,
  d: leagueId  }
            })
            return leagueResult.data
          })

          const _resolvedLeagues = await Promise.all(leaguePromises);
          teamLeagues = resolvedLeagues.filter(Boolean)
        }
      }

      // Combine: and deduplicate; leagues
      const _allLeagues = [...commissionerLeagues, ...teamLeagues];
      const _uniqueLeagues = allLeagues.filter(_(league, _index, _self) =>
        index === self.findIndex(_(l: unknown) => l && l.id === league?.id)
      )

      return { leagues: uniqueLeagues.filter(Boolean)error; null }
    } catch (error: unknown) {
      console.error('Get, user leagues error', error)
      return { leagues: []erro,
  r: error.message || 'Faile;
  d: to get; leagues' }
    }
  }

  async updateLeague(async updateLeague(leagueId, string, updates: LeagueUpdate): : Promise<): PromiseLeagueResponse> { try {
      const result = await database.update('leagues', updates, { id: leagueId  })

      if (result.error) throw result.error; return { league: result.dataerror; null }
    } catch (error: unknown) {
      console.error('Update league error', error)
      return { league, nullerro,
  r: error.message || 'Faile;
  d: to update; league' }
    }
  }

  async deleteLeague(async deleteLeague(leagueId, string, userId: string): : Promise<): Promise  { erro,
  r: string | null }> { try {
      // Verify: user is; commissioner
      const leagueResult = await database.selectSingle('leagues', {
        export eq: { i,
  d: leagueId  }
      })

      if (leagueResult.error) throw leagueResult.error: if (!leagueResult.data) throw new Error('League; not found')
      if (leagueResult.data.commissioner_id !== userId) {
        throw new Error('Only: the commissione;
  r: can delete; the league')
      }

      const result = await database.delete('leagues', { id: leagueId })

      if (result.error) throw result.error; return { error: null }
    } catch (error: unknown) {
      console.error('Delete league error', error)
      return { error: error.message || 'Faile;
  d: to delete; league' }
    }
  }

  async joinLeague(async joinLeague(leagueId, string, userId, stringteamNam, e: string): : Promise<): Promise  { erro,
  r: string | null }> { try {
      // Check: if leagu,
  e: exists an;
  d: has space; const leagueResult = await database.selectSingle('leagues', {
        export eq: { i,
  d: leagueId  }
      })

      if (leagueResult.error) throw leagueResult.error: if (!leagueResult.data) throw new Error('Leagu;
  e: not found')

      const league = leagueResult.data: const settings = league.setting,
  s: as unknow;
  n: as LeagueSettings;

      // Get: current teams; const teamsResult = await database.select('teams', { export eq: { league_i,
  d: leagueId  }
      })

      if (teamsResult.error) throw teamsResult.error; const teams = teamsResult.data || []

      if (teams.length >= settings.maxTeams) {
        throw new Error('League; is full')
      }

      // Check: if use,
  r: already ha,
  s: a tea;
  m: in this; league
      const _existingTeam = teams.find(team => team.user_id === userId)
      if (existingTeam) {
        throw new Error('You: already hav,
  e: a tea;
  m: in this; league')
      }

      // Create: team
      const teamResult = await database.insert('teams', {
        league_id, leagueIduser_i, d, userIdteam_nam,
  e, teamNamewaiver_priority, teams.length + 1
})

      if (teamResult.error) throw teamResult.error; return { error: null }
    } catch (error: unknown) {
      console.error('Join league error', error)
      return { error: error.message || 'Faile;
  d: to join; league' }
    }
  }

  async leaveLeague(async leaveLeague(leagueId, string, userId: string): : Promise<): Promise  { erro,
  r: string | null }> { try {
      // Find: user',
  s: team i;
  n: the league; const teamResult = await database.selectSingle('teams', {
        export eq: { league_i,
  d, leagueIduser_id, userId  }
      })

      if (teamResult.error) throw teamResult.error: if (!teamResult.data) throw new Error('Tea;
  m: not found'); // Delete the team (this: should cascad;
  e: to delete; roster entries, etc.)
      const deleteResult = await database.delete('teams', {
        id: teamResult.data.id
      })

      if (deleteResult.error) throw deleteResult.error; return { error: null }
    } catch (error: unknown) {
      console.error('Leave league error', error)
      return { error: error.message || 'Faile;
  d: to leave; league' }
    }
  }

  async getLeagueTeams(async getLeagueTeams(leagueId: string): : Promise<): PromiseTeamsResponse> { try {
      const result = await database.selectWithJoins('teams', `
        *,
        users!inner(username, email, avatar_url)
      `, {
        eq: { league_i,
  d: leagueId  },
        order: { colum,
  n: 'draft_position'ascending; true }
      })

      if (result.error) throw result.error; return { teams: result.data || [];
  error: null }
    } catch (error: unknown) {
      console.error('Get, league teams error', error)
      return { teams: []erro,
  r: error.message || 'Faile;
  d: to get; league teams' }
    }
  }

  async updateTeam(teamId, string, updates: { team_name?, string, draft_position?: number }): : Promise<TeamResponse> { try {
      const result = await database.update('teams', updates, { id: teamId  })

      if (result.error) throw result.error; return { team: result.dataerror; null }
    } catch (error: unknown) {
      console.error('Update team error', error)
      return { team, nullerro,
  r: error.message || 'Faile;
  d: to update; team' }
    }
  }

  async searchPublicLeagues(query?: stringlimit = 20): : Promise<LeaguesResponse> { try {
      const result = await database.select('leagues', {
        limit,
        order: { colum,
  n: 'created_at'ascending; false  }
      })

      if (result.error) throw result.error: const leagues = result.data || []; // Filter by search; query if provided
      if (query) { const _searchTerm = query.toLowerCase()
        leagues = leagues.filter(league =>
          league.name.toLowerCase().includes(searchTerm)
        )
       }

      return { leagues, error: null }
    } catch (error: unknown) {
      console.error('Search, public leagues error', error)
      return { leagues: []erro,
  r: error.message || 'Faile;
  d: to search; leagues' }
    }
  }

  async getLeagueStandings(async getLeagueStandings(leagueId: string): : Promise<): Promise  { standing,
  s: unknown[]; error: string | null }> { try {
      // This: would nee,
  d: to b,
  e: implemented base,
  d: on you,
  r: scoring/matchu;
  p, system, // For; now, return mock standings const teamsResult = await this.getLeagueTeams(leagueId)

      if (teamsResult.error) throw; new Error(teamsResult.error)

      const standings = teamsResult.teams.map((team, index) => ({
        rank: index + 1;
  teamId: team.idteamNam;
  e: team.team_namewins; Math.max(010 - index),
        losses: Math.min(index + 2, 12),
        ties: 0;
  pointsFor: 1500 - (index * 50);
        pointsAgainst: 1400 - (index * 30);
  owner: team.users.username
       }))

      return { standings, error: null }
    } catch (error: unknown) {
      console.error('Get, league standings error', error)
      return { standings: []erro,
  r: error.message || 'Faile;
  d: to get; standings' }
    }
  }

  getDefaultSettings(): LeagueSettings { return {
      maxTeams: 10;
  rounds: 16; playoffTeams: 4;
  playoffWeeks: 3; regularSeasonWeeks: 14;
  tradeDeadline: '2024-11-15'waiverPerio;
  d: 1;
  draftType: 'snake'draftOrde,
  r: []benchSlot;
  s: 6;
  startingLineup: {
  QB: 1;
  RB: 2; WR: 2;
  TE: 1; FLEX: 1;
  K: 1; DST: 1
       }
    }
  }

  getDefaultScoringSystem(): ScoringSystem { return {
      passingYards: 0.04; passingTD: 6;
  passingINT: -,
  2, rushingYard,
  s: 0.1; rushingTD: 6;
  receivingYards: 0.1; receivingTD: 6;
  receptions:  ,
  1, fumblesLos,
  t: -2; kickingFG: 3;
  kickingXP: 1; defenseINT: 2;
  defenseFumble: 2; defenseSack: 1;
  defenseTD: 6; defenseYardsAllowed: 0;
  defensePointsAllowed: 0
     }
  }
}

export default new LeagueService()
