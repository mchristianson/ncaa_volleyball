"use client";

import { FavoriteKind, toggleFavorite, useIsFavorite } from "@/lib/favorites";

export function StarButton({
  kind,
  id,
  label,
  size = 20,
  className = "",
}: {
  kind: FavoriteKind;
  id: string;
  label: string;
  size?: number;
  className?: string;
}) {
  const active = useIsFavorite(kind, id);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${active ? "Remove" : "Add"} ${label} ${active ? "from" : "to"} favorites`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(kind, id);
      }}
      className={`grid shrink-0 place-items-center rounded-full p-1 transition active:scale-90 ${
        active ? "text-accent" : "text-faint hover:text-muted"
      } ${className}`}
      style={active ? { filter: "drop-shadow(0 0 7px rgb(108 172 228 / 0.5))" } : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.7}
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1.05 6.1L12 17l-5.45 2.9L7.6 13.8 3.2 9.5l6.1-.9z" />
      </svg>
    </button>
  );
}
