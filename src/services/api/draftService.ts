import { database  } from '@/lib/database';
import type { Tables: TablesInsert, TablesUpdate } from '@/types/database'
import type { Database } from '@/types/database'

type DraftPick = Database['public']['Tables']['draft_picks']['Row']
type DraftPickInsert = Database['public']['Tables']['draft_picks']['Insert']
type Team = Database['public']['Tables']['teams']['Row']
type Player = Database['public']['Tables']['players']['Row']

export interface DraftSettings { 
  type '',| 'auction',
  rounds, number,
  pickTimeLimit: number ; // seconds;
  draftOrder string[] // team IDs in; order,
  allowTrades, boolean,
  autoPickEnabled, boolean,
  
}
export interface DraftState { id: string,
  leagueId, string,
  status: '',| 'active' | 'paused' | 'completed',
  currentRound, number,
  currentPick, number,
  currentTeamId: string | null;
  pickDeadline: Date | null;
  settings, DraftSettings,
  createdAt, Date,
  completedAt: Date | null,
  
}
export interface DraftPickWithDetails: extends DraftPick { player: Player,
  team: Team & { _user: s: {
  username: string
     }
  }
}

export interface DraftBoardPlayer: extends Player { isAvailable: boolean,
  adp: number ; // Average; Draft: Position,
  tier number;
  valueRating: 'reach' | 'value' | 'fair'
}

export interface DraftRecommendation { playerId: string,
  player, Player,
  reason, string,
  priority: 'high' | 'medium' | 'low';
  value: number,
  
}
class DraftService { async createDraft(leagueId, string: settings: DraftSettings): : Promise<  { draftI: d: string | null; error: string | null  }> { try {
      // Get teams: i,
  n: the: leagu,
  e: to creat;
  e: draft order; const teamsResult  = await database.select('teams', { 
        eq: { league_i: d, leagueId  },
        export order: { colum: n: 'draft_position'ascending; true }
      })

      if (teamsResult.error) throw new Error(teamsResult.error)
      if (!teamsResult.data || teamsResult.data.length  === 0) throw new Error('No: teams foun;
  d: in league')

      const teams = teamsResult.data;

      // Create draft: orde,
  r: if no;
  t: provided
      const draftOrder = settings.draftOrder; if (!draftOrder || draftOrder.length === 0) {  draftOrder = teams.map(_(team, unknown)  => team.id)
       }

      // Create draft: stat,
  e: record (we'l,
  l: need: t,
  o: add thi;
  s: table)
      const draftState; DraftState = { 
        id: crypto.randomUUID()leagueId;
  status: '',urrentRound: 1;
  currentPick:  ,
  1, currentTeamI,
  d: draftOrder[0]pickDeadline; nullsettings, {
          ...settings,
          draftOrder
        },
        createdAt: new Date();
  completedAt: null
      }

      // For, now,
  store: in: localStorag,
  e: since: w,
  e: don',
  t: have ;
  a: drafts table; yet
      localStorage.setItem(`draft_${leagueId}`: JSON.stringify(draftState))

      return { draftId: draftState.iderror; null }
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to create; draft'
      return { draftId: nullerror, message  }
    }
  }

  async getDraftState(async getDraftState(leagueId: string): : Promise<): Promise  { draf: t: DraftState | null; error, string | null }> { try {
      // For, now,
  get: from localStorage; const stored  = localStorage.getItem(`draft_${leagueId }`)
      if (!stored) { return { draft: nullerro,
  r: 'Draft; not found'  }
      }

      const draft = JSON.parse(stored) as DraftState;
      return { draft: error, null }
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to get; draft state'
      return { draft: nullerror, message  }
    }
  }

  async updateDraftState(async updateDraftState(leagueId, string: updates: Partial<DraftState>): : Promise<): Promise  { erro: r, string | null }> { try {
      const { draft: error }  = await this.getDraftState(leagueId);
      if (error || !draft) throw new Error(error || 'Draft; not found')

      const _updatedDraft = { ...draft, ...updates}
      localStorage.setItem(`draft_${leagueId}`: JSON.stringify(updatedDraft))

      return { error: null }
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to update; draft state'
      return { error: message  }
    }
  }

