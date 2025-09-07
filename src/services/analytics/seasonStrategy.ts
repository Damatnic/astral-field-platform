import { db } from '../../lib/db';
import { AIRouter } from '../ai/aiRouter';

export interface PlayoffProjection {
  teamId: string;
  teamName: string;
  currentRecord: { wins: number; losses: number };
  projectedWins: number;
  projectedLosses: number;
  playoffProbability: number;
  byeWeekProbability: number;
  championshipProbability: number;
  strengthOfSchedule: number;
  remainingOpponents: string[];
  keyMatchups: Array<{
    week: number;
    opponent: string;
    importance: 'critical' | 'important' | 'moderate';
    winProbability: number;
  }>;
}

export interface SeasonPhaseStrategy {
  phase: 'early' | 'mid' | 'late' | 'playoffs';
  weekRange: string;
  primaryGoals: string[];
  strategicFocus: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingRecommendations: string[];
  waiverPriorities: string[];
  lineupOptimizations: string[];
}

export interface StrategicRecommendation {
  type: 'trade' | 'waiver' | 'lineup' | 'long_term' | 'playoff_prep';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  timeline: string;
  riskLevel: 'low' | 'medium' | 'high';
  targetPlayers?: string[];
  alternatives?: string[];
}

export interface WeeklyMatchupStrategy {
  week: number;
  opponent: string;
  opponentStrengths: string[];
  opponentWeaknesses: string[];
  recommendedLineup: Record<string, string[]>;
  streamingTargets: string[];
  sitStartAdvice: Array<{
    player: string;
    action: 'start' | 'sit' | 'flex';
    confidence: number;
    reasoning: string;
  }>;
  gameScript: string;
  weatherConsiderations: string[];
}

export interface SeasonLongStrategy {
  teamAnalysis: {
    currentStanding: number;
    strengthAreas: string[];
    weaknessAreas: string[];
    rosterConstruction: string;
    competitiveWindow: string;
  };
  playoffProjections: PlayoffProjection;
  phaseStrategies: SeasonPhaseStrategy[];
  strategicRecommendations: StrategicRecommendation[];
  weeklyStrategies: WeeklyMatchupStrategy[];
  contingencyPlans: Array<{
    scenario: string;
    triggers: string[];
    actions: string[];
    timeline: string;
  }>;
  seasonGoals: {
    primary: string;
    secondary: string[];
    fallback: string;
  };
}

export class SeasonStrategyService {
  private aiRouter: AIRouter;

  constructor() {
    this.aiRouter = new AIRouter();
    // PredictiveAnalyticsDashboardService intentionally not constructed here to avoid
    // unnecessary dependencies; this service does not require it directly.
  }

  async generateSeasonLongStrategy(
    leagueId: string,
    userId: string,
    currentWeek?: number
  ): Promise<SeasonLongStrategy> {
    try {
      const [
        teamAnalysis,
        playoffProjections,
        leagueContext,
        historicalData
      ] = await Promise.all([
        this.analyzeTeamConstruction(leagueId, userId),
        this.generatePlayoffProjections(leagueId, userId),
        this.getLeagueContext(leagueId),
        this.getHistoricalPerformance(leagueId, userId)
      ]);

      const phaseStrategies = await this.generatePhaseStrategies(
        teamAnalysis,
        playoffProjections,
        leagueContext,
        currentWeek || 1
      );

      const strategicRecommendations = await this.generateStrategicRecommendations(
        teamAnalysis,
        playoffProjections,
        leagueContext,
        phaseStrategies
      );

      const weeklyStrategies = await this.generateWeeklyStrategies(
        leagueId,
        userId,
        currentWeek || 1,
        Math.min((currentWeek || 1) + 4, 17)
      );

      const contingencyPlans = await this.generateContingencyPlans(
        teamAnalysis,
        playoffProjections,
        leagueContext
      );

      const seasonGoals = await this.determineSeasonGoals(
        teamAnalysis,
        playoffProjections,
        leagueContext
      );

      return {
        teamAnalysis: {
          currentStanding: teamAnalysis.standing,
          strengthAreas: teamAnalysis.strengths,
          weaknessAreas: teamAnalysis.weaknesses,
          rosterConstruction: teamAnalysis.construction,
          competitiveWindow: teamAnalysis.competitiveWindow
        },
        playoffProjections,
        phaseStrategies,
        strategicRecommendations,
        weeklyStrategies,
        contingencyPlans,
        seasonGoals
      };

    } catch (error) {
      console.error('Error generating season-long strategy:', error);
      throw error;
    }
  }

