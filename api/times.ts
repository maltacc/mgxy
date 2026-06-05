import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const MAX = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'GET') {
    const { userId, difficulty } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId required' });
      return;
    }
    let query = supabase
      .from('puzzle_times')
      .select('seconds')
      .eq('user_id', userId)
      .order('solved_at', { ascending: false })
      .limit(MAX);

    if (difficulty && typeof difficulty === 'string') {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;
    if (error) {
      console.error('GET puzzle_times error:', error);
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ times: (data ?? []).map(r => r.seconds) });
    return;
  }

  if (req.method === 'POST') {
    const { userId, time, name, picture, difficulty } = req.body as {
      userId: string; time: number; name?: string; picture?: string; difficulty?: string;
    };
    if (!userId || typeof time !== 'number' || time <= 0) {
      res.status(400).json({ error: 'invalid payload' });
      return;
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, name: name || `Player ${userId.slice(0, 6)}`, ...(picture ? { picture } : {}) }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('user_profiles upsert error:', profileError);
    }

    const { error: insertError } = await supabase
      .from('puzzle_times')
      .insert({ user_id: userId, seconds: time, difficulty: difficulty ?? 'hard' });

    if (insertError) {
      console.error('puzzle_times insert error:', insertError);
      res.status(500).json({ error: insertError.message });
      return;
    }

    const { data } = await supabase
      .from('puzzle_times')
      .select('seconds')
      .eq('user_id', userId)
      .eq('difficulty', difficulty ?? 'hard')
      .order('solved_at', { ascending: false })
      .limit(MAX);

    res.json({ times: (data ?? []).map(r => r.seconds) });
    return;
  }

  res.status(405).end();
}