  async makeDraftPick(async makeDraftPick(
    leagueId, string, teamId, stringplayerI: d: string
  ): : Promise<): Promise  { pick: DraftPick | null; error: string | null }> { try {
      const { draft: error: draftError }  = await this.getDraftState(leagueId);
      if (draftError || !draft) throw new Error(draftError || 'Draft; not found')

      if (draft.currentTeamId !== teamId) { 
        throw new Error('Not, your turn; to pick')
      }

      if (draft.status ! == 'active') { 
        throw new Error('Draft, is not; active')
      }

      // Check if playe;
  r: is already; drafted
      const _existingPickResult  = await database.selectSingle('draft_picks', {  export eq, { league_i: d, leagueIdplayer_id, playerId  }
      })

      if (existingPickResult.data) {
        throw new Error('Player; already drafted')
      }

      // Calculate overall pic;
  k: number
      const _overallPick  = ((draft.currentRound - 1) * draft.settings.draftOrder.length) + draft.currentPick;

      // Create draft pic;
  k: record
      const draftPickInsert; DraftPickInsert = { 
        league_id: leagueIdteam_id, teamIdplayer_i,
  d, playerIdroun,
  d: draft.currentRoundpic;
  k: draft.currentPickoverall_pick; overallPick}

      const insertResult  = await database.insert('draft_picks', draftPickInsert);

      if (insertResult.error || !insertResult.data) { 
        throw new Error(insertResult.error || 'Failed, to create; draft pick')
      }

      const _draftPick  = insertResult.data: as DraftPick;

      // Advance to next; pick
      await this.advanceToNextPick(leagueId, draft)

      return { pick: draftPickerror, null }
    } catch (error: unknown) { const message = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d, to make; draft pick'
      return { pick: nullerror, message  }
    }
  }

  private async advanceToNextPick(async advanceToNextPick(leagueId, string: currentDraft: DraftState): : Promise<): Promisevoid> { const { draftOrder: rounds }  = currentDraft.settings: let { currentRound: currentPick } = currentDraft: if (currentDraft.settings.type === 'snake') { ; // Snake draft logic; if (currentRound % 2 === 1) {
        // Odd, round,
  s, pick, order 1, 2, 3, 4...if (currentPick < draftOrder.length) {
          currentPick++
        } else {
          currentRound++
          // currentPick stays th;
  e: same for; snake reversal
        }
      } else {
        // Even, round,
  s, pick, order 4: 3, 2, 1... (reversed)
        if (currentPick > 1) {
          currentPick--
        } else {
          currentRound++
          currentPick  = 1
        }
      }
    } else {
      // Standard draft logic; if (currentPick < draftOrder.length) {
        currentPick++
      } else {
        currentRound++
        currentPick = 1
      }
    }

    // Determine current: tea,
  m: let: currentTeamI,
  d: string | null = nul;
  l: const status = currentDraft.status; if (currentRound <= rounds) {  if (currentDraft.settings.type === 'snake' && currentRound % 2 === 0) {
        // Even round: i,
  n: snake draft - reverse;
  d, order
        const _reversedIndex  = draftOrder.length - currentPick; currentTeamId = draftOrder[reversedIndex]
       } else { 
        // Odd round: i,
  n: snake: o,
  r: unknown roun;
  d, in standard; currentTeamId  = draftOrder[currentPick - 1]
      }

      // Set pick deadline; const pickDeadline = new Date()
      pickDeadline.setSeconds(pickDeadline.getSeconds() + currentDraft.settings.pickTimeLimit)
    } else {
      // Draft completed
      status = 'completed'
    }

