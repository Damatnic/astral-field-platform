import type { NextApiRequest, NextApiResponse } from 'next';
import { database } from '@/lib/database';

type SentimentPoint = {
  timestamp: string;
  score: number; // -1..1
  volume: number; // posts/tweets
};

type Trend = {
  player: string;
  averageScore: number;
  direction: 'up' | 'down' | 'flat';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Optional DB reachability check
    if (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL) {
      try { await database.query('SELECT 1'); } catch {}
    }

    if (req.method === 'POST') {
      const { action, platform, account, timeframe = '24h', players = [], subscriptionData } = req.body || {};

      switch (action) {
        case 'start_monitoring':
          return res.status(200).json({ success: true, message: 'Monitoring started', type: 'monitoring' });
        case 'stop_monitoring':
          return res.status(200).json({ success: true, message: 'Monitoring stopped', type: 'monitoring' });
        case 'subscribe_alerts':
          if (!subscriptionData) return res.status(400).json({ error: 'subscriptionData required' });
          return res.status(200).json({ success: true, message: 'Subscribed', subscriptionId: 'sub_123' });
        case 'unsubscribe_alerts':
          if (!subscriptionData?.subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
          return res.status(200).json({ success: true, message: 'Unsubscribed' });
        case 'dismiss_alert':
          if (!req.body?.alertId) return res.status(400).json({ error: 'alertId required' });
          return res.status(200).json({ success: true, message: 'Alert dismissed' });
        case 'analyze_custom_content':
          if (!req.body?.content) return res.status(400).json({ error: 'content required' });
          return res.status(200).json({
            success: true,
            data: {
              sentiment: Math.round((Math.random() * 2 - 1) * 100) / 100,
              relevance: Math.round(Math.random() * 100),
              keyPhrases: ['injury update', 'breakout', 'coaching change'].slice(0, 2),
            },
            type: 'custom_sentiment_analysis',
          });
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'GET') {
      const { type, player, hours = '24' } = req.query as Record<string, string>;
      switch (type) {
        case 'current_trends': {
          const players = ['Player A', 'Player B', 'Player C'];
          const trends: Trend[] = players.map((p) => ({
            player: p,
            averageScore: Math.round((Math.random() * 2 - 1) * 100) / 100,
            direction: ['up', 'down', 'flat'][Math.floor(Math.random() * 3)] as Trend['direction'],
          }));
          return res.status(200).json({ success: true, data: trends, type: 'current_sentiment_trends' });
        }
        case 'player_summary': {
          if (!player) return res.status(400).json({ error: 'player required' });
          const n = Math.max(4, Math.min(24, parseInt(hours, 10) || 24));
          const points: SentimentPoint[] = Array.from({ length: n }).map((_, i) => ({
            timestamp: new Date(Date.now() - (n - i) * 60 * 60 * 1000).toISOString(),
            score: Math.round((Math.random() * 2 - 1) * 100) / 100,
            volume: Math.floor(Math.random() * 50) + 10,
          }));
          const avg = Math.round((points.reduce((s, p) => s + p.score, 0) / points.length) * 100) / 100;
          return res.status(200).json({
            success: true,
            data: { player, hours: n, averageScore: avg, series: points },
            type: 'player_sentiment_summary',
          });
        }
        default:
          return res.status(400).json({ error: 'Invalid type' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
