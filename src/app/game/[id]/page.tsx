"use client";

import { use, useState } from "react";
import Link from "next/link";
import { BoxScore } from "@/components/BoxScore";
import { BackButton, Empty, Header, Spinner } from "@/components/Header";
import { MomentumChart } from "@/components/MomentumChart";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { TeamStatsCompare } from "@/components/TeamStatsCompare";
import { useGame, usePbp } from "@/lib/api";
import { safeColor } from "@/lib/format";
import type { ContestTeam, GameInfo } from "@/lib/ncaa";

type Tab = "summary" | "box" | "team" | "momentum" | "plays";

function Side({ team }: { team: ContestTeam | undefined }) {
  if (!team) return null;
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
      <TeamLogo seoname={team.seoname} label={team.name6Char} size={48} />
      <Link href={`/team/${team.seoname}`} className="text-sm font-semibold leading-tight">
        {team.teamRank ? <span className="mr-1 text-accent">{team.teamRank}</span> : null}
        {team.nameShort}
      </Link>
      <span className="text-[11px] text-muted">{team.record ?? ""}</span>
      <StarButton kind="team" id={team.seoname} label={team.nameShort} size={16} />
    </div>
  );
}

function ScoreHeader({ info }: { info: GameInfo }) {
  const home = info.teams.find((t) => t.isHome) ?? info.teams[0];
  const away = info.teams.find((t) => !t.isHome) ?? info.teams[1];
  const live = info.statusCodeDisplay === "live";

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex items-center gap-2">
        <Side team={away} />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 font-mono text-4xl font-bold tabular-nums">
            <span className={away?.isWinner ? "" : "text-muted"}>{away?.score ?? "–"}</span>
            <span className="text-xl text-muted">:</span>
            <span className={home?.isWinner ? "" : "text-muted"}>{home?.score ?? "–"}</span>
          </div>
          <span
            className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${live ? "text-live" : "text-muted"}`}
          >
            {live ? "Live · " : ""}
            {info.finalMessage || info.currentPeriod || info.startTime}
          </span>
        </div>
        <Side team={home} />
      </div>

      {info.linescores?.length ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-center text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase text-muted">
                <th className="py-1.5 pl-3 text-left font-semibold">Sets</th>
                {info.linescores.map((l, i) => (
                  <th key={i} className="py-1.5 font-semibold">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[away, home].map((t, idx) => (
                <tr key={t?.teamId} className="border-b border-line/60 last:border-0">
                  <th scope="row" className="py-1.5 pl-3 text-left font-medium">
                    {t?.name6Char}
                  </th>
                  {info.linescores.map((l, i) => {
                    const mine = idx === 0 ? Number(l.visit) : Number(l.home);
                    const theirs = idx === 0 ? Number(l.home) : Number(l.visit);
                    return (
                      <td
                        key={i}
                        className={`py-1.5 ${mine > theirs ? "font-bold" : "text-muted"}`}
                      >
                        {mine}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("summary");
  const { data, isLoading, isError } = useGame(id);
  const { data: pbp, isLoading: pbpLoading } = usePbp(
    id,
    (tab === "momentum" || tab === "plays") && !!data?.info.hasPbp,
  );

  if (isLoading) return <Spinner />;
  if (isError || !data) return <Empty>Couldn&apos;t load this match.</Empty>;

  const { info, boxscore, teamStats } = data;
  const venue = info.location
    ? [info.location.venue, info.location.city, info.location.stateUsps]
        .filter(Boolean)
        .join(", ")
    : null;

  const tabs: { id: Tab; label: string; on: boolean }[] = [
    { id: "summary", label: "Summary", on: true },
    { id: "box", label: "Box score", on: !!boxscore },
    { id: "team", label: "Team stats", on: !!teamStats },
    { id: "momentum", label: "Momentum", on: info.hasPbp },
    { id: "plays", label: "Plays", on: info.hasPbp },
  ];

  return (
    <>
      <Header
        title={info.teams.map((t) => t.nameShort).join(" vs ")}
        subtitle={venue}
        back={<BackButton />}
      />
      <ScoreHeader info={info} />

      <div className="no-scrollbar sticky top-[68px] z-10 flex gap-1 overflow-x-auto border-b border-line bg-bg/85 px-4 pb-2 backdrop-blur">
        {tabs
          .filter((t) => t.on)
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                tab === t.id ? "bg-accent text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className="px-4 pt-4">
        {tab === "summary" && <Summary info={info} box={boxscore} />}
        {tab === "box" && boxscore && <BoxScore box={boxscore} />}
        {tab === "team" && teamStats && <TeamStatsCompare box={teamStats} />}
        {tab === "momentum" &&
          (pbpLoading ? <Spinner /> : pbp ? <MomentumChart pbp={pbp} /> : <Empty>No play-by-play.</Empty>)}
        {tab === "plays" &&
          (pbpLoading ? <Spinner /> : pbp ? <PlayList pbp={pbp} /> : <Empty>No play-by-play.</Empty>)}
        <div className="h-8" />
      </div>
    </>
  );
}

function Summary({
  info,
  box,
}: {
  info: GameInfo;
  box: { teamBoxscore: { teamId: string | number; playerStats?: unknown[] }[] } | null;
}) {
  const leaders = matchLeaders(box as never);
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Fact label="Start" value={info.startTime ? new Date(info.startTimeEpoch * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "TBA"} />
        <Fact label="Status" value={info.finalMessage || info.currentPeriod || info.statusCodeDisplay} />
        {info.network ? <Fact label="TV" value={info.network} /> : null}
        <Fact label="Season" value={String(info.seasonYear)} />
      </dl>
      {leaders.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Match leaders
          </h3>
          <ul className="space-y-1.5 text-sm">
            {leaders.map((l) => (
              <li key={l.label} className="flex justify-between gap-3">
                <span className="text-muted">{l.label}</span>
                <span className="truncate font-medium">
                  {l.name} <span className="font-mono tabular-nums">{l.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="truncate text-[13px] font-medium">{value}</dd>
    </div>
  );
}

type Leader = { label: string; name: string; value: string };

function matchLeaders(box: { teamBoxscore?: { playerStats?: Record<string, string>[] }[] } | null): Leader[] {
  if (!box?.teamBoxscore) return [];
  const players = box.teamBoxscore.flatMap((t) => t.playerStats ?? []);
  if (players.length === 0) return [];
  const top = (key: string, label: string): Leader | null => {
    const best = players.reduce<Record<string, string> | null>(
      (acc, p) => (acc === null || Number(p[key]) > Number(acc[key]) ? p : acc),
      null,
    );
    if (!best || !Number(best[key])) return null;
    return { label, name: `${best.firstName} ${best.lastName}`, value: best[key] };
  };
  return [
    top("kills", "Kills"),
    top("assists", "Assists"),
    top("digs", "Digs"),
    top("totalBlocks", "Blocks"),
    top("serviceAces", "Aces"),
  ].filter((l): l is Leader => l !== null);
}

function PlayList({ pbp }: { pbp: import("@/lib/ncaa").Pbp }) {
  return (
    <div className="space-y-5">
      {pbp.periods.map((period) => (
        <section key={String(period.periodNumber)}>
          <h3 className="pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            {period.periodDisplay || `Set ${period.periodNumber}`}
          </h3>
          <ol className="overflow-hidden rounded-2xl border border-line bg-surface">
            {(period.playbyplayStats ?? []).flatMap((group, gi) =>
              (group.plays ?? []).map((play, pi) => {
                const team = pbp.teams.find(
                  (t) => String(t.teamId) === String(group.teamId),
                );
                return (
                  <li
                    key={`${gi}-${pi}`}
                    className="flex gap-3 border-b border-line/60 px-3 py-2 text-[13px] last:border-0"
                  >
                    <span className="w-12 shrink-0 font-mono text-[12px] tabular-nums text-muted">
                      {play.homeScore !== null ? `${play.visitorScore}-${play.homeScore}` : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      {team ? (
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                          style={{ background: safeColor(team.color) }}
                          aria-label={team.nameShort}
                        />
                      ) : null}
                      {play.playText}
                    </span>
                  </li>
                );
              }),
            )}
          </ol>
        </section>
      ))}
    </div>
  );
}