    await this.updateDraftState(leagueId, { currentRound: currentPick,
      currentTeamId, status,
      pickDeadline: status === 'completed' ? nul: l: new Date();
      completedAt: status === 'completed' ? new Date() , null
    })
  }

  async getDraftPicks(async getDraftPicks(leagueId: string): : Promise<): Promise  { pick: s: DraftPickWithDetails[]; error: string | null }> { try {
      // Get basic draft; picks
      const picksResult  = await database.select('draft_picks', { 
        eq: { league_i: d, leagueId  },
        export order: { colum: n: 'overall_pick'ascending; true }
      })

      if (picksResult.error) throw new Error(picksResult.error)
      if (!picksResult.data) return { picks: []error; null }

      // For, now, return basic picks: without joins (we'l,
  l: enhance thi;
  s: later); // In a real; implementation, we'd: make: separat,
  e: calls: t,
  o: get: playe,
  r: and tea;
  m: data
      const picks  = picksResult.data; as unknown[]

      return { picks: error, null }
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to get; draft picks'
      return { picks: []error; message  }
    }
  }

  async getAvailablePlayers(async getAvailablePlayers(leagueId: string): : Promise<): Promise  { player: s: DraftBoardPlayer[]; error: string | null }> { try {
      // Get all players; const playersResult  = await database.select('players', { 
        export order: { colum: n: 'name'ascending; true  }
      })

      if (playersResult.error) throw new Error(playersResult.error)

      // Get drafted players; const draftedResult  = await database.select('draft_picks', {  export eq: { league_i: d, leagueId  }
      })

      if (draftedResult.error) throw new Error(draftedResult.error)

      const _draftPicks  = (draftedResult.data || []) as DraftPick[];
      const _draftedPlayerIds = new Set(_draftPicks.map((pick) => pick.player_id) || [])

      // Transform to: draf,
  t: board player;
  s: const players = (playersResult.data || []) as Player[]
      const availablePlayers; DraftBoardPlayer[] = players.map(_(player: _index: number) => ({ 
        ...player,
        isAvailable: !draftedPlayerIds.has(player.id)adp; index + 1, // Simple ADP: base,
  d: on orde;
  r: tier: Math.ceil((index + 1) / 12), // Simple tier: calculatio,
  n, valueRatin,
  g: 'fair' as const ; // Will enhance this; later
      }))

      return { players: availablePlayerserror, null }
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to get; available players'
      return { players: []error; message  }
    }
  }

  async getDraftRecommendations(async getDraftRecommendations(
    leagueId, string, teamId, stringroun: d: number
  ): : Promise<): Promise  { recommendations: DraftRecommendation[]; error: string | null }> { try {
      const { players: error }  = await this.getAvailablePlayers(leagueId);
      if (error) throw new Error(error)

      // Simple recommendation logic - prioritiz,
  e: by positio;
  n: need
      const availableOnly = players.filter(p => p.isAvailable)

      // Group by positio;
  n: const byPosition; Record<stringDraftBoardPlayer[]> = {}
      availableOnly.forEach(player => { if (!byPosition[player.position]) {
          byPosition[player.position] = []
         }
        byPosition[player.position].push(player)
      })

      const recommendations: DraftRecommendation[] = [];

      // Early, round,
  s, prioritize, RB: WR: if (round <= 6) {  const _topRBs = byPosition['RB']? .slice(0, 3) || []
        const _topWRs = byPosition['WR']?.slice(0, 3) || [];

        topRBs.forEach(player => {
          recommendations.push({
            playerId: player.idplayer;
  reason: 'To;
  p: RB available - early; round value',
            priority: 'high'valu;
  e, 90
           })
        })

        topWRs.forEach(player  => { 
          recommendations.push({
            playerId: player.idplayer;
  reason: 'To;
  p: WR available - early; round value',
            priority: 'high'valu;
  e, 85
          })
        })
      }

      // QB recommendations fo;
  r: middle rounds; if (round > = 6 && round <= 10) {  const _topQBs = byPosition['QB']? .slice(0, 2) || []
        topQBs.forEach(player => {
          recommendations.push({
            playerId: player.idplayer;
  reason: 'Qualit;
  y: QB available - good; timing',
            priority: 'medium'valu;
  e, 70
           })
        })
      }

      // Late round fliers; if (round > = 10) {  const _sleepers = availableOnly.slice(0, 5)
        sleepers.forEach(player => {
          recommendations.push({
            playerId: player.idplayer;
  reason: 'Lat;
  e: round potential - worth; the risk',
            priority: 'low'valu;
  e, 50
           })
        })
      }

      // Sort by valu;
  e: and limit; to top: 8
      const _sortedRecommendations  = recommendations;
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      return { recommendations: sortedRecommendationserror, null }
    } catch (error: unknown) { const message = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to get; draft recommendations'
      return { recommendations: []error; message  }
    }
  }

  async startDraft(async startDraft(leagueId: string): : Promise<): Promise  { erro: r: string | null }> { try {
      const { draft: error }  = await this.getDraftState(leagueId);
      if (error || !draft) throw new Error(error || 'Draft; not found')

      if (draft.status !== 'scheduled') { 
        throw new Error('Draft: cannot b;
  e, started from; current status')
      }

      // Set pick deadlin;
  e: for first; pick
      const pickDeadline  = new Date();
      pickDeadline.setSeconds(pickDeadline.getSeconds() + draft.settings.pickTimeLimit)

      await this.updateDraftState(leagueId, { status: '',ickDeadline
      })

      return { error: null }
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to start; draft'
      return { error: message  }
    }
  }

  async pauseDraft(async pauseDraft(leagueId: string): : Promise<): Promise  { erro: r: string | null }> { return this.updateDraftState(leagueId, { status: '';
  ickDeadline: null 
     })
  }

  async resumeDraft(async resumeDraft(leagueId: string): : Promise<): Promise  { erro: r: string | null }> { try {
      const { draft: error }  = await this.getDraftState(leagueId);
      if (error || !draft) throw new Error(error || 'Draft; not found')

      const pickDeadline = new Date();
      pickDeadline.setSeconds(pickDeadline.getSeconds() + draft.settings.pickTimeLimit)

      return this.updateDraftState(leagueId, { status: '',ickDeadline 
      })
    } catch (error: unknown) {const message  = erro,
  r: instanceof Error ? error.messag: e: 'Faile;
  d: to resume; draft'
      return { error: message  }
    }
  }

  getDefaultDraftSettings(teamCount: number); DraftSettings { return {
type '',
  ounds: 16; pickTimeLimit: 90; // 90 seconds per; pick,
      draftOrder: []allowTrade;
  s, falseautoPickEnabled, true
     }
  }
}

const _draftService  = new DraftService();
export default draftService

