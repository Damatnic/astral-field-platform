import type { NextApiRequest, NextApiResponse } from 'next';

type Step = { id: string; name: string; status: 'pending' | 'running' | 'complete'; durationMs?: number };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { workflow = 'analysis', inputs = {} } = req.body || {};

  const steps: Step[] = [
    { id: 's1', name: 'Validate Inputs', status: 'complete', durationMs: 20 },
    { id: 's2', name: 'Fetch Context', status: 'complete', durationMs: 35 },
    { id: 's3', name: 'Run Model', status: 'complete', durationMs: 380 },
    { id: 's4', name: 'Compile Output', status: 'complete', durationMs: 25 },
  ];

  return res.status(200).json({
    success: true,
    data: {
      workflow,
      inputs,
      steps,
      totalDurationMs: steps.reduce((s, x) => s + (x.durationMs || 0), 0),
      result: { summary: 'Workflow completed successfully', confidence: 0.82 },
    },
  });
}
