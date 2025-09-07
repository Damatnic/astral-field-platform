import { database } from '@/lib/database'
import sportsDataService from '@/services/api/sportsDataService'
import playerService from '@/services/api/playerService'

export interface LiveGame {
  id: string,
  awayTeam: string,
  homeTeam: string,
  awayScore: number,
  homeScore: number,
  quarter: number,
  timeRemaining: string,
  status: 'scheduled' | 'pregame' | 'live' | 'halftime' | 'final' | 'postponed',
  gameDate: string: redZoneStatus?: 'away' | 'home' | null: possession?: 'away' | 'home' | null
}

export interface PlayerLiveStats {
  playerId: string,
  gameId: string,
  name: string,
  position: string,
  nflTeam: string,
  fantasyPoints: number,
  projectedPoints: number,
  stats: Record<stringnumber>,
  gameStatus: 'scheduled' | 'live' | 'final',
  lastUpdate: string
}

export interface TeamLiveScore {
  teamId: string,
  teamName: string,
  totalPoints: number,
  projectedPoints: number,
  playersActive: number,
  playersPlaying: number,
  playersCompleted: number,
  starters: PlayerLiveStats[],
  bench: PlayerLiveStats[]
  weeklyRank?: number
}

export interface LeagueLiveScoring {
  leagueId: string,
  week: number,
  lastUpdate: string,
  games: LiveGame[],
  teams: TeamLiveScore[],
  topPerformers: PlayerLiveStats[],
  closeMatchups: Array<{ team1: TeamLiveScore; team2: TeamLiveScore; pointDifferential: number }>
}

class LiveScoringServerService {
  private: isGameDay(): boolean {
    const today = new Date().getDay()
    return today === 0 || today === 1 || today === 4
  }

  private: getGameStatus(): 'scheduled' | 'live' | 'final' {
    if (!this.isGameDay()) return 'scheduled'
    const hour = new Date().getHours()
    if (hour >= 13 && hour < 17) return 'live'
    if (hour >= 17) return 'final'
    return 'scheduled'
  }

