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
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <TeamLogo seoname={away?.seoname} label={away?.nameShort ?? ""} size={20} />
          {away?.nameShort}
        </span>
        <span className="flex items-center gap-2">
          {home?.nameShort}
          <TeamLogo seoname={home?.seoname} label={home?.nameShort ?? ""} size={20} />
        </span>
      </div>
      <ul>
        {ROWS.map((row) => {
          const av = Number(a[row.key] ?? NaN);
          const hv = Number(h[row.key] ?? NaN);
          const total = (Number.isFinite(av) ? av : 0) + (Number.isFinite(hv) ? hv : 0);
          const pct = total > 0 ? (av / total) * 100 : 50;
          // Errors are bad: the bar still shows share, the label carries meaning.
          return (
            <li key={row.key} className="border-b border-line/60 px-4 py-2.5 last:border-0">
              <div className="flex items-baseline justify-between text-[13px] tabular-nums">
                <span className="font-semibold">{a[row.key] ?? "–"}</span>
                <span className="text-[11px] uppercase tracking-wide text-muted">
                  {row.label}
                </span>
                <span className="font-semibold">{h[row.key] ?? "–"}</span>
              </div>
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="bg-muted/60"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <span className="flex-1 bg-accent" aria-hidden />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
