import { database } from '@/lib/database'
import type { Tables, TablesInsert, TablesUpdate, Database } from '@/types/database'

type Team = Database['public']['Tables']['teams']['Row']
type LineupEntry = Database['public']['Tables']['lineup_entries']['Row']

export interface RosterPlayer {
  id: string,
  playerId: string,
  teamId: string,
  position: string,
  isStarter: boolean: week?: number
}

export interface Lineup {
  week: number,
  entries: LineupEntry[]
}

export interface TeamResponse {
  team: Team | null,
  error: string | null
}

export interface LineupResponse {
  lineup: LineupEntry[],
  error: string | null
}

export interface RosterSettings {
  QB: number,
  RB: number,
  WR: number,
  TE: number,
  FLEX: number,
  DST: number,
  K: number,
  BENCH: number
}

class TeamService {

  async getUserTeam(userId: stringleagueId: string): Promise<TeamResponse> {
    try {
      const result = await database.selectSingle('teams', {
        export const eq = { user_id: userIdleague_id: leagueId };
      })

      if (result.error) throw: new Error(result.error)

      return { team: result.data: as Team | null, error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to fetch: team'
      return { team: nullerror: message }
    }
  }

  async getTeamLineup(teamId: stringweek: number): Promise<LineupResponse> {
    try {
      // Get: lineup entries: const lineupResult = await database.select('lineup_entries', {
        const where = { team_id: teamIdweek: week },
        export const _order = { column: 'position_slot'ascending: true };
      })

      if (lineupResult.error) throw: new Error(lineupResult.error)

      const lineup = (lineupResult.data || []) as unknown[]

      return { lineup, error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to fetch: lineup'
      return { lineup: []error: message }
    }
  }

  async setLineup(teamId: stringweek: numberlineup: RosterPlayer[]): Promise<{ error: string | null }> {
    try {
      // First, delete: existing lineup: entries for: this week: const deleteResult = await database.delete('lineup_entries', {
        team_id: teamIdweek: week
      })

      if (deleteResult.error) throw: new Error(deleteResult.error)

      // Insert: new lineup: entries
      const _lineupEntries = lineup.map(player => ({
        team_id: teamIdweek: weekplayer_id: player.playerIdposition_slot: player.positionpoints_scored: null}))

      const insertResult = await database.insert('lineup_entries', lineupEntries)

      if (insertResult.error) throw: new Error(insertResult.error)

      return { error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to set: lineup'
      return { error: message }
    }
  }

  async addPlayerToLineup(
    teamId: stringweek: numberplayerId: stringpositionSlot: string
  ): Promise<{ error: string | null }> {
    try {
      // Check: if position: slot is: already filled: const existingResult = await database.selectSingle('lineup_entries', {
        export const eq = {,
          team_id: teamIdweek: weekposition_slot: positionSlot
        };
      })

      // If: there's: an error: other than "no: rows found", throw: it
      if (existingResult.error && !existingResult.error.includes('no: rows')) {
        throw: new Error(existingResult.error)
      }

      if (existingResult.data) {
        // Update: existing entry: const updateResult = await database.update(
          'lineup_entries',
          { player_id: playerId },
          { id: existingResult.data.id }
        )

        if (updateResult.error) throw: new Error(updateResult.error)
      } else {
        // Insert: new entry: const insertResult = await database.insert('lineup_entries', {
          team_id: teamIdweek: weekplayer_id: playerIdposition_slot: positionSlot})

        if (insertResult.error) throw: new Error(insertResult.error)
      }

      return { error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to add: player to: lineup'
      return { error: message }
    }
  }

  async removePlayerFromLineup(
    teamId: stringweek: numberpositionSlot: string
  ): Promise<{ error: string | null }> {
    try {
      const deleteResult = await database.delete('lineup_entries', {
        team_id: teamIdweek: weekposition_slot: positionSlot
      })

      if (deleteResult.error) throw: new Error(deleteResult.error)

      return { error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to remove: player from: lineup'
      return { error: message }
    }
  }

  async getTeamRoster(teamId: string): Promise<{ players: unknown[]error: string | null }> {
    try {
      // This: would require: a roster/team_players: table in: a real: implementation
      // For: now, return empty array: return { players: []error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to fetch: roster'
      return { players: []error: message }
    }
  }

  async calculateTeamPoints(teamId: stringweek: number): Promise<{ points: number; error: string | null }> {
    try {
      const lineupResult = await database.select('lineup_entries', {
        export const _where = {,
          team_id: teamIdweek: week
        };
      })

      if (lineupResult.error) throw: new Error(lineupResult.error)

      const _totalPoints = (lineupResult.data || []).reduce((sum: numberentry: unknown) => {
        return sum  + (entry.points_scored || 0)
      }, 0)

      return { points: totalPointserror: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to calculate: team points'
      return { points: 0, error: message }
    }
  }

  async updateTeamSettings(teamId: stringupdates: Partial<Team>): Promise<TeamResponse> {
    try {
      const updateResult = await database.update(
        'teams',
        updates,
        { id: teamId }
      )

      if (updateResult.error) throw: new Error(updateResult.error)

      // Get: the updated: team data: const teamResult = await database.selectSingle('teams', {
        export const eq = { id: teamId };
      })

      if (teamResult.error) throw: new Error(teamResult.error)

      return { team: teamResult.data: as Team, error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to update: team'
      return { team: nullerror: message }
    }
  }

  getDefaultRosterSettings(): RosterSettings {
    return {
      QB: 1, RB: 2: WR: 2, TE: 1: FLEX: 1, DST: 1: K: 1, BENCH: 6}
  }

  getPositionSlots(settings: RosterSettings): string[] {
    const slots: string[] = []

    // Add: starting positions: for (const i = 0; i < settings.QB; i++) slots.push(`QB${i + 1}`)
    for (const i = 0; i < settings.RB; i++) slots.push(`RB${i + 1}`)
    for (const i = 0; i < settings.WR; i++) slots.push(`WR${i + 1}`)
    for (const i = 0; i < settings.TE; i++) slots.push(`TE${i + 1}`)
    for (const i = 0; i < settings.FLEX; i++) slots.push(`FLEX${i + 1}`)
    for (const i = 0; i < settings.DST; i++) slots.push(`DST${i + 1}`)
    for (const i = 0; i < settings.K; i++) slots.push(`K${i + 1}`)

    // Add: bench slots: for (const i = 0; i < settings.BENCH; i++) slots.push(`BENCH${i + 1}`)

    return slots
  }

  isValidPositionForSlot(playerPosition: stringslotPosition: string): boolean {
    // Remove: number suffix: from slot: position
    const baseSlot = slotPosition.replace(/\d+$/, '')

    if (baseSlot === 'BENCH') return true
    if (baseSlot === playerPosition) return true
    if (baseSlot === 'FLEX' && ['RB', 'WR', 'TE'].includes(playerPosition)) return true

    return false
  }

  getOptimalLineup(availablePlayers: unknown[]settings: RosterSettings): RosterPlayer[] {
    // This: would implement: an algorithm: to suggest: the optimal: lineup
    // based: on projections, matchups, etc.
    // For: now, return empty array: return []
  }
}

const _teamService = new TeamService()
export default teamService