  private async analyzeTeamConstruction(leagueId: string, userId: string): Promise<{
    standing: number;
    strengths: string[];
    weaknesses: string[];
    construction: string;
    competitiveWindow: string;
  }> {
    const teamData = await db.query(`
      WITH team_standings AS (
        SELECT 
          u.id as user_id,
          u.username,
          COUNT(CASE WHEN lm.user_score > lm.opponent_score THEN 1 END) as wins,
          COUNT(CASE WHEN lm.user_score < lm.opponent_score THEN 1 END) as losses,
          COALESCE(AVG(lm.user_score), 0) as avg_score,
          COALESCE(SUM(lm.user_score), 0) as total_points,
          ROW_NUMBER() OVER (ORDER BY 
            COUNT(CASE WHEN lm.user_score > lm.opponent_score THEN 1 END) DESC,
            COALESCE(SUM(lm.user_score), 0) DESC
          ) as standing
        FROM users u
        JOIN league_matchups lm ON u.id = lm.user_id
        WHERE lm.league_id = $1
        GROUP BY u.id, u.username
      ),
      roster_analysis AS (
        SELECT 
          up.user_id,
          COUNT(CASE WHEN p.position = 'QB' THEN 1 END) as qb_count,
          COUNT(CASE WHEN p.position = 'RB' THEN 1 END) as rb_count,
          COUNT(CASE WHEN p.position = 'WR' THEN 1 END) as wr_count,
          COUNT(CASE WHEN p.position = 'TE' THEN 1 END) as te_count,
          COUNT(CASE WHEN p.position = 'K' THEN 1 END) as k_count,
          COUNT(CASE WHEN p.position = 'DST' THEN 1 END) as dst_count,
          AVG(COALESCE(p.projected_points, 0)) as avg_projected_points,
          COUNT(CASE WHEN p.injury_status IN ('questionable', 'doubtful', 'out') THEN 1 END) as injured_players
        FROM user_players up
        JOIN players p ON up.player_id = p.id
        WHERE up.user_id = $2
        GROUP BY up.user_id
      )
      SELECT 
        ts.*,
        ra.*
      FROM team_standings ts
      LEFT JOIN roster_analysis ra ON ts.user_id = ra.user_id
      WHERE ts.user_id = $2
    `, [leagueId, userId]);

    const team = teamData.rows[0];
    if (!team) throw new Error('Team not found');

    const strengths = [];
    const weaknesses = [];

    // Analyze roster construction
    if (team.qb_count >= 2) strengths.push('Solid QB depth');
    else if (team.qb_count < 1) weaknesses.push('Lack of QB depth');

    if (team.rb_count >= 4) strengths.push('Strong RB depth');
    else if (team.rb_count < 3) weaknesses.push('Thin at RB position');

    if (team.wr_count >= 5) strengths.push('Excellent WR depth');
    else if (team.wr_count < 4) weaknesses.push('Limited WR options');

    if (team.te_count >= 2) strengths.push('TE depth advantage');
    else if (team.te_count < 1) weaknesses.push('No TE backup');

    // Analyze performance
    if (parseFloat(team.avg_score) > 120) strengths.push('High-scoring offense');
    else if (parseFloat(team.avg_score) < 100) weaknesses.push('Struggling to score points');

    if (team.standing <= 4) strengths.push('Strong playoff position');
    else if (team.standing > 8) weaknesses.push('Outside playoff contention');

    if (parseInt(team.injured_players) > 3) weaknesses.push('Injury-prone roster');

    // Determine roster construction type
    let construction = 'balanced';
    if (team.rb_count >= 5 && team.wr_count < 5) construction = 'RB-heavy';
    else if (team.wr_count >= 6 && team.rb_count < 4) construction = 'WR-heavy';
    else if (parseFloat(team.avg_projected_points) > 15) construction = 'star-heavy';

    // Determine competitive window
    let competitiveWindow = 'rebuilding';
    if (team.standing <= 6 && parseFloat(team.avg_score) > 110) competitiveWindow = 'championship contender';
    else if (team.standing <= 8) competitiveWindow = 'playoff contender';
    else if (team.wins >= team.losses) competitiveWindow = 'competitive';

    return {
      standing: parseInt(team.standing),
      strengths,
      weaknesses,
      construction,
      competitiveWindow
    };
  }

