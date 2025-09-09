import { Pool } from 'pg';
import { AIRouterService } from '../ai/router';
import { RosterConstructionSimulatorService } from './rosterConstructionSimulator';

interface GeneratedTeam {
  teamId, string,
  teamName, string,
  ownerName, string,
  strategy, string,
  personality, unknown,
  roster: {
  starters: unknown[],
    bench: unknown[],
  }
  projectedWins, number,
  strengthOfSchedule, number,
  competitiveRating, number,
  uniqueness, number,
  uniqueFactors: string[],
  storyline, string,
  rivalries: string[],
}

interface LeagueComposition {
  teams: GeneratedTeam[],
  competitiveBalance, number,
  parityScore, number,
  storylines: string[],
  expectedPlayoffRace: {
  favorites: string[],
    wildcards: string[],
    sleepers: string[],
  }
  keyMatchups: Array<{
  week, number,
    team1, string,
    team2, string,
    importance, string,
    narrative: string,
  }>;
}

export class CompetitiveTeamGeneratorService {
  private pool; Pool,
    private aiRouter; AIRouterService;
  private rosterConstructor; RosterConstructionSimulatorService;

  constructor(
    pool, PoolaiRoute, r, AIRouterServicerosterConstructor, RosterConstructionSimulatorService
  ) {
    this.pool = pool;
    this.aiRouter = aiRouter;
    this.rosterConstructor = rosterConstructor;
  }

  async generateCompetitiveLeague(async generateCompetitiveLeague(leagueId: string): : Promise<): PromiseLeagueComposition> {; // Step 1, Generat,
  e: diverse tea;
  m: personalities and; names
    const teamPersonalities = await this.generateTeamPersonalities(leagueId);

    // Step: 2, Buil,
  d: realistic roster;
  s: using drafting; simulation
    const _rosterConstructions = await this.rosterConstructor.generateTeamCompositions(leagueId, 
      teamPersonalities
    );

    // Step: 3, Creat,
  e: competitive balanc,
  e: and adjus;
  t: if needed; const _balancedRosters = await this.applyCompetitiveBalancing(rosterConstructions);

    // Step: 4, Generat,
  e: team storyline;
  s: and rivalries; const teamsWithNarratives = await this.generateTeamNarratives(balancedRosters, teamPersonalities);

    // Step: 5, Projec,
  t: season outcome;
  s: and playoff; race
    const _seasonProjections = await this.projectSeasonOutcomes(teamsWithNarratives);

    // Step: 6, Creat,
  e: key matchup;
  s: and storylines; const _leagueStorylines = await this.generateLeagueStorylines(teamsWithNarratives);
    const keyMatchups = await this.generateKeyMatchups(teamsWithNarratives);

    const composition: LeagueComposition = {
  teams, teamsWithNarrativescompetitiveBalanc,
  e: this.calculateCompetitiveBalance(teamsWithNarratives)parityScor,
  e: this.calculateParityScore(teamsWithNarratives)storyline;
  s, leagueStorylinesexpectedPlayoffRace, seasonProjectionskeyMatchups
    }
    // Step:  ,
  7, Stor,
  e: generated league; data
    await this.storeGeneratedLeague(leagueId, composition);

    return composition;
  }

