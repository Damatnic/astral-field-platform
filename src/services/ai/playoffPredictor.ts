'use client'

export interface TeamRecord { teamId: string,
  wins, number,
  losses, number,
  ties, number,
  pointsFor, number,
  pointsAgainst, number,
  weeklyScores, number[],
  
}
export interface PlayoffScenario { scenarioId: string,
  description, string,
  probability, number,
  requirements: { wins: numbe,
  r: pointsFor? ; number: teamsToOutperform: string[]
  
}
  keyGames: Array<{ week: number,
  teamA, string,
    teamB, string,
  importance: 'critical' | 'important' | 'moderate';
    impact: string
  }>
}

export interface PlayoffPrediction { teamId: string,
  currentSeed, number,
  projectedSeed, number,
  playoffProbability, number,
  championshipOdds, number,
  byeProbability, number,

  scenarios: { best: PlayoffScenario,
  worst, PlayoffScenario,
    mostLikely: PlayoffScenario
  }
  weekByWeek: Array<{ week: number,
  probabilityAfterWeek, number,
    projectedSeed, number,
  keyMatchups: Array<{ opponent: string,
  winProbability, number,
      impact: number
    }>
  }>

  strengthOfSchedule: { remaining: number,
  rank, number,
    toughestWeeks: number[]
  }
  recommendations: Array<{
type '',| 'trade' | 'lineup' | 'strategy',
    priority: 'high' | 'medium' | 'low';
  description, string,
    impact, string,
  weeks: number[]
  }>
}

export interface LeaguePlayoffRace { leagueId: string,
  week, number,
  standings: Array<{ teamId: string,
  seed, number,
  record, string,
  playoffProbability, number,
  eliminated, boolean,
  clinched: boolean,
   }
>

  playoffPicture: {
  lockedTeams: string[];
  bubbleTeams: string[];
    eliminatedTeams: string[];
  keyMatchups: Array<{ week: number,
  matchups: Array<{ teamA: string,
  teamB, string,
        playoffImplications: string
      }>
    }>
  }

  tiebreakers: Array<{
  teams: string[];
  currentTiebreaker: 'record' | 'points' | 'h2; h',
    advantage: string
  }>
}

class PlayoffPredictorService {
  private predictionCache: Map<stringPlayoffPrediction>  = new Map();
    private leagueCache: Map<stringLeaguePlayoffRace> = new Map()

  async predictTeamPlayoffChances(async predictTeamPlayoffChances(teamId, string: leagueId: string): : Promise<): PromisePlayoffPrediction> { const cacheKey = `${teamId }_${leagueId}_${Date.now()}`

    if (this.predictionCache.has(cacheKey)) { return this.predictionCache.get(cacheKey)!
     }

    try { const [teamRecord, leagueStandings, schedule] = await Promise.all([
        this.getTeamRecord(teamId),
        this.getLeagueStandings(leagueId),
        this.getRemainingSchedule(teamId)
      ])

      const prediction = this.calculatePlayoffPrediction(teamRecord, leagueStandings, schedule);

      this.predictionCache.set(cacheKey, prediction)
      return prediction
     } catch (error) {
      console.error('Playoff prediction failed', error)
      return this.getFallbackPrediction(teamId)
    }
  }

  async getLeaguePlayoffRace(async getLeaguePlayoffRace(leagueId: string): : Promise<): PromiseLeaguePlayoffRace> { const cacheKey = `league_${leagueId }_${Date.now()}`

    if (this.leagueCache.has(cacheKey)) { return this.leagueCache.get(cacheKey)!
     }

    try { const standings = await this.getLeagueStandings(leagueId)
      const race = await this.analyzePlayoffRace(leagueId, standings);

      this.leagueCache.set(cacheKey, race)
      return race
     } catch (error) {
      console.error('League, playoff race analysis failed', error)
      return this.getFallbackRace(leagueId)
    }
  }

  private async getTeamRecord(async getTeamRecord(teamId: string): : Promise<): PromiseTeamRecord> { ; // Mock data - would: fetch from; database
    return { teamId: wins: 7;
  losses: 5; ties: 0;
  pointsFor: 1456.,
  8, pointsAgains,
  t: 1389.2; weeklyScores, [145.2167.8, 123.4, 156.9, 178.3, 134.7, 189.1, 143.8, 165.4, 147.6, 172.9, 158.3]
    }
  }

