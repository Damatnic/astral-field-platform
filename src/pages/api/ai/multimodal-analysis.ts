import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, mediaType, analysisType, mediaUrl, playerName, context, platform, accountInfo, caption, headline, source, relatedPlayers, showName, hosts, duration, transcript, analyses } = req.body || {};

    if (!action) return res.status(400).json({ error: 'action required' });

    switch (action) {
      case 'analyze_player_movement': {
        if (!mediaUrl || !playerName) return res.status(400).json({ error: 'mediaUrl and playerName required' });
        const result = {
          playerName,
          keyMovements: ['cut', 'acceleration'],
          estimatedSpeedMph: Math.round((15 + Math.random() * 8) * 10) / 10,
          riskIndicators: ['none'],
          confidence: Math.round((0.65 + Math.random() * 0.3) * 100) / 100,
        };
        return res.status(200).json({ success: true, data: result, type: 'player_movement_analysis' });
      }
      case 'analyze_social_media': {
        if (!platform || !accountInfo) return res.status(400).json({ error: 'platform and accountInfo required' });
        const result = {
          platform,
          account: accountInfo,
          caption: caption || null,
          fantasyRelevance: Math.round(Math.random() * 100),
          sentiment: Math.round((Math.random() * 2 - 1) * 100) / 100,
          topics: ['trade rumor', 'injury update'],
        };
        return res.status(200).json({ success: true, data: result, type: 'social_media_analysis' });
      }
      case 'analyze_news_image': {
        if (!headline || !source) return res.status(400).json({ error: 'headline and source required' });
        const result = {
          headline,
          source,
          players: Array.isArray(relatedPlayers) ? relatedPlayers : [],
          relevance: Math.round(Math.random() * 100),
          summary: 'Image suggests increased role and potential workload shift.',
        };
        return res.status(200).json({ success: true, data: result, type: 'news_image_analysis' });
      }
      case 'analyze_podcast': {
        if (!showName || !hosts || !transcript) return res.status(400).json({ error: 'showName, hosts, transcript required' });
        const insights = ['Buy-low on WR', 'Fade injured RB'];
        const result = {
          showName,
          hosts,
          duration: duration || 0,
          actionableInsights: insights,
          summary: 'Hosts discuss market inefficiencies and injury fallout.',
        };
        return res.status(200).json({ success: true, data: result, type: 'podcast_analysis' });
      }
      case 'batch_analysis': {
        if (!Array.isArray(analyses) || analyses.length === 0) {
          return res.status(400).json({ error: 'analyses array required' });
        }
        const results = analyses.slice(0, 10).map((a: any, idx: number) => ({ id: a.id ?? `job_${idx}`, type: a.type, success: true }));
        return res.status(200).json({ success: true, type: 'batch_analysis', totalAnalyses: results.length, results });
      }
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
