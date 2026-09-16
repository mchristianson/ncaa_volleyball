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
  const days = Array.from({ length: span * 2 + 1 }, (_, i) =>
    shiftISO(today, i - span),
  );

  useEffect(() => {
    ref.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [value]);

  return (
    <div className="flex items-center gap-1">
      <div
        ref={ref}
        className="no-scrollbar flex flex-1 gap-1 overflow-x-auto scroll-smooth"
      >
        {days.map((iso) => {
          const d = new Date(`${iso}T12:00:00Z`);
          const selected = iso === value;
          return (
            <button
              key={iso}
              data-selected={selected}
              onClick={() => onChange(iso)}
              className={`flex w-12 shrink-0 flex-col items-center rounded-xl px-1 py-1.5 text-center transition ${
                selected
                  ? "bg-accent text-white"
                  : iso === today
                    ? "bg-accent-soft text-accent"
                    : "text-muted"
              }`}
            >
              <span className="text-[10px] font-medium uppercase">
                {d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}
              </span>
              <span className="text-[15px] font-semibold tabular-nums">
                {d.toLocaleDateString(undefined, { day: "numeric", timeZone: "UTC" })}
              </span>
            </button>
          );
        })}
      </div>
      <label className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="3" />
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
