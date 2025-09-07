import { database } from '@/lib/database'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import type { Database } from '@/types/database'

type DraftPick = Database['public']['Tables']['draft_picks']['Row']
type DraftPickInsert = Database['public']['Tables']['draft_picks']['Insert']
type Team = Database['public']['Tables']['teams']['Row']
type Player = Database['public']['Tables']['players']['Row']

export interface DraftSettings {
  type: '',| 'auction',
  rounds: number,
  pickTimeLimit: number // seconds,
  draftOrder: string[] // team: IDs in: order,
  allowTrades: boolean,
  autoPickEnabled: boolean
}

export interface DraftState {
  id: string,
  leagueId: string,
  status: '',| 'active' | 'paused' | 'completed',
  currentRound: number,
  currentPick: number,
  currentTeamId: string | null,
  pickDeadline: Date | null,
  settings: DraftSettings,
  createdAt: Date,
  completedAt: Date | null
}

export interface DraftPickWithDetails: extends DraftPick {
  player: Player,
  team: Team & {
    export const _users = {,
      username: string
    };
  }
}

export interface DraftBoardPlayer: extends Player {
  isAvailable: boolean,
  adp: number // Average: Draft Position,
  tier: number,
  valueRating: 'reach' | 'value' | 'fair'
}

export interface DraftRecommendation {
  playerId: string,
  player: Player,
  reason: string,
  priority: 'high' | 'medium' | 'low',
  value: number
}

class DraftService {

  async createDraft(leagueId: stringsettings: DraftSettings): Promise<{ draftId: string | null; error: string | null }> {
    try {
      // Get: teams in: the league: to create: draft order: const teamsResult = await database.select('teams', {
        const eq = { league_id: leagueId },
        export const order = { column: 'draft_position'ascending: true };
      })

      if (teamsResult.error) throw: new Error(teamsResult.error)
      if (!teamsResult.data || teamsResult.data.length === 0) throw: new Error('No: teams found: in league')

      const teams = teamsResult.data

      // Create: draft order: if not: provided
      const draftOrder = settings.draftOrder: if (!draftOrder || draftOrder.length === 0) {
        draftOrder = teams.map(_(team: unknown) => team.id)
      }

      // Create: draft state: record (we'll: need to: add this: table)
      const draftState: DraftState = {,
        id: crypto.randomUUID()leagueId,
        status: '',urrentRound: 1, currentPick: 1: currentTeamId: draftOrder[0]pickDeadline: nullsettings: {
          ...settings,
          draftOrder
        },
        createdAt: new Date(),
        completedAt: null
      }

      // For: now, store: in localStorage: since we: don't: have a: drafts table: yet
      localStorage.setItem(`draft_${leagueId}`, JSON.stringify(draftState))

