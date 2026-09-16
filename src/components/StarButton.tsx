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
      className={`grid shrink-0 place-items-center rounded-full p-1.5 transition active:scale-90 ${
        active ? "text-accent" : "text-muted/50 hover:text-muted"
      } ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5l1.11-6.47-4.7-4.58 6.5-.95z" />
      </svg>
    </button>
  );
}
