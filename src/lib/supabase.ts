import { createClient } from "@supabase/supabase-js";
import type { Difficulty } from "../hooks/useGame";

export interface LeaderboardPlayer {
  userId: string;
  name: string;
  times: number[];
  avg: number;
  best: number;
  solveCount: number;
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
);

const MAX = 30;

export async function fetchLeaderboard(
  excludeUserId?: string,
): Promise<LeaderboardPlayer[]> {
  const { data, error } = await supabase.from("puzzle_times").select(`
      user_id,
      seconds,
      user_profiles (name)
    `);

  if (error || !data) return [];

  // Map to group data by user
  const byUser = new Map<string, { name: string; times: number[] }>();

  for (const row of data) {
    const userId = row.user_id as string;
    if (excludeUserId && userId === excludeUserId) continue;

    const entry = byUser.get(userId) ?? {
      name: (row.user_profiles as any)?.name ?? `Player ${userId.slice(0, 6)}`,
      times: [] as number[],
    };

    entry.times.push(row.seconds as number);
    byUser.set(userId, entry);
  }

  return [...byUser.entries()]
    .map(([userId, { name, times }]) => {
      // Get the most recent MAX solves
      const sortedTimes = [...times].sort((a, b) => b - a).slice(0, MAX);
      const avg = Math.round(
        sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length,
      );

      return {
        userId,
        name,
        times: sortedTimes,
        avg,
        best: Math.min(...sortedTimes),
        solveCount: times.length,
      };
    })
    .sort((a, b) => a.avg - b.avg);
}

export async function postSolveTime(
  userId: string,
  seconds: number,
  difficulty: Difficulty,
  name?: string,
): Promise<number[]> {
  // 1. Ensure the profile exists first.
  // We use upsert so that if the user already has a profile, it just updates (or does nothing).
  // This satisfies the Foreign Key requirement.
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, name: name ?? "Anonymous" });

  if (profileError) {
    console.error("Profile Upsert Error:", profileError);
    // You might want to handle this, but keep going to attempt the time insert
  }

  // 2. Now insert the puzzle time
  const { error: timeError } = await supabase
    .from("puzzle_times")
    .insert([{ user_id: userId, seconds, difficulty }]);

  if (timeError) {
    console.error("Time Insert Error:", timeError);
    throw timeError;
  }

  return fetchTimes(userId, difficulty);
}

export async function fetchTimes(
  userId: string,
  difficulty: Difficulty,
): Promise<number[]> {
  const { data, error } = await supabase
    .from("puzzle_times")
    .select("seconds")
    .eq("user_id", userId)
    .eq("difficulty", difficulty)
    .order("solved_at", { ascending: false })
    .limit(MAX);

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return (data ?? []).map((r) => r.seconds as number);
}