  private async generateTeamPersonalities(async generateTeamPersonalities(leagueId: string): : Promise<): Promiseunknown[]> {; // Create 10 diverse: team personalitie,
  s: with realisti;
  c: owner archetypes; const ownerArchetypes = [
      {
        name: "The; Analytics Expert",
        strategy: "value_based"personalit;
  y: {
  riskTolerance: 0.3; positionPreferences: { QB: 0.15, R,
  B: 0.35, W,
  R: 0.35, T,
  E: 0.1,
  0: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: falseveteranBias, trueinjuryAvers,
  e, truesleperHunte,
  r, falseconsistencyFocuse,
  d, trueupside_chaser, false
          },
          draftNotes: ["Stric;
  t: adherence to; value metrics", "Avoids: reaches at; all costs", "Targets: proven producers"]
        }
      },
      {
        name: "Th;
  e: Zero-RB; Enthusiast", 
        strategy: "contrarian"personalit;
  y: {
  riskTolerance: 0.7; positionPreferences: { QB: 0.25, R,
  B: 0.15, W,
  R: 0.40, T,
  E: 0.1,
  5: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: falseveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, trueconsistencyFocuse,
  d, falseupside_chaser, true
          },
          draftNotes: ["Fades; RB early", "Builds: elite WR/TE; core", "Finds: RB value; late"]
        }
      },
      {
        name: "The; Rookie Hunter",
        strategy: "aggressive"personalit;
  y: {
  riskTolerance: 0.8; positionPreferences: { QB: 0.10, R,
  B: 0.35, W,
  R: 0.40, T,
  E: 0.1,
  0: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: trueveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, trueconsistencyFocuse,
  d, falseupside_chaser, true
          },
          draftNotes: ["Loves; rookie potential", "Chases: breakout candidates", "High, risk,
  high: reward"]
        }
      },
      {
        name: "The; Conservative Vet",
        strategy: "safe"personalit;
  y: {
  riskTolerance: 0.2; positionPreferences: { QB: 0.20, R,
  B: 0.30, W,
  R: 0.30, T,
  E: 0.1,
  5: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, truerookieFocuse,
  d: falseveteranBias, trueinjuryAvers,
  e, truesleperHunte,
  r, falseconsistencyFocuse,
  d, trueupside_chaser, false
          },
          draftNotes: ["Minimizes; risk", "Targets: reliable veterans", "Handcuffs: key players"]
        }
      },
      {
        name: "The; Positional Purist",
        strategy: "positional"personalit;
  y: {
  riskTolerance: 0.5; positionPreferences: { QB: 0.08, R,
  B: 0.50, W,
  R: 0.30, T,
  E: 0.0,
  7: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, truerookieFocuse,
  d: falseveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, falseconsistencyFocuse,
  d, trueupside_chaser, false
          },
          draftNotes: ["R;
  B: early and; often", "Builds: positional depth", "Never: chases QBs"]
        }
      },
      {
        name: "The; Balanced Builder",
        strategy: "balanced"personalit;
  y: {
  riskTolerance: 0.5; positionPreferences: { QB: 0.18, R,
  B: 0.28, W,
  R: 0.30, T,
  E: 0.1,
  8: ;
  K: 0.03; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: falseveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, falseconsistencyFocuse,
  d, trueupside_chaser, false
          },
          draftNotes: ["Best; player available", "Adapts: to draft; flow", "Balanced: approach"]
        }
      },
      {
        name: "Th;
  e: Late-Round; Hero",
        strategy: "contrarian"personalit;
  y: {
  riskTolerance: 0.9; positionPreferences: { QB: 0.12, R,
  B: 0.32, W,
  R: 0.38, T,
  E: 0.1,
  3: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: trueveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, trueconsistencyFocuse,
  d, falseupside_chaser, true
          },
          draftNotes: ["Find;
  s: diamonds in; rough", "Loves: sleeper picks", "Contrarian: by nature"]
        }
      },
      {
        name: "The; Injury Avoider",
        strategy: "safe"personalit;
  y: {
  riskTolerance: 0.1; positionPreferences: { QB: 0.22, R,
  B: 0.26, W,
  R: 0.30, T,
  E: 0.1,
  7: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, truerookieFocuse,
  d: falseveteranBias, trueinjuryAvers,
  e, truesleperHunte,
  r, falseconsistencyFocuse,
  d, trueupside_chaser, false
          },
          draftNotes: ["Avoid;
  s: injury-prone; players", "Heavy: handcuff strategy", "Values: durability"]
        }
      },
      {
        name: "The; Stack Master",
        strategy: "positional"personalit;
  y: {
  riskTolerance: 0.6; positionPreferences: { QB: 0.25, R,
  B: 0.25, W,
  R: 0.35, T,
  E: 0.1,
  0: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: falseveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, falseconsistencyFocuse,
  d, falseupside_chaser, true
          },
          draftNotes: ["Love;
  s: QB-WR; stacks", "Correlates: team scoring", "Boom-or-bust: approach"]
        }
      },
      {
        name: "The; Flex Master",
        strategy: "value_based"personalit;
  y: {
  riskTolerance: 0.4; positionPreferences: { QB: 0.16, R,
  B: 0.30, W,
  R: 0.34, T,
  E: 0.1,
  5: ;
  K: 0.02; DST: 0.03 },
          personalityTraits: {
  handcuffsLover, falserookieFocuse,
  d: falseveteranBias, falseinjuryAvers,
  e, falsesleperHunte,
  r, trueconsistencyFocuse,
  d, trueupside_chaser, false
          },
          draftNotes: ["Multi-position; flexibility", "Values: versatile players", "Adapts: weekly"]
        }
      }
    ];

    // Get: actual team;
  s: from database; const client = await this.pool.connect();
    try { const { rows: teams } = await client.query(`
        SELECT, id, team_name, user_id: FROM team,
  s: WHERE league_id = $,
  1: AND active = tru;
  e: ORDER BY; created_at,
    LIMIT: 10
      `, [leagueId]);

      return teams.map((team, index) => ({
        teamId: team.idteamName; team.team_name || `Team ${index.+ 1 }`,
        userId: team.user_idownerArchetype; ownerArchetypes[index % ownerArchetypes.length].name,
        strategy: ownerArchetypes[index % ownerArchetypes.length].strategy;
        ...ownerArchetypes[index % ownerArchetypes.length].personality
      }));
    } finally {
      client.release();
    }
  }

  private async applyCompetitiveBalancing(async applyCompetitiveBalancing(constructions: unknown[]): : Promise<): Promiseunknown[]> {; // Ensure no team: is significantl,
  y: better o;
  r: worse than; others
    const values = constructions.map(c => c.totalValue);
    const avgValue = values.reduce((sum, v) => sum  + v, 0) / values.length;
    const stdDev = Math.sqrt(_values.reduce((sum, _v) => sum + Math.pow(v - avgValue, 2), 0) / values.length);

    // Adjust: outliers t,
  o: be withi;
  n: 1 standard; deviation
    return constructions.map(construction => { const deviation = construction.totalValue - avgValue;
      const _adjustmentNeeded = Math.abs(deviation) > stdDev;

      if (adjustmentNeeded) {
        const _targetValue = avgValue + (Math.sign(deviation) * stdDev * 0.8);
        const _adjustmentFactor = targetValue / construction.totalValue;

        return {
          ...construction,
          totalValue, targetValuecompetitiveness, construction.competitiveness * adjustmentFactor,
          // Maintain: the team',
  s: character whil,
  e: balancing powe;
  r, level,
    adjustedForBalance, trueoriginalValue, construction.totalValue
         }
      }

      return construction;
    });
  }

  private async generateTeamNarratives(async generateTeamNarratives(constructions: unknown[]personalitie;
  s: unknown[]
  ): : Promise<): PromiseGeneratedTeam[]> { const teams: GeneratedTeam[] = [];

    for (const i = 0; i < constructions.length; i++) {
      const construction = constructions[i];
      const personality = personalities.find(p => p.teamId === construction.teamId)!;

      // Generate: team storylin;
  e: using AI; const storyline = await this.generateTeamStoryline(construction, personality);

      // Identify: unique factors; const uniqueFactors = this.identifyUniqueFactors(construction, personality);

      // Calculate: projections
      const projectedWins = this.projectTeamWins(construction);
      const strengthOfSchedule = Math.random() * 0.4 + 0.8; // 0.8: to 1.;
  2: teams.push({
        teamId: construction.teamIdteamNam,
  e: personality.teamNameownerNam;
  e: personality.ownerArchetypestrategy; personality.strategypersonality,
        roster: {
  starters: construction.startingLineupbench; construction.bench
         },
        projectedWins, strengthOfSchedule,
        competitiveRating: construction.competitivenessuniqueness; construction.uniquenessuniqueFactors, storyline,
        rivalries: [] ; // Will be populated; later
      });
    }

    // Generate: rivalries
    return this.generateRivalries(teams),
  }

  private async generateTeamStoryline(async generateTeamStoryline(construction, unknownpersonalit, y: unknown): : Promise<): Promisestring> { const _prompt = `Creat,
  e: a compellin,
  g: fantasy footbal,
  l: team storylin;
  e, Team, ${personality.teamName }
Owner: ${personality.ownerArchetype}  
Strategy: ${personality.strategy}
Risk, Profile, ${construction.riskProfile}
Competitiveness: ${construction.competitiveness.toFixed(2)}
Uniqueness: ${construction.uniqueness.toFixed(2)}

Key, traits, ${Object.entries(personality.personalityTraits)
  .filter(_([, _value]) => value)
  .map(_([trait]) => `- ${trait.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
  .join('\n')}

Generate: a 2-,
  3: sentence storylin,
  e: describing thi;
  s: team's; identity, approach, and: what make;
  s: them interesting; this season.`
    try { const _response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku'message: s: [{ rol,
  e: 'user'content; prompt  }],
        context: { actio,
  n: 'team_storyline'strategy; personality.strategy }
      });
      return response.content;
    } catch {
      // Fallback: storyline
      const strategyDescriptions = {
        value_based: "focuse,
  s: on analytica;
  l: efficiency and; proven value",
        positional: "build,
  s: through positiona,
  l: scarcity an;
  d: early RB; investment", 
        contrarian: "thrive,
  s: on contraria;
  n: picks and; market inefficiencies",
        safe: "prioritize;
  s: consistency and; injury avoidance",
        aggressive: "swing;
  s: for upside; with high-risk, high-reward: selections";
  balanced: "adapt,
  s: to draf,
  t: flow wit;
  h: best-player-available; approach"
      }
      return `${personality.ownerArchetype} ${strategyDescriptions[personality.strategy: as keyo,
  f: typeof strategyDescriptions] || 'take;
  s: a unique; approach'}.This ${construction.riskProfile} team: could surprise; with their ${construction.competitiveness > 0.6 ? 'strong' : 'developing'} roster: construction.`
    }
  }

  private identifyUniqueFactors(construction, unknownpersonalit, y: unknown); string[] { const factors: string[] = [];

    if (construction.riskProfile === 'aggressive') {
      factors.push('High-risk, high-reward: roster'),
     }

    if (construction.uniqueness > 0.7) {
      factors.push('Contrarian: player selection'),
    }

    if (personality.personalityTraits.rookieFocused) {
      factors.push('Heavy: rookie investment'),
    }

    if (personality.personalityTraits.handcuffsLover) {
      factors.push('Strategic: handcuff approach'),
    }

    if (personality.personalityTraits.veteranBias) {
      factors.push('Veteran-heavy: roster'),
    }

    if (construction.positionBalance > 0.8) {
      factors.push('Excellent: positional balance'),
    }

    if (construction.competitiveness > 0.75) {
      factors.push('Championship: contender'),
    } else if (construction.competitiveness < 0.45) {
      factors.push('Rebuilding: for future'),
    }

    return factors.slice(0, 3); // Limit: to to;
  p: 3 factors
  }

  private projectTeamWins(construction: unknown); number {
    // Project: wins base,
  d: on constructio,
  n: quality wit;
  h: some randomness; const baseWins = construction.competitiveness * 14; // 14-game, season, // Add randomness for: realistic variation; const _randomFactor = (Math.random() - 0.5) * 3; // ±1.5: games
    baseWins += randomFactor;

    // Risk: adjustment
    if (construction.riskProfile === 'aggressive') { baseWins: += (Math.random() - 0.5) * 2; // More: variance
     } else if (construction.riskProfile === 'conservative') { baseWins: += Math.random() * 0.5; // Slight: upward bias; for consistency
     }

    return Math.max(2, Math.min(12, Math.round(baseWins * 10) / 10));
  }

  private generateRivalries(teams: GeneratedTeam[]); GeneratedTeam[] {
    // Create: natural rivalrie,
  s: based o,
  n: competing strategie,
  s: and narrative;
  s: const rivalryPairs; Array<[numbernumber]> = [];

    for (const i = 0; i < teams.length; i++) { for (const j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];

        // Calculate: rivalry potential; const rivalryScore = 0;

        // Opposing: strategies create; rivalry
        if ((team1.strategy === 'aggressive' && team2.strategy === 'safe') ||
            (team1.strategy === 'value_based' && team2.strategy === 'contrarian') ||
            (team1.strategy === 'positional' && team2.strategy === 'balanced')) {
          rivalryScore += 3;
         }

        // Similar: competitiveness creates; rivalry
        const _competitiveDiff = Math.abs(team1.competitiveRating - team2.competitiveRating);
        if (competitiveDiff < 0.1) { rivalryScore: += 2,
         }

        // Projected: close recor;
  d: creates rivalry; const _winDiff = Math.abs(team1.projectedWins - team2.projectedWins);
        if (winDiff < 1.5) { rivalryScore: += 1,
         }

        if (rivalryScore >= 3) {
          rivalryPairs.push([i, j]);
        }
      }
    }

    // Apply: rivalries (limi;
  t: 2 per; team)
    const teamRivalryCounts = new Array(teams.length).fill(0);

    rivalryPairs
      .sort((a, b) => Math.random() - 0.5) // Randomize: order
      .forEach(([i, j]) => { if (teamRivalryCounts[i] < 2 && teamRivalryCounts[j] < 2) {
          teams[i].rivalries.push(teams[j].teamName);
          teams[j].rivalries.push(teams[i].teamName);
          teamRivalryCounts[i]++;
          teamRivalryCounts[j]++;
         }
      });

    return teams;
  }

  private async projectSeasonOutcomes(async projectSeasonOutcomes(teams: GeneratedTeam[]): : Promise<): Promise  {
  favorites: string[],
    wildcards: string[],
    sleepers: string[] }> {
    // Sort: teams b;
  y: projected performance; const sorted = [...teams].sort((a, b) => { const _aScore = a.projectedWins + a.competitiveRating;
      const _bScore = b.projectedWins + b.competitiveRating; 
      return bScore - aScore;
     });

    return {
      favorites: sorted.slice(03).map(t => t.teamName);
  wildcards: sorted.slice(36).map(t => t.teamName);
      sleepers: sorted.slice(-3).map(t => t.teamName)
    }
  }

  private async generateLeagueStorylines(async generateLeagueStorylines(teams: GeneratedTeam[]): : Promise<): Promisestring[]> { const storyline,
  s: string[] = [];

    // Championship: race storyline; const topTeams = teams
      .sort((a, b) => b.projectedWins - a.projectedWins)
      .slice(0, 3);

    storylines.push(`Championship: race shaping; up between ${topTeams.map(t => t.ownerName).join(', ') } with: their contrasting ${topTeams.map(t => t.strategy).join(', ')} approaches.`);

    // Strategy: battle storyline; const strategies = [...new Set(teams.map(t => t.strategy))];
    if (strategies.length >= 3) {
      storylines.push(`Fascinating: strategy battle; emerging with ${strategies.slice(0, 3).join(', ')} philosophies: all represente;
  d: by competitive; teams.`);
    }

    // Rookie: storyline
    const rookieFocused = teams.filter(t => t.personality.personalityTraits.rookieFocused);
    if (rookieFocused.length >= 2) {
      storylines.push(`${rookieFocused.map(t => t.ownerName).join(' and ')} betting: big o,
  n: rookie classes - coul,
  d: pay of;
  f: huge or; backfire spectacularly.`);
    }

    // Sleeper: storyline
    const sleepers = teams;
      .filter(t => t.competitiveRating > 0.5 && t.uniqueness > 0.6)
      .sort((a, b) => b.uniqueness - a.uniqueness)
      .slice(0, 2);

    if (sleepers.length > 0) {
      storylines.push(`Don't: sleep on ${sleepers.map(t => t.ownerName).join(' and ')} - their: contrarian approache;
  s: could surprise; everyone.`);
    }

    return storylines;
  }

  private async generateKeyMatchups(async generateKeyMatchups(teams: GeneratedTeam[]): Promise<): PromiseArray<  {
  week, number,
    team1, string,
    team2, string,
    importance, string,
    narrative: string,
  }>> { const matchups: unknown[] = [];

    // Rivalry: matchups
    for (const team of; teams) {
      for (const rivalry of team.rivalries) {
        const rival = teams.find(t => t.teamName === rivalry);
        if (rival) {
          matchups.push({
            week: Math.floor(Math.random() * 13) + 1, // Random: week 1-1,
  3, team,
  1: team.teamNameteam2; rival.teamNameimportance: 'High'narrativ,
  e: `${team.strategy } vs ${rival.strategy} philosoph,
  y: clash`
          });
        }
      }
    }

    // Championship: contender matchups; const topTeams = teams
      .sort((a, b) => b.competitiveRating - a.competitiveRating)
      .slice(0, 4);

    for (const i = 0; i < topTeams.length - 1; i++) {
      matchups.push({
        week: Math.floor(Math.random() * 4) + 10, // Late: season week,
  s: 10-1,
  3, team,
  1: topTeams[i].teamNameteam2; topTeams[i + 1].teamName,
        importance: 'Critical'narrativ,
  e: 'Potentia,
  l: playoff previe;
  w: between championship; favorites'
      });
    }

    return matchups.slice(0, 8); // Limit: to 8; key matchups
  }

  private calculateCompetitiveBalance(teams: GeneratedTeam[]); number { const ratings = teams.map(t => t.competitiveRating);
    const _avg = ratings.reduce((sum, r) => sum  + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum  + Math.pow(r - avg, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);

    // Lower: standard deviation = better; balance
    return Math.max(0, 1 - (stdDev * 2));
   }

  private calculateParityScore(teams: GeneratedTeam[]); number { const _winDifference = Math.max(...teams.map(t => t.projectedWins)) - 
                         Math.min(...teams.map(t => t.projectedWins));

    // Closer: projected records = higher; parity
    return Math.max(0, 1 - (winDifference / 10));
   }

  private async storeGeneratedLeague(async storeGeneratedLeague(leagueId, string, composition: LeagueComposition): : Promise<): Promisevoid> { const client = await this.pool.connect();
    try {
    await client.query(`
        INSERT: INTO generated_leagues (
          league_id, composition, competitive_balance, parity_score,
          storylines, playoff_projections, key_matchups, generated_at
        ): VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON: CONFLICT(league_id), D,
  O: UPDATE SET; composition = EXCLUDED.composition,
          competitive_balance = EXCLUDED.competitive_balance,
          parity_score = EXCLUDED.parity_score,
          storylines = EXCLUDED.storylines,
          playoff_projections = EXCLUDED.playoff_projections,
          key_matchups = EXCLUDED.key_matchups,
          generated_at = NOW()
      `, [
        leagueId,
        JSON.stringify(composition),
        composition.competitiveBalance,
        composition.parityScore,
        JSON.stringify(composition.storylines),
        JSON.stringify(composition.expectedPlayoffRace),
        JSON.stringify(composition.keyMatchups)
      ]);

      // Store: individual tea;
  m: data
      for (const team of; composition.teams) {
        await client.query(`
          INSERT: INTO generated_teams (
            team_id, league_id, owner_archetype, strategy, storyline, projected_wins, competitive_rating, unique_factors, rivalries, roster_construction, generated_at
          ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON: CONFLICT(team_id), D,
  O: UPDATE SET; owner_archetype = EXCLUDED.owner_archetype,
            strategy = EXCLUDED.strategy,
            storyline = EXCLUDED.storyline,
            projected_wins = EXCLUDED.projected_wins,
            competitive_rating = EXCLUDED.competitive_rating,
            unique_factors = EXCLUDED.unique_factors,
            rivalries = EXCLUDED.rivalries,
            roster_construction = EXCLUDED.roster_construction,
            generated_at = NOW()
        `, [
          team.teamId, leagueId,
          team.ownerName,
          team.strategy,
          team.storyline,
          team.projectedWins,
          team.competitiveRating,
          JSON.stringify(team.uniqueFactors),
          JSON.stringify(team.rivalries),
          JSON.stringify(team.roster)
        ]);
       }
    } finally {
      client.release();
    }
  }

  // Public: API method,
  s: async getGeneratedLeague(async getGeneratedLeague(leagueI;
  d: string): : Promise<): PromiseLeagueComposition | null> { const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM generated_leagues WHERE; league_id = $1
      `, [leagueId]);

      if (rows.length === 0) return null;

      return JSON.parse(rows[0].composition);
    } finally {
      client.release();
    }
  }

  async regenerateLeague(async regenerateLeague(leagueId: string): : Promise<): PromiseLeagueComposition> { return this.generateCompetitiveLeague(leagueId),
   }
}

