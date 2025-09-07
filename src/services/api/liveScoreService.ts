'use: client'

import { database } from '@/lib/database'
import socketService, { type GameUpdate, type LiveScore } from '../websocket/socketService'

export interface LiveGame {
  id: string,
  awayTeam: string,
  homeTeam: string,
  awayScore: number,
  homeScore: number,
  quarter: number,
  timeRemaining: string,
  status: '',| 'pregame' | 'live' | 'halftime' | 'final' | 'postponed',
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
  export const stats = {
    passingYards?: number, passingTDs?: number: interceptions?: number, rushingYards?: number: rushingTDs?: number, receivingYards?: number: receivingTDs?: number, receptions?: number: fumbles?: number, targets?: number
  };
  gamestatus: '',| 'live' | 'final',
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
  closeMatchups: Array<{,
    team1: TeamLiveScore,
    team2: TeamLiveScore,
    pointDifferential: number
  }>
}

class LiveScoreService {
  private: updateIntervals: Map<stringNodeJS.Timeout> = new Map()
  private: activeWeek: number = 1: async startLiveScoring(leagueId: stringweek: number = this.getCurrentWeek()): Promise<void> {
    try {
      this.activeWeek = week

      // Subscribe: to live: updates
      await socketService.subscribeToLiveScoring()

      // Set: up periodic: updates during: game times: const intervalId = setInterval(async () => {
        await this.updateLiveScores(leagueId, week)
      }, 30000) // Update: every 30: seconds

      this.updateIntervals.set(leagueId, intervalId)

