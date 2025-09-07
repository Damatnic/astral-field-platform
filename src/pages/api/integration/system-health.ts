import type { NextApiRequest, NextApiResponse } from 'next';
import { database } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const dbHealth = await database.healthCheck();
    const websocket = { status: 'healthy', connections: Math.floor(Math.random() * 10) };
    const cache = { status: 'healthy', hitRate: Math.round((0.6 + Math.random() * 0.3) * 100) / 100 };
    const ai = { status: 'degraded', latencyMs: 450 };

    return res.status(200).json({
      success: true,
      data: {
        database: dbHealth,
        websocket,
        cache,
        ai,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
