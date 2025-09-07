import { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceAttributionService } from '../../../services/analytics/performanceAttribution';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const attributionService = new PerformanceAttributionService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allowed = await rateLimitMiddleware(req, res, {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `performance-attribution:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!allowed) return;

  try {
    const auth = await authenticateUser(req);
    if (!auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = auth.user.id;

    if (req.method === 'GET') {
      const { leagueId, type, decisionId, decisionType } = req.query;

      if (!leagueId || typeof leagueId !== 'string') {
        return res.status(400).json({ error: 'League ID is required' });
      }

      switch (type) {
        case 'decision':
          if (!decisionId || typeof decisionId !== 'string') {
            return res.status(400).json({ error: 'Decision ID is required for decision lookup' });
          }
          
          const decision = await attributionService.getDecisionById(decisionId);
          if (!decision) {
            return res.status(404).json({ error: 'Decision not found' });
          }

          return res.status(200).json({
            success: true,
            data: decision,
            type: 'decision_detail'
          });

        case 'attribution':
          const attributionAnalysis = await attributionService.generateAttributionAnalysis(
            userId,
            leagueId,
            decisionType as string
          );

          return res.status(200).json({
            success: true,
            data: attributionAnalysis,
            type: 'attribution_analysis'
          });

        case 'patterns':
          const decisionPatterns = await attributionService.analyzeDecisionPatterns(
            userId,
            leagueId
          );

          return res.status(200).json({
            success: true,
            data: decisionPatterns,
            type: 'decision_patterns'
          });

        case 'breakdown':
        case 'full':
        default:
          const seasonBreakdown = await attributionService.generateSeasonPerformanceBreakdown(
            userId,
            leagueId
          );

          return res.status(200).json({
            success: true,
            data: seasonBreakdown,
            type: 'season_breakdown',
            generatedAt: new Date().toISOString()
          });
      }
    }

    if (req.method === 'POST') {
      const { action, leagueId } = req.body;

      if (!leagueId) {
        return res.status(400).json({ error: 'League ID is required' });
      }

      switch (action) {
        case 'track_decision':
          const {
            decisionType,
            description,
            weekNumber,
            playersBefore,
            playersAfter,
            reasoning,
            aiRecommended,
            alternativesConsidered,
            expectedImpact,
            impactTimeline
          } = req.body;

          if (!decisionType || !description || !weekNumber) {
            return res.status(400).json({ 
              error: 'Decision type, description, and week number are required' 
            });
          }

          if (weekNumber < 1 || weekNumber > 17) {
            return res.status(400).json({ 
              error: 'Week number must be between 1 and 17' 
            });
          }

          const decisionId = await attributionService.trackDecision({
            userId,
            leagueId,
            decisionType,
            description,
            weekNumber: parseInt(weekNumber),
            playersBefore: playersBefore || [],
            playersAfter: playersAfter || [],
            reasoning,
            aiRecommended: aiRecommended || false,
            alternativesConsidered: alternativesConsidered || [],
            expectedImpact: parseFloat(expectedImpact) || 0,
            impactTimeline: impactTimeline || 'short_term'
          });

          return res.status(201).json({
            success: true,
            data: { decisionId },
            message: 'Decision tracked successfully'
          });

        case 'calculate_impact':
          const { targetDecisionId } = req.body;
          
          if (!targetDecisionId) {
            return res.status(400).json({ error: 'Decision ID is required' });
          }

          const impact = await attributionService.calculateDecisionImpact(targetDecisionId);

          return res.status(200).json({
            success: true,
            data: impact,
            message: 'Impact calculated successfully'
          });

        case 'analyze_patterns':
          const patterns = await attributionService.analyzeDecisionPatterns(userId, leagueId);

          return res.status(200).json({
            success: true,
            data: patterns,
            type: 'decision_patterns'
          });

        case 'generate_breakdown':
          const breakdown = await attributionService.generateSeasonPerformanceBreakdown(
            userId,
            leagueId
          );

          return res.status(200).json({
            success: true,
            data: breakdown,
            type: 'season_breakdown',
            generatedAt: new Date().toISOString()
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Performance attribution error:', error);

    if (error.message?.includes('League not found')) {
      return res.status(404).json({ error: 'League not found' });
    }

    if (error.message?.includes('Decision not found')) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (error.message?.includes('Validation') || error.message?.includes('Invalid')) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Performance attribution analysis failed'
    });
  }
}