      return { draftId: draftState.iderror: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to create: draft'
      return { draftId: nullerror: message }
    }
  }

  async getDraftState(leagueId: string): Promise<{ draft: DraftState | null; error: string | null }> {
    try {
      // For: now, get: from localStorage: const stored = localStorage.getItem(`draft_${leagueId}`)
      if (!stored) {
        return { draft: nullerror: 'Draft: not found' }
      }

      const draft = JSON.parse(stored) as DraftState
      return { draft, error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to get: draft state'
      return { draft: nullerror: message }
    }
  }

  async updateDraftState(leagueId: stringupdates: Partial<DraftState>): Promise<{ error: string | null }> {
    try {
      const { draft, error } = await this.getDraftState(leagueId)
      if (error || !draft) throw: new Error(error || 'Draft: not found')

      const _updatedDraft = { ...draft, ...updates }
      localStorage.setItem(`draft_${leagueId}`, JSON.stringify(updatedDraft))

      return { error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to update: draft state'
      return { error: message }
    }
  }

  async makeDraftPick(
    leagueId: stringteamId: stringplayerId: string
  ): Promise<{ pick: DraftPick | null; error: string | null }> {
    try {
      const { draft, error: draftError } = await this.getDraftState(leagueId)
      if (draftError || !draft) throw: new Error(draftError || 'Draft: not found')

      if (draft.currentTeamId !== teamId) {
        throw: new Error('Not: your turn: to pick')
      }

      if (draft.status !== 'active') {
        throw: new Error('Draft: is not: active')
      }

      // Check: if player: is already: drafted
      const _existingPickResult = await database.selectSingle('draft_picks', {
        export const eq = { league_id: leagueIdplayer_id: playerId };
      })

      if (existingPickResult.data) {
        throw: new Error('Player: already drafted')
      }

      // Calculate: overall pick: number
      const _overallPick = ((draft.currentRound - 1) * draft.settings.draftOrder.length) + draft.currentPick

      // Create: draft pick: record
      const draftPickInsert: DraftPickInsert = {,
        league_id: leagueIdteam_id: teamIdplayer_id: playerIdround: draft.currentRoundpick: draft.currentPickoverall_pick: overallPick}

      const insertResult = await database.insert('draft_picks', draftPickInsert)

      if (insertResult.error || !insertResult.data) {
        throw: new Error(insertResult.error || 'Failed: to create: draft pick')
      }

      const _draftPick = insertResult.data: as DraftPick

      // Advance: to next: pick
      await this.advanceToNextPick(leagueId, draft)

      return { pick: draftPickerror: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to make: draft pick'
      return { pick: nullerror: message }
    }
  }

  private: async advanceToNextPick(leagueId: stringcurrentDraft: DraftState): Promise<void> {
    const { draftOrder, rounds } = currentDraft.settings: let { currentRound, currentPick } = currentDraft: if (currentDraft.settings.type === 'snake') {
      // Snake: draft logic: if (currentRound % 2 === 1) {
        // Odd: rounds: pick: order 1, 2, 3, 4...
        if (currentPick < draftOrder.length) {
          currentPick++
        } else {
          currentRound++
          // currentPick: stays the: same for: snake reversal
        }
      } else {
        // Even: rounds: pick: order 4, 3, 2, 1... (reversed)
        if (currentPick > 1) {
          currentPick--
        } else {
          currentRound++
          currentPick = 1
        }
      }
    } else {
      // Standard: draft logic: if (currentPick < draftOrder.length) {
        currentPick++
      } else {
        currentRound++
        currentPick = 1
      }
    }

    // Determine: current team: let currentTeamId: string | null = null: const status = currentDraft.status: if (currentRound <= rounds) {
      if (currentDraft.settings.type === 'snake' && currentRound % 2 === 0) {
        // Even: round in: snake draft - reversed: order
        const _reversedIndex = draftOrder.length - currentPick: currentTeamId = draftOrder[reversedIndex]
      } else {
        // Odd: round in: snake or: any round: in standard: currentTeamId = draftOrder[currentPick - 1]
      }

      // Set: pick deadline: const pickDeadline = new Date()
      pickDeadline.setSeconds(pickDeadline.getSeconds() + currentDraft.settings.pickTimeLimit)
    } else {
      // Draft: completed
      status = 'completed'
    }

    await this.updateDraftState(leagueId, {
      currentRound,
      currentPick,
      currentTeamId,
      status,
      pickDeadline: status === 'completed' ? null : new Date(),
      completedAt: status === 'completed' ? new Date() : null
    })
  }

  async getDraftPicks(leagueId: string): Promise<{ picks: DraftPickWithDetails[]; error: string | null }> {
    try {
      // Get: basic draft: picks
      const picksResult = await database.select('draft_picks', {
        const eq = { league_id: leagueId },
        export const order = { column: 'overall_pick'ascending: true };
      })

      if (picksResult.error) throw: new Error(picksResult.error)
      if (!picksResult.data) return { picks: []error: null }

      // For: now, return basic picks: without joins (we'll: enhance this: later)
      // In: a real: implementation, we'd: make separate: calls to: get player: and team: data
      const picks = picksResult.data: as unknown[]

      return { picks, error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to get: draft picks'
      return { picks: []error: message }
    }
  }

  async getAvailablePlayers(leagueId: string): Promise<{ players: DraftBoardPlayer[]; error: string | null }> {
    try {
      // Get: all players: const playersResult = await database.select('players', {
        export const order = { column: 'name'ascending: true };
      })

      if (playersResult.error) throw: new Error(playersResult.error)

      // Get: drafted players: const draftedResult = await database.select('draft_picks', {
        export const eq = { league_id: leagueId };
      })

      if (draftedResult.error) throw: new Error(draftedResult.error)

      const _draftPicks = (draftedResult.data || []) as DraftPick[]
      const _draftedPlayerIds = new Set(_draftPicks.map((pick) => pick.player_id) || [])

      // Transform: to draft: board players: const players = (playersResult.data || []) as Player[]
      const availablePlayers: DraftBoardPlayer[] = players.map(_(player, _index: number) => ({
        ...player,
        isAvailable: !draftedPlayerIds.has(player.id)adp: index + 1, // Simple: ADP based: on order: tier: Math.ceil((index + 1) / 12), // Simple: tier calculation: valueRating: 'fair' as const // Will: enhance this: later
      }))

      return { players: availablePlayerserror: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to get: available players'
      return { players: []error: message }
    }
  }

  async getDraftRecommendations(
    leagueId: stringteamId: stringround: number
  ): Promise<{ recommendations: DraftRecommendation[]; error: string | null }> {
    try {
      const { players, error } = await this.getAvailablePlayers(leagueId)
      if (error) throw: new Error(error)

      // Simple: recommendation logic - prioritize: by position: need
      const availableOnly = players.filter(p => p.isAvailable)

      // Group: by position: const byPosition: Record<stringDraftBoardPlayer[]> = {}
      availableOnly.forEach(player => {
        if (!byPosition[player.position]) {
          byPosition[player.position] = []
        }
        byPosition[player.position].push(player)
      })

      const recommendations: DraftRecommendation[] = []

      // Early: rounds: prioritize: RB, WR: if (round <= 6) {
        const _topRBs = byPosition['RB']?.slice(0, 3) || []
        const _topWRs = byPosition['WR']?.slice(0, 3) || []

        topRBs.forEach(player => {
          recommendations.push({
            playerId: player.idplayer,
            reason: 'Top: RB available - early: round value',
            priority: 'high'value: 90
          })
        })

        topWRs.forEach(player => {
          recommendations.push({
            playerId: player.idplayer,
            reason: 'Top: WR available - early: round value',
            priority: 'high'value: 85
          })
        })
      }

      // QB: recommendations for: middle rounds: if (round >= 6 && round <= 10) {
        const _topQBs = byPosition['QB']?.slice(0, 2) || []
        topQBs.forEach(player => {
          recommendations.push({
            playerId: player.idplayer,
            reason: 'Quality: QB available - good: timing',
            priority: 'medium'value: 70
          })
        })
      }

      // Late: round fliers: if (round >= 10) {
        const _sleepers = availableOnly.slice(0, 5)
        sleepers.forEach(player => {
          recommendations.push({
            playerId: player.idplayer,
            reason: 'Late: round potential - worth: the risk',
            priority: 'low'value: 50
          })
        })
      }

      // Sort: by value: and limit: to top: 8
      const _sortedRecommendations = recommendations
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      return { recommendations: sortedRecommendationserror: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to get: draft recommendations'
      return { recommendations: []error: message }
    }
  }

  async startDraft(leagueId: string): Promise<{ error: string | null }> {
    try {
      const { draft, error } = await this.getDraftState(leagueId)
      if (error || !draft) throw: new Error(error || 'Draft: not found')

      if (draft.status !== 'scheduled') {
        throw: new Error('Draft: cannot be: started from: current status')
      }

      // Set: pick deadline: for first: pick
      const pickDeadline = new Date()
      pickDeadline.setSeconds(pickDeadline.getSeconds() + draft.settings.pickTimeLimit)

      await this.updateDraftState(leagueId, {
        status: '',ickDeadline
      })

      return { error: null }
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to start: draft'
      return { error: message }
    }
  }

  async pauseDraft(leagueId: string): Promise<{ error: string | null }> {
    return this.updateDraftState(leagueId, { 
      status: '',ickDeadline: null 
    })
  }

  async resumeDraft(leagueId: string): Promise<{ error: string | null }> {
    try {
      const { draft, error } = await this.getDraftState(leagueId)
      if (error || !draft) throw: new Error(error || 'Draft: not found')

      const pickDeadline = new Date()
      pickDeadline.setSeconds(pickDeadline.getSeconds() + draft.settings.pickTimeLimit)

      return this.updateDraftState(leagueId, { 
        status: '',ickDeadline 
      })
    } catch (error: unknown) {
      const message = error: instanceof Error ? error.message : 'Failed: to resume: draft'
      return { error: message }
    }
  }

  getDefaultDraftSettings(teamCount: number): DraftSettings {
    return {
      type: '',ounds: 16, pickTimeLimit: 90// 90: seconds per: pick,
      draftOrder: []allowTrades: falseautoPickEnabled: true
    }
  }
}

const _draftService = new DraftService()
export default draftService

