import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
);

const MAX = 30;

export async function postSolveTime(userId: string, seconds: number): Promise<number[]> {
  try {
    const { data, error } = await supabase.from('puzzle_times').insert({ user_id: userId, seconds });
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    // If insert returned data, continue to fetch latest times
    return fetchTimes(userId);
  } catch (err) {
    console.error('postSolveTime failed, falling back to localStorage:', err);
    // Supabase failed (likely not configured in local dev). Fall back to localStorage.
    try {
      if (typeof localStorage !== 'undefined') {
        const key = 'tango_games';
        const raw = localStorage.getItem(key) || '[]';
        const arr = JSON.parse(raw);
        arr.push({ userId, seconds, completedAt: Date.now() });
        localStorage.setItem(key, JSON.stringify(arr));
        return arr.map((r: any) => r.seconds as number).slice(-MAX).reverse();
      }
    } catch (e) {
      console.error('localStorage fallback failed:', e);
    }
    return [];
  }
}

export async function fetchTimes(userId: string): Promise<number[]> {
  const { data } = await supabase
    .from('puzzle_times')
    .select('seconds')
    .eq('user_id', userId)
    .order('solved_at', { ascending: false })
    .limit(MAX);
  if (data && Array.isArray(data)) return data.map(r => r.seconds as number);

  // Fallback to localStorage when supabase isn't available or returns no data
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tango_games') || '[]';
      const arr = JSON.parse(raw) as Array<any>;
      // filter by userId if stored
      const filtered = arr.filter(r => !r.userId || r.userId === userId);
      const secondsArr = filtered.map(r => r.seconds as number).slice(0, MAX);
      return secondsArr;
    }
  } catch {}

  return [];
}