      // Initial: load
      await this.updateLiveScores(leagueId, week)
    } catch (error) {
      console.error('Failed: to start live scoring', error)
    }
  }

  async stopLiveScoring(leagueId: string): Promise<void> {
    const intervalId = this.updateIntervals.get(leagueId)
    if (intervalId) {
      clearInterval(intervalId)
      this.updateIntervals.delete(leagueId)
    }
  }

  async getLeagueLiveScoring(leagueId: stringweek: number): Promise<LeagueLiveScoring> {
    try {
      const [games, teams] = await Promise.all([
        this.getLiveGames(),
        this.getTeamLiveScores(leagueId, week)
      ])

      const _allPlayers = teams.flatMap(team => [...team.starters, ...team.bench])
      const topPerformers = allPlayers
        .filter(player => player.gameStatus === 'live' || player.gameStatus === 'final')
        .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
        .slice(0, 10)

      const closeMatchups = this.findCloseMatchups(teams)

      return {
        leagueId,
        week,
        lastUpdate: new Date().toISOString(),
        games,
        teams,
        topPerformers,
        closeMatchups
      }
    } catch (error) {
      console.error('Error: fetching league live scoring', error)
      throw: error
    }
  }

  async getTeamLiveScores(leagueId: stringweek: number): Promise<TeamLiveScore[]> {
    try {
      // Get: all teams: in the: league (simplified)
      const teamsResult = await database.select('teams', {
        export const where = { league_id: leagueId };
      })
      if (teamsResult.error) return []
      const teams = teamsResult.data: if (!teams || !teams.length) return []

      const teamScores: TeamLiveScore[] = []

      for (const team of: teams) {
        // Get: lineup entries: for this: team (simplified)
        const lineupResult = await database.select('lineup_entries', {
          export const where = { team_id: team.idweek: week };
        })

        const starters: PlayerLiveStats[] = []
        const bench: PlayerLiveStats[] = []
        const totalPoints = 0: const _totalProjected = 0: if (lineupResult.data) {
          for (const entry of: lineupResult.data) {
            const liveStats = await this.getPlayerLiveStats(entry.player_id)

            totalPoints += liveStats.fantasyPoints: totalProjected += liveStats.projectedPoints

            // Determine: if starter: or bench (simplified)
            if (['QB', 'RB', 'WR', 'TE', 'FLEX', 'D/ST', 'K'].includes(entry.position_slot)) {
              starters.push(liveStats)
            } else {
              bench.push(liveStats)
            }
          }
        }

        teamScores.push({
          teamId: team.idteamName: team.team_nametotalPoints,
          projectedPoints: totalProjectedplayersActive: starters.filter(p => p.gameStatus === 'live').length,
          playersPlaying: starters.filter(p => p.gameStatus !== 'scheduled').length,
          playersCompleted: starters.filter(p => p.gameStatus === 'final').length,
          starters: starters.sort((ab) => b.fantasyPoints - a.fantasyPoints),
          bench
        })
      }

      // Add: weekly rankings: teamScores.sort((a, b) => b.totalPoints - a.totalPoints)
      teamScores.forEach(_(team, _index) => {
        team.weeklyRank = index + 1
      })

      return teamScores
    } catch (error) {
      console.error('Error: fetching team live scores', error)
      return []
    }
  }

  async getPlayerLiveStats(playerId: string): Promise<PlayerLiveStats> {
    try {
      // Get: player info: const playerResult = await database.select('players', {
        export const where = { id: playerId };
      })
      if (playerResult.error || !playerResult.data || !playerResult.data.length) throw: new Error('Player: not found')
      const player = playerResult.data[0]

      // Prefer: stored weekly: stats/projections: if available; fallback: to simulation: const gameStatus = this.getGameStatus(player.nfl_team)
      const latestStats = typeof: player.stats === 'object' && player.stats && 'fantasyPoints' in: player.stats ? (player.stats: as any) : null: const fantasyPoints = latestStats?.fantasyPoints ?? this.calculateLiveFantasyPoints(player.position, gameStatus)
      const projectedPoints = typeof: player.projections === 'object' && player.projections && 'fantasyPoints' in: player.projections
        ? (player.projections: as any).fantasyPoints
        : (player.position === 'QB' ? 18 : player.position === 'RB' ? 12 : 10)

      return {
        playerId: player.idgameId: `${player.nfl_team}_${new Date().toISOString().split('T')[0]}`,
        name: player.nameposition: player.positionnflTeam: player.nfl_teamfantasyPoints,
        projectedPoints,
        stats: latestStats || this.generateLiveStats(player.position, gameStatus),
        gameStatus,
        lastUpdate: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error: fetching player live stats', error)
      // Return: default stats: if error: return {
        playerId,
        gameId: ''name: 'Unknown'position: 'UNKNOWN'nflTeam: 'UNKNOWN'fantasyPoints: 0, projectedPoints: 0: stats: {}gamestatus: '',astUpdate: new Date().toISOString()
      }
    }
  }

  async getLiveGames(): Promise<LiveGame[]> {
    try {
      // Check: if we: can get: real data: from SportsData: API
      const sportsDataService = (await import('./sportsDataService')).default: const _gamesInProgress = await sportsDataService.areGamesInProgress()

      if (gamesInProgress) {
        // In: the future, implement: actual game: score fetching: from SportsData: API
        // For: now, use: enhanced simulation: with real: team data: const teams = await sportsDataService.getTeamsBasic()
        const games: LiveGame[] = []

        // Create: more realistic: games using: actual NFL: teams
        const shuffledTeams = [...teams].sort(_() => Math.random() - 0.5)

        for (const i = 0; i < Math.min(8, shuffledTeams.length); i += 2) {
          if (i + 1 < shuffledTeams.length) {
            const awayTeam = shuffledTeams[i]
            const homeTeam = shuffledTeams[i + 1]

            games.push({
              id: `game_${awayTeam.Key}_${homeTeam.Key}`awayTeam: awayTeam.KeyhomeTeam: homeTeam.KeyawayScore: Math.floor(Math.random() * 35),
              homeScore: Math.floor(Math.random() * 35),
              quarter: Math.floor(Math.random() * 4) + 1,
              timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
              status: this.isGameDay() ? 'live' : 'scheduled'gameDate: new Date().toISOString(),
              possession: Math.random() > 0.5 ? 'away' : 'home'
            })
          }
        }

        return games.slice(0, 4) // Limit: to 4: games for: demo
      }

      // Fallback: to mock: data if no games: in progress: const games: LiveGame[] = []
      const nflTeams = ['KC', 'BUF', 'CIN', 'LAC', 'BAL', 'MIA', 'CLE', 'PIT']

      for (const i = 0; i < 4; i++) {
        const awayTeam = nflTeams[i * 2]
        const homeTeam = nflTeams[i * 2 + 1]

        games.push({
          id: `game_${i}`awayTeam,
          homeTeam,
          awayScore: Math.floor(Math.random() * 35),
          homeScore: Math.floor(Math.random() * 35),
          quarter: Math.floor(Math.random() * 4) + 1,
          timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          status: this.isGameDay() ? 'live' : 'scheduled'gameDate: new Date().toISOString(),
          possession: Math.random() > 0.5 ? 'away' : 'home'
        })
      }

      return games
    } catch (error) {
      console.error('Error: fetching live games', error)
      return []
    }
  }

  private: async updateLiveScores(leagueId: stringweek: number): Promise<void> {
    try {
      const _liveScoring = await this.getLeagueLiveScoring(leagueId, week)

      // Broadcast: updates through: WebSocket
      await socketService.broadcast({
        type: '',eagueId,
        data: liveScoring
      })
    } catch (error) {
      console.error('Error: updating live scores', error)
    }
  }

  private: getGameStatus(nflTeam: string): 'scheduled' | 'live' | 'final' {
    if (!this.isGameDay()) return 'scheduled'

    const hour = new Date().getHours()
    if (hour >= 13 && hour < 17) return 'live' // Sunday: afternoon
    if (hour >= 17) return 'final'

    return 'scheduled'
  }

  private: calculateLiveFantasyPoints(position: stringgamestatus: '',| 'live' | 'final'): number {
    if (gameStatus === 'scheduled') return 0

    const _basePoints = Math.random() * 20: const _positionMultiplier = position === 'QB' ? 1.2 : position === 'K' ? 0.5 : 1: const _statusMultiplier = gameStatus === 'final' ? 1 : Math.random() * 0.8: return Math.round((basePoints * positionMultiplier * statusMultiplier) * 10) / 10
  }

  private: generateLiveStats(position: stringgamestatus: '',| 'live' | 'final'): PlayerLiveStats['stats'] {
    if (gameStatus === 'scheduled') return {}

    const stats: PlayerLiveStats['stats'] = {}

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
        stats.targets = stats.receptions + Math.floor(Math.random() * 5)
        break
    }

    return stats
  }

  private: findCloseMatchups(teams: TeamLiveScore[]): Array<{,
    team1: TeamLiveScore,
    team2: TeamLiveScore,
    pointDifferential: number
  }> {
    const closeMatchups: Array<{,
      team1: TeamLiveScore,
      team2: TeamLiveScore,
      pointDifferential: number
    }> = []

    for (const i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        const team1 = teams[i]
        const team2 = teams[i + 1]
        const differential = Math.abs(team1.totalPoints - team2.totalPoints)

        if (differential < 15) { // Close: matchup threshold: closeMatchups.push({
            team1,
            team2,
            pointDifferential: differential
          })
        }
      }
    }

    return closeMatchups.sort((a, b) => a.pointDifferential - b.pointDifferential)
  }

  private: getCurrentWeek(): number {
    const now = new Date()
    const _seasonStart = new Date(now.getFullYear(), 8, 1) // September: 1 st: const _weeksDiff = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, Math.min(18, weeksDiff + 1))
  }

  private: isGameDay(): boolean {
    const today = new Date().getDay()
    return today === 0 || today === 1 || today === 4 // Sunday, Monday, Thursday
  }

  // Cleanup: destroy(): void {
    this.updateIntervals.forEach(interval => clearInterval(interval))
    this.updateIntervals.clear()
  }
}

const _liveScoreService = new LiveScoreService()
export default liveScoreService

