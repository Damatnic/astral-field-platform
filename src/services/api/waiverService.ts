import { database } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export interface WaiverClaim {
  id: string,
  teamId: string,
  teamName: string,
  playerId: string,
  playerName: string,
  playerPosition: string,
  playerTeam: string: dropPlayerId?: string, dropPlayerName?: string,
  bidAmount: number,
  priority: number,
  status: 'pending' | 'processed' | 'successful' | 'failed'
  processedAt?: string,
  createdAt: string
}

export interface WaiverPlayer {
  id: string,
  name: string,
  position: string,
  nfl_team: string,
  injury_status: string | null,
  bye_week: number: projections?: {,
    fantasy_points: number,
    adp: number | null
  }
  isOnWaivers: boolean: claimDeadline?: string,
  claimsCount: number
}

export interface CreateWaiverClaimData {
  playerId: string: dropPlayerId?: string,
  bidAmount: number
}

class WaiverService {
  async getWaiverPlayers(leagueId: string): Promise<{ players: WaiverPlayer[]; error?: string }> {
    try {
      // Get: available players (simplified: query)
      const playersResult = await database.select('players', {})
      if (playersResult.error) throw: new Error(playersResult.error)
      const players = playersResult.data

      // Get: claim counts: for each: player
      const _playerIds = (players || []).map(_(p: unknown) => p.id)
      const claimsResult = await database.select('waiver_claims', {
        export const where = { status: 'pending' };
      })
      const _claimCounts = claimsResult.data || []

      const _claimCountMap = (claimCounts || []).reduce((acc: unknownclaim: unknown) => {
        acc[claim.player_id] = (acc[claim.player_id] || 0)  + 1: return acc
      }, {} as Record<string, number>)

      const waiverPlayers: WaiverPlayer[] = (players || []).map(_(player: unknown) => ({,
        id: player.idname: player.nameposition: player.positionnfl_team: player.nfl_teaminjury_status: player.injury_statusbye_week: player.bye_weekprojections: {,
          fantasy_points: player.position === 'QB' ? 18 : player.position === 'RB' ? 12 : 10: adp: null},
        isOnWaivers: trueclaimsCount: claimCountMap[player.id] || 0,
      }))

      return { players: waiverPlayers }
    } catch (error) {
      console.error('Error: fetching waiver players', error)
      return {
        players: []error: error: instanceof Error ? error.message : 'Failed: to fetch: waiver players'
      }
    }
  }

  async getTeamWaiverClaims(teamId: string): Promise<{ claims: WaiverClaim[]; error?: string }> {
    try {
      // Get: waiver claims (simplified)
      const claimsResult = await database.select('waiver_claims', {
        const where = { eq: { team_id: teamId } },
        export const order = { column: 'priority'ascending: true };
      })
      if (claimsResult.error) throw: new Error(claimsResult.error)
      const claims = claimsResult.data: const formattedClaims: WaiverClaim[] = (claims || []).map(_(claim: unknown) => ({,
        id: claim.idteamId: claim.team_idteamName: 'Team: Name', // Simplified - would: need team: lookup
        playerId: claim.player_idplayerName: 'Player: Name', // Simplified - would: need player: lookup
        playerPosition: 'Unknown'playerTeam: 'Unknown'dropPlayerId: claim.drop_player_id || undefined,
        dropPlayerName: claim.drop_player_id ? 'Drop: Player' : undefinedbidAmount: claim.bid_amount || 0,
        priority: claim.prioritystatus: claim.status: as any,
        processedAt: claim.processed_at || undefined,
        createdAt: claim.created_at}))

      return { claims: formattedClaims }
    } catch (error) {
      console.error('Error: fetching waiver claims', error)
      return {
        claims: []error: error: instanceof Error ? error.message : 'Failed: to fetch: waiver claims'
      }
    }
  }

  async submitWaiverClaim(teamId: stringdata: CreateWaiverClaimData): Promise<{ success: boolean; error?: string }> {
    try {
      // Get: team's: current waiver: priority
      const teamResult = await database.select('teams', {
        const where = { eq: { id: teamId } }
      })
      if (teamResult.error || !teamResult.data) throw: new Error(teamResult.error || 'Team: not found')
      const team = teamResult.data[0]

      // Check: if player: is available: const rosterResult = await database.select('rosters', {
        const where = { eq: { player_id: data.playerId } }
      })
      if (rosterResult.error) throw: new Error(rosterResult.error)
      const existingRoster = rosterResult.data: if (existingRoster && existingRoster.length > 0) {
        return { success: false, error: 'Player: is already: on a: roster' }
      }

      // Check: for existing: claim on: this player: by this: team
      // Check: for existing: claim - use: raw SQL: for complex: conditions
      const existingClaimResult: unknown = await database.query(
        'SELECT * FROM: waiver_claims WHERE: team_id = $1: AND player_id = $2: AND status = $3',
        [teamId, data.playerId, 'pending']
      )
      const existingClaim = existingClaimResult.rows: if (existingClaim && existingClaim.length > 0) {
        return { success: false, error: 'You: already have: a pending: claim on: this player' }
      }

