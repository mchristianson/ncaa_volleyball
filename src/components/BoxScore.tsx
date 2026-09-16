"use client";

import Link from "next/link";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { playerKey, useFavorites } from "@/lib/favorites";
import type { Boxscore, PlayerStats } from "@/lib/ncaa";

const COLUMNS: { key: keyof PlayerStats; label: string; title: string }[] = [
  { key: "kills", label: "K", title: "Kills" },
  { key: "attackErrors", label: "E", title: "Attack errors" },
  { key: "attackAttempts", label: "TA", title: "Total attempts" },
  { key: "hittingPercentage", label: "PCT", title: "Hitting percentage" },
  { key: "assists", label: "A", title: "Assists" },
  { key: "digs", label: "D", title: "Digs" },
  { key: "serviceAces", label: "SA", title: "Service aces" },
  { key: "totalBlocks", label: "B", title: "Total blocks" },
  { key: "points", label: "PTS", title: "Points" },
];

function fmt(v: unknown) {
  if (v === null || v === undefined || v === "") return "–";
  return String(v);
}

export function BoxScore({ box }: { box: Boxscore }) {
  const favorites = useFavorites();

  return (
    <div className="space-y-6">
      {box.teams.map((team) => {
        const entry = box.teamBoxscore.find(
          (t) => String(t.teamId) === String(team.teamId),
        );
        const players = (entry?.playerStats ?? []).filter((p) => p.participated);
        if (players.length === 0) return null;

        return (
          <section key={team.teamId}>
            <div className="mb-2 flex items-center gap-2 px-1">
              <TeamLogo seoname={team.seoname} label={team.nameShort} size={22} />
              <Link href={`/team/${team.seoname}`} className="font-semibold">
                {team.nameShort}
              </Link>
              <span className="text-xs text-muted">{team.isHome ? "Home" : "Away"}</span>
              <StarButton
                kind="team"
                id={team.seoname}
                label={team.nameShort}
                size={15}
                className="ml-auto"
              />
            </div>

            <div className="no-scrollbar overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[520px] text-right text-[13px] tabular-nums">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                    <th scope="col" className="sticky left-0 z-10 bg-surface py-2 pl-3 text-left font-semibold">
                      Player
                    </th>
                    {COLUMNS.map((c) => (
                      <th key={c.key} scope="col" title={c.title} className="px-2 py-2 font-semibold">
                        {c.label}
                      </th>
                    ))}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => {
                    const key = playerKey(team.seoname, p.firstName, p.lastName);
                    const fav = favorites.player.includes(key);
                    return (
                      <tr
                        key={key + p.number}
                        className={`border-b border-line/60 last:border-0 ${fav ? "bg-accent-soft" : ""}`}
                      >
                        <th
                          scope="row"
                          className={`sticky left-0 z-10 py-2 pl-3 text-left font-medium ${fav ? "bg-accent-soft" : "bg-surface"}`}
                        >
                          <span className="mr-1.5 font-mono text-[11px] text-muted">
                            {p.number ?? "–"}
                          </span>
                          {p.firstName} {p.lastName}
                          {p.starter ? (
                            <span className="ml-1 text-[10px] text-muted">GS</span>
                          ) : null}
                          {p.position ? (
                            <span className="ml-1 text-[10px] text-muted">{p.position}</span>
                          ) : null}
                        </th>
                        {COLUMNS.map((c) => (
                          <td key={c.key} className="px-2 py-2">
                            {fmt(p[c.key])}
                          </td>
                        ))}
                        <td className="pr-1">
                          <StarButton
                            kind="player"
                            id={key}
                            label={`${p.firstName} ${p.lastName}`}
                            size={14}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {entry?.teamStats ? (
                  <tfoot>
                    <tr className="bg-surface-2 text-[12px] font-semibold">
                      <th scope="row" className="sticky left-0 z-10 bg-surface-2 py-2 pl-3 text-left">
                        Team
                      </th>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="px-2 py-2">
                          {fmt((entry.teamStats as Record<string, unknown>)[c.key as string])}
                        </td>
                      ))}
                      <td />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