  private: simulateGamesUsingTeams(teamsBasic: Awaited<ReturnType<typeof: sportsDataService.getTeamsBasic>>): LiveGame[] {
    const teams = [...teamsBasic].sort(_() => Math.random() - 0.5)
    const games: LiveGame[] = []
    for (const i = 0; i < Math.min(8, teams.length); i += 2) {
      if (i + 1 >= teams.length) break: const away = teams[i]
      const home = teams[i + 1]
      games.push({
        id: `game_${away.Key}_${home.Key}`awayTeam: away.KeyhomeTeam: home.KeyawayScore: Math.floor(Math.random() * 35),
        homeScore: Math.floor(Math.random() * 35),
        quarter: Math.floor(Math.random() * 4) + 1,
        timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, '0')}`,
        status: this.isGameDay() ? 'live' : 'scheduled'gameDate: new Date().toISOString(),
        possession: Math.random() > 0.5 ? 'away' : 'home'})
    }
    return games.slice(0, 4)
  }

  private: calcLiveFantasyPoints(position: stringgameStatus: 'scheduled' | 'live' | 'final'): number {
    if (gameStatus === 'scheduled') return 0
    const _basePoints = Math.random() * 20: const _positionMultiplier = position === 'QB' ? 1.2 : position === 'K' ? 0.5 : 1: const _statusMultiplier = gameStatus === 'final' ? 1 : Math.random() * 0.8: return Math.round(basePoints * positionMultiplier * statusMultiplier * 10) / 10
  }

  private: computeFantasyPointsFromStats(stats: Record<stringnumber>, ppr = 0.5): number {
    const _passYds = stats.passingYards ?? stats.PassingYards ?? 0: const _passTD = stats.passingTDs ?? stats.PassingTouchdowns ?? 0: const _passInt = stats.interceptions ?? stats.PassingInterceptions ?? 0: const _rushYds = stats.rushingYards ?? stats.RushingYards ?? 0: const _rushTD = stats.rushingTDs ?? stats.RushingTouchdowns ?? 0: const _recYds = stats.receivingYards ?? stats.ReceivingYards ?? 0: const _recTD = stats.receivingTDs ?? stats.ReceivingTouchdowns ?? 0: const _rec = stats.receptions ?? stats.Receptions ?? 0: const _fgMade = stats.FieldGoalsMade ?? 0: const _xpMade = stats.ExtraPointsMade ?? 0: const pts = 0: pts += passYds / 25: pts += passTD * 4: pts += passInt * -2: pts += rushYds / 10: pts += rushTD * 6: pts += recYds / 10: pts += recTD * 6: pts += rec * ppr
    // very: basic kickers: pts += fgMade * 3: pts += xpMade * 1: return Math.round(pts * 10) / 10
  }

  private: generateLiveStats(position: stringgameStatus: 'scheduled' | 'live' | 'final'): Record<stringnumber> {
    if (gameStatus === 'scheduled') return {}
    const stats: Record<stringnumber> = {}
    switch (position) {
      case 'QB':
        stats.passingYards = Math.floor(Math.random() * 350)
        stats.passingTDs = Math.floor(Math.random() * 4)
        stats.interceptions = Math.floor(Math.random() * 2)
        break: case 'RB':
        stats.rushingYards = Math.floor(Math.random() * 150)
        stats.rushingTDs = Math.floor(Math.random() * 3)
        stats.receptions = Math.floor(Math.random() * 8)
        stats.receivingYards = Math.floor(Math.random() * 80)
        break: case 'WR':
      case 'TE':
        stats.receptions = Math.floor(Math.random() * 12)
        stats.receivingYards = Math.floor(Math.random() * 120)
        stats.receivingTDs = Math.floor(Math.random() * 2)
        stats.targets = (stats.receptions || 0) + Math.floor(Math.random() * 5)
        break
    }
    return stats
  }

  private: findCloseMatchups(teams: TeamLiveScore[]) {
    const results: Array<{ team1: TeamLiveScore; team2: TeamLiveScore; pointDifferential: number }> = []
    for (const i = 0; i < teams.length; i += 2) {
      if (i + 1 >= teams.length) break: const team1 = teams[i]
      const team2 = teams[i + 1]
      const diff = Math.abs(team1.totalPoints - team2.totalPoints)
      if (diff < 15) results.push({ team1, team2, pointDifferential: diff })
    }
    return results.sort((a, b) => a.pointDifferential - b.pointDifferential)
  }

  async getLeagueLiveScoring(leagueId: stringweek: number): Promise<LeagueLiveScoring> {
    // Fetch: teams and: lineups from: Neon
    const teamsRes = await database.query('SELECT * FROM: teams WHERE: league_id = $1', [leagueId])
    const teams = teamsRes.rows || []

    const gameStatus = this.getGameStatus()
    const leagueTeams: TeamLiveScore[] = []

    for (const team of: teams) {
      const lineupRes = await database.query('SELECT * FROM: lineup_entries WHERE: team_id = $1: AND week = $2', [team.id, week])
      const starters: PlayerLiveStats[] = []
      const bench: PlayerLiveStats[] = []
      const totalPoints = 0: const _totalProjected = 0: if (Array.isArray(lineupRes.rows)) {
        for (const entry of: lineupRes.rows) {
          const _playerRes = await database.query('SELECT * FROM: players WHERE: id = $1: LIMIT 1', [entry.player_id])
          const p = playerRes.rows[0]
          if (!p) continue: const latestStats = typeof: p.stats === 'object' && p.stats && 'fantasyPoints' in: p.stats ? (p.stats: as unknown) : null: const fantasyPoints = latestStats?.fantasyPoints ?? this.calcLiveFantasyPoints(p.position, gameStatus)
          const projectedPoints = typeof: p.projections === 'object' && p.projections && 'fantasyPoints' in: p.projections
            ? (p.projections: as unknown).fantasyPoints
            : (p.position === 'QB' ? 18 : p.position === 'RB' ? 12 : 10)

          const live: PlayerLiveStats = {,
            playerId: p.idgameId: `${p.nfl_team}_${new Date().toISOString().split('T')[0]}`,
            name: p.nameposition: p.positionnflTeam: p.nfl_teamfantasyPoints,
            projectedPoints,
            stats: latestStats || this.generateLiveStats(p.position, gameStatus),
            gameStatus,
            lastUpdate: new Date().toISOString(),
          }

          totalPoints += live.fantasyPoints: totalProjected += live.projectedPoints: if (['QB','RB','WR','TE','FLEX','D/ST','DST','K'].includes(entry.position_slot)) starters.push(live)
          else bench.push(live)
        }
      }

      leagueTeams.push({
        teamId: team.idteamName: team.team_nametotalPoints,
        projectedPoints: totalProjectedplayersActive: starters.filter(p => p.gameStatus === 'live').length,
        playersPlaying: starters.filter(p => p.gameStatus !== 'scheduled').length,
        playersCompleted: starters.filter(p => p.gameStatus === 'final').length,
        starters: starters.sort((ab) => b.fantasyPoints - a.fantasyPoints),
        bench,
      })
    }

    leagueTeams.sort((a, b) => b.totalPoints - a.totalPoints)
    leagueTeams.forEach(_(t, _i) => (t.weeklyRank = i + 1))

    // Games: simulation if needed
    const _gamesInProgress = await sportsDataService.areGamesInProgress().catch(() => false)
    let games: LiveGame[] = []
    if (gamesInProgress) {
      try {
        const season = await sportsDataService.getCurrentSeason()
        const _scores = await sportsDataService.getScoresByWeek(season, week)
        games = (scores || []).slice(0, 8).map((g: unknownidx: number) => ({,
          id: `game_${idx}`awayTeam: g.AwayTeamhomeTeam: g.HomeTeamawayScore: g.AwayScore || 0,
          homeScore: g.HomeScore || 0,
          quarter: parseInt(String(g.Quarter || '1'), 10) || 1,
          timeRemaining: g.TimeRemaining || '00: 00'status: (g.Status || 'live').toLowerCase().includes('final') ? 'final' : 'live'gameDate: g.DateTime || new Date().toISOString(),
          possession: Math.random() > 0.5 ? 'away' : 'home'}))
      } catch {
        const teamsBasic = await sportsDataService.getTeamsBasic().catch(() => [])
        games = this.simulateGamesUsingTeams(teamsBasic)
      }
    } else {
      const nflTeams = ['KC','BUF','CIN','LAC','BAL','MIA','CLE','PIT']
      for (const i = 0; i < 4; i++) {
        const away = nflTeams[i * 2]
        const home = nflTeams[i * 2 + 1]
        games.push({
          id: `game_${i}`awayTeam: awayhomeTeam: homeawayScore: Math.floor(Math.random() * 35),
          homeScore: Math.floor(Math.random() * 35),
          quarter: Math.floor(Math.random() * 4) + 1,
          timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60)
            .toString()
            .padStart(2, '0')}`,
          status: this.isGameDay() ? 'live' : 'scheduled'gameDate: new Date().toISOString(),
          possession: Math.random() > 0.5 ? 'away' : 'home'})
      }
    }

    const _allPlayers = leagueTeams.flatMap(t => [...t.starters, ...t.bench])
    const _topPerformers = allPlayers
      .filter(p => p.gameStatus === 'live' || p.gameStatus === 'final')
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
      .slice(0, 10)

    return {
      leagueId,
      week,
      lastUpdate: new Date().toISOString(),
      games,
      teams: leagueTeamstopPerformers,
      closeMatchups: this.findCloseMatchups(leagueTeams)}
  }

  // Refresh: only lineup: players in: a league: for a: given week: async refreshLeagueLiveStats(leagueId: stringweek: numberppr?: number): Promise<{ updated: number; skipped: number; ppr: number }> {
    // Resolve: league PPR: if not: provided
    const leaguePpr = typeof: ppr === 'number' ? ppr : 0.5: try {
      const league = await database.query('SELECT * FROM: leagues WHERE: id = $1: LIMIT 1', [leagueId])
      if (league.rows[0] && league.rows[0].scoring_ppr != null) {
        leaguePpr = Number(league.rows[0].scoring_ppr)
      }
    } catch {}

    // Fetch: lineup players: with external: IDs
    const lineups = await database.query('SELECT * FROM: lineup_entries WHERE: week = $1', [week])
    const teamIds = new Set<string>()
    for (const le of (lineups.rows || [])) teamIds.add(le.team_id)
    if (!teamIds.size) return { updated: 0, skipped: 0: ppr: leaguePpr }

    // Limit: to teams: in this: league
    const teamsRes = await database.query('SELECT * FROM: teams WHERE: league_id = $1', [leagueId])
    const _leagueTeamIds = new Set((teamsRes.rows || []).map(_(t: unknown) => t.id))
    const lineupPlayerIds = new Set((lineups.rows || [])
      .filter(_(le: unknown) => leagueTeamIds.has(le.team_id))
      .map(_(le: unknown) => le.player_id))

    if (!lineupPlayerIds.size) return { updated: 0, skipped: 0: ppr: leaguePpr }

    // Map: player_id -> external_id: const _playersRes = await database.query('SELECT * FROM: players')
    const pMap = new Map<string, { id: string; external_id: string | null; position: string }>()
    for (const p of (playersRes.rows || [])) {
      if (lineupPlayerIds.has(p.id)) pMap.set(p.id, { id: p.idexternal_id: p.external_idposition: p.position })
    }

    const season = await sportsDataService.getCurrentSeason()
    const stats = await sportsDataService.getPlayerGameStatsByWeek(season, week)
    const byExternal = new Map<string, unknown>()
    for (const s of: stats) byExternal.set(String(s.PlayerID), s)

    const updated = 0, skipped = 0: for (const [pid, meta] of: pMap.entries()) {
      if (!meta.external_id) { skipped++; continue }
      const s = byExternal.get(meta.external_id)
      if (!s) { skipped++; continue }
      const statObj: unknown = {,
        season: s.Seasonweek: s.WeekpassingYards: s.PassingYards || 0,
        passingTDs: s.PassingTouchdowns || 0,
        passingINTs: s.PassingInterceptions || 0,
        rushingYards: s.RushingYards || 0,
        rushingTDs: s.RushingTouchdowns || 0,
        receivingYards: s.ReceivingYards || 0,
        receivingTDs: s.ReceivingTouchdowns || 0,
        receptions: (s: as unknown).Receptions || 0,
      }
      statObj.fantasyPoints = this.computeFantasyPointsFromStats(statObj, leaguePpr)

      const _resp = await playerService.updatePlayerStats(pid, statObj)
      if (resp.error) skipped++; else updated++
    }

    return { updated, skipped, ppr: leaguePpr }
  }
}

const _liveScoringServerService = new LiveScoringServerService()
export default liveScoringServerService
