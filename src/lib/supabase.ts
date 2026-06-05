const MAX = 30;
const TIMES_API = '/api/times';
const LEADERBOARD_API = '/api/leaderboard';

export interface LeaderboardPlayer {
  userId: string;
  name: string;
  times: number[];
  avg: number;
  best: number;
  solveCount: number;
}

async function apiGet(userId: string): Promise<number[]> {
  const res = await fetch(`${TIMES_API}?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `GET ${TIMES_API} failed (${res.status})`);
  }
  const { times } = (await res.json()) as { times: number[] };
  return times;
}

async function apiPost(userId: string, seconds: number, name?: string): Promise<number[]> {
  const res = await fetch(TIMES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, time: seconds, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `POST ${TIMES_API} failed (${res.status})`);
  }
  const { times } = (await res.json()) as { times: number[] };
  return times;
}

async function apiLeaderboard(excludeUserId?: string): Promise<LeaderboardPlayer[]> {
  const qs = excludeUserId ? `?excludeUserId=${encodeURIComponent(excludeUserId)}` : '';
  const res = await fetch(`${LEADERBOARD_API}${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `GET ${LEADERBOARD_API} failed (${res.status})`);
  }
  const { players } = (await res.json()) as { players: LeaderboardPlayer[] };
  return players;
}

function localGet(userId: string): number[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem('tango_games') || '[]';
  const arr = JSON.parse(raw) as Array<{ userId?: string; seconds: number }>;
  return arr
    .filter(r => !r.userId || r.userId === userId)
    .map(r => r.seconds)
    .slice(-MAX)
    .reverse();
}

function localPost(userId: string, seconds: number, name?: string): number[] {
  if (typeof localStorage === 'undefined') return [];
  const key = 'tango_games';
  const raw = localStorage.getItem(key) || '[]';
  const arr = JSON.parse(raw) as Array<{ userId: string; seconds: number; completedAt: number; name?: string }>;
  arr.push({ userId, seconds, completedAt: Date.now(), name });
  localStorage.setItem(key, JSON.stringify(arr));
  return arr.map(r => r.seconds).slice(-MAX).reverse();
}

function localLeaderboard(excludeUserId?: string): LeaderboardPlayer[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem('tango_games') || '[]';
  const arr = JSON.parse(raw) as Array<{ userId: string; seconds: number; name?: string }>;
  const byUser = new Map<string, { name?: string; times: number[] }>();

  for (const row of arr) {
    if (excludeUserId && row.userId === excludeUserId) continue;
    const entry = byUser.get(row.userId) ?? { name: row.name, times: [] };
    if (entry.times.length < MAX) entry.times.unshift(row.seconds);
    if (row.name) entry.name = row.name;
    byUser.set(row.userId, entry);
  }

  return [...byUser.entries()]
    .map(([userId, { name, times }]) => {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      return {
        userId,
        name: name ?? `Player ${userId.slice(0, 6)}`,
        times,
        avg,
        best: Math.min(...times),
        solveCount: times.length,
      };
    })
    .sort((a, b) => a.avg - b.avg);
}

export async function postSolveTime(userId: string, seconds: number, name?: string): Promise<number[]> {
  try {
    return await apiPost(userId, seconds, name);
  } catch {
    return localPost(userId, seconds, name);
  }
}

export async function fetchTimes(userId: string): Promise<number[]> {
  try {
    return await apiGet(userId);
  } catch {
    return localGet(userId);
  }
}

export async function fetchLeaderboard(excludeUserId?: string): Promise<LeaderboardPlayer[]> {
  try {
    return await apiLeaderboard(excludeUserId);
  } catch {
    return localLeaderboard(excludeUserId);
  }
}
