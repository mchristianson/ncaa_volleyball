"use client";

import { useMemo } from "react";
import type { Pbp } from "@/lib/ncaa";
import { safeColor } from "@/lib/format";

type Point = { i: number; diff: number; home: number; visit: number; text: string };

/**
 * Turns play-by-play into one score-differential line per set: positive area is
 * the home team ahead, negative is the away team. Runs read as steep slopes.
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
          text: play.playText,
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

export function MomentumChart({ pbp }: { pbp: Pbp }) {
  const home = pbp.teams.find((t) => t.isHome);
  const away = pbp.teams.find((t) => !t.isHome);
  const homeColor = safeColor(home?.color, "#e4572e");
  const awayColor = safeColor(away?.color, "#667085");

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
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <i className="h-2.5 w-2.5 rounded-sm" style={{ background: homeColor }} />
          {home?.nameShort} ahead
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          {away?.nameShort} ahead
          <i className="h-2.5 w-2.5 rounded-sm" style={{ background: awayColor }} />
        </span>
      </div>

      {live.map(({ period, points }) => {
        const last = points[points.length - 1];
        const max = Math.max(4, ...points.map((p) => Math.abs(p.diff)));
        const W = 320;
        const H = 88;
        const x = (i: number) => (i / (points.length - 1)) * W;
        const y = (d: number) => H / 2 - (d / max) * (H / 2 - 4);
        const line = points.map((p) => `${x(p.i).toFixed(1)},${y(p.diff).toFixed(1)}`);
        const run = longestRun(points);

        return (
          <figure key={String(period.periodNumber)} className="rounded-2xl border border-line bg-surface p-3">
            <figcaption className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold">
                {period.periodDisplay || `Set ${period.periodNumber}`}
              </span>
              <span className="font-mono text-sm tabular-nums text-muted">
                {last.home}–{last.visit}
              </span>
            </figcaption>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Set ${period.periodNumber} momentum, final ${last.home} to ${last.visit}`}
            >
              <defs>
                <clipPath id={`above-${period.periodNumber}`}>
                  <rect x="0" y="0" width={W} height={H / 2} />
                </clipPath>
                <clipPath id={`below-${period.periodNumber}`}>
                  <rect x="0" y={H / 2} width={W} height={H / 2} />
                </clipPath>
              </defs>
              <polygon
                points={`0,${H / 2} ${line.join(" ")} ${W},${H / 2}`}
                fill={homeColor}
                opacity="0.9"
                clipPath={`url(#above-${period.periodNumber})`}
              />
              <polygon
                points={`0,${H / 2} ${line.join(" ")} ${W},${H / 2}`}
                fill={awayColor}
                opacity="0.9"
                clipPath={`url(#below-${period.periodNumber})`}
              />
              <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="currentColor" strokeWidth="0.75" className="text-line" />
            </svg>
            <p className="mt-1.5 text-[11px] text-muted">
              Biggest run: {run.len} straight by{" "}
              {run.team === "home" ? home?.nameShort : away?.nameShort} · largest lead{" "}
              {Math.max(...points.map((p) => Math.abs(p.diff)))}
            </p>
          </figure>
        );
      })}
    </div>
  );
}
