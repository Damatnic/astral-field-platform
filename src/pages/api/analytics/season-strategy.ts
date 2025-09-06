import { NextApiRequest, NextApiResponse } from 'next';
import { SeasonStrategyService } from '../../../services/analytics/seasonStrategy';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const strategyService = new SeasonStrategyService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await rateLimitMiddleware(req, res, {
    maxRequests: 15,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `season-strategy:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  try {
    const userId = await authenticateUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.method === 'GET') {
      const { leagueId, type = 'full', week } = req.query;

      if (!leagueId || typeof leagueId !== 'string') {
        return res.status(400).json({ error: 'League ID is required' });
      }

      if (type === 'weekly') {
        const weekNum = parseInt(week as string) || 1;
        if (weekNum < 1 || weekNum > 17) {
          return res.status(400).json({ error: 'Week must be between 1 and 17' });
        }

        const weeklyStrategy = await strategyService.generateQuickWeeklyStrategy(
          leagueId,
          userId,
          weekNum
        );

        return res.status(200).json({
          success: true,
          data: weeklyStrategy,
          type: 'weekly_strategy',
          week: weekNum
        });
      }

      const currentWeek = week ? parseInt(week as string) : undefined;
      const seasonStrategy = await strategyService.generateSeasonLongStrategy(
        leagueId,
        userId,
        currentWeek
      );

      return res.status(200).json({
        success: true,
        data: seasonStrategy,
        type: 'season_strategy',
        generatedAt: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const { leagueId, strategyType, week, currentWeek } = req.body;

      if (!leagueId) {
        return res.status(400).json({ error: 'League ID is required' });
      }

      let result;

      switch (strategyType) {
        case 'weekly':
          const weekNum = parseInt(week) || 1;
          if (weekNum < 1 || weekNum > 17) {
            return res.status(400).json({ error: 'Week must be between 1 and 17' });
          }
          result = await strategyService.generateQuickWeeklyStrategy(leagueId, userId, weekNum);
          break;

        case 'season':
        case 'full':
        default:
          result = await strategyService.generateSeasonLongStrategy(
            leagueId,
            userId,
            currentWeek ? parseInt(currentWeek) : undefined
          );
          break;
      }

      return res.status(200).json({
        success: true,
        data: result,
        type: strategyType || 'season',
        generatedAt: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Season strategy error:', error);

    if (error.message?.includes('League not found')) {
      return res.status(404).json({ error: 'League not found' });
    }

    if (error.message?.includes('Team not found')) {
      return res.status(404).json({ error: 'Team not found in league' });
    }

    if (error.message?.includes('Matchup not found')) {
      return res.status(404).json({ error: 'Matchup not found for specified week' });
    }

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Strategy generation failed'
    });
  }
}