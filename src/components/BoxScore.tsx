"use client";

import { useState } from "react";
import Link from "next/link";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { playerKey, useFavorites } from "@/lib/favorites";
import type { Boxscore, PlayerStats } from "@/lib/ncaa";

/**
 * Column widths are fixed so the whole line fits a phone without scrolling:
 * every stat gets exactly what its widest value needs, and the player name
 * takes whatever is left.
 */
const COLUMNS: {
  key: keyof PlayerStats;
  label: string;
  title: string;
  width: string;
}[] = [
  { key: "kills", label: "K", title: "Kills", width: "24px" },
  { key: "attackErrors", label: "E", title: "Attack errors", width: "24px" },
  { key: "attackAttempts", label: "TA", title: "Total attempts", width: "28px" },
  { key: "hittingPercentage", label: "PCT", title: "Hitting percentage", width: "40px" },
  { key: "assists", label: "A", title: "Assists", width: "26px" },
  { key: "digs", label: "D", title: "Digs", width: "26px" },
  { key: "serviceAces", label: "SA", title: "Service aces", width: "26px" },
  { key: "totalBlocks", label: "B", title: "Total blocks", width: "24px" },
  { key: "points", label: "PTS", title: "Points", width: "34px" },
];

const NAME_FADE = {
  maskImage: "linear-gradient(to right, #000 78%, rgb(0 0 0 / 0.25) 100%)",
  WebkitMaskImage: "linear-gradient(to right, #000 78%, rgb(0 0 0 / 0.25) 100%)",
};

function fmt(v: unknown) {
  if (v === null || v === undefined || v === "") return "–";
  return String(v);
}

export function BoxScore({ box }: { box: Boxscore }) {
  const favorites = useFavorites();
  // Names are clipped to keep each player on one line; tapping one opens it.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      {box.teams.map((team) => {
        const entry = box.teamBoxscore.find(
          (t) => String(t.teamId) === String(team.teamId),
        );
        const players = (entry?.playerStats ?? []).filter((p) => p.participated);
        if (players.length === 0) return null;

        return (
          <section key={team.teamId} className="panel rounded-2xl">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
              <TeamLogo seoname={team.seoname} label={team.nameShort} size={28} />
              <Link href={`/team/${team.seoname}`} className="text-[17px] font-bold">
                {team.nameShort}
              </Link>
              <span className="text-[14px] text-muted">{team.isHome ? "Home" : "Away"}</span>
              <StarButton
                kind="team"
                id={team.seoname}
                label={team.nameShort}
                size={18}
                className="ml-auto"
              />
            </div>

            <table className="w-full table-fixed text-right text-[12px] tabular-nums">
              <colgroup>
                <col />
                {COLUMNS.map((c) => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
                <col style={{ width: "24px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pl-3 text-left font-semibold">
                    Player
                  </th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} scope="col" title={c.title} className="px-0.5 py-2 font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const key = playerKey(team.seoname, p.firstName, p.lastName);
                  const fav = favorites.player.includes(key);
                  const open = !!expanded[key];
                  return (
                    <tr
                      key={key + p.number}
                      className={`border-b border-line-soft last:border-0 ${fav ? "bg-accent-soft" : ""}`}
                    >
                      <th scope="row" className="py-2 pl-3 text-left font-normal">
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                          aria-expanded={open}
                          title={`${p.firstName} ${p.lastName}`}
                          className={`block w-full text-left ${open ? "" : "overflow-hidden whitespace-nowrap"}`}
                          style={open ? undefined : NAME_FADE}
                        >
                          <span className="mr-1 text-[10px] tabular-nums text-faint">
                            {p.number ?? "–"}
                          </span>
                          <span className="text-[12.5px] font-semibold">
                            {p.firstName} {p.lastName}
                          </span>
                          {p.position ? (
                            <span className="ml-1 text-[10px] font-semibold uppercase text-faint">
                              {p.position}
                            </span>
                          ) : null}
                          {p.starter ? (
                            <span className="ml-1 text-[10px] font-semibold uppercase text-faint">
                              GS
                            </span>
                          ) : null}
                        </button>
                      </th>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="px-0.5 py-2">
                          {fmt(p[c.key])}
                        </td>
                      ))}
                      <td className="pr-1.5">
                        <StarButton
                          kind="player"
                          id={key}
                          label={`${p.firstName} ${p.lastName}`}
                          size={13}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {entry?.teamStats ? (
                <tfoot>
                  <tr className="bg-[#070f1c] text-[12px] font-bold">
                    <th scope="row" className="py-2.5 pl-3 text-left">
                      Team
                    </th>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="px-0.5 py-2.5">
                        {fmt((entry.teamStats as Record<string, unknown>)[c.key as string])}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </section>
        );
      })}
    </div>
  );
}
