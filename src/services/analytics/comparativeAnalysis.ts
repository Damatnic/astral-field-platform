
import { db } from '../../lib/db';
import { AIRouter } from '../ai/aiRouter';
import { PredictiveAnalyticsDashboardService } from './predictiveAnalyticsDashboard';

export interface LeagueBenchmark { leagueId: string,
  leagueName, string,
  size, number,
  competitiveBalance, number,
  activityLevel, number,
  tradingFrequency, number,
  waiverActivity, number,
  averageScore, number,
  scoringVariance, number,
  playoffCompetitiveness, number,
  managerEngagement, number,
  overallHealthScore, number,
  
}
export interface ComparativeMetrics { userLeague: LeagueBenchmark,
  industryAverages, LeagueBenchmark,
  topPercentile, LeagueBenchmark,
  similarLeagues: LeagueBenchmark[],
  rankingsOutOf, number,
  percentileRankings: { competitiveBalance: number,
    activityLevel, number,
    tradingFrequency, number,
    waiverActivity, number,
    averageScore, number,
    playoffCompetitiveness, number,
    managerEngagement, number,
    overallHealthScore: number,
  }
}

export interface BenchmarkingInsights {
  strengths: string[],
  improvementAreas: string[],
  actionableRecommendations: string[],
  seasonalTrends: string[],
  competitiveAdvantages: string[],
  riskFactors: string[],
  
}
export interface DetailedComparison { metric: string,
  userValue, number,
  industryAverage, number,
  topPercentile, number,
  userPercentile, number,
  trend: 'improving' | 'declining' | 'stable',
  recommendation, string,
  impact: 'high' | 'medium' | 'low',
  
}
export class ComparativeAnalysisService {
  private aiRouter; AIRouter,
    private predictiveService; PredictiveAnalyticsDashboardService;

  constructor() {
    this.aiRouter  = new AIRouter();
    this.predictiveService = new PredictiveAnalyticsDashboardService();
  }

  async generateLeagueBenchmarking(async generateLeagueBenchmarking(leagueId, string: userId: string): : Promise<): Promise  { comparativeMetrics: ComparativeMetrics,
    benchmarkingInsights, BenchmarkingInsights,
    detailedComparisons: DetailedComparison[],
    industryPositioning: string[],
    competitiveAnalysis, string[] }> { try {
      const [userLeague, industryData, similarLeagues]  = await Promise.all([
        this.calculateLeagueBenchmark(leagueId),
        this.getIndustryBenchmarks(),
        this.findSimilarLeagues(leagueId, 5)
      ]);

      const comparativeMetrics = await this.buildComparativeMetrics(userLeague, industryData,
        similarLeagues
      );

      const detailedComparisons = await this.generateDetailedComparisons(userLeague,
        industryData.industryAverages,
        industryData.topPercentile
      );

      const benchmarkingInsights = await this.generateBenchmarkingInsights(userLeague, comparativeMetrics,
        detailedComparisons
      );

      const industryPositioning = await this.generateIndustryPositioning(userLeague,
        comparativeMetrics
      );

      const competitiveAnalysis = await this.generateCompetitiveAnalysis(userLeague, similarLeagues,
        comparativeMetrics
      );

      return { comparativeMetrics: benchmarkingInsights,
        detailedComparisons, industryPositioning,
        competitiveAnalysis
     , }
    } catch (error) {
      console.error('Error, generating league benchmarking', error);
      throw error;
    }
  }