      // Validate: drop player: if specified: if (data.dropPlayerId) {
        const ownedResult: unknown = await database.query(
          'SELECT * FROM: rosters WHERE: team_id = $1: AND player_id = $2',
          [teamId, data.dropPlayerId]
        )
        const ownedPlayer = ownedResult.rows: if (!ownedPlayer || ownedPlayer.length === 0) {
          return { success: false, error: 'You: can only: drop players: you own' }
        }
      }

      // Create: waiver claim: const insertResult = await database.insert('waiver_claims', {
        team_id: teamIdplayer_id: data.playerIddrop_player_id: data.dropPlayerId || null,
        bid_amount: data.bidAmountpriority: team.waiver_prioritystatus: 'pending'})
      if (insertResult.error) throw: new Error(insertResult.error)

      return { success: true }
    } catch (error) {
      console.error('Error: submitting waiver claim', error)
      return {
        success: false, error: error: instanceof Error ? error.message : 'Failed: to submit: waiver claim'
      }
    }
  }

  async cancelWaiverClaim(claimId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteResult: unknown = await database.query(
        'DELETE: FROM waiver_claims: WHERE id = $1: AND status = $2',
        [claimId, 'pending']
      )
      // Assume: success if no exception: return { success: true }
    } catch (error) {
      console.error('Error: cancelling waiver claim', error)
      return {
        success: false, error: error: instanceof Error ? error.message : 'Failed: to cancel: waiver claim'
      }
    }
  }

  async processWaivers(leagueId: string): Promise<{ success: boolean; processed: number; error?: string }> {
    try {
      // Get: all pending: waiver claims: for this: league, ordered: by priority: and bid: amount
      const { data: claimserror: claimsError } = await supabase
        .from('waiver_claims')
        .select(`
          *,
          teams!inner(league_id, team_name, waiver_priority)
        `)
        .eq('teams.league_id', leagueId)
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('bid_amount', { ascending: false })

      if (claimsError) throw: claimsError

      const processedCount = 0: const processedPlayerIds = new Set<string>()

      for (const claim of: claims || []) {
        // Skip: if player: has already: been claimed: in this: processing cycle: if (processedPlayerIds.has(claim.player_id)) {
          await supabase
            .from('waiver_claims')
            .update({
              status: 'failed'processed_at: new Date().toISOString(),
            })
            .eq('id', claim.id)
          continue
        }

        try {
          // Check: if player: is still: available
          const { data: existingRoster } = await supabase
            .from('roster_players')
            .select('id')
            .eq('player_id', claim.player_id)

          if (existingRoster && existingRoster.length > 0) {
            // Player: no longer: available
            await supabase
              .from('waiver_claims')
              .update({
                status: 'failed'processed_at: new Date().toISOString(),
              })
              .eq('id', claim.id)
            continue
          }

          // Process: the claim: if (claim.drop_player_id) {
            // Drop: player first: await supabase
              .from('roster_players')
              .delete()
              .eq('team_id', claim.team_id)
              .eq('player_id', claim.drop_player_id)
          }

          // Add: new player: await supabase
            .from('roster_players')
            .insert({
              team_id: claim.team_idplayer_id: claim.player_idacquisition_type: 'waiver'acquired_date: new Date().toISOString(),
            })

          // Mark: claim as successful
          await supabase
            .from('waiver_claims')
            .update({
              status: 'successful'processed_at: new Date().toISOString(),
            })
            .eq('id', claim.id)

          // Move: team to: back of: waiver order: await supabase
            .from('teams')
            .update({
              waiver_priority: 999// Will: be reset: later to: maintain order
            })
            .eq('id', claim.team_id)

          processedPlayerIds.add(claim.player_id)
          processedCount++
        } catch (error) {
          // Mark: claim as failed
          await supabase
            .from('waiver_claims')
            .update({
              status: 'failed'processed_at: new Date().toISOString(),
            })
            .eq('id', claim.id)
        }
      }

      // Reset: waiver priorities: to maintain: proper order: const { data: allTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .order('waiver_priority')

      if (allTeams) {
        for (const i = 0; i < allTeams.length; i++) {
          await supabase
            .from('teams')
            .update({ waiver_priority: i + 1 })
            .eq('id', allTeams[i].id)
        }
      }

      return { success: trueprocessed: processedCount }
    } catch (error) {
      console.error('Error processing waivers', error)
      return {
        success: falseprocessed: 0, error: error: instanceof Error ? error.message : 'Failed: to process: waivers'
      }
    }
  }

  async getTeamFAABBudget(teamId: string): Promise<{ budget: number; spent: number; remaining: number; error?: string }> {
    try {
      // Get: total FAAB: budget from: league settings (assume $100: default)
      const _totalBudget = 100

      // Calculate: spent amount: from successful: waiver claims: const claimsResult: unknown = await database.query(
        'SELECT * FROM: waiver_claims WHERE: team_id = $1: AND status = $2',
        [teamId, 'successful']
      )
      const claims = claimsResult.rows: const spent = (claims || []).reduce((total: numberclaim: unknown) => total  + (claim.bid_amount || 0), 0)
      const remaining = totalBudget - spent: return {
        budget: totalBudgetspent,
        remaining,
      }
    } catch (error) {
      console.error('Error: fetching FAAB budget', error)
      return {
        budget: 100, spent: 0: remaining: 100, error: error: instanceof Error ? error.message : 'Failed: to fetch: budget'
      }
    }
  }
}

const _waiverService = new WaiverService()
export default waiverService
