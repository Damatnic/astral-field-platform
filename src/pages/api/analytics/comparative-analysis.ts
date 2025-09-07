import type { NextApiRequest, NextApiResponse } from 'next';
import { database } from '@/lib/database';
import { withRateLimit } from '@/lib/rate-limiter';

type LeagueBenchmark = {
  leagueId: string;
  leagueName: string;
  size: number;
  competitiveBalance: number; // 0-1
  activityLevel: number; // 0-100
  tradingFrequency: number; // trades per season
  waiverActivity: number; // transactions per season
  averageScore: number;
  scoringVariance: number;
  playoffCompetitiveness: number; // 0-1
  managerEngagement: number; // 0-100
  overallHealthScore: number; // 0-100
};

async function comparativeAnalysisHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leagueId = (req.method === 'GET' ? req.query.leagueId : req.body?.leagueId) as string | undefined;

  try {
    let usedSql = false;
    let userLeague: LeagueBenchmark | null = null;
    if (leagueId && (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL)) {
      try {
        // Size
        const sizeRes = await database.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM teams WHERE league_id = $1`,
          [leagueId]
        );
        const size = Number(sizeRes.rows?.[0]?.count ?? 0);

        // Latest week
        const latestWeekRes = await database.query<{ week: number }>(
          `SELECT MAX(le.week) AS week
           FROM lineup_entries le
           JOIN teams t ON le.team_id = t.id
           WHERE t.league_id = $1`,
          [leagueId]
        );
        const latestWeek = latestWeekRes.rows?.[0]?.week ?? null;

        // Average score and variance
        const avgRes = await database.query<{ avg: string | number; std: string | number }>(
          `SELECT AVG(le.points_scored) AS avg, STDDEV(le.points_scored) AS std
           FROM lineup_entries le
           JOIN teams t ON le.team_id = t.id
           WHERE t.league_id = $1 AND le.points_scored IS NOT NULL`,
          [leagueId]
        );
        const avgVal = avgRes.rows?.[0]?.avg as any;
        const stdVal = avgRes.rows?.[0]?.std as any;
        const averageScore = avgVal ? Number(avgVal) : 0;
        const scoringVariance = stdVal ? Number(stdVal) : 0;

        // Waiver activity count
        const waiversRes = await database.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count
           FROM waiver_claims w
           JOIN teams t ON w.team_id = t.id
           WHERE t.league_id = $1 AND w.status = 'processed'`,
          [leagueId]
        );
        const waiverActivity = Number(waiversRes.rows?.[0]?.count ?? 0);

        // Trading frequency (accepted/processed)
        const tradesRes = await database.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count
           FROM trades tr
           JOIN teams tp ON tr.proposing_team_id = tp.id
           WHERE tp.league_id = $1 AND tr.status IN ('accepted','processed','completed')`,
          [leagueId]
        );
        const tradingFrequency = Number(tradesRes.rows?.[0]?.count ?? 0);

        // Engagement metrics (lineup setting rate in latest week)
        let lineupSettingRate = 0;
        if (size > 0 && latestWeek !== null) {
          const lineupSetRes = await database.query<{ teams_set: number }>(
            `SELECT COUNT(DISTINCT le.team_id)::int AS teams_set
             FROM lineup_entries le
             JOIN teams t ON le.team_id = t.id
             WHERE t.league_id = $1 AND le.week = $2`,
            [leagueId, latestWeek]
          );
          const teamsSet = Number(lineupSetRes.rows?.[0]?.teams_set ?? 0);
          lineupSettingRate = teamsSet / size;
        }

        // Waiver/trade participation rates
        let tradingParticipation = 0;
        let waiverParticipation = 0;
        if (size > 0) {
          const tradePartRes = await database.query<{ participants: number }>(
            `WITH participants AS (
               SELECT proposing_team_id AS team_id FROM trades tr
                 JOIN teams tp ON tr.proposing_team_id = tp.id
                 WHERE tp.league_id = $1 AND tr.status IN ('accepted','processed','completed')
               UNION
               SELECT receiving_team_id AS team_id FROM trades tr
                 JOIN teams trt ON tr.receiving_team_id = trt.id
                 WHERE trt.league_id = $1 AND tr.status IN ('accepted','processed','completed')
             )
             SELECT COUNT(DISTINCT team_id)::int AS participants FROM participants`,
            [leagueId]
          );
          tradingParticipation = Math.min(1, Number(tradePartRes.rows?.[0]?.participants ?? 0) / size);

          const waiverPartRes = await database.query<{ participants: number }>(
            `SELECT COUNT(DISTINCT w.team_id)::int AS participants
             FROM waiver_claims w
             JOIN teams t ON w.team_id = t.id
             WHERE t.league_id = $1 AND w.status = 'processed'`,
            [leagueId]
          );
          waiverParticipation = Math.min(1, Number(waiverPartRes.rows?.[0]?.participants ?? 0) / size);
        }

        // Derived composite scores
        const activityLevel = (lineupSettingRate * 0.4 + tradingParticipation * 0.3 + waiverParticipation * 0.3) * 100;
        const managerEngagement = (lineupSettingRate * 0.6 + (tradingParticipation > 0 ? 0.2 : 0) + (waiverParticipation > 0 ? 0.2 : 0)) * 100;
        const competitiveBalance = 1 - Math.max(0, Math.min(1, scoringVariance / 25)); // normalize stddev to 0..1
        const playoffCompetitiveness = Math.max(0, Math.min(1, (competitiveBalance * 0.6 + (activityLevel / 100) * 0.4)));
        const overallHealthScore = (
          competitiveBalance * 0.25 + (activityLevel / 100) * 0.25 + playoffCompetitiveness * 0.2 + (managerEngagement / 100) * 0.2 + Math.min(tradingFrequency / (size || 1), 0.1)
        ) * 100;

        userLeague = {
          leagueId,
          leagueName: 'Your League',
          size,
          competitiveBalance: Number(competitiveBalance.toFixed(2)),
          activityLevel: Math.round(activityLevel),
          tradingFrequency,
          waiverActivity,
          averageScore: Number(averageScore.toFixed(1)),
          scoringVariance: Number(scoringVariance.toFixed(1)),
          playoffCompetitiveness: Number(playoffCompetitiveness.toFixed(2)),
          managerEngagement: Math.round(managerEngagement),
          overallHealthScore: Math.round(overallHealthScore),
        };
        usedSql = true;
      } catch (e) {
        console.warn('comparative-analysis SQL failed; using fallback:', (e as Error).message);
      }
    }

    if (!userLeague) {
      // Fallback mock
      userLeague = {
        leagueId: leagueId || 'unknown',
        leagueName: 'Your League',
        size: 12,
        competitiveBalance: 0.72,
        activityLevel: 68,
        tradingFrequency: 24,
        waiverActivity: 180,
        averageScore: 112.3,
        scoringVariance: 18.7,
        playoffCompetitiveness: 0.62,
        managerEngagement: 74,
        overallHealthScore: 76,
      };
    }

    const industryAverages: LeagueBenchmark = {
      leagueId: 'industry_avg',
      leagueName: 'Industry Avg',
      size: 12,
      competitiveBalance: 0.65,
      activityLevel: 55,
      tradingFrequency: 15,
      waiverActivity: 120,
      averageScore: 108.1,
      scoringVariance: 20.3,
      playoffCompetitiveness: 0.55,
      managerEngagement: 60,
      overallHealthScore: 64,
    };

    const topPercentile: LeagueBenchmark = {
      leagueId: 'top_10pct',
      leagueName: 'Top 10%',
      size: 12,
      competitiveBalance: 0.8,
      activityLevel: 85,
      tradingFrequency: 40,
      waiverActivity: 260,
      averageScore: 118.5,
      scoringVariance: 16.2,
      playoffCompetitiveness: 0.75,
      managerEngagement: 88,
      overallHealthScore: 88,
    };

    const similarLeagues: LeagueBenchmark[] = [
      { ...userLeague, leagueId: 'sim_1', leagueName: 'Similar A', activityLevel: Math.max(0, userLeague.activityLevel - 4) },
      { ...userLeague, leagueId: 'sim_2', leagueName: 'Similar B', activityLevel: Math.max(0, userLeague.activityLevel - 10) },
      { ...userLeague, leagueId: 'sim_3', leagueName: 'Similar C', activityLevel: Math.min(100, userLeague.activityLevel + 4) },
    ];

    const percentile = (value: number, min: number, max: number) => {
      if (max === min) return 50;
      const clamped = Math.max(min, Math.min(max, value));
      return Math.round(((clamped - min) / (max - min)) * 100);
    };

    const comparativeMetrics = {
      userLeague,
      industryAverages,
      topPercentile,
      similarLeagues,
      rankingsOutOf: 100,
      percentileRankings: {
        competitiveBalance: percentile(userLeague.competitiveBalance, 0.4, 0.85),
        activityLevel: percentile(userLeague.activityLevel, 30, 90),
        tradingFrequency: percentile(userLeague.tradingFrequency, 5, 50),
        waiverActivity: percentile(userLeague.waiverActivity, 50, 300),
        averageScore: percentile(userLeague.averageScore, 90, 125),
        playoffCompetitiveness: percentile(userLeague.playoffCompetitiveness, 0.3, 0.8),
        managerEngagement: percentile(userLeague.managerEngagement, 30, 95),
        overallHealthScore: percentile(userLeague.overallHealthScore, 40, 95),
      },
    };

    const strengths = [
      'Above-average activity level',
      'Healthy competitive balance',
      'Efficient waiver churn',
    ];
    const improvementAreas = [
      'Increase trading participation',
      'Reduce scoring variance with deeper benches',
    ];
    const actionableRecommendations = [
      'Encourage trade blocks and weekly discussion threads',
      'Introduce FAB bidding insights to improve waiver efficiency',
    ];
    const seasonalTrends = ['Gradual increase in average score post-week 4'];
    const competitiveAdvantages = ['Active managers maintain roster freshness'];
    const riskFactors = ['Injury clusters elevating variance'];

    const benchmarkingInsights = {
      strengths,
      improvementAreas,
      actionableRecommendations,
      seasonalTrends,
      competitiveAdvantages,
      riskFactors,
    };

    const detailedComparisons = [
      {
        metric: 'Activity Level',
        userValue: userLeague.activityLevel,
        industryAverage: industryAverages.activityLevel,
        topPercentile: topPercentile.activityLevel,
        userPercentile: comparativeMetrics.percentileRankings.activityLevel,
        trend: 'improving' as const,
        recommendation: 'Keep weekly check-ins; promote trading windows.',
        impact: 'medium' as const,
      },
      {
        metric: 'Competitive Balance',
        userValue: userLeague.competitiveBalance,
        industryAverage: industryAverages.competitiveBalance,
        topPercentile: topPercentile.competitiveBalance,
        userPercentile: comparativeMetrics.percentileRankings.competitiveBalance,
        trend: 'stable' as const,
        recommendation: 'Maintain waiver fairness and trade review standards.',
        impact: 'low' as const,
      },
    ];

    return res.status(200).json({
      success: true,
      data: {
        comparativeMetrics,
        benchmarkingInsights,
        detailedComparisons,
        industryPositioning: [usedSql ? 'Live metrics enabled' : 'Mock benchmark mode', 'Above industry average in activity and balance'],
        competitiveAnalysis: ['Well-positioned for playoff competitiveness with minor tweaks'],
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('comparative-analysis error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withRateLimit(comparativeAnalysisHandler, {
  rule: 'analytics',
  keyPrefix: 'comparative-analysis:'
})