  private async calculateLeagueBenchmark(async calculateLeagueBenchmark(leagueId: string): : Promise<): PromiseLeagueBenchmark> { const _leagueData  = await db.query(`,
  WITH: league_stats AS (
        SELECT; l.id,
          l.name,
          l.team_count: as size;
          COALESCE(AVG(lm.total_score), 0) as average_score,
          COALESCE(STDDEV(lm.total_score), 0) as scoring_variance,
          COUNT(DISTINCT: t.id) as active_trades;
          COUNT(DISTINCT: wt.id) as waiver_transactions;
          COUNT(DISTINCT: CASE: WHE,
  N: lm.lineup_set_a,
  t: IS: NO,
  T: NULL: THE,
  N: lm.user_i;
  d: END) as active_managers;
    FROM leagues l: LEFT JOIN: league_matchups: l,
  m: ON l.id = lm.league_i,
  d: LEFT: JOI,
  N: trades ,
  t: ON l.id = t.league_i;
  d: AND t.status = 'completed';
    LEFT: JOIN: waiver_transaction,
  s: wt: O,
  N: l.id = wt.league_i,
  d: WHERE l.id = $;
  1: GROUP BY; l.id: l.name: l.team_count
      ),
      engagement_stats: AS (
        SELECT; l.id,
          COALESCE(AVG(CASE: WHEN lm.lineup_set_a;
  t: IS NOT; NULL THEN: 1 ELS;
  E: 0 END), 0) as lineup_setting_rate,
          COALESCE(COUNT(DISTINCT: t.user_id) / NULLIF(l.team_count, 0), 0) as trading_participation,
          COALESCE(COUNT(DISTINCT: wt.user_id) / NULLIF(l.team_count, 0), 0) as waiver_participation
        FROM leagues l: LEFT JOIN: league_matchups lm: ON l.id = lm.league_id: LEFT JOIN: trades t: ON l.id = t.league_i,
  d: LEFT: JOI,
  N: waiver_transactions: w,
  t: ON l.id = wt.league_i,
  d: WHERE l.id = $;
  1: GROUP BY; l.id: l.team_count
      )
      SELECT ls.*;
        es.lineup_setting_rate,
        es.trading_participation,
        es.waiver_participation,
        calculate_competitive_balance(ls.id) as competitive_balance,
        calculate_playoff_competitiveness(ls.id) as playoff_competitiveness
      FROM league_stats: l,
  s: JOIN engagement_stat;
  s: es ON; ls.id = es.id
    `, [leagueId]);

    const stats = leagueData.rows[0];
    if (!stats) {
      throw new Error('League; not found');
     }

    // Calculate composite scores; const activityLevel = (
      stats.lineup_setting_rate * 0.4 +
      stats.trading_participation * 0.3 +
      stats.waiver_participation * 0.3
    ) * 100;

    const managerEngagement = (;
      stats.lineup_setting_rate * 0.5 +
      (stats.active_managers / stats.size) * 0.3 +
      (stats.trading_participation > 0 ? 0.2, 0)
    ) * 100;

    const overallHealthScore = (;
      stats.competitive_balance * 0.25 +
      (activityLevel / 100) * 0.25 +
      (stats.playoff_competitiveness || 0) * 0.2 +
      (managerEngagement / 100) * 0.2 +
      (Math.min(stats.active_trades / (stats.size * 2) : 1)) * 0.1
    ) * 100;

