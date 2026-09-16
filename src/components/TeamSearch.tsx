"use client";

import { useEffect, useRef } from "react";

/**
 * Collapsed to an icon until tapped, then a full-width field. Filtering happens
 * on the day's already-loaded games, so results update as you type with no
 * extra requests.
 */
export function TeamSearch({
  open,
  query,
  count,
  onOpen,
  onClose,
  onChange,
}: {
  open: boolean;
  query: string;
  count: number;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Search teams"
        aria-expanded={false}
        className="panel grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition active:scale-90"
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="panel flex flex-1 items-center gap-2 rounded-full px-4">
        <span className="text-muted" aria-hidden>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder="Search teams or conferences"
          aria-label="Search teams or conferences"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query ? (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
            {count}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-[13px] font-medium text-accent"
      >
        Cancel
      </button>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  );
}
