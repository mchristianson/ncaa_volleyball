"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Backdrop } from "@/components/Backdrop";
import { BoxScore } from "@/components/BoxScore";
import {
  BackButton,
  CalendarGlyph,
  ChartGlyph,
  DocGlyph,
  Empty,
  Header,
  Spinner,
  TrophyGlyph,
  TvGlyph,
} from "@/components/Header";
import { MomentumChart } from "@/components/MomentumChart";
import { PlayList } from "@/components/PlayList";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { TeamStatsCompare } from "@/components/TeamStatsCompare";
import { useGame, usePbp } from "@/lib/api";
import type { Boxscore, ContestTeam, GameInfo, PlayerStats } from "@/lib/ncaa";

type Tab = "summary" | "box" | "team" | "momentum" | "plays";

function Side({ team }: { team: ContestTeam | undefined }) {
  if (!team) return null;
  return (
    <div className="flex w-[34%] flex-col items-center gap-2 text-center">
      <TeamLogo seoname={team.seoname} label={team.name6Char} size={66} />
      <Link href={`/team/${team.seoname}`} className="text-[17px] font-bold leading-tight">
        {team.teamRank ? <span className="mr-1 text-accent">{team.teamRank}</span> : null}
        {team.nameShort}
      </Link>
      <span className="-mt-1 text-[13px] text-muted">{team.record ?? ""}</span>
      <StarButton kind="team" id={team.seoname} label={team.nameShort} size={20} />
    </div>
  );
}

function ScoreHeader({ info }: { info: GameInfo }) {
  const home = info.teams.find((t) => t.isHome) ?? info.teams[0];
  const away = info.teams.find((t) => !t.isHome) ?? info.teams[1];
  const live = info.statusCodeDisplay === "live";

  return (
    <div className="relative z-10 px-5 pt-1">
      <div className="flex items-start justify-between">
        <Side team={away} />
        <div className="flex flex-1 flex-col items-center pt-6">
          <div className="flex items-center gap-3 text-[46px] font-bold leading-none tabular-nums">
            <span className={away?.isWinner ? "" : "text-muted"}>{away?.score ?? "–"}</span>
            <span className="text-[26px] text-faint">:</span>
            <span className={home?.isWinner ? "" : "text-muted"}>{home?.score ?? "–"}</span>
          </div>
          <span
            className={`mt-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${
              live ? "text-live" : "text-muted"
            }`}
          >
            {live ? "Live · " : ""}
            {info.finalMessage || info.currentPeriod || info.startTime}
          </span>
        </div>
        <Side team={home} />
      </div>

      {info.linescores?.length ? (
        <div className="panel mt-5 overflow-hidden rounded-2xl">
          <table className="w-full text-center text-[15px] tabular-nums">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-[0.1em] text-muted">
                <th className="py-2.5 pl-4 text-left font-semibold">Sets</th>
                {info.linescores.map((_, i) => (
                  <th key={i} className="py-2.5 font-semibold">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[away, home].map((t, idx) => (
                <tr key={t?.teamId} className="border-b border-line-soft last:border-0">
                  <th scope="row" className="py-2.5 pl-4 text-left text-[15px] font-semibold">
                    {t?.name6Char}
                  </th>
                  {info.linescores.map((l, i) => {
                    const mine = idx === 0 ? Number(l.visit) : Number(l.home);
                    const theirs = idx === 0 ? Number(l.home) : Number(l.visit);
                    return (
                      <td
                        key={i}
                        className={`py-2.5 ${mine > theirs ? "font-bold" : "text-muted"}`}
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
      <Backdrop />
      <Header
        title={info.teams.map((t) => t.nameShort).join(" vs ")}
        subtitle={venue}
        back={<BackButton />}
        size="sm"
      />
      <ScoreHeader info={info} />

      <div className="no-scrollbar relative z-10 -mx-0 mt-5 flex gap-2 overflow-x-auto px-5">
        {tabs
          .filter((t) => t.on)
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition ${
                tab === t.id ? "accent-fill text-white" : "panel text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className="relative z-10 px-5 pt-4">
        {tab === "summary" && <Summary info={info} box={boxscore} />}
        {tab === "box" && boxscore && <BoxScore box={boxscore} />}
        {tab === "team" && teamStats && <TeamStatsCompare box={teamStats} />}
        {tab === "momentum" &&
          (pbpLoading ? <Spinner /> : pbp ? <MomentumChart pbp={pbp} /> : <Empty>No play-by-play.</Empty>)}
        {tab === "plays" &&
          (pbpLoading ? <Spinner /> : pbp ? <PlayList pbp={pbp} /> : <Empty>No play-by-play.</Empty>)}
        <div className="h-10" />
      </div>
    </>
  );
}

function Summary({ info, box }: { info: GameInfo; box: Boxscore | null }) {
  const leaders = matchLeaders(box);
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3">
        <Fact
          icon={CalendarGlyph}
          label="Start"
          value={
            info.startTimeEpoch
              ? new Date(info.startTimeEpoch * 1000).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "TBA"
          }
        />
        <Fact
          icon={TrophyGlyph}
          label="Status"
          value={info.finalMessage || info.currentPeriod || info.statusCodeDisplay}
        />
        {/* Secondary to the score, sets and stats above; absent entirely when
            NCAA has no broadcaster for the match. */}
        {info.broadcast ? (
          <Fact icon={TvGlyph} label="Broadcast" value={info.broadcast.network} />
        ) : null}
        <Fact icon={DocGlyph} label="Season" value={String(info.seasonYear)} />
      </dl>

      {leaders.length > 0 && (
        <div className="panel rounded-2xl">
          <h3 className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <span className="text-accent">{ChartGlyph}</span>
            <span className="text-[13px] font-bold uppercase tracking-[0.14em]">
              Match leaders
            </span>
          </h3>
          <ul>
            {leaders.map((l) => (
              <li
                key={l.label}
                className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3 last:border-0"
              >
                <span className="text-[15px] text-muted">{l.label}</span>
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="truncate text-[15px] font-medium">{l.name}</span>
                  <span className="text-[17px] font-bold tabular-nums">{l.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="panel rounded-2xl px-4 py-3">
      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 text-[15px] font-semibold">{value}</dd>
    </div>
  );
}

type Leader = { label: string; name: string; value: string };

function matchLeaders(box: Boxscore | null): Leader[] {
  const players = (box?.teamBoxscore ?? []).flatMap((t) => t.playerStats ?? []);
  if (players.length === 0) return [];
  const top = (key: keyof PlayerStats, label: string): Leader | null => {
    const best = players.reduce<PlayerStats | null>(
      (acc, p) =>
        acc === null || Number(p[key]) > Number(acc[key]) ? p : acc,
      null,
    );
    const value = best ? String(best[key]) : "";
    if (!best || !Number(value)) return null;
    return { label, name: `${best.firstName} ${best.lastName}`, value };
  };
  return [
    top("kills", "Kills"),
    top("assists", "Assists"),
    top("digs", "Digs"),
    top("totalBlocks", "Blocks"),
    top("serviceAces", "Aces"),
  ].filter((l): l is Leader => l !== null);
}
