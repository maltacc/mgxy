import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

const MAX = 30;

export interface LeaderboardPlayer {
  userId: string;
  name: string;
  times: number[];
  avg: number;
  best: number;
  solveCount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const excludeUserId = typeof req.query.excludeUserId === 'string' ? req.query.excludeUserId : null;

  const { data: rows, error: timesError } = await supabase
    .from('puzzle_times')
    .select('user_id, seconds, solved_at')
    .order('solved_at', { ascending: false });

  if (timesError) {
    res.status(500).json({ error: timesError.message });
    return;
  }

  const { data: profiles } = await supabase.from('user_profiles').select('user_id, name');
  const names = new Map((profiles ?? []).map(p => [p.user_id, p.name as string]));
  const byUser = new Map<string, number[]>();

  for (const row of rows ?? []) {
    const uid = row.user_id as string;
    if (excludeUserId && uid === excludeUserId) continue;
    const list = byUser.get(uid) ?? [];
    if (list.length < MAX) list.push(row.seconds as number);
    byUser.set(uid, list);
  }

  const players: LeaderboardPlayer[] = [...byUser.entries()]
    .map(([userId, times]) => {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      return {
        userId,
        name: names.get(userId) ?? `Player ${userId.slice(0, 6)}`,
        times,
        avg,
        best: Math.min(...times),
        solveCount: times.length,
      };
    })
    .sort((a, b) => a.avg - b.avg);

  res.json({ players });
}
