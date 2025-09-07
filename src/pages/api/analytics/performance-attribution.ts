import type { NextApiRequest, NextApiResponse } from 'next';
import { database } from '@/lib/database';
import { CacheHelper } from '@/lib/cache-manager';
import { getDatabaseOptimizer } from '@/lib/database-optimizer';

type AttributionItem = {
  factor: string;
  impact: number; // positive boosts performance; negative hurts
};

// Extract the main data fetching logic
async function fetchPerformanceAttribution(leagueId?: string) {
  try {
    let responseBuilt = false;
    if (leagueId && (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL)) {
      try {
        // Use optimized queries that combine multiple operations
        const optimizer = getDatabaseOptimizer();
        const {
          latestWeek,
          leagueAvg,
          waiverProcessed,
          tradesAccepted,
          injuredCount
        } = await optimizer.executeAnalyticsQueries(leagueId);

        // Derive simple normalized impacts
        const efficiencyImpact = Math.max(0, Math.min(0.25, (leagueAvg - 95) / 250)); // clamp to 0..0.25
        const waiverImpact = Math.min(0.15, waiverProcessed / 1000);
        const tradesImpact = Math.min(0.12, tradesAccepted / 500);
        const injuryDetract = -Math.min(0.2, injuredCount / 200);
        const byeDetract = -0.03; // placeholder
        const startSitDetract = -0.02; // placeholder

        const topContributors: AttributionItem[] = [
          { factor: 'Roster Efficiency', impact: Number(efficiencyImpact.toFixed(3)) },
          { factor: 'Matchup Exploitation', impact: 0.08 },
          { factor: 'Waiver Additions', impact: Number(waiverImpact.toFixed(3)) },
          { factor: 'Trading Activity', impact: Number(tradesImpact.toFixed(3)) },
        ];
        const detractors: AttributionItem[] = [
          { factor: 'Injuries', impact: Number(injuryDetract.toFixed(3)) },
          { factor: 'Bye Week Coverage', impact: byeDetract },
          { factor: 'Start/Sit Decisions', impact: startSitDetract },
        ];

        const now = new Date().toISOString();
        responseBuilt = true;
        return {
          attribution: [...topContributors, ...detractors],
          totalImpact: Number((topContributors.reduce((s, i) => s + i.impact, 0) + detractors.reduce((s, i) => s + i.impact, 0)).toFixed(3)),
          mode: 'sql',
          metadata: {
            leagueId,
            period: latestWeek !== null ? `week-${latestWeek}` : 'season-to-date',
            leagueAverages: { latestWeek, averagePoints: Number(leagueAvg.toFixed(2)) },
            activity: { waiversProcessed: waiverProcessed, tradesAccepted },
            generatedAt: now,
          }
        };
      } catch (e) {
        console.warn('SQL attribution fallback:', (e as Error).message);
      }
    }

    if (!responseBuilt) {
      // Fallback mock when no DB or query failed
      const now = new Date().toISOString();
      const topContributors: AttributionItem[] = [
        { factor: 'Roster Efficiency', impact: 0.18 },
        { factor: 'Matchup Exploitation', impact: 0.12 },
        { factor: 'Waiver Additions', impact: 0.07 },
      ];
      const detractors: AttributionItem[] = [
        { factor: 'Injuries', impact: -0.11 },
        { factor: 'Bye Week Coverage', impact: -0.05 },
        { factor: 'Start/Sit Decisions', impact: -0.03 },
      ];
      return {
        attribution: [...topContributors, ...detractors],
        totalImpact: Number((topContributors.reduce((s, i) => s + i.impact, 0) + detractors.reduce((s, i) => s + i.impact, 0)).toFixed(3)),
        mode: 'mock',
        metadata: {
          leagueId: leagueId || 'unknown',
          period: 'season-to-date',
          generatedAt: now,
        }
      };
    }
  } catch (error) {
    console.error('performance-attribution fetch error:', error);
    // Return mock data on error
    const now = new Date().toISOString();
    const mockAttribution: AttributionItem[] = [
      { factor: 'Roster Efficiency', impact: 0.18 },
      { factor: 'Matchup Exploitation', impact: 0.12 },
      { factor: 'Waiver Additions', impact: 0.07 },
      { factor: 'Injuries', impact: -0.11 },
      { factor: 'Bye Week Coverage', impact: -0.05 },
      { factor: 'Start/Sit Decisions', impact: -0.03 },
    ];
    return {
      attribution: mockAttribution,
      totalImpact: Number(mockAttribution.reduce((s, i) => s + i.impact, 0).toFixed(3)),
      mode: 'error-fallback',
      metadata: {
        leagueId: leagueId || 'unknown',
        period: 'season-to-date',
        generatedAt: now,
        error: (error as Error).message
      }
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leagueId = (req.method === 'GET' ? req.query.leagueId : req.body?.leagueId) as string | undefined;

  try {
    // Use cache helper with 5-minute TTL
    const cacheHelper = new CacheHelper();
    const params = { leagueId: leagueId || 'default' };
    
    const data = await cacheHelper.wrapWithCache(
      'performance-attribution',
      params,
      () => fetchPerformanceAttribution(leagueId),
      300 // 5 minutes
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error('performance-attribution handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
