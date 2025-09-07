import type { NextApiRequest, NextApiResponse } from 'next';

type Thread = {
  id: string;
  categoryId: string;
  title: string;
  author: string;
  createdAt: string;
  replies: number;
};

let THREADS: Thread[] = [
  { id: 't1', categoryId: 'trades', title: 'Is this trade fair?', author: 'alice', createdAt: new Date().toISOString(), replies: 3 },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { categoryId } = req.query as Record<string, string>;
    const list = categoryId ? THREADS.filter((t) => t.categoryId === categoryId) : THREADS;
    return res.status(200).json({ success: true, data: list });
  }
  if (req.method === 'POST') {
    const { categoryId, title, author } = req.body || {};
    if (!categoryId || !title || !author) return res.status(400).json({ error: 'categoryId, title, author required' });
    const id = `t${THREADS.length + 1}`;
    const thread: Thread = { id, categoryId, title, author, createdAt: new Date().toISOString(), replies: 0 };
    THREADS.push(thread);
    return res.status(201).json({ success: true, data: thread });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
