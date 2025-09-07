import { NextApiRequest, NextApiResponse } from 'next';
import { MultiModalAnalyzer } from '../../../services/ai/multiModalAnalyzer';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';
import { database as db } from '../../../lib/database';

const analyzer = new MultiModalAnalyzer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allowed = await rateLimitMiddleware(req, res, {
    maxRequests: 20, // Lower limit for resource-intensive operations
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `multimodal:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!allowed) {
    return; // rateLimitMiddleware already sent the response
  }

  try {
    const auth = await authenticateUser(req);
    if (!auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = auth.user.id;

    if (req.method === 'POST') {
      const { action, mediaType, analysisType, mediaUrl, playerName, context } = req.body;

      // Validate request
      if (!action || !analysisType) {
        return res.status(400).json({ error: 'Action and analysisType are required' });
      }

      // Validate media analysis request
      const validationResult = await analyzer.validateMedia({
        mediaType,
        analysisType,
        mediaUrl,
        playerName,
        context
      });

      if (!validationResult.valid) {
        return res.status(400).json({ 
          error: 'Invalid request',
          details: validationResult.errors
        });
      }

      switch (action) {
        case 'analyze_player_movement':
          if (!playerName) {
            return res.status(400).json({ error: 'Player name is required for movement analysis' });
          }

          const movementAnalysis = await analyzer.analyzePlayerMovement({
            videoUrl: mediaUrl,
            playerName,
            analysisContext: analysisType as 'injury_assessment' | 'performance_evaluation'
          });

          // Store analysis result
          await storeAnalysisResult(userId, {
            type: 'player_movement',
            player: playerName,
            result: movementAnalysis,
            analysisContext: analysisType
          });

          return res.status(200).json({
            success: true,
            data: movementAnalysis,
            type: 'player_movement_analysis'
          });

        case 'analyze_social_media':
          const { platform, accountInfo, caption } = req.body;
          
          if (!platform || !accountInfo) {
            return res.status(400).json({ 
              error: 'Platform and account info required for social media analysis' 
            });
          }

          const socialAnalysis = await analyzer.analyzeSocialMediaContent({
            imageUrl: mediaUrl,
            caption,
            platform,
            accountInfo
          });

          // Store analysis result
          await storeAnalysisResult(userId, {
            type: 'social_media',
            platform,
            result: socialAnalysis,
            relevance: socialAnalysis.fantasyRelevance
          });

          return res.status(200).json({
            success: true,
            data: socialAnalysis,
            type: 'social_media_analysis'
          });

        case 'analyze_news_image':
          const { headline, source, relatedPlayers } = req.body;
          
          if (!headline || !source) {
            return res.status(400).json({ 
              error: 'Headline and source required for news image analysis' 
            });
          }

          const newsAnalysis = await analyzer.analyzeNewsImages({
            imageUrl: mediaUrl,
            headline,
            source,
            playerNames: relatedPlayers
          });

          // Store analysis result
          await storeAnalysisResult(userId, {
            type: 'news_image',
            source,
            result: newsAnalysis,
            players: relatedPlayers
          });

          return res.status(200).json({
            success: true,
            data: newsAnalysis,
            type: 'news_image_analysis'
          });

        case 'analyze_podcast':
          const { showName, hosts, duration, transcript } = req.body;
          
          if (!showName || !hosts || !transcript) {
            return res.status(400).json({ 
              error: 'Show name, hosts, and transcript required for podcast analysis' 
            });
          }

          const podcastAnalysis = await analyzer.analyzePodcastAudio({
            audioUrl: mediaUrl,
            transcript,
            showName,
            hosts,
            duration: duration || 0
          });

          // Store analysis result
          await storeAnalysisResult(userId, {
            type: 'podcast',
            show: showName,
            result: podcastAnalysis,
            insights: podcastAnalysis.actionableInsights.length
          });

          return res.status(200).json({
            success: true,
            data: podcastAnalysis,
            type: 'podcast_analysis'
          });

        case 'batch_analysis':
          const { analyses } = req.body;
          
          if (!Array.isArray(analyses) || analyses.length === 0) {
            return res.status(400).json({ error: 'Analyses array is required for batch processing' });
          }

          if (analyses.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 analyses per batch request' });
          }

          const batchResults = [];
          for (const analysis of analyses) {
            try {
              let result;
              
              switch (analysis.type) {
                case 'player_movement':
                  result = await analyzer.analyzePlayerMovement(analysis.params);
                  break;
                case 'social_media':
                  result = await analyzer.analyzeSocialMediaContent(analysis.params);
                  break;
                case 'news_image':
                  result = await analyzer.analyzeNewsImages(analysis.params);
                  break;
                case 'podcast':
                  result = await analyzer.analyzePodcastAudio(analysis.params);
                  break;
                default:
                  result = { error: `Unknown analysis type: ${analysis.type}` };
              }
              
              const isError = (result as any)?.error !== undefined;
              batchResults.push({
                id: analysis.id,
                type: analysis.type,
                success: !isError,
                data: result
              });

              // Store each result
              if (!isError) {
                await storeAnalysisResult(userId, {
                  type: analysis.type,
                  result,
                  batchId: analysis.id
                });
              }
              
            } catch (error) {
              batchResults.push({
                id: analysis.id,
                type: analysis.type,
                success: false,
                error: (error as Error).message || 'Unknown error'
              });
            }
          }

          return res.status(200).json({
            success: true,
            data: batchResults,
            type: 'batch_analysis',
            totalAnalyses: analyses.length,
            successful: batchResults.filter(r => r.success).length,
            failed: batchResults.filter(r => !r.success).length
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'GET') {
      const { type, days, player } = req.query;

      switch (type) {
        case 'capabilities':
          const capabilities = await analyzer.getAnalysisCapabilities();
          
          return res.status(200).json({
            success: true,
            data: capabilities,
            type: 'analysis_capabilities'
          });

        case 'history':
          const daysBack = days ? parseInt(days as string) : 7;
          const history = await getAnalysisHistory(userId, daysBack, player as string);
          
          return res.status(200).json({
            success: true,
            data: history,
            type: 'analysis_history',
            period: `${daysBack} days`
          });

        case 'insights_summary':
          const insightsSummary = await getInsightsSummary(userId);
          
          return res.status(200).json({
            success: true,
            data: insightsSummary,
            type: 'insights_summary'
          });

        case 'trending_analyses':
          const trending = await getTrendingAnalyses();
          
          return res.status(200).json({
            success: true,
            data: trending,
            type: 'trending_analyses'
          });

        default:
          const recentAnalyses = await getAnalysisHistory(userId, 1);
          return res.status(200).json({
            success: true,
            data: recentAnalyses,
            type: 'recent_analyses'
          });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Multi-modal analysis API error:', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (error.message?.includes('File size')) {
      return res.status(413).json({ error: 'File too large' });
    }

    if (error.message?.includes('Unsupported')) {
      return res.status(415).json({ error: 'Unsupported media type' });
    }

    if (error.message?.includes('timeout')) {
      return res.status(408).json({ 
        error: 'Analysis timeout',
        message: 'Media analysis took too long to complete.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Multi-modal analysis failed'
    });
  }
}

async function storeAnalysisResult(userId: string, analysis: {
  type: string;
  result: any;
  player?: string;
  platform?: string;
  source?: string;
  show?: string;
  relevance?: number;
  insights?: number;
  players?: string[];
  analysisContext?: string;
  batchId?: string;
}) {
  try {
    await db.query(`
      INSERT INTO multimodal_analyses (
        user_id, analysis_type, analysis_result, player_name,
        platform, source, show_name, relevance_score,
        insights_count, related_players, analysis_context,
        batch_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `, [
      userId,
      analysis.type,
      JSON.stringify(analysis.result),
      analysis.player,
      analysis.platform,
      analysis.source,
      analysis.show,
      analysis.relevance || 0.5,
      analysis.insights || 0,
      JSON.stringify(analysis.players || []),
      analysis.analysisContext,
      analysis.batchId
    ]);
  } catch (error) {
    console.error('Error storing analysis result:', error);
    // Don't throw - analysis succeeded even if storage failed
  }
}

async function getAnalysisHistory(userId: string, days: number, player?: string): Promise<any[]> {
  const query = `
    SELECT 
      analysis_type,
      analysis_result,
      player_name,
      platform,
      source,
      show_name,
      relevance_score,
      insights_count,
      created_at
    FROM multimodal_analyses 
    WHERE user_id = $1 
      AND created_at > NOW() - INTERVAL '${days} days'
      ${player ? 'AND player_name = $2' : ''}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const params = player ? [userId, player] : [userId];
  const result = await db.query(query, params);
  
  return result.rows.map(row => ({
    type: row.analysis_type,
    result: JSON.parse(row.analysis_result),
    player: row.player_name,
    platform: row.platform,
    source: row.source,
    show: row.show_name,
    relevance: parseFloat(row.relevance_score),
    insights: parseInt(row.insights_count),
    timestamp: row.created_at
  }));
}

async function getInsightsSummary(userId: string): Promise<{
  totalAnalyses: number;
  byType: Record<string, number>;
  topPlayers: Array<{player: string; count: number}>;
  averageRelevance: number;
  totalInsights: number;
}> {
  const summaryQuery = await db.query(`
    SELECT 
      COUNT(*) as total_analyses,
      COALESCE(AVG(relevance_score), 0) as avg_relevance,
      COALESCE(SUM(insights_count), 0) as total_insights,
      json_object_agg(analysis_type, type_count) as by_type
    FROM (
      SELECT 
        analysis_type,
        relevance_score,
        insights_count,
        COUNT(*) as type_count
      FROM multimodal_analyses 
      WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY analysis_type, relevance_score, insights_count
    ) subquery
  `, [userId]);

  const topPlayersQuery = await db.query(`
    SELECT 
      player_name,
      COUNT(*) as analysis_count
    FROM multimodal_analyses 
    WHERE user_id = $1 
      AND player_name IS NOT NULL
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY player_name 
    ORDER BY analysis_count DESC 
    LIMIT 10
  `, [userId]);

  const summary = summaryQuery.rows[0];
  const topPlayers = topPlayersQuery.rows.map(row => ({
    player: row.player_name,
    count: parseInt(row.analysis_count)
  }));

  return {
    totalAnalyses: parseInt(summary.total_analyses) || 0,
    byType: summary.by_type || {},
    topPlayers,
    averageRelevance: parseFloat(summary.avg_relevance) || 0,
    totalInsights: parseInt(summary.total_insights) || 0
  };
}

async function getTrendingAnalyses(): Promise<{
  trendingPlayers: Array<{player: string; analysisCount: number; trend: string}>;
  popularSources: Array<{source: string; count: number}>;
  hotTopics: string[];
}> {
  // Get players with increasing analysis volume
  const trendingPlayersQuery = await db.query(`
    WITH recent_week AS (
      SELECT player_name, COUNT(*) as recent_count
      FROM multimodal_analyses 
      WHERE player_name IS NOT NULL
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY player_name
    ),
    previous_week AS (
      SELECT player_name, COUNT(*) as previous_count
      FROM multimodal_analyses 
      WHERE player_name IS NOT NULL
        AND created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
      GROUP BY player_name
    )
    SELECT 
      COALESCE(r.player_name, p.player_name) as player,
      COALESCE(r.recent_count, 0) as recent_count,
      COALESCE(p.previous_count, 0) as previous_count,
      CASE 
        WHEN COALESCE(p.previous_count, 0) = 0 THEN 'new'
        WHEN r.recent_count > p.previous_count * 1.5 THEN 'rising'
        WHEN r.recent_count < p.previous_count * 0.5 THEN 'falling'
        ELSE 'stable'
      END as trend
    FROM recent_week r
    FULL OUTER JOIN previous_week p ON r.player_name = p.player_name
    WHERE COALESCE(r.recent_count, 0) > 2
    ORDER BY recent_count DESC
    LIMIT 10
  `);

  // Get popular sources
  const popularSourcesQuery = await db.query(`
    SELECT 
      COALESCE(source, platform, show_name, 'Unknown') as source,
      COUNT(*) as count
    FROM multimodal_analyses 
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY COALESCE(source, platform, show_name, 'Unknown')
    ORDER BY count DESC
    LIMIT 10
  `);

  return {
    trendingPlayers: trendingPlayersQuery.rows.map(row => ({
      player: row.player,
      analysisCount: parseInt(row.recent_count),
      trend: row.trend
    })),
    popularSources: popularSourcesQuery.rows.map(row => ({
      source: row.source,
      count: parseInt(row.count)
    })),
    hotTopics: [] // Would be extracted from analysis results in a real implementation
  };
}