  private async generatePlayoffProjections(leagueId: string, userId: string): Promise<PlayoffProjection> {
    const projectionData = await db.query(`
      WITH current_standings AS (
        SELECT 
          u.id,
          u.username,
          COUNT(CASE WHEN lm.user_score > lm.opponent_score THEN 1 END) as wins,
          COUNT(CASE WHEN lm.user_score < lm.opponent_score THEN 1 END) as losses,
          COALESCE(AVG(lm.user_score), 0) as avg_score,
          COALESCE(AVG(lm.opponent_score), 0) as avg_opponent_score
        FROM users u
        LEFT JOIN league_matchups lm ON u.id = lm.user_id
        WHERE lm.league_id = $1
        GROUP BY u.id, u.username
      ),
      schedule_analysis AS (
        SELECT 
          lm.user_id,
          COUNT(*) as remaining_games,
          AVG(opponent_difficulty.avg_score) as avg_opponent_strength
        FROM league_matchups lm
        JOIN current_standings opponent_difficulty ON lm.opponent_id = opponent_difficulty.id
        WHERE lm.league_id = $1 AND lm.week > (
          SELECT COALESCE(MAX(week), 1) FROM league_matchups WHERE league_id = $1 AND user_score IS NOT NULL
        )
        GROUP BY lm.user_id
      )
      SELECT 
        cs.*,
        COALESCE(sa.remaining_games, 0) as remaining_games,
        COALESCE(sa.avg_opponent_strength, cs.avg_score) as avg_opponent_strength
      FROM current_standings cs
      LEFT JOIN schedule_analysis sa ON cs.id = sa.user_id
      WHERE cs.id = $2
    `, [leagueId, userId]);

    const team = projectionData.rows[0];
    if (!team) throw new Error('Team not found');

    const totalGames = team.wins + team.losses + team.remaining_games;
    const winRate = team.wins / Math.max(team.wins + team.losses, 1);

    // Project remaining wins based on strength vs opponents
    const strengthRatio = team.avg_score / Math.max(team.avg_opponent_strength, 1);
    const adjustedWinRate = Math.min(0.85, Math.max(0.15, winRate * strengthRatio));
    const projectedRemainingWins = team.remaining_games * adjustedWinRate;

    const projectedWins = team.wins + projectedRemainingWins;
    const projectedLosses = totalGames - projectedWins;

    // Calculate probabilities based on projected wins
    let playoffProbability = 0;
    if (projectedWins >= 10) playoffProbability = 0.95;
    else if (projectedWins >= 9) playoffProbability = 0.85;
    else if (projectedWins >= 8) playoffProbability = 0.65;
    else if (projectedWins >= 7) playoffProbability = 0.35;
    else if (projectedWins >= 6) playoffProbability = 0.15;

    const byeWeekProbability = Math.max(0, playoffProbability * 0.5);
    const championshipProbability = Math.max(0, playoffProbability * 0.2);

    // Get remaining opponents
    const remainingOpponents = await db.query(`
      SELECT DISTINCT u.username
      FROM league_matchups lm
      JOIN users u ON lm.opponent_id = u.id
      WHERE lm.league_id = $1 AND lm.user_id = $2 AND lm.week > (
        SELECT COALESCE(MAX(week), 1) FROM league_matchups WHERE league_id = $1 AND user_score IS NOT NULL
      )
      ORDER BY u.username
    `, [leagueId, userId]);

    return {
      teamId: userId,
      teamName: team.username,
      currentRecord: { wins: team.wins, losses: team.losses },
      projectedWins: Math.round(projectedWins * 10) / 10,
      projectedLosses: Math.round(projectedLosses * 10) / 10,
      playoffProbability,
      byeWeekProbability,
      championshipProbability,
      strengthOfSchedule: team.avg_opponent_strength / team.avg_score,
      remainingOpponents: remainingOpponents.rows.map((r: any) => r.username),
      keyMatchups: [] // Would be populated with specific matchup analysis
    };
  }

  private async getLeagueContext(leagueId: string): Promise<{
    totalTeams: number;
    playoffSpots: number;
    tradeDeadline: string;
    currentWeek: number;
    scoringType: string;
  }> {
    const leagueData = await db.query(`
      SELECT 
        l.team_count,
        l.playoff_teams,
        l.trade_deadline,
        l.scoring_type,
        COALESCE(MAX(lm.week), 1) as current_week
      FROM leagues l
      LEFT JOIN league_matchups lm ON l.id = lm.league_id AND lm.user_score IS NOT NULL
      WHERE l.id = $1
      GROUP BY l.team_count, l.playoff_teams, l.trade_deadline, l.scoring_type
    `, [leagueId]);

    const league = leagueData.rows[0];
    return {
      totalTeams: league.team_count || 10,
      playoffSpots: league.playoff_teams || 6,
      tradeDeadline: league.trade_deadline || 'Week 13',
      currentWeek: league.current_week,
      scoringType: league.scoring_type || 'standard'
    };
  }

