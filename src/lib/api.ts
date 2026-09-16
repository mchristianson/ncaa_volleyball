"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Boxscore,
  GameInfo,
  Pbp,
  RankingPoll,
  ScoreboardGame,
} from "@/lib/ncaa";

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Live games change fast; everything else can idle. */
const LIVE_POLL = 20_000;

export function useScoreboard(date: string) {
  return useQuery({
    queryKey: ["scoreboard", date],
    queryFn: () => json<{ date: string; games: ScoreboardGame[] }>(`/api/scoreboard?date=${date}`),
    refetchInterval: (q) => {
      const games = q.state.data?.games ?? [];
      return games.some((g) => g.statusCodeDisplay === "live") ? LIVE_POLL : false;
    },
  });
}

export function useGame(id: string) {
  return useQuery({
    queryKey: ["game", id],
    queryFn: () =>
      json<{ info: GameInfo; boxscore: Boxscore | null; teamStats: Boxscore | null }>(
        `/api/game/${id}`,
      ),
    refetchInterval: (q) =>
      q.state.data?.info.statusCodeDisplay === "live" ? LIVE_POLL : false,
  });
}

export function usePbp(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["pbp", id],
    queryFn: () => json<Pbp>(`/api/game/${id}/pbp`),
    enabled,
    refetchInterval: (q) => (q.state.data?.status === "live" ? LIVE_POLL : false),
  });
}

export function useRankings(poll: string) {
  return useQuery({
    queryKey: ["rankings", poll],
    queryFn: () => json<RankingPoll>(`/api/rankings?poll=${poll}`),
    staleTime: 30 * 60_000,
  });
}

export function useTeamSchedule(seoname: string) {
  return useQuery({
    queryKey: ["team", seoname],
    queryFn: () => json<{ seoname: string; games: ScoreboardGame[] }>(`/api/team/${seoname}`),
    staleTime: 5 * 60_000,
  });
}
