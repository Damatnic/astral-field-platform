import { NextApiRequest, NextApiResponse } from 'next';
import { ComparativeAnalysisService } from '../../../services/analytics/comparativeAnalysis';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const comparativeService = new ComparativeAnalysisService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await rateLimitMiddleware(req, res, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `comparative-analysis:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
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
      const { leagueId, type = 'full' } = req.query;

      if (!leagueId || typeof leagueId !== 'string') {
        return res.status(400).json({ error: 'League ID is required' });
      }

      if (type === 'quick') {
        const quickBenchmark = await comparativeService.generateQuickBenchmark(leagueId);
        return res.status(200).json({
          success: true,
          data: quickBenchmark,
          type: 'quick_benchmark'
        });
      }

      const benchmarkingData = await comparativeService.generateLeagueBenchmarking(
        leagueId,
        userId
      );

      return res.status(200).json({
        success: true,
        data: benchmarkingData,
        type: 'full_benchmarking',
        generatedAt: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const { leagueId, analysisType } = req.body;

      if (!leagueId) {
        return res.status(400).json({ error: 'League ID is required' });
      }

      let result;

      switch (analysisType) {
        case 'quick':
          result = await comparativeService.generateQuickBenchmark(leagueId);
          break;
        case 'full':
        default:
          result = await comparativeService.generateLeagueBenchmarking(leagueId, userId);
          break;
      }

      return res.status(200).json({
        success: true,
        data: result,
        type: analysisType || 'full',
        generatedAt: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Comparative analysis error:', error);

    if (error.message?.includes('League not found')) {
      return res.status(404).json({ error: 'League not found' });
    }

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Analysis generation failed'
    });
  }
}