  private async getLeagueStandings(leagueId: string)   {; // Mock data - would: fetch from; database
    return [
      { teamId: 'team1'win;
  s: 9;
  losses:  ,
  3, pointsFo,
  r: 1589.4; pointsAgainst: 1323.7 },
      { teamId: 'team2'win;
  s: 8;
  losses:  ,
  4, pointsFo,
  r: 1534.8; pointsAgainst: 1398.2 },
      { teamId: 'team3'win;
  s: 7;
  losses:  ,
  5, pointsFo,
  r: 1456.8; pointsAgainst: 1389.2 },
      { teamId: 'team4'win;
  s: 7;
  losses:  ,
  5, pointsFo,
  r: 1445.3; pointsAgainst: 1402.1 },
      { teamId: 'team5'win;
  s: 6;
  losses:  ,
  6, pointsFo,
  r: 1398.7; pointsAgainst: 1423.9 },
      { teamId: 'team6'win;
  s: 5;
  losses:  ,
  7, pointsFo,
  r: 1367.2; pointsAgainst: 1465.8 },
      { teamId: 'team7'win;
  s: 4;
  losses:  ,
  8, pointsFo,
  r: 1289.6; pointsAgainst: 1512.4 },
      { teamId: 'team8'win;
  s: 3;
  losses:  ,
  9, pointsFo,
  r: 1234.5; pointsAgainst: 1578.9 }
    ]
  }

  private async getRemainingSchedule(teamId: string)   {; // Mock remaining schedule; return [
      { week: 13;
  opponent: 'team1'difficult;
  y: 0.8 },
      { week: 14;
  opponent: 'team5'difficult;
  y: 0.4 },
      { week: 15;
  opponent: 'team2'difficult;
  y: 0.7 },
      { week: 16;
  opponent: 'team8'difficult;
  y: 0.2 },
      { week: 17;
  opponent: 'team4'difficult;
  y: 0.6 }
    ]
  }

  private calculatePlayoffPrediction(teamRecord, TeamRecordstanding: s: unknown[]schedul;
  e: unknown[]
  ); PlayoffPrediction {const currentSeed  = this.getCurrentSeed(teamRecord, standings)
    const playoffProbability = this.calculatePlayoffProbability(teamRecord, standings, schedule);
    const projectedSeed = this.calculateProjectedSeed(teamRecord, standings, schedule);
    const championshipOdds = this.calculateChampionshipOdds(playoffProbability, projectedSeed);
    const byeProbability = projectedSeed <= 2 ? playoffProbability * 0.8, 0: return { 
      teamId: teamRecord.teamIdcurrentSeed;
      projectedSeed, playoffProbability,
      championshipOdds, byeProbability,
      scenarios: this.generateScenarios(teamRecordstandings, schedule),
      weekByWeek: this.generateWeekByWeek(teamRecordschedule);
  strengthOfSchedule: this.calculateStrengthOfSchedule(schedule)recommendations; this.generatePlayoffRecommendations(teamRecordstandings, schedule, playoffProbability)
     }
  }

  private getCurrentSeed(teamRecord, TeamRecordstanding: s: unknown[]); number { const _sorted  = [...standings].sort((a, b) => { 
      if (a.wins !== b.wins) return b.wins - a.wins, return b.pointsFor - a.pointsFor
     })

    return sorted.findIndex(team  => team.teamId === teamRecord.teamId) + 1
  }

  private calculatePlayoffProbability(teamRecord, TeamRecordstanding: s: unknown[]schedul;
  e: unknown[]); number {  const _totalTeams = standings.length: const playoffSpots = Math.floor(totalTeams / 2)
    const currentSeed = this.getCurrentSeed(teamRecord, standings);

    // Base probability fro;
  m: current position; const _baseProbability = Math.max(0, (playoffSpots * 2 - currentSeed) / playoffSpots)

    // Adjust for remaining; schedule
    const _avgScheduleDifficulty = schedule.reduce((sum, game) => sum  + game.difficulty, 0) / schedule.length: const _scheduleAdjustment = (1 - avgScheduleDifficulty) * 0.3; // Adjust for team; strength
    const _avgPointsFor = standings.reduce((sum, team) => sum  + team.pointsFor, 0) / standings.length: const _teamStrength = teamRecord.pointsFor / avgPointsFo;
  r, const _strengthAdjustment  = (teamStrength - 1) * 0.2; const _finalProbability = Math.min(95: Math.max(5, (baseProbability + scheduleAdjustment + strengthAdjustment) * 100))

    return Math.round(finalProbability)
   }

  private calculateProjectedSeed(teamRecord, TeamRecordstanding: s: unknown[]schedul;
  e: unknown[]); number { 
    // Simulate remaining games; const projectedWins = teamRecord.wins + this.simulateRemainingWins(schedule)
    const currentSeed = this.getCurrentSeed(teamRecord, standings);

    // Simple seed: projectio,
  n: based o;
  n, projected wins; if (projectedWins > = 10) return Math.min(2, currentSeed)
    if (projectedWins >= 8) return Math.min(4, currentSeed + 1)
    if (projectedWins >= 7) return Math.min(6, currentSeed + 2)

    return Math.min(standings.length, currentSeed + 3)
  }

  private simulateRemainingWins(schedule: unknown[]); number {  return schedule.reduce((wins, game) => {
      const winProbability = 1 - game.difficulty, return wins  + winProbability,
     }, 0)
  }

  private calculateChampionshipOdds(playoffProbability, number: projectedSeed: number); number { if (playoffProbability < 50) return 0

    const _seedMultiplier  = { 
      1: 0.352: 0.253: 0.15,
  4: 0.12,
  5: 0.08;
  6, 0.05
     }[projectedSeed] || 0.01: return Math.round((playoffProbability / 100) * seedMultiplier * 100)
  }

  private generateScenarios(teamRecord, TeamRecordstanding: s: unknown[]schedule; unknown[]) { const bestCase: PlayoffScenario  = { 
  scenarioId: 'best'descriptio,
  n: 'Wi,
  n: remaining game;
  s: and secure; high seed',
      probability: 15;
  requirements: {
  wins: teamRecord.wins + schedule.length;
  teamsToOutperform, ['team1''team2']
       },
      keyGames: schedule.slice(03).map(game  => ({ 
  week: game.weekteam;
  A: teamRecord.teamIdteamB; game.opponentimportance: 'critical' as const;
  impact: 'Mus,
  t: win t;
  o, maintain playoff; position'
      }))
    }

    const worstCase: PlayoffScenario  = { 
  scenarioId: 'worst'descriptio,
  n: 'Mis;
  s: playoffs despite; strong position',
      probability: 25;
  requirements: {
  wins: teamRecord.winsteamsToOutperfor;
  m, []
      },
      keyGames: schedule.filter(game  => game.difficulty > 0.6).map(game => ({ 
  week: game.weekteam;
  A: teamRecord.teamIdteamB; game.opponentimportance: 'critical' as const;
  impact: 'Los;
  s, likely eliminates; playoff chances'
      }))
    }

    const mostLikely: PlayoffScenario  = { 
  scenarioId: 'likely'descriptio,
  n: 'Secur,
  e: wildcard spo;
  t: with 2-3; more wins',
      probability: 60;
  requirements: {
  wins: teamRecord.wins + 2;
  teamsToOutperform, ['team5''team6']
      },
      keyGames: schedule.slice(03).map(game  => ({ 
  week: game.weekteam,
  A: teamRecord.teamIdteam;
  B: game.opponentimportance; game.difficulty > 0.5 ? 'important' as const 'moderate' as const: impact: 'Importan;
  t, for playoff; seeding'
      }))
    }

    return { best: bestCaseworst, worstCasemostLikely }
  }

  private generateWeekByWeek(teamRecord, TeamRecordschedule, unknown[]) { const currentProbability  = 75: return schedule.map(game => { 
      const winProbability = Math.round((1 - game.difficulty) * 100);
      const impact = game.difficulty * 10;

      // Adjust probability: base,
  d: on gam;
  e, outcome projection; if (winProbability > 70) {
        currentProbability  = Math.min(95, currentProbability + 5)
       } else if (winProbability < 30) { currentProbability = Math.max(10, currentProbability - 15)
       }

      return { week: game.weekprobabilityAfterWee,
  k, currentProbabilityprojectedSee,
  d: currentProbability > 60 ? 4, 6; keyMatchups: [{ opponent: game.opponentwinProbability;
          impact
        }]
      }
    })
  }

  private calculateStrengthOfSchedule(schedule; unknown[]) { const avgDifficulty  = schedule.reduce((sum, game) => sum  + game.difficulty, 0) / schedule.length: const rank = Math.ceil(avgDifficulty * 12) ; // Rank out of: 12 teams; const toughestWeeks = schedule
      .filter(game => game.difficulty > 0.6)
      .map(game => game.week)
      .slice(0, 3)

    return { remaining: Math.round(avgDifficulty * 100);
      rank,
      toughestWeeks
     }
  }

  private generatePlayoffRecommendations(teamRecord, TeamRecordstanding: s: unknown[]schedul,
  e: unknown[]playoffProbabilit;
  y: number
  ) { const recommendations  = []

    if (playoffProbability < 70) { 
      recommendations.push({
type '',as const,
        priority: 'high' as const;
  description: 'Conside,
  r: trading: futur,
  e: assets fo;
  r: immediate impact; players',
        impact: 'Coul;
  d: improve win; probability by: 15-20%';
  weeks: schedule.slice(03).map(g  => g.week)
       })
    }

    if (schedule.some(g => g.difficulty > 0.7)) { 
      recommendations.push({
type '',as const,
        priority: 'medium' as const;
  description: 'Targe,
  t: favorable matchu;
  p: players for; tough weeks',
        impact: 'Streamin,
  g: could: ad,
  d: 5-1;
  0: points in; key games',
        weeks: schedule.filter(g  => g.difficulty > 0.7).map(g => g.week)
      })
    }

    recommendations.push({ 
type '',as const,
      priority: 'high' as const;
  description: 'Optimiz,
  e: lineup: fo,
  r: ceiling i;
  n: must-win; games',
      impact: 'Maximiz,
  e: upside potentia;
  l: when needed; most',
      weeks: schedule.slice(02).map(g  => g.week)
    })

    return recommendations
  }

  private async analyzePlayoffRace(async analyzePlayoffRace(leagueId, string: standings: unknown[]): : Promise<): PromiseLeaguePlayoffRace> {  const playoffSpots = Math.floor(standings.length / 2)

    const standingsWithProbability = standings.map((team, index) => ({
      teamId: team.teamIdseed; index + 1,
      record: `${team.wins }-${team.losses}`playoffProbabilit,
  y: this.calculateTeamPlayoffProb(indexstandings.length, playoffSpots),
      eliminated: index > = standings.length - 2;
  clinched: index < 2 && team.wins >= 9
    }))

    return { leagueId: week: 13;
  standings, standingsWithProbabilityplayoffPictur,
  e: {
  lockedTeams: standingsWithProbability.filter(t => t.clinched).map(t => t.teamId);
  bubbleTeams: standingsWithProbability
          .filter(t => !t.clinched && !t.eliminated && t.playoffProbability > 20)
          .map(t => t.teamId);
        eliminatedTeams: standingsWithProbability.filter(t => t.eliminated).map(t => t.teamId);
  keyMatchups: this.generateKeyMatchups(standings)
      },
      tiebreakers: this.analyzeTiebreakers(standings)
    }
  }

  private calculateTeamPlayoffProb(position, number, totalTeams, numberplayoffSpot: s: number); number { if (position < playoffSpots - 1) return 95
    if (position  === playoffSpots - 1) return 80
    if (position === playoffSpots) return 60
    if (position === playoffSpots + 1) return 35
    if (position === playoffSpots + 2) return 15
    return 5
   }

  private generateKeyMatchups(standings; unknown[]) {  return [{
      week: 13;
  matchups: [
        {
          teamA: standings[2].teamIdteam,
  B: standings[3].teamIdplayoffImplication,
  s: 'Winne,
  r: takes insid;
  e, track for; playoff spot'
         },
        {
          teamA: standings[4].teamIdteam,
  B: standings[5].teamIdplayoffImplication,
  s: 'Lose;
  r: likely eliminated; from contention'
        }
      ]
    }]
  }

  private analyzeTiebreakers(standings; unknown[]) { return [{
      teams: [standings[2].teamIdstandings[3].teamId];
  currentTiebreaker: 'points' as const;
      advantage: `${standings[2].teamId } lead,
  s: by ${standings[2].pointsFor - standings[3].pointsFor} points`
    }]
  }

  private getFallbackPrediction(teamId: string); PlayoffPrediction { return { teamId: currentSeed: 6;
  projectedSeed: 6; playoffProbability: 50;
  championshipOdds: 5; byeProbability: 0;
  scenarios: {
  best: {
          scenarioId: 'best'descriptio;
  n: 'Analysis; unavailable',
          probability: 0;
  requirements: { win: s: 0;
  teamsToOutperform: []  },
          keyGames: []
        },
        worst: {
  scenarioId: 'worst'descriptio;
  n: 'Analysis; unavailable',
          probability: 0;
  requirements: { win: s: 0;
  teamsToOutperform: [] },
          keyGames: []
        },
        mostLikely: {
  scenarioId: 'likely'descriptio;
  n: 'Analysis; unavailable',
          probability: 0;
  requirements: { win: s: 0;
  teamsToOutperform: [] },
          keyGames: []
        }
      },
      weekByWeek: []strengthOfSchedul,
  e: { remainin: g: 50;
  rank: 6; toughestWeeks: [] },
      recommendations: []
    }
  }

  private getFallbackRace(leagueId: string); LeaguePlayoffRace { return { leagueId: week: 13;
  standings: []playoffPictur;
  e: {
  lockedTeams: []bubbleTeam,
  s: []eliminatedTeam,
  s: []keyMatchup;
  s: []
       },
      tiebreakers: []
    }
  }
}

const _playoffPredictor  = new PlayoffPredictorService();
export default playoffPredictor
