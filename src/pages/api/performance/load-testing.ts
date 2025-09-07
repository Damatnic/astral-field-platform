import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { target = '/api/health', durationSeconds = 5, concurrency = 5 } = req.body || {};
  if (durationSeconds > 30) return res.status(400).json({ error: 'durationSeconds max 30' });
  if (concurrency > 50) return res.status(400).json({ error: 'concurrency max 50' });

  // Simulated results only (no actual load is generated in this endpoint)
  const requests = durationSeconds * concurrency * 10;
  const latency = { p50: 42, p90: 120, p99: 310 };
  const errors = Math.floor(requests * 0.01);
  const throughput = Math.round((requests - errors) / durationSeconds);

  return res.status(200).json({
    success: true,
    data: {
      target,
      durationSeconds,
      concurrency,
      requests,
      errors,
      throughputRps: throughput,
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    },
  });
}
