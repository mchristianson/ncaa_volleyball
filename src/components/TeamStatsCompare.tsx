"use client";

import { TeamLogo } from "@/components/TeamLogo";
import type { Boxscore } from "@/lib/ncaa";

const ROWS: { key: string; label: string }[] = [
  { key: "kills", label: "Kills" },
  { key: "attackErrors", label: "Attack errors" },
  { key: "attackAttempts", label: "Attack attempts" },
  { key: "hittingPercentage", label: "Hitting %" },
  { key: "assists", label: "Assists" },
  { key: "digs", label: "Digs" },
  { key: "serviceAces", label: "Aces" },
  { key: "serviceErrors", label: "Service errors" },
  { key: "totalBlocks", label: "Blocks" },
  { key: "receptionErrors", label: "Reception errors" },
  { key: "points", label: "Points" },
];

export function TeamStatsCompare({ box }: { box: Boxscore }) {
  const home = box.teams.find((t) => t.isHome) ?? box.teams[0];
  const away = box.teams.find((t) => !t.isHome) ?? box.teams[1];
  const stats = (teamId: string | number | undefined) =>
    (box.teamBoxscore.find((t) => String(t.teamId) === String(teamId))?.teamStats ??
      {}) as Record<string, string | null>;

  const h = stats(home?.teamId);
  const a = stats(away?.teamId);

  if (Object.keys(h).length === 0 && Object.keys(a).length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No team stats yet.</p>;
  }

  return (
    <div className="panel rounded-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <span className="flex items-center gap-2.5 text-[16px] font-bold">
          <TeamLogo seoname={away?.seoname} label={away?.nameShort ?? ""} size={28} />
          {away?.nameShort}
        </span>
        <span className="flex items-center gap-2.5 text-[16px] font-bold">
          {home?.nameShort}
          <TeamLogo seoname={home?.seoname} label={home?.nameShort ?? ""} size={28} />
        </span>
      </div>

      <ul>
        {ROWS.map((row) => {
          const av = Number(a[row.key] ?? NaN);
          const hv = Number(h[row.key] ?? NaN);
          const total = (Number.isFinite(av) ? av : 0) + (Number.isFinite(hv) ? hv : 0);
          // Share of the row's total, so the split bar reads as "who had more".
          // On an errors row more is worse — the numbers carry that, not the bar.
          const pct = total > 0 ? (av / total) * 100 : 50;
          return (
            <li key={row.key} className="border-b border-line-soft px-4 py-3 last:border-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="w-16 text-[19px] font-bold tabular-nums">
                  {a[row.key] ?? "–"}
                </span>
                <span className="flex-1 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {row.label}
                </span>
                <span className="w-16 text-right text-[19px] font-bold tabular-nums">
                  {h[row.key] ?? "–"}
                </span>
              </div>
              <div
                className="mt-2 flex h-2 overflow-hidden rounded-full"
                role="img"
                aria-label={`${row.label}: ${away?.nameShort} ${a[row.key] ?? "–"}, ${home?.nameShort} ${h[row.key] ?? "–"}`}
              >
                <span
                  className="bg-gradient-to-r from-[#707372] to-[#b2b4b2]"
                  style={{ width: `${pct}%` }}
                />
                <span className="flex-1 bg-gradient-to-r from-[#005ca9] to-[#6cace4]" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
