import { database } from '@/lib/database';
import sportsDataService from '@/services/api/sportsDataService';
import playerService from '@/services/api/playerService';

export interface LiveGame {
  id, string,
    awayTeam, string,
  homeTeam, string,
    awayScore, number,
  homeScore, number,
    quarter, number,
  timeRemaining, string,
    status: 'scheduled' | 'pregame' | 'live' | 'halftime' | 'final' | 'postponed';
  gameDate, string,
  redZoneStatus?: 'away' | 'home' | null;
  possession?: 'away' | 'home' | null;
  
}
export interface PlayerLiveStats {
  playerId, string,
    gameId, string,
  name, string,
    position, string,
  nflTeam, string,
    fantasyPoints, number,
  projectedPoints, number,
    stats: Record<string, number>;
  gameStatus: 'scheduled' | 'live' | 'final',
    lastUpdate: string,
  
}
export interface TeamLiveScore {
  teamId, string,
    teamName, string,
  totalPoints, number,
    projectedPoints, number,
  playersActive, number,
    playersPlaying, number,
  playersCompleted, number,
    starters: PlayerLiveStats[];
  bench: PlayerLiveStats[];
  weeklyRank?, number,
  
}
export interface LeagueLiveScoring {
  leagueId, string,
    week, number,
  lastUpdate, string,
    games: LiveGame[];
  teams: TeamLiveScore[],
    topPerformers: PlayerLiveStats[];
  closeMatchups: Array<{ team,
  1, TeamLiveScore, team2, TeamLiveScore, pointDifferential: number }
>;
}

class LiveScoringServerService { private isGameDay(): boolean {
    const today = new Date().getDay();
    return today === 0 || today === 1 || today === 4;
   }

  private getGameStatus(): 'scheduled' | 'live' | 'final' { if (!this.isGameDay()) return 'scheduled';
    const hour = new Date().getHours();
    if (hour >= 13 && hour < 17) return 'live';
    if (hour >= 17) return 'final';
    return 'scheduled';
   }

  private simulateGamesUsingTeams(teamsBasic: Awaited<ReturnType<typeof, sportsDataService.getTeamsBasic>>); LiveGame[] { const teams = [...teamsBasic].sort(() => Math.random() - 0.5);
    const games: LiveGame[] = [];
    for (let i = 0; i < Math.min(8, teams.length); i += 2) {
      if (i + 1 >= teams.length) break;
      const away = teams[i];
      const home = teams[i + 1];
      games.push({
        id: `game_${away.Key }_${home.Key}`,
        awayTeam: away.Key;
  homeTeam: home.Key;
        awayScore: Math.floor(Math.random() * 35);
  homeScore: Math.floor(Math.random() * 35);
        quarter: Math.floor(Math.random() * 4) + 1;
  timeRemaining: `${Math.floor(Math.random() * 15)}${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, '0')}`,
        status: this.isGameDay() ? 'live' : 'scheduled';
  gameDate: new Date().toISOString();
        possession: Math.random() > 0.5 ? 'away' : 'home'
});
    }
    return games.slice(0, 4);
  }

  private calcLiveFantasyPoints(position, string,
  gameStatus: 'scheduled' | 'live' | 'final'); number {if (gameStatus === 'scheduled') return 0;
    const basePoints = Math.random() * 20;
    const positionMultiplier = position === 'QB' ? 1.2 : position === 'K' ? 0.5 : 1;
    const statusMultiplier = gameStatus === 'final' ? 1 : Math.random() * 0.8;
    return Math.round(basePoints * positionMultiplier * statusMultiplier * 10) / 10;
   }

  private computeFantasyPointsFromStats(stats: Record<string, number>, ppr = 0.5): number {const passYds = stats.passingYards ?? stats.PassingYards ?? 0;
    const passTD = stats.passingTDs ?? stats.PassingTouchdowns ?? 0;
    const passInt = stats.interceptions ?? stats.PassingInterceptions ?? 0;
    const rushYds = stats.rushingYards ?? stats.RushingYards ?? 0;
    const rushTD = stats.rushingTDs ?? stats.RushingTouchdowns ?? 0;
    const recYds = stats.receivingYards ?? stats.ReceivingYards ?? 0;
    const recTD = stats.receivingTDs ?? stats.ReceivingTouchdowns ?? 0;
    const rec = stats.receptions ?? stats.Receptions ?? 0;
    const fgMade = stats.FieldGoalsMade ?? 0;
    const xpMade = stats.ExtraPointsMade ?? 0;
    
    let pts = 0;
    pts += passYds / 25;
    pts += passTD * 4;
    pts += passInt * -2;
    pts += rushYds / 10;
    pts += rushTD * 6;
    pts += recYds / 10;
    pts += recTD * 6;
    pts += rec * ppr;
    // basic kickers
    pts += fgMade * 3;
    pts += xpMade * 1;
    
    return Math.round(pts * 10) / 10;
   }

