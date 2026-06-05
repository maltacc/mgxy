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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const excludeUserId = typeof req.query.excludeUserId === 'string' ? req.query.excludeUserId : null;

  const [{ data: rows, error: timesError }, { data: profiles }] = await Promise.all([
    supabase.from('puzzle_times').select('user_id, seconds, difficulty, solved_at').order('solved_at', { ascending: false }),
    supabase.from('user_profiles').select('user_id, name, picture'),
  ]);

  if (timesError) {
    res.status(500).json({ error: timesError.message });
    return;
  }

  const profileMap = new Map((profiles ?? []).map(p => [
    p.user_id as string,
    { name: p.name as string, picture: p.picture as string | null },
  ]));

  const byUser = new Map<string, { hard: number[]; minimal: number[]; latestTime: number | null }>();

  for (const row of rows ?? []) {
    const uid = row.user_id as string;
    if (excludeUserId && uid === excludeUserId) continue;
    const entry = byUser.get(uid) ?? { hard: [], minimal: [], latestTime: null };
    if (entry.latestTime === null) entry.latestTime = row.seconds as number;
    if (row.difficulty === 'hard' && entry.hard.length < MAX) entry.hard.push(row.seconds as number);
    else if (row.difficulty === 'minimal' && entry.minimal.length < MAX) entry.minimal.push(row.seconds as number);
    byUser.set(uid, entry);
  }

  const players = [...byUser.entries()]
    .map(([userId, { hard, minimal, latestTime }]) => {
      const all = [...hard, ...minimal];
      if (all.length === 0) return null;
      const avg = Math.round(all.reduce((a, b) => a + b, 0) / all.length);
      const profile = profileMap.get(userId);
      return {
        userId,
        name: profile?.name ?? `Player ${userId.slice(0, 6)}`,
        picture: profile?.picture ?? undefined,
        hardTimes: hard,
        minimalTimes: minimal,
        latestTime: latestTime ?? 0,
        avg,
        best: Math.min(...all),
        solveCount: all.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.avg - b!.avg);

  res.json({ players });
}
