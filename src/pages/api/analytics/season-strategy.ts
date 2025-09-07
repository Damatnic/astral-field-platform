import type { NextApiRequest, NextApiResponse } from 'next';
import { database } from '@/lib/database';
import { withMonitoring } from '@/lib/production-monitor';

type StrategyRecommendation = {
  action: string;
  rationale: string;
  expectedImpact: 'high' | 'medium' | 'low';
};

async function seasonStrategyHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leagueId = (req.method === 'GET' ? req.query.leagueId : req.body?.leagueId) as string | undefined;
  const teamId = (req.method === 'GET' ? req.query.teamId : req.body?.teamId) as string | undefined;

  try {
    let usedSql = false
    if (leagueId && teamId && (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL)) {
      try {
        // Latest league week
        const latestWeekRes = await database.query<{ week: number }>(
          `SELECT MAX(le.week) AS week
           FROM lineup_entries le
           JOIN teams t ON le.team_id = t.id
           WHERE t.league_id = $1`,
          [leagueId]
        )
        const latestWeek = latestWeekRes.rows?.[0]?.week ?? null

        // Team recent performance (last up to 3 weeks)
        const teamRecentRes = await database.query<{ week: number; points: number }>(
          `SELECT le.week, SUM(COALESCE(le.points_scored,0))::float AS points
           FROM lineup_entries le
           WHERE le.team_id = $1
           GROUP BY le.week
           ORDER BY le.week DESC
           LIMIT 3`,
          [teamId]
        )
        const teamRecent = teamRecentRes.rows?.slice().reverse() || []
        const teamRecentAvg = teamRecent.length
          ? teamRecent.reduce((s, r) => s + (r.points || 0), 0) / teamRecent.length
          : 0

        // League recent averages (last up to 3 weeks)
        const leagueRecentRes = await database.query<{ week: number; avg: number }>(
          `SELECT le.week, AVG(le.points_scored)::float AS avg
           FROM lineup_entries le
           JOIN teams t ON le.team_id = t.id
           WHERE t.league_id = $1 AND le.points_scored IS NOT NULL
           GROUP BY le.week
           ORDER BY le.week DESC
           LIMIT 3`,
          [leagueId]
        )
        const leagueRecent = leagueRecentRes.rows?.slice().reverse() || []
        const leagueRecentAvg = leagueRecent.length
          ? leagueRecent.reduce((s, r) => s + (r.avg || 0), 0) / leagueRecent.length
          : 0

        // Roster composition and injuries
        const compRes = await database.query<{ position: string; count: number }>(
          `SELECT p.position, COUNT(*)::int AS count
           FROM rosters r
           JOIN players p ON r.player_id = p.id
           WHERE r.team_id = $1 AND r.dropped_date IS NULL
           GROUP BY p.position`,
          [teamId]
        )
        const compMap = new Map<string, number>(compRes.rows.map(r => [r.position, Number(r.count)]))
        const injuredRes = await database.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count
           FROM rosters r
           JOIN players p ON r.player_id = p.id
           WHERE r.team_id = $1 AND r.dropped_date IS NULL AND p.injury_status IS NOT NULL`,
          [teamId]
        )
        const injuredCount = Number(injuredRes.rows?.[0]?.count ?? 0)

        // Upcoming bye weeks for roster players
        let byeWeeksToCover: number[] = []
        if (latestWeek !== null) {
          const byesRes = await database.query<{ bye_week: number }>(
            `SELECT DISTINCT p.bye_week
             FROM rosters r
             JOIN players p ON r.player_id = p.id
             WHERE r.team_id = $1 AND r.dropped_date IS NULL AND p.bye_week BETWEEN $2 AND $3
             ORDER BY p.bye_week`,
            [teamId, latestWeek + 1, latestWeek + 3]
          )
          byeWeeksToCover = (byesRes.rows || []).map(r => Number(r.bye_week)).filter(Boolean)
        }

        // Heuristic schedule outlook
        let next3WeeksSOS: 'favorable' | 'neutral' | 'unfavorable' = 'neutral'
        if (teamRecentAvg && leagueRecentAvg) {
          const delta = teamRecentAvg - leagueRecentAvg
          next3WeeksSOS = delta > 5 ? 'favorable' : delta < -5 ? 'unfavorable' : 'neutral'
        }

        const keyMatchups = (latestWeek ? [1, 2].map(i => ({ week: latestWeek + i, note: i === 1 ? 'Potential shootout' : 'Positive trend vs league avg' })) : [])

        // Derive strengths/weaknesses from composition
        const strengths: string[] = []
        const weaknesses: string[] = []
        const rb = compMap.get('RB') || 0
        const wr = compMap.get('WR') || 0
        const te = compMap.get('TE') || 0
        if (wr >= 5) strengths.push('WR depth')
        if (rb >= 4) strengths.push('RB depth')
        if (te >= 2) strengths.push('TE flexibility')
        if (rb < 3) weaknesses.push('RB depth')
        if (te < 1) weaknesses.push('TE streaming')

        // Recommendations based on heuristics
        const recommendations: StrategyRecommendation[] = []
        if (rb < 3) {
          recommendations.push({ action: 'Trade for RB depth', rationale: 'Mitigate injury and bye-week risk at RB', expectedImpact: 'high' })
        }
        if (injuredCount > 0) {
          recommendations.push({ action: 'Stash injured player backups', rationale: 'Cover short-term risk from injuries', expectedImpact: 'medium' })
        }
        if (te < 1) {
          recommendations.push({ action: 'Stream TE weekly', rationale: 'Exploit matchup volatility at TE', expectedImpact: 'low' })
        }
        if (recommendations.length === 0) {
          recommendations.push({ action: 'Target high-target WR on waivers', rationale: 'Stabilize floor with volume', expectedImpact: 'medium' })
        }

        // Simple playoff odds proxy using recent trend and composition
        const trendBoost = teamRecent.length >= 2 && teamRecent[teamRecent.length - 1].points > (teamRecent[teamRecent.length - 2].points || 0) ? 0.07 : 0
        const compBoost = (rb >= 4 ? 0.05 : 0) + (wr >= 5 ? 0.03 : 0)
        const injuryPenalty = Math.min(0.1, injuredCount * 0.02)
        const playoffOdds = Math.max(0.1, Math.min(0.9, 0.55 + trendBoost + compBoost - injuryPenalty))

        usedSql = true
        return res.status(200).json({
          success: true,
          data: {
            leagueId,
            teamId,
            strategyOverview: {
              playoffOdds: Number(playoffOdds.toFixed(2)),
              strengths: strengths.length ? strengths : ['Balanced roster'],
              weaknesses: weaknesses.length ? weaknesses : ['Upside limited at TE'],
              riskFactors: [injuredCount > 0 ? 'Injury risk' : 'Low injury risk', byeWeeksToCover.length ? 'Upcoming bye coverage needed' : 'Byes manageable'],
            },
            recommendations,
            scheduleOutlook: {
              next3WeeksSOS,
              byeWeeksToCover,
              keyMatchups,
            },
            generatedAt: new Date().toISOString(),
            mode: 'sql',
          },
        })
      } catch (e) {
        console.warn('season-strategy SQL failed; using fallback:', (e as Error).message)
      }
    }

    // Fallback: mock output
    const recommendations: StrategyRecommendation[] = [
      { action: 'Trade for RB depth', rationale: 'RB volatility is high; depth mitigates injury risk and bye weeks.', expectedImpact: 'high' },
      { action: 'Target waiver WR with high targets', rationale: 'Volume-driven WR provides stable floor to complement boom/bust players.', expectedImpact: 'medium' },
      { action: 'Stream TE based on matchup', rationale: 'TE scoring is matchup-sensitive; weekly streaming improves consistency.', expectedImpact: 'low' },
    ]
    const scheduleOutlook = {
      next3WeeksSOS: 'favorable',
      byeWeeksToCover: [8, 10],
      keyMatchups: [
        { week: 8, note: 'Opponent weak vs RBs' },
        { week: 9, note: 'High-scoring environment projected' },
      ],
    }
    const playoffOdds = 0.67
    return res.status(200).json({
      success: true,
      data: {
        leagueId: leagueId || 'unknown',
        teamId: teamId || 'unknown',
        strategyOverview: {
          playoffOdds,
          strengths: ['WR core', 'QB consistency'],
          weaknesses: ['RB depth', 'TE ceiling'],
          riskFactors: ['Injury risk at RB2', 'Bye week clustering'],
        },
        recommendations,
        scheduleOutlook,
        generatedAt: new Date().toISOString(),
        mode: usedSql ? 'sql' : 'mock',
      },
    })
  } catch (error) {
    console.error('season-strategy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withMonitoring(seasonStrategyHandler, {
  service: 'analytics',
  endpoint: 'season-strategy',
  enableMetrics: true
})
