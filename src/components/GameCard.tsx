"use client";

import Link from "next/link";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import type { ScoreboardGame, ScoreboardTeam } from "@/lib/ncaa";
import { homeAway, isFinal, isLive, statusLabel, teamScore } from "@/lib/format";

function TeamRow({
  team,
  live,
  final,
}: {
  team: ScoreboardTeam | undefined;
  live: boolean;
  final: boolean;
}) {
  if (!team) return null;
  // A scheduled or postponed match reports 0-0; showing that reads as a result.
  const score = live || final ? teamScore(team) : null;
  const dim = final && !team.isWinner;
  return (
    <div className="flex items-center gap-2.5">
      <TeamLogo seoname={team.seoname} label={team.name6Char} size={28} />
      <span className={`min-w-0 flex-1 truncate text-[15px] ${dim ? "text-muted" : "font-semibold"}`}>
        {team.teamRank ? (
          <span className="mr-1 text-xs font-bold text-accent">{team.teamRank}</span>
        ) : null}
        {team.nameShort}
      </span>
      <span
        className={`w-6 text-right font-mono text-[17px] tabular-nums ${
          dim ? "text-muted" : "font-semibold"
        } ${live ? "text-live" : ""}`}
      >
        {score ?? ""}
      </span>
      <StarButton kind="team" id={team.seoname} label={team.nameShort} size={16} />
    </div>
  );
}

export function GameCard({
  game,
  pinned,
  showDate,
}: {
  game: ScoreboardGame;
  pinned?: boolean;
  showDate?: boolean;
}) {
  const { home, away } = homeAway(game);
  const live = isLive(game);
  const final = isFinal(game);

  return (
    <Link
      href={`/game/${game.contestId}`}
      className={`block rounded-2xl border bg-surface p-3 transition active:scale-[0.99] ${
        pinned ? "border-accent/40 ring-1 ring-accent/15" : "border-line"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide">
        {live ? (
          <span className="flex items-center gap-1.5 text-live">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
            {statusLabel(game)}
          </span>
        ) : (
          <span className={final ? "text-muted" : "text-ink"}>{statusLabel(game)}</span>
        )}
        {showDate ? (
          <span className="text-muted">
            {new Date(game.startTimeEpoch * 1000).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : null}
        {game.broadcasterName ? (
          <span className="text-muted">· {game.broadcasterName}</span>
        ) : null}
        {game.isChampionship ? (
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">NCAA</span>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <TeamRow team={away} live={live} final={final} />
        <TeamRow team={home} live={live} final={final} />
      </div>
    </Link>
  );
}