  private async getHistoricalPerformance(leagueId: string, userId: string): Promise<{
    seasonTrend: 'improving' | 'declining' | 'stable';
    consistencyScore: number;
    clutchFactor: number;
  }> {
    const performanceData = await db.query(`
      WITH weekly_scores AS (
        SELECT 
          week,
          user_score,
          opponent_score,
          CASE WHEN user_score > opponent_score THEN 1 ELSE 0 END as win
        FROM league_matchups
        WHERE league_id = $1 AND user_id = $2
        ORDER BY week
      ),
      trend_analysis AS (
        SELECT 
          week,
          user_score,
          AVG(user_score) OVER (ORDER BY week ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as rolling_avg,
          STDDEV(user_score) OVER () as score_stddev,
          COUNT(*) OVER () as total_games
        FROM weekly_scores
      )
      SELECT 
        AVG(user_score) as avg_score,
        COALESCE(STDDEV(user_score), 0) as score_stddev,
        COUNT(*) as total_games,
        SUM(CASE WHEN ABS(user_score - opponent_score) <= 10 THEN win ELSE 0 END) as close_wins,
        COUNT(CASE WHEN ABS(user_score - opponent_score) <= 10 THEN 1 END) as close_games
      FROM weekly_scores
    `, [leagueId, userId]);

    const data = performanceData.rows[0];
    if (!data || !data.total_games) {
      return { seasonTrend: 'stable', consistencyScore: 0.5, clutchFactor: 0.5 };
    }

    const consistencyScore = Math.max(0, 1 - (parseFloat(data.score_stddev) / parseFloat(data.avg_score)));
    const clutchFactor = data.close_games > 0 ? data.close_wins / data.close_games : 0.5;

    // Simplified trend calculation - would need more sophisticated analysis in production
    const seasonTrend = 'stable' as const;

    return {
      seasonTrend,
      consistencyScore,
      clutchFactor
    };
  }

  private async generatePhaseStrategies(
    teamAnalysis: any,
    playoffProjections: PlayoffProjection,
    leagueContext: any,
    currentWeek: number
  ): Promise<SeasonPhaseStrategy[]> {
    const phases: SeasonPhaseStrategy[] = [];

    // Early Season (Weeks 1-6)
    if (currentWeek <= 6) {
      phases.push({
        phase: 'early',
        weekRange: 'Weeks 1-6',
        primaryGoals: ['Establish roster identity', 'Monitor player health', 'Assess league competition'],
        strategicFocus: ['Lineup optimization', 'Waiver wire activity', 'Trade exploration'],
        riskTolerance: 'moderate',
        tradingRecommendations: ['Target buy-low candidates', 'Explore depth trades', 'Monitor trade values'],
        waiverPriorities: ['Handcuff RBs', 'Emerging WRs', 'Streaming defenses'],
        lineupOptimizations: ['Play proven starters', 'Stream DST matchups', 'Monitor target share']
      });
    }

    // Mid Season (Weeks 7-11)
    phases.push({
      phase: 'mid',
      weekRange: 'Weeks 7-11',
      primaryGoals: ['Secure playoff position', 'Address roster weaknesses', 'Build playoff team'],
      strategicFocus: ['Strategic trading', 'Playoff schedule planning', 'Injury management'],
      riskTolerance: teamAnalysis.standing <= 6 ? 'moderate' : 'aggressive',
      tradingRecommendations: ['Target playoff schedules', 'Consolidate talent', 'Address bye weeks'],
      waiverPriorities: ['Playoff relevant adds', 'Injury replacements', 'Stash playoff DSTs'],
      lineupOptimizations: ['Matchup-based decisions', 'Rest injured stars', 'Plan for byes']
    });

    // Late Season (Weeks 12-17)
    phases.push({
      phase: 'late',
      weekRange: 'Weeks 12-17',
      primaryGoals: ['Optimize playoff roster', 'Manage player health', 'Championship preparation'],
      strategicFocus: ['Playoff matchups', 'Health management', 'Championship lineup'],
      riskTolerance: playoffProjections.playoffProbability > 0.7 ? 'conservative' : 'aggressive',
      tradingRecommendations: ['Final roster moves', 'Target playoff performers', 'Health-based swaps'],
      waiverPriorities: ['Playoff streamers', 'Handcuffs for playoffs', 'Championship week adds'],
      lineupOptimizations: ['Rest vs performance', 'Weather considerations', 'Playoff history']
    });

    // Playoffs (Weeks 15-17)
    if (playoffProjections.playoffProbability > 0.5) {
      phases.push({
        phase: 'playoffs',
        weekRange: 'Weeks 15-17',
        primaryGoals: ['Win championship', 'Optimize weekly lineups', 'Execute game plan'],
        strategicFocus: ['Weekly matchups', 'Ceiling plays', 'Championship strategy'],
        riskTolerance: 'conservative',
        tradingRecommendations: ['No trades (past deadline)', 'Focus on waivers', 'Roster management'],
        waiverPriorities: ['Weekly streamers', 'Injury fill-ins', 'Ceiling plays'],
        lineupOptimizations: ['High ceiling plays', 'Matchup exploitation', 'Weather factors']
      });
    }

    return phases;
  }

