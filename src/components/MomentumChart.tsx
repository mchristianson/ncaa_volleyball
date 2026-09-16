"use client";

import { useMemo } from "react";
import type { Pbp } from "@/lib/ncaa";
import { safeColor } from "@/lib/format";

type Point = { i: number; diff: number; home: number; visit: number };

/**
 * Turns play-by-play into one score-differential line per set: the band above
 * the axis is the home team ahead, below is the away team. Runs read as slopes.
 */
function setSeries(pbp: Pbp) {
  return pbp.periods.map((period) => {
    const points: Point[] = [];
    let i = 0;
    for (const group of period.playbyplayStats ?? []) {
      for (const play of group.plays ?? []) {
        if (play.homeScore === null || play.visitorScore === null) continue;
        points.push({
          i: i++,
          diff: play.homeScore - play.visitorScore,
          home: play.homeScore,
          visit: play.visitorScore,
        });
      }
    }
    return { period, points };
  });
}

function longestRun(points: Point[]) {
  let best = { team: "", len: 0 };
  let cur = { team: "", len: 0 };
  for (let i = 1; i < points.length; i++) {
    const team = points[i].home > points[i - 1].home ? "home" : "visit";
    cur = cur.team === team ? { team, len: cur.len + 1 } : { team, len: 1 };
    if (cur.len > best.len) best = { ...cur };
  }
  return best;
}

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th"];

export function MomentumChart({ pbp }: { pbp: Pbp }) {
  const home = pbp.teams.find((t) => t.isHome);
  const away = pbp.teams.find((t) => !t.isHome);
  const homeColor = safeColor(home?.color, "#ff5f2e");
  const awayColor = safeColor(away?.color, "#3b7ddd");

  const series = useMemo(() => setSeries(pbp), [pbp]);
  const live = series.filter((s) => s.points.length > 1);

  if (live.length === 0) {
    return (
      <p className="px-1 py-10 text-center text-sm text-muted">
        No play-by-play yet for this match.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1 pb-1 text-[14px]">
        <span className="flex items-center gap-2 font-medium">
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: homeColor }} />
          {home?.nameShort} ahead
        </span>
        <span className="flex items-center gap-2 font-medium">
          {away?.nameShort} ahead
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: awayColor }} />
        </span>
      </div>

      {live.map(({ period, points }) => {
        const last = points[points.length - 1];
        const peak = Math.max(...points.map((p) => Math.abs(p.diff)));
        // Axis ticks every 4, at least +/-8 so sets stay comparable.
        const max = Math.max(8, Math.ceil(peak / 4) * 4);
        const W = 320;
        const H = 104;
        const mid = H / 2;
        const x = (i: number) => (i / (points.length - 1)) * W;
        const y = (d: number) => mid - (d / max) * (mid - 6);
        const line = points.map((p) => `${x(p.i).toFixed(1)},${y(p.diff).toFixed(1)}`);
        const run = longestRun(points);
        const id = String(period.periodNumber);
        const ticks = [max, max / 2, 0, -max / 2, -max];

        return (
          <figure key={id} className="panel rounded-2xl p-4">
            <figcaption className="mb-3 flex items-baseline justify-between">
              <span className="text-[16px] font-bold">
                {period.periodDisplay || ORDINAL[Number(period.periodNumber) - 1] || id} Set
              </span>
              <span className="text-[15px] tabular-nums text-muted">
                {last.home} – {last.visit}
              </span>
            </figcaption>

            <div className="flex gap-2">
              <ul className="flex w-5 shrink-0 flex-col justify-between py-0 text-right text-[10px] tabular-nums text-faint">
                {ticks.map((t) => (
                  <li key={t} style={{ lineHeight: 1 }}>
                    {t > 0 ? t : t === 0 ? 0 : t}
                  </li>
                ))}
              </ul>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-[104px] w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label={`Set ${id} momentum, ${last.home} to ${last.visit}`}
              >
                <defs>
                  <clipPath id={`above-${id}`}>
                    <rect x="0" y="0" width={W} height={mid} />
                  </clipPath>
                  <clipPath id={`below-${id}`}>
                    <rect x="0" y={mid} width={W} height={mid} />
                  </clipPath>
                  <linearGradient id={`fill-home-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={homeColor} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={homeColor} stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id={`fill-away-${id}`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={awayColor} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={awayColor} stopOpacity="0.35" />
                  </linearGradient>
                </defs>

                {/* rally gridlines, quarters of the set */}
                {[0.25, 0.5, 0.75].map((f) => (
                  <line
                    key={f}
                    x1={W * f}
                    y1="0"
                    x2={W * f}
                    y2={H}
                    stroke="currentColor"
                    className="text-line"
                    strokeDasharray="3 5"
                    strokeWidth="1"
                  />
                ))}

                <polygon
                  points={`0,${mid} ${line.join(" ")} ${W},${mid}`}
                  fill={`url(#fill-home-${id})`}
                  clipPath={`url(#above-${id})`}
                />
                <polygon
                  points={`0,${mid} ${line.join(" ")} ${W},${mid}`}
                  fill={`url(#fill-away-${id})`}
                  clipPath={`url(#below-${id})`}
                />
                <line x1="0" y1={mid} x2={W} y2={mid} stroke="currentColor" strokeWidth="1" className="text-line" />
              </svg>
            </div>

            <p className="mt-2.5 text-[13px] text-muted">
              Biggest run: {run.len} straight by{" "}
              {run.team === "home" ? home?.nameShort : away?.nameShort} · largest lead {peak}
            </p>
          </figure>
        );
      })}
    </div>
  );
}
