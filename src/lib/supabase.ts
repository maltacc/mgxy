import type { Difficulty } from "../hooks/useGame";

export interface LeaderboardPlayer {
  userId: string;
  name: string;
  picture?: string;
  hardTimes: number[];
  minimalTimes: number[];
  latestTime: number;
  avg: number;
  best: number;
  solveCount: number;
}

export async function fetchLeaderboard(
  excludeUserId?: string,
): Promise<LeaderboardPlayer[]> {
  const params = excludeUserId
    ? new URLSearchParams({ excludeUserId })
    : new URLSearchParams();
  const res = await fetch(`/api/leaderboard?${params}`);
  if (!res.ok) return [];
  const { players } = await res.json();
  return players;
}

export async function postSolveTime(
  userId: string,
  seconds: number,
  difficulty: Difficulty,
  name?: string,
  picture?: string,
): Promise<number[]> {
  const res = await fetch("/api/times", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, time: seconds, difficulty, name, picture }),
  });
  if (!res.ok) throw new Error("Failed to save time");
  const { times } = await res.json();
  return times;
}

export async function fetchTimes(
  userId: string,
  difficulty: Difficulty,
): Promise<number[]> {
  const params = new URLSearchParams({ userId, difficulty });
  const res = await fetch(`/api/times?${params}`);
  if (!res.ok) return [];
  const { times } = await res.json();
  return times;
}
