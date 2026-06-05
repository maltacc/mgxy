const MAX = 30;
const API = '/api/times';

async function apiGet(userId: string): Promise<number[]> {
  const res = await fetch(`${API}?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `GET ${API} failed (${res.status})`);
  }
  const { times } = (await res.json()) as { times: number[] };
  return times;
}

async function apiPost(userId: string, seconds: number): Promise<number[]> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, time: seconds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `POST ${API} failed (${res.status})`);
  }
  const { times } = (await res.json()) as { times: number[] };
  return times;
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

function localPost(userId: string, seconds: number): number[] {
  if (typeof localStorage === 'undefined') return [];
  const key = 'tango_games';
  const raw = localStorage.getItem(key) || '[]';
  const arr = JSON.parse(raw) as Array<{ userId: string; seconds: number; completedAt: number }>;
  arr.push({ userId, seconds, completedAt: Date.now() });
  localStorage.setItem(key, JSON.stringify(arr));
  return arr.map(r => r.seconds).slice(-MAX).reverse();
}

export async function postSolveTime(userId: string, seconds: number): Promise<number[]> {
  try {
    return await apiPost(userId, seconds);
  } catch (err) {
    console.error('postSolveTime failed, falling back to localStorage:', err);
    return localPost(userId, seconds);
  }
}

export async function fetchTimes(userId: string): Promise<number[]> {
  try {
    return await apiGet(userId);
  } catch (err) {
    console.error('fetchTimes failed, falling back to localStorage:', err);
    return localGet(userId);
  }
}