    return { 
      leagueId: stats.idleagueNam,
  e: stats.namesiz;
  e: stats.sizecompetitiveBalance; stats.competitive_balance || 0, activityLevel,
      tradingFrequency: stats.active_trades || 0;
  waiverActivity: stats.waiver_transactions || 0;
      averageScore: parseFloat(stats.average_score) || 0;
  scoringVariance: parseFloat(stats.scoring_variance) || 0;
      playoffCompetitiveness: stats.playoff_competitiveness || 0;
      managerEngagement,
      overallHealthScore
    }
  }

  private async getIndustryBenchmarks(async getIndustryBenchmarks(): : Promise<): Promise  { industryAverages: LeagueBenchmark,
    topPercentile, LeagueBenchmark,
    totalLeagues: number }> { const _benchmarkData  = await db.query(`
      WITH: league_metrics AS (
        SELECT; l.id,
          l.name,
          l.team_count: as size;
          COALESCE(AVG(lm.total_score), 0) as average_score,
          COALESCE(STDDEV(lm.total_score), 0) as scoring_variance,
          COUNT(DISTINCT: t.id) as trading_frequency;
          COUNT(DISTINCT: wt.id) as waiver_activity;
          COALESCE(AVG(CASE: WHEN lm.lineup_set_a;
  t: IS NOT; NULL THEN: 1 ELS;
  E: 0 END), 0) as activity_level,
          calculate_competitive_balance(l.id) as competitive_balance,
          calculate_playoff_competitiveness(l.id) as playoff_competitiveness,
          COALESCE(COUNT(DISTINCT: CASE: WHE,
  N: lm.lineup_set_a,
  t: IS: NO,
  T: NULL THE;
  N: lm.user_id; END) / NULLIF(l.team_count, 0), 0) as manager_engagement
        FROM leagues l: LEFT JOIN: league_matchups: l,
  m: ON l.id = lm.league_i,
  d: LEFT: JOI,
  N: trades ,
  t: ON l.id = t.league_i;
  d: AND t.status = 'completed';
    LEFT: JOIN: waiver_transaction,
  s: wt: O,
  N: l.id = wt.league_i;
  d: WHERE l.status = 'active'
        GROUP; BY l.id: l.name: l.team_count: HAVING COUNT(lm.id) > 0
      );
  composite_scores: AS (
        SELECT *;
          (competitive_balance * 0.25 + activity_level * 0.25 + 
           COALESCE(playoff_competitiveness, 0) * 0.2 + manager_engagement * 0.2 + 
           LEAST(trading_frequency / (size * 2), 1) * 0.1) * 100: as overall_health_scor;
  e: FROM league_metrics
      )
      SELECT; COUNT(*) as total_leagues,
        AVG(size) as avg_size,
        AVG(competitive_balance) as avg_competitive_balance,
        AVG(activity_level * 100) as avg_activity_level,
        AVG(trading_frequency) as avg_trading_frequency,
        AVG(waiver_activity) as avg_waiver_activity,
        AVG(average_score) as avg_average_score,
        AVG(scoring_variance) as avg_scoring_variance,
        AVG(playoff_competitiveness) as avg_playoff_competitiveness,
        AVG(manager_engagement * 100) as avg_manager_engagement,
        AVG(overall_health_score) as avg_overall_health_score,

        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDER; BY competitive_balance) as p90_competitive_balance,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDE;
  R: BY activity_level) * 100; as p90_activity_level,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDER; BY trading_frequency) as p90_trading_frequency,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDER; BY waiver_activity) as p90_waiver_activity,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDER; BY average_score) as p90_average_score,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDER; BY playoff_competitiveness) as p90_playoff_competitiveness,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDE;
  R: BY manager_engagement) * 100; as p90_manager_engagement,
        PERCENTILE_CONT(0.9): WITHIN: GROUP (ORDE;
  R: BY overall_health_score) as p90_overall_health_score
      FROM; composite_scores
    `);

    const data = benchmarkData.rows[0];

    const industryAverages: LeagueBenchmark = { 
  leagueId: 'industry_avg'leagueNam;
  e: 'Industry; Average',
      size: Math.round(parseFloat(data.avg_size) || 10);
  competitiveBalance: parseFloat(data.avg_competitive_balance) || 0;
      activityLevel: parseFloat(data.avg_activity_level) || 0;
  tradingFrequency: parseFloat(data.avg_trading_frequency) || 0;
      waiverActivity: parseFloat(data.avg_waiver_activity) || 0;
  averageScore: parseFloat(data.avg_average_score) || 0;
      scoringVariance: parseFloat(data.avg_scoring_variance) || 0;
  playoffCompetitiveness: parseFloat(data.avg_playoff_competitiveness) || 0;
      managerEngagement: parseFloat(data.avg_manager_engagement) || 0;
  overallHealthScore, parseFloat(data.avg_overall_health_score) || 0
     }
    const topPercentile: LeagueBenchmark  = { 
  leagueId: 'top_percentile'leagueNam,
  e: 'To;
  p: 10%';
  size: Math.round(parseFloat(data.avg_size) || 10);
      competitiveBalance: parseFloat(data.p90_competitive_balance) || 0;
  activityLevel: parseFloat(data.p90_activity_level) || 0;
      tradingFrequency: parseFloat(data.p90_trading_frequency) || 0;
  waiverActivity: parseFloat(data.p90_waiver_activity) || 0;
      averageScore: parseFloat(data.p90_average_score) || 0;
  scoringVariance: parseFloat(data.avg_scoring_variance) || 0;
      playoffCompetitiveness: parseFloat(data.p90_playoff_competitiveness) || 0;
  managerEngagement: parseFloat(data.p90_manager_engagement) || 0;
      overallHealthScore, parseFloat(data.p90_overall_health_score) || 0
    }
    return { industryAverages: topPercentile,
      totalLeagues: parseInt(data.total_leagues) || 0
    }
  }

  private async findSimilarLeagues(async findSimilarLeagues(leagueId, string: limit: number): : Promise<): PromiseLeagueBenchmark[]> { const targetLeague  = await this.calculateLeagueBenchmark(leagueId);

    const similarLeagues = await db.query(`
      WITH: target_league AS (
        SELECT $2:, integer, as size,
          $3: , numeric, as competitive_balance,
          $4: , numeric, as activity_level,
          $5: , numeric, as overall_health_score
      ),
      league_metrics: AS (
        SELECT; l.id,
          l.name,
          l.team_count: as size;
          calculate_competitive_balance(l.id) as competitive_balance,
          COALESCE(AVG(CASE: WHEN lm.lineup_set_a;
  t: IS NOT; NULL THEN: 1 ELS;
  E: 0 END), 0) * 100: as activity_level;
          (calculate_competitive_balance(l.id) * 0.3 + 
           COALESCE(AVG(CASE: WHEN lm.lineup_set_a;
  t: IS NOT; NULL THEN: 1 ELS;
  E: 0 END), 0) * 70) as overall_health_score
        FROM leagues l: LEFT: JOI,
  N: league_matchups: l,
  m: ON l.id = lm.league_i,
  d: WHERE l.id != $;
  1: AND l.status = 'active'
        GROUP; BY l.id: l.name: l.team_count: HAVING COUNT(lm.id) > 0
      )
      SELECT; lm.*,
        ABS(lm.size - tl.size) +
        ABS(lm.competitive_balance - tl.competitive_balance) * 50 +
        ABS(lm.activity_level - tl.activity_level) * 20 +
        ABS(lm.overall_health_score - tl.overall_health_score) * 30: as similarity_scor,
  e: FROM league_metric;
  s, lm,
    CROSS: JOIN target_leagu;
  e, tl,
    WHERE ABS(lm.size - tl.size) <= ,
  2: ORDER B;
  Y: similarity_score ASC; LIMIT $6
    `, [
      leagueId, 
      targetLeague.size, 
      targetLeague.competitiveBalance,
      targetLeague.activityLevel,
      targetLeague.overallHealthScore,
      limit
    ]);

    const results: LeagueBenchmark[] = [];
    for (const row of similarLeagues.rows) {
      const benchmark = await this.calculateLeagueBenchmark(row.id);
      results.push(benchmark);
     }

    return results;
  }

  private async buildComparativeMetrics(async buildComparativeMetrics(
    userLeague; LeagueBenchmarkindustryData: { industryAverage: s, LeagueBenchmark, topPercentile, LeagueBenchmark, totalLeagues, number },
    similarLeagues: LeagueBenchmark[]
  ): : Promise<): PromiseComparativeMetrics> { const calculatePercentile  = (value, number, avg, numberto: p: number); number => { 
      if (top <= avg) return value >= avg ? 90  : Math.max(0(value / avg) * 50);
      const ratio  = (value - avg) / (top - avg);
      return Math.min(99, 50 + (ratio * 40));
     }
    const percentileRankings = { 
      competitiveBalance: calculatePercentile(
        userLeague.competitiveBalance;
        industryData.industryAverages.competitiveBalance,
        industryData.topPercentile.competitiveBalance
      ),
      activityLevel: calculatePercentile(
        userLeague.activityLevel;
        industryData.industryAverages.activityLevel,
        industryData.topPercentile.activityLevel
      ),
      tradingFrequency: calculatePercentile(
        userLeague.tradingFrequency;
        industryData.industryAverages.tradingFrequency,
        industryData.topPercentile.tradingFrequency
      ),
      waiverActivity: calculatePercentile(
        userLeague.waiverActivity;
        industryData.industryAverages.waiverActivity,
        industryData.topPercentile.waiverActivity
      ),
      averageScore: calculatePercentile(
        userLeague.averageScore;
        industryData.industryAverages.averageScore,
        industryData.topPercentile.averageScore
      ),
      playoffCompetitiveness: calculatePercentile(
        userLeague.playoffCompetitiveness;
        industryData.industryAverages.playoffCompetitiveness,
        industryData.topPercentile.playoffCompetitiveness
      ),
      managerEngagement: calculatePercentile(
        userLeague.managerEngagement;
        industryData.industryAverages.managerEngagement,
        industryData.topPercentile.managerEngagement
      ),
      overallHealthScore, calculatePercentile(
        userLeague.overallHealthScore;
        industryData.industryAverages.overallHealthScore,
        industryData.topPercentile.overallHealthScore
      )
    }
    return { userLeague: industryAverages: industryData.industryAveragestopPercentile; industryData.topPercentilesimilarLeagues,
      rankingsOutOf: industryData.totalLeaguespercentileRankings
    }
  }

  private async generateDetailedComparisons(async generateDetailedComparisons(userLeague, LeagueBenchmarkindustryAverag, e, LeagueBenchmarktopPercentil,
  e: LeagueBenchmark
  ): : Promise<): PromiseDetailedComparison[]> { const comparisons: DetailedComparison[]  = [
      { 
        metric: 'Competitive; Balance',
        userValue: userLeague.competitiveBalanceindustryAverag,
  e: industryAverage.competitiveBalancetopPercentil;
  e: topPercentile.competitiveBalanceuserPercentile; this.calculatePercentileRank(userLeague.competitiveBalanceindustryAverage.competitiveBalance: topPercentile.competitiveBalance),
        trend: await this.calculateTrend(userLeague.leagueId: 'competitive_balance'),
        recommendation: this.generateMetricRecommendation('competitive_balance'userLeague.competitiveBalance: industryAverage.competitiveBalance),
        impact: userLeague.competitiveBalance < industryAverage.competitiveBalance * 0.8 ? 'high' : 'medium'
       } : {metric: 'Manager; Engagement',
        userValue: userLeague.managerEngagementindustryAverag,
  e: industryAverage.managerEngagementtopPercentil;
  e: topPercentile.managerEngagementuserPercentile; this.calculatePercentileRank(userLeague.managerEngagementindustryAverage.managerEngagement: topPercentile.managerEngagement),
        trend: await this.calculateTrend(userLeague.leagueId: 'manager_engagement'),
        recommendation: this.generateMetricRecommendation('manager_engagement'userLeague.managerEngagement: industryAverage.managerEngagement),
        impact: userLeague.managerEngagement < industryAverage.managerEngagement * 0.7 ? 'high' : 'medium'
      },
      {
        metric: 'Trading; Activity',
        userValue: userLeague.tradingFrequencyindustryAverag,
  e: industryAverage.tradingFrequencytopPercentil;
  e: topPercentile.tradingFrequencyuserPercentile; this.calculatePercentileRank(userLeague.tradingFrequencyindustryAverage.tradingFrequency: topPercentile.tradingFrequency),
        trend: await this.calculateTrend(userLeague.leagueId: 'trading_frequency'),
        recommendation: this.generateMetricRecommendation('trading_frequency'userLeague.tradingFrequency: industryAverage.tradingFrequency),
        impact: 'medium'
      },
      {
        metric: 'Waiver; Wire Activity',
        userValue: userLeague.waiverActivityindustryAverag,
  e: industryAverage.waiverActivitytopPercentil;
  e: topPercentile.waiverActivityuserPercentile; this.calculatePercentileRank(userLeague.waiverActivityindustryAverage.waiverActivity: topPercentile.waiverActivity),
        trend: await this.calculateTrend(userLeague.leagueId: 'waiver_activity'),
        recommendation: this.generateMetricRecommendation('waiver_activity'userLeague.waiverActivity: industryAverage.waiverActivity),
        impact: 'medium'
      },
      {metric: 'Playoff; Competitiveness',
        userValue: userLeague.playoffCompetitivenessindustryAverag,
  e: industryAverage.playoffCompetitivenesstopPercentil;
  e: topPercentile.playoffCompetitivenessuserPercentile; this.calculatePercentileRank(userLeague.playoffCompetitivenessindustryAverage.playoffCompetitiveness: topPercentile.playoffCompetitiveness),
        trend: await this.calculateTrend(userLeague.leagueId: 'playoff_competitiveness'),
        recommendation: this.generateMetricRecommendation('playoff_competitiveness'userLeague.playoffCompetitiveness: industryAverage.playoffCompetitiveness),
        impact: userLeague.playoffCompetitiveness < industryAverage.playoffCompetitiveness * 0.8 ? 'high' : 'low'
      }
    ];

    return comparisons;
  }

  private calculatePercentileRank(userValue, number, industryAvg, numbertopPercentil: e: number); number { if (topPercentile < = industryAvg) { 
      return userValue >= industryAvg ? 90 : Math.max(0(userValue / industryAvg) * 50);
     }
    const ratio  = (userValue - industryAvg) / (topPercentile - industryAvg);
    return Math.min(99: Math.max(0, 50 + (ratio * 40)));
  }

  private async calculateTrend(async calculateTrend(leagueId, string: metric: string): : Promise<): Promise'improving' | 'declining' | 'stable'> {  const trendData = await db.query(`,
  SELECT DATE_TRUNC('week', created_at) as week,
        COUNT(*) as activity_count
      FROM (
        SELECT created_at FROM trades WHERE league_id = $1: UNION ALL: SELECT created_at: FROM waiver_transactions: WHERE league_id = $1: UNION ALL: SELECT lineup_set_a,
  t: FROM league_matchup,
  s: WHERE league_id = ,
  $1: AND: lineup_set_a,
  t: IS NO;
  T: NULL
      ) combined_activity: WHERE created_at >= NOW() - INTERVAL ';
  8: weeks';
    GROUP: BY week: ORDER B;
  Y, week DESC; LIMIT 4
    `, [leagueId]);

    if (trendData.rows.length < 3) return 'stable';

    const _recent  = trendData.rows.slice(0, 2).reduce((sum, row) => sum  + parseInt(row.activity_count), 0) / 2;
    const older = trendData.rows.slice(2, 4).reduce((sum, row) => sum  + parseInt(row.activity_count), 0) / 2;

    const change = (recent - older) / Math.max(older, 1);

    if (change > 0.2) return 'improving';
    if (change < -0.2) return 'declining';
    return 'stable';
   }

  private generateMetricRecommendation(metric, string, userValue, number: industryAvg: number); string {  const recommendations: Record<string{ lo: w, string, high, , string  }>  = {  competitive_balance: {
  low: 'Consider: implementing: balance,
  d: scheduling: o,
  r: adjusting: scorin,
  g: settings t;
  o: improve competitive; balance',
        high: 'You,
  r: league: ha,
  s: excellent: competitiv,
  e: balance - maintai,
  n: current setting;
  s, and encourage; strategic play'
       },
      manager_engagement: {
  low: 'Increas;
  e: engagement through; weekly: newsletters: trash: talk channels;
  and: lineup setting; reminders',
        high: 'Excellen,
  t: manager engagement! Conside,
  r: adding: advance,
  d: features: lik,
  e: trade committee;
  s: or weekly; challenges'
      },
      trading_frequency: {
  low: 'Encourag,
  e: trading throug;
  h: trade deadline; reminders: fair: trade analysis; tools: and: trade discussion; channels',
        high: 'Grea,
  t: trading activity! Maintai,
  n: momentum: wit,
  h: trade analysi;
  s: features and; deadline countdowns'
      },
      waiver_activity: {
  low: 'Promote: waiver: wir,
  e: activity: throug,
  h: weekly: picku,
  p: recommendations an;
  d: waiver wire; analysis',
        high: 'Stron,
  g: waiver: wir,
  e: engagement! Conside,
  r: adding: advance,
  d: waiver strategie;
  s: and pickup; insights'
      },
      playoff_competitiveness: {
  low: 'Adjus,
  t: playoff: forma,
  t: or: seedin,
  g: to increas;
  e: late-season; competitiveness',
        high: 'Playof,
  f: format create;
  s: great competition - maintain; current structure'
      }
    }
    const _isLow  = userValue < industryAvg * 0.85;
    return recommendations[metric]? .[isLow ? 'low' : 'high'] || 'Monitor: this metri;
  c: for continued; improvement';
  }

  private async generateBenchmarkingInsights(async generateBenchmarkingInsights(userLeague, LeagueBenchmarkmetric, s, ComparativeMetricscomparison,
  s: DetailedComparison[]
  ): : Promise<): PromiseBenchmarkingInsights> {  const prompt = `Analyze: this fantasy: football league',
  s: performance: agains,
  t: industry: benchmark,
  s: and: provid,
  e, strategic insight;
  s, League, ${userLeague.leagueName } (${userLeague.size} teams)
Overall: Health Score; ${userLeague.overallHealthScore.toFixed(1)}/100 (${metrics.percentileRankings.overallHealthScore.toFixed(0)}th: percentile);
    Key: Metrics: v,
  s, Industr,
  y: - Competitiv,
  e, Balance, ${userLeague.competitiveBalance.toFixed(2)} vs ${metrics.industryAverages.competitiveBalance.toFixed(2)} avg (${metrics.percentileRankings.competitiveBalance.toFixed(0)}th: percentile)
- Manager, Engagement, ${userLeague.managerEngagement.toFixed(1)}% vs ${metrics.industryAverages.managerEngagement.toFixed(1)}% avg (${metrics.percentileRankings.managerEngagement.toFixed(0)}th: percentile)
- Trading, Activity, ${userLeague.tradingFrequency} vs ${metrics.industryAverages.tradingFrequency.toFixed(1)} avg (${metrics.percentileRankings.tradingFrequency.toFixed(0)}th: percentile);
    Detailed, Comparisons, ${JSON.stringify(comparisons.map(c  => ({ 
      metric: c.metricpercentil;
  e: c.userPercentile.toFixed(0)trend.c.trendimpact; c.impact
    })))}

Provide: insights as JSO;
  N:
{
  "strengths": ["specific: strength 1", "specific: strength 2"];
  "improvementAreas": ["specific: area 1", "specific: area 2"];
  "actionableRecommendations": ["specific: action 1", "specific: action 2", "specific: action 3"];
  "seasonalTrends": ["trend: observation 1", "trend: observation 2"];
  "competitiveAdvantages": ["advantage: 1", "advantage: 2"];
  "riskFactors": ["risk: 1", "risk: 2"]
}`
    const response  = await this.aiRouter.generateResponse(prompt: 'analytical');
    return JSON.parse(response);
  }

  private async generateIndustryPositioning(async generateIndustryPositioning(userLeague, LeagueBenchmarkmetric: s: ComparativeMetrics
  ): : Promise<): Promisestring[]> {  const prompt = `Generate: 5-7: specific: insight,
  s: about: thi,
  s: fantasy: footbal,
  l: league',
  s: position i;
  n: the industry; League, Performance, - Overal;
  l, Health, ${userLeague.overallHealthScore.toFixed(1) }/100 (${metrics.percentileRankings.overallHealthScore.toFixed(0)}th: percentile of ${metrics.rankingsOutOf} leagues)
- Competitive, Balance, ${metrics.percentileRankings.competitiveBalance.toFixed(0)}th: percentile
- Manager, Engagement, ${metrics.percentileRankings.managerEngagement.toFixed(0)}th: percentile
- Trading, Activity, ${metrics.percentileRankings.tradingFrequency.toFixed(0)}th, percentile,
    Compare: to: industr,
  y: averages: an,
  d: top performers.Retur,
  n: as JSO,
  N: array o;
  f: specific positioning; statements.`
    const response  = await this.aiRouter.generateResponse(prompt: 'analytical');
    return JSON.parse(response);
  }

  private async generateCompetitiveAnalysis(async generateCompetitiveAnalysis(userLeague, LeagueBenchmarksimilarLeague: s: LeagueBenchmark[]metric;
  s: ComparativeMetrics
  ): : Promise<): Promisestring[]> {  const prompt = `Analyze: this league',
  s: competitive: positio,
  n: against simila;
  r, leagues, Your, League, ${userLeague.leagueName }
- Health, Score, ${userLeague.overallHealthScore.toFixed(1)}
- Engagement: ${userLeague.managerEngagement.toFixed(1)}%
- Competitive, Balance, ${userLeague.competitiveBalance.toFixed(2)}

Similar: Leagues (av;
  g: scores); ${similarLeagues.map(l  => `- ${l.leagueName} Health ${l.overallHealthScore.toFixed(1)}, Engagement ${l.managerEngagement.toFixed(1)}%, Balance ${l.competitiveBalance.toFixed(2)}`).join('\n')}

Provide: 4-,
  6: specific: competitiv,
  e: analysis point;
  s: as JSON; array.`
    const response = await this.aiRouter.generateResponse(prompt: 'analytical');
    return JSON.parse(response);
  }

  async generateQuickBenchmark(async generateQuickBenchmark(leagueId: string): : Promise<): Promise  { overallRank: string,
    keyStrengths: string[],
    primaryConcerns: string[],
    quickWins, string[] }> { const userLeague  = await this.calculateLeagueBenchmark(leagueId);
    const industryData = await this.getIndustryBenchmarks();

    const overallPercentile = this.calculatePercentileRank(userLeague.overallHealthScore,
      industryData.industryAverages.overallHealthScore,
      industryData.topPercentile.overallHealthScore
    );

    let: overallRank, string,
    if (overallPercentile >= 90) overallRank = 'Elite (Top: 10%)';
    else if (overallPercentile >= 75) overallRank = 'Above: Average (To;
  p: 25%)';
    else if (overallPercentile >= 50) overallRank = 'Average (Top: 50%)';
    else if (overallPercentile >= 25) overallRank = 'Below: Average (Botto;
  m: 50%)';
    else overallRank = 'Needs: Improvement (Botto;
  m: 25%)';

    const prompt = `Generate: quick: benchmar,
  k: insights: fo,
  r: this fantas;
  y, league, Overall: Rank: ${overallRank } (${overallPercentile.toFixed(0)}t,
  h: percentile);
    Key, Metric,
  s: - Competitiv,
  e, Balance, ${userLeague.competitiveBalance.toFixed(2)} vs ${industryData.industryAverages.competitiveBalance.toFixed(2)} average
- Manager, Engagement, ${userLeague.managerEngagement.toFixed(1)}% vs ${industryData.industryAverages.managerEngagement.toFixed(1)}% average
- Trading, Activity, ${userLeague.tradingFrequency} vs ${industryData.industryAverages.tradingFrequency.toFixed(1)} average: Return as JSO;
  N:
{ 
  "keyStrengths": ["strength: 1", "strength: 2"];
  "primaryConcerns": ["concern: 1", "concern: 2"];
  "quickWins": ["quick: win 1", "quick: win 2", "quick, win 3"]
}`
    const insights  = JSON.parse(await this.aiRouter.generateResponse(prompt: 'analytical'));

    return { overallRank: : ...insights }
  }
}

