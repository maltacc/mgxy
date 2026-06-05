import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

const MAX = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId required' });
      return;
    }
    const { data, error } = await supabase
      .from('puzzle_times')
      .select('seconds')
      .eq('user_id', userId)
      .order('solved_at', { ascending: false })
      .limit(MAX);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ times: (data ?? []).map(r => r.seconds) });
    return;
  }

  if (req.method === 'POST') {
    const { userId, time } = req.body as { userId: string; time: number };
    if (!userId || typeof time !== 'number' || time <= 0) {
      res.status(400).json({ error: 'invalid payload' });
      return;
    }

    const { error: insertError } = await supabase
      .from('puzzle_times')
      .insert({ user_id: userId, seconds: time });

    if (insertError) { res.status(500).json({ error: insertError.message }); return; }

    const { data } = await supabase
      .from('puzzle_times')
      .select('seconds')
      .eq('user_id', userId)
      .order('solved_at', { ascending: false })
      .limit(MAX);

    res.json({ times: (data ?? []).map(r => r.seconds) });
    return;
  }

  res.status(405).end();
}
