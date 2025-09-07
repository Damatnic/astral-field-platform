import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, expected, actual } = req.body || {};
  if (!prompt || expected === undefined || actual === undefined) {
    return res.status(400).json({ error: 'prompt, expected, actual required' });
  }

  // Very simple string overlap scoring
  const normalize = (s: string) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const exp = normalize(expected);
  const act = normalize(actual);
  const overlap = exp && act ? Math.min(exp.length, act.length) / Math.max(exp.length, act.length) : 0;
  const score = Math.round(overlap * 100);

  return res.status(200).json({
    success: true,
    data: {
      prompt,
      expected,
      actual,
      score,
      verdict: score >= 70 ? 'pass' : 'fail',
    },
  });
}
