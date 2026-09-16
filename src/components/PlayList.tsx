"use client";

import { useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";
import { safeColor } from "@/lib/format";
import type { Pbp, PbpPlay } from "@/lib/ncaa";

type Row = { play: PbpPlay; teamId: string | null };

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th"];

function setLabel(period: { periodNumber: number | string; periodDisplay?: string | null }) {
  const n = Number(period.periodNumber);
  const ordinal = period.periodDisplay || ORDINAL[n - 1] || `Set ${n}`;
  return /set/i.test(ordinal) ? ordinal.toUpperCase() : `${ordinal.toUpperCase()} SET`;
}

export function PlayList({ pbp }: { pbp: Pbp }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      {pbp.periods.map((period) => {
        const key = String(period.periodNumber);
        const rows: Row[] = (period.playbyplayStats ?? []).flatMap((group) =>
          (group.plays ?? []).map((play) => ({
            play,
            teamId: group.teamId === null ? null : String(group.teamId),
          })),
        );
        // The opening lineups read as a roster, not as plays.
        const starters = rows.filter((r) => /starters:/i.test(r.play.playText));
        const plays = rows.filter((r) => !/starters:/i.test(r.play.playText));
        const last = [...plays].reverse().find((r) => r.play.homeScore !== null)?.play;
        const open = !closed[key];

        return (
          <section key={key} className="panel rounded-2xl">
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [key]: !c[key] }))}
              aria-expanded={open}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <h3 className="text-[16px] font-bold tracking-[0.04em]">{setLabel(period)}</h3>
              <span className="flex items-center gap-2.5 text-[15px] tabular-nums text-muted">
                {last ? `${last.visitorScore} – ${last.homeScore}` : ""}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className={`transition-transform ${open ? "" : "rotate-180"}`}
                >
                  <path d="M6 15l6-6 6 6" />
                </svg>
              </span>
            </button>

            {open && (
              <>
                {starters.length > 0 && (
                  <div className="space-y-2 px-3 pb-3">
                    {starters.map((r, i) => {
                      const team = pbp.teams.find((t) => String(t.teamId) === r.teamId);
                      const [who, names] = r.play.playText.split(/starters:/i);
                      return (
                        <div
                          key={i}
                          className="flex gap-3 rounded-xl border border-line-soft bg-bg/40 p-3"
                        >
                          <TeamLogo
                            seoname={team?.seoname}
                            label={team?.nameShort ?? ""}
                            size={30}
                          />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold">
                              {(who || team?.nameShort || "").trim()} starters
                            </p>
                            <p className="text-[13px] leading-snug text-muted">
                              {names?.replace(/;/g, ",").replace(/\s+/g, " ").trim()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <ol className="border-t border-line-soft">
                  {plays.map((r, i) => {
                    const team = pbp.teams.find((t) => String(t.teamId) === r.teamId);
                    const scored = r.play.homeScore !== null;
                    return (
                      <li
                        key={i}
                        className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0"
                      >
                        <span className="w-12 shrink-0 text-[14px] font-bold tabular-nums">
                          {scored ? (
                            `${r.play.visitorScore}-${r.play.homeScore}`
                          ) : (
                            <SubGlyph />
                          )}
                        </span>
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: safeColor(team?.color) }}
                          aria-label={team?.nameShort}
                        />
                        <span className="min-w-0 flex-1 text-[15px]">{r.play.playText}</span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SubGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="substitution"
      className="text-faint"
    >
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}