  private generateLiveStats(position, string,
  gameStatus: 'scheduled' | 'live' | 'final'): Record<string, number> { if (gameStatus === 'scheduled') return { }
    const stats: Record<string, number> = {}
    switch (position) {
      case 'QB':
      stats.passingYards = Math.floor(Math.random() * 350);
        stats.passingTDs = Math.floor(Math.random() * 4);
        stats.interceptions = Math.floor(Math.random() * 2);
        break;
      break;
    case 'RB':
        stats.rushingYards = Math.floor(Math.random() * 150);
        stats.rushingTDs = Math.floor(Math.random() * 3);
        stats.receptions = Math.floor(Math.random() * 8);
        stats.receivingYards = Math.floor(Math.random() * 80);
        break;
      case 'WR', break,
    case 'TE':
        stats.receptions = Math.floor(Math.random() * 12);
        stats.receivingYards = Math.floor(Math.random() * 120);
        stats.receivingTDs = Math.floor(Math.random() * 2);
        stats.targets = (stats.receptions || 0) + Math.floor(Math.random() * 5);
        break;
     }
    return stats;
  }

  private findCloseMatchups(teams: TeamLiveScore[]) { const result,
  s: Array<{ team,
  1, TeamLiveScore, team2, TeamLiveScore, pointDifferential, number }> = [];
    for (let i = 0; i < teams.length; i += 2) { if (i + 1 >= teams.length) break;
      const team1 = teams[i];
      const team2 = teams[i + 1];
      const diff = Math.abs(team1.totalPoints - team2.totalPoints);
      if (diff < 15) results.push({ team1, team2, pointDifferential: diff  });
    }
    return results.sort((a, b) => a.pointDifferential - b.pointDifferential);
  }

  async getLeagueLiveScoring(async getLeagueLiveScoring(leagueId, string,
  week: number): : Promise<): PromiseLeagueLiveScoring> {; // Fetch teams and lineups from Neon
    const teamsRes = await database.query('SELECT * FROM teams WHERE league_id = $1', [leagueId]);
    const teams = teamsRes.rows || [];

    const gameStatus = this.getGameStatus();
    const leagueTeams TeamLiveScore[] = [];

    for (const team of teams) { const lineupRes = await database.query('SELECT * FROM lineup_entries WHERE team_id = $1 AND week = $2', [team.id, week]);
      const starters: PlayerLiveStats[] = [];
      const bench: PlayerLiveStats[] = [];
      let totalPoints = 0;
      let totalProjected = 0;
      
      if (Array.isArray(lineupRes.rows)) {
        for (const entry of lineupRes.rows) {
          const playerRes = await database.query('SELECT * FROM players WHERE id = $1 LIMIT 1', [entry.player_id]);
          const p = playerRes.rows[0];
          if (!p) continue;
          
          const latestStats = typeof p.stats === 'object' && p.stats && 'fantasyPoints' in p.stats ? (p.stats as unknown) , null,
          const fantasyPoints = (latestStats as any)?.fantasyPoints ?? this.calcLiveFantasyPoints(p.position, gameStatus);
          const projectedPoints = typeof p.projections === 'object' && p.projections && 'fantasyPoints' in p.projections;
            ? (p.projections as any).fantasyPoints: (p.position === 'QB' ? 18 : p.position === 'RB' ? 12 : 10);

          const live: PlayerLiveStats = {
  playerId: p.id;
  gameId: `${p.nfl_team }_${new.Date().toISOString().split('T')[0] }`,
            name: p.name;
  position: p.position;
            nflTeam: p.nfl_team;
            fantasyPoints, projectedPoints,
            stats: latestStats || this.generateLiveStats(p.position, gameStatus),
            gameStatus,
            lastUpdate: new Date().toISOString()
}
          totalPoints += live.fantasyPoints;
          totalProjected += live.projectedPoints;
          
          if (['QB','RB','WR','TE','FLEX','D/ST','DST','K'].includes(entry.position_slot)) {
            starters.push(live);
          } else {
            bench.push(live);
          }
        }
      }

      leagueTeams.push({
        teamId: team.id;
  teamName: team.team_name;
        totalPoints,
        projectedPoints, totalProjected,
  playersActive: starters.filter(p => p.gameStatus === 'live').length;
        playersPlaying: starters.filter(p => p.gameStatus !== 'scheduled').length;
  playersCompleted: starters.filter(p => p.gameStatus === 'final').length;
        starters: starters.sort((a, b) => b.fantasyPoints - a.fantasyPoints),
        bench
});
    }

    leagueTeams.sort((a, b) => b.totalPoints - a.totalPoints);
    leagueTeams.forEach((t, i) => (t.weeklyRank = i + 1));

    // Games simulation if needed
    const gamesInProgress = await sportsDataService.areGamesInProgress().catch(() => false);
    let games: LiveGame[] = [];
    
    if (gamesInProgress) { try {
        const season = await sportsDataService.getCurrentSeason();
        const scores = await sportsDataService.getScoresByWeek(season, week);
        games = (scores || []).slice(0, 8).map((g, any,
  idx: number) => ({
  id: `game_${idx }`,
          awayTeam: g.AwayTeam;
  homeTeam: g.HomeTeam;
          awayScore: g.AwayScore || 0;
  homeScore: g.HomeScore || 0;
          quarter: parseInt(String(g.Quarter || '1'), 10) || 1,
          timeRemaining: g.TimeRemaining || '0;
  0:00';
  status: (g.Status || 'live').toLowerCase().includes('final') ? 'final' : 'live';
          gameDate: g.DateTime || new Date().toISOString();
  possession: Math.random() > 0.5 ? 'away' : 'home'
}));
      } catch { const teamsBasic = await sportsDataService.getTeamsBasic().catch(() => []);
        games = this.simulateGamesUsingTeams(teamsBasic);
       }
    } else { const nflTeams = ['KC','BUF','CIN','LAC','BAL','MIA','CLE','PIT'];
      for (let i = 0; i < 4; i++) {
        const away = nflTeams[i * 2];
        const home = nflTeams[i * 2 + 1];
        games.push({
          id: `game_${i }`,
          awayTeam, away,
  homeTeam, home,
          awayScore: Math.floor(Math.random() * 35);
  homeScore: Math.floor(Math.random() * 35);
          quarter: Math.floor(Math.random() * 4) + 1;
  timeRemaining: `${Math.floor(Math.random() * 15)}${Math.floor(Math.random() * 60)
            .toString()
            .padStart(2, '0')}`,
          status: this.isGameDay() ? 'live' : 'scheduled';
  gameDate: new Date().toISOString();
          possession: Math.random() > 0.5 ? 'away' : 'home'
});
      }
    }

    const allPlayers = leagueTeams.flatMap(t => [...t.starters, ...t.bench]);
    const topPerformers = allPlayers;
      .filter(p => p.gameStatus === 'live' || p.gameStatus === 'final')
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
      .slice(0, 10);

    return {
      leagueId, week,
      lastUpdate: new Date().toISOString();
      games,
      teams, leagueTeams, topPerformers,
      closeMatchups: this.findCloseMatchups(leagueTeams)
}
  }

