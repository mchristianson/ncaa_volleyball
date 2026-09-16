"use client";

import { useEffect, useRef } from "react";
import { shiftISO } from "@/lib/ncaa";

export function DateStrip({
  value,
  today,
  onChange,
  span = 10,
}: {
  value: string;
  today: string;
  onChange: (iso: string) => void;
  span?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: span * 2 + 1 }, (_, i) => shiftISO(today, i - span));

  useEffect(() => {
    ref.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [value]);

  return (
    <div className="flex items-stretch gap-2">
      {/* Bleed the scroller into the page gutter so chips can sit flush at the
          edge while still scrolling past it. */}
      <div
        ref={ref}
        className="no-scrollbar -mx-5 flex flex-1 gap-2 overflow-x-auto scroll-smooth px-5"
      >
        {days.map((iso) => {
          const d = new Date(`${iso}T12:00:00Z`);
          const selected = iso === value;
          return (
            <button
              key={iso}
              data-selected={selected}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              className={`flex h-[74px] w-[62px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition ${
                selected ? "accent-fill text-white" : "panel text-muted"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">
                {d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}
              </span>
              <span
                className={`text-[22px] font-bold tabular-nums ${selected ? "text-white" : "text-ink"}`}
              >
                {d.toLocaleDateString(undefined, { day: "numeric", timeZone: "UTC" })}
              </span>
            </button>
          );
        })}
      </div>
      <label className="panel grid h-[74px] w-[62px] shrink-0 place-items-center rounded-2xl text-muted">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="4" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        <input
          type="date"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="sr-only"
          aria-label="Pick a date"
        />
      </label>
    </div>
  );
}
