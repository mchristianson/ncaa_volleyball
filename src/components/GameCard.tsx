"use client";

import Link from "next/link";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import type { ScoreboardGame, ScoreboardTeam } from "@/lib/ncaa";
import { homeAway, isFinal, isLive, startLabel, statusLabel, teamScore } from "@/lib/format";

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
      <TeamLogo seoname={team.seoname} label={team.name6Char} size={30} />
      <span className={`min-w-0 flex-1 truncate text-[16px] ${dim ? "text-muted" : "font-semibold"}`}>
        {team.teamRank ? (
          <span className="mr-1.5 font-bold text-accent">{team.teamRank}</span>
        ) : null}
        {team.nameShort}
      </span>
      {score !== null ? (
        <span
          className={`w-5 text-right text-[17px] font-bold tabular-nums ${
            live ? "text-live" : dim ? "text-muted" : ""
          }`}
        >
          {score}
        </span>
      ) : null}
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
  const scheduled = !live && !final;

  return (
    <Link
      href={`/game/${game.contestId}`}
      className={`panel flex items-center gap-3 rounded-2xl px-3.5 py-3.5 transition active:scale-[0.99] ${
        pinned ? "border-accent/45" : ""
      }`}
    >
      {/* When / where to watch */}
      <div className="w-[76px] shrink-0">
        {live ? (
          <span className="flex items-center gap-1.5 text-[14px] font-bold text-live">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
            {game.currentPeriod || "Live"}
          </span>
        ) : (
          <span
            className={`block text-[14px] font-semibold ${final ? "text-muted" : "text-ink"}`}
          >
            {scheduled ? startLabel(game) : statusLabel(game)}
          </span>
        )}
        {showDate ? (
          <span className="mt-0.5 block text-[12px] text-faint">
            {new Date(game.startTimeEpoch * 1000).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : null}
        {game.broadcasterName ? (
          <span className="mt-0.5 block truncate text-[12px] uppercase tracking-wide text-faint">
            {game.broadcasterName}
          </span>
        ) : null}
        {game.isChampionship ? (
          <span className="mt-1 inline-block rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
            NCAA
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <TeamRow team={away} live={live} final={final} />
        <TeamRow team={home} live={live} final={final} />
      </div>

      <span className="h-14 w-px shrink-0 bg-line" aria-hidden />

      {/* One star per team, aligned with its row. The design shows a single
          star here, but a match has two teams and either may be the one worth
          following, so the column carries both. */}
      <div className="flex shrink-0 flex-col gap-2.5">
        {[away, home].map((t, i) => (
          <span key={t?.seoname ?? i} className="grid h-[30px] place-items-center">
            <StarButton
              kind="team"
              id={t?.seoname ?? ""}
              label={t?.nameShort ?? ""}
              size={19}
            />
          </span>
        ))}
      </div>
    </Link>
  );
}