  private async generateStrategicRecommendations(
    teamAnalysis: any,
    playoffProjections: PlayoffProjection,
    leagueContext: any,
    phaseStrategies: SeasonPhaseStrategy[]
  ): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = [];

    const prompt = `Generate 5-7 strategic recommendations for this fantasy football team:

Team Analysis:
- Standing: ${teamAnalysis.standing}/${leagueContext.totalTeams}
- Strengths: ${teamAnalysis.strengths.join(', ')}
- Weaknesses: ${teamAnalysis.weaknesses.join(', ')}
- Construction: ${teamAnalysis.construction}
- Competitive Window: ${teamAnalysis.competitiveWindow}

Playoff Projections:
- Playoff Probability: ${(playoffProjections.playoffProbability * 100).toFixed(1)}%
- Projected Record: ${playoffProjections.projectedWins.toFixed(1)}-${playoffProjections.projectedLosses.toFixed(1)}
- Championship Odds: ${(playoffProjections.championshipProbability * 100).toFixed(1)}%

Current Phase: ${phaseStrategies.find(p => p.phase === 'mid')?.phase || 'mid-season'}

Return as JSON array with format:
[{
  "type": "trade|waiver|lineup|long_term|playoff_prep",
  "priority": "high|medium|low",
  "title": "Brief title",
  "description": "Detailed description",
  "reasoning": "Why this helps",
  "expectedImpact": "What impact to expect",
  "timeline": "When to execute",
  "riskLevel": "low|medium|high",
  "targetPlayers": ["player1", "player2"] // if applicable
}]`;

    const response = await this.aiRouter.generateResponse(prompt);
    const aiRecommendations = JSON.parse(response.content);