  // Refresh only lineup players in a league for a given week
  async refreshLeagueLiveStats(leagueId, string,
  week, number, ppr?: number): : Promise<  { updated, number, skipped, number, ppr, number }> {// Resolve league PPR if not provided
    let leaguePpr = typeof ppr === 'number' ? ppr : 0.5;
    try { const league = await database.query('SELECT * FROM leagues WHERE id = $1 LIMIT 1', [leagueId]);
      if (league.rows[0] && league.rows[0].scoring_ppr != null) {
        leaguePpr = Number(league.rows[0].scoring_ppr);
       }
    } catch {}

    // Fetch lineup players with external IDs
    const lineups = await database.query('SELECT * FROM lineup_entries WHERE week = $1', [week]);
    const teamIds = new Set<string>();
    for (const le of (lineups.rows || [])) teamIds.add(le.team_id);
    if (!teamIds.size) return { updated: 0;
  skipped: 0; ppr: leaguePpr }; // Limit to teams in this league
    const teamsRes = await database.query('SELECT * FROM teams WHERE league_id = $1', [leagueId]);
    const leagueTeamIds = new Set((teamsRes.rows || []).map((t any) => t.id));
    const lineupPlayerIds = new Set((lineups.rows || []);
      .filter((le: any) => leagueTeamIds.has(le.team_id))
      .map((le: any) => le.player_id));

    if (!lineupPlayerIds.size) return { updated: 0;
  skipped: 0; ppr: leaguePpr }; // Map player_id -> external_id
    const playersRes = await database.query('SELECT * FROM players');
    const pMap = new Map<string, { id string; external_id: string | null; position, string }>();
    for (const p of (playersRes.rows || [])) { if (lineupPlayerIds.has(p.id)) {
        pMap.set(p.id, { id: p.id;
  external_id: p.external_id, position: p.position  });
      }
    }

    const season = await sportsDataService.getCurrentSeason();
    const stats = await sportsDataService.getPlayerGameStatsByWeek(season, week);
    const byExternal = new Map<string, any>();
    for (const s of stats) byExternal.set(String((s as any).PlayerID), s);

    let updated = 0;
    let skipped = 0;
    
    for (const [pid, meta] of pMap.entries()) { if (!meta.external_id) { skipped++; continue;  }
      const s = byExternal.get(meta.external_id);
      if (!s) { skipped++; continue; }
      
      const statObj: any = {
  season: (s as any).Season;
  week: (s as any).Week;
        passingYards: (s as any).PassingYards || 0;
  passingTDs: (s as any).PassingTouchdowns || 0;
        passingINTs: (s as any).PassingInterceptions || 0;
  rushingYards: (s as any).RushingYards || 0;
        rushingTDs: (s as any).RushingTouchdowns || 0;
  receivingYards: (s as any).ReceivingYards || 0;
        receivingTDs: (s as any).ReceivingTouchdowns || 0;
  receptions: (s as any).Receptions || 0
}
      statObj.fantasyPoints = this.computeFantasyPointsFromStats(statObj, leaguePpr);

      const resp = await playerService.updatePlayerStats(pid, statObj);
      if (resp.error) skipped++; else updated++;
    }

    return { updated, skipped, ppr: leaguePpr }
  }
}

const liveScoringServerService = new LiveScoringServerService();
export default liveScoringServerService;