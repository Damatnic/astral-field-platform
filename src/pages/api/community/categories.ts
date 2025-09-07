import type { NextApiRequest, NextApiResponse } from 'next';

let CATEGORIES = [
  { id: 'general', name: 'General Discussion', description: 'Talk about anything fantasy.' },
  { id: 'trades', name: 'Trade Talk', description: 'Trade evaluations and ideas.' },
  { id: 'waivers', name: 'Waiver Wire', description: 'Waiver priorities and adds.' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: CATEGORIES });
  }
  if (req.method === 'POST') {
    const { id, name, description } = req.body || {};
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    const exists = CATEGORIES.some((c) => c.id === id);
    if (exists) return res.status(409).json({ error: 'Category already exists' });
    const cat = { id, name, description: description || '' };
    CATEGORIES.push(cat);
    return res.status(201).json({ success: true, data: cat });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