    return aiRecommendations.map((rec: any) => ({
      type: rec.type,
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      reasoning: rec.reasoning,
      expectedImpact: rec.expectedImpact,
      timeline: rec.timeline,
      riskLevel: rec.riskLevel,
      targetPlayers: rec.targetPlayers || [],
      alternatives: rec.alternatives || []
    }));
  }

  private async generateWeeklyStrategies(
    leagueId: string,
    userId: string,
    startWeek: number,
    endWeek: number
  ): Promise<WeeklyMatchupStrategy[]> {
    const strategies: WeeklyMatchupStrategy[] = [];

    for (let week = startWeek; week <= Math.min(endWeek, 17); week++) {
      const matchupData = await db.query(`
        SELECT 
          lm.opponent_id,
          u.username as opponent_name,
          COALESCE(AVG(opponent_lm.user_score), 0) as opponent_avg_score
        FROM league_matchups lm
        JOIN users u ON lm.opponent_id = u.id
        LEFT JOIN league_matchups opponent_lm ON lm.opponent_id = opponent_lm.user_id 
          AND opponent_lm.league_id = $1
        WHERE lm.league_id = $1 AND lm.user_id = $2 AND lm.week = $3
        GROUP BY lm.opponent_id, u.username
      `, [leagueId, userId, week]);

      if (matchupData.rows.length > 0) {
        const opponent = matchupData.rows[0];
        
        const strategy: WeeklyMatchupStrategy = {
          week,
          opponent: opponent.opponent_name,
          opponentStrengths: [], // Would be populated with detailed analysis
          opponentWeaknesses: [],
          recommendedLineup: {},
          streamingTargets: [],
          sitStartAdvice: [],
          gameScript: `Week ${week} strategy vs ${opponent.opponent_name}`,
          weatherConsiderations: []
        };

        strategies.push(strategy);
      }
    }

    return strategies;
  }

  private async generateContingencyPlans(
    teamAnalysis: any,
    playoffProjections: PlayoffProjection,
    leagueContext: any
  ): Promise<Array<{
    scenario: string;
    triggers: string[];
    actions: string[];
    timeline: string;
  }>> {
    const plans = [];

    // Playoff chase scenario
    if (playoffProjections.playoffProbability < 0.8) {
      plans.push({
        scenario: 'Playoff Push',
        triggers: ['Below .500 record', 'Outside playoff spots', 'Key injuries'],
        actions: ['Aggressive waiver claims', 'Trade for win-now players', 'Start high-ceiling options'],
        timeline: 'Weeks 8-12'
      });
    }

    // Injury contingency
    plans.push({
      scenario: 'Key Player Injury',
      triggers: ['Star player injury', 'Multiple position injuries', 'Long-term IR placement'],
      actions: ['Immediate waiver claims', 'Handcuff activation', 'Trade for replacement'],
      timeline: 'Immediate'
    });

    // Championship preparation
    if (playoffProjections.playoffProbability > 0.6) {
      plans.push({
        scenario: 'Championship Run',
        triggers: ['Clinch playoff spot', 'Weeks 14+ approach', 'Healthy roster'],
        actions: ['Rest injured players', 'Target playoff schedules', 'Optimize for ceiling'],
        timeline: 'Weeks 13-17'
      });
    }

    return plans;
  }

  private async determineSeasonGoals(
    teamAnalysis: any,
    playoffProjections: PlayoffProjection,
    leagueContext: any
  ): Promise<{
    primary: string;
    secondary: string[];
    fallback: string;
  }> {
    let primary = 'Make playoffs';
    const secondary = [];
    let fallback = 'Finish above .500';

    if (playoffProjections.playoffProbability > 0.8) {
      primary = 'Win championship';
      secondary.push('Secure playoff bye', 'Finish top 2');
      fallback = 'Reach championship game';
    } else if (playoffProjections.playoffProbability > 0.5) {
      primary = 'Secure playoff spot';
      secondary.push('Avoid last-place', 'Build for next season');
      fallback = 'Finish in top half';
    } else {
      primary = 'Build competitive roster';
      secondary.push('Identify keeper candidates', 'Avoid last place');
      fallback = 'Learn league dynamics';
    }

    return { primary, secondary, fallback };
  }

  async generateQuickWeeklyStrategy(
    leagueId: string, 
    userId: string, 
    week: number
  ): Promise<{
    opponent: string;
    keyMatchups: string[];
    startSitRecommendations: string[];
    streamingTargets: string[];
    winProbability: number;
  }> {
    const matchupData = await db.query(`
      SELECT 
        u.username as opponent_name,
        COALESCE(AVG(opponent_lm.user_score), 0) as opponent_avg_score,
        COALESCE(AVG(user_lm.user_score), 0) as user_avg_score
      FROM league_matchups lm
      JOIN users u ON lm.opponent_id = u.id
      LEFT JOIN league_matchups opponent_lm ON lm.opponent_id = opponent_lm.user_id AND opponent_lm.league_id = $1
      LEFT JOIN league_matchups user_lm ON lm.user_id = user_lm.user_id AND user_lm.league_id = $1
      WHERE lm.league_id = $1 AND lm.user_id = $2 AND lm.week = $3
      GROUP BY u.username
    `, [leagueId, userId, week]);

    if (matchupData.rows.length === 0) {
      throw new Error('Matchup not found');
    }

    const opponent = matchupData.rows[0];
    const userAvg = parseFloat(opponent.user_avg_score);
    const opponentAvg = parseFloat(opponent.opponent_avg_score);
    
    const winProbability = userAvg / (userAvg + opponentAvg);

    return {
      opponent: opponent.opponent_name,
      keyMatchups: [`Your ${userAvg.toFixed(1)} avg vs ${opponent.opponent_name}'s ${opponentAvg.toFixed(1)} avg`],
      startSitRecommendations: ['Monitor injury reports', 'Check weather conditions', 'Review target share trends'],
      streamingTargets: ['Defense with favorable matchup', 'Kicker in dome game', 'Emerging handcuff'],
      winProbability: Math.max(0.1, Math.min(0.9, winProbability))
    };
  }
}

const seasonStrategyService = new SeasonStrategyService();
export default seasonStrategyService;
