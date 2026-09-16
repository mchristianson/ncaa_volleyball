import Link from "next/link";

export function Header({
  title,
  subtitle,
  right,
  back,
  collapseTitle,
  size = "lg",
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  back?: React.ReactNode;
  /** Hides the title so `right` can take the full bar (e.g. an open search). */
  collapseTitle?: boolean;
  /** "lg" is the landing headline; "sm" sits next to a back button. */
  size?: "lg" | "sm";
}) {
  return (
    <header
      className="relative z-10 px-5 pb-3"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
    >
      <div className="flex items-center gap-3">
        {back}
        {collapseTitle ? null : (
          <div className="min-w-0 flex-1">
            <h1
              className={`title-xl truncate ${size === "lg" ? "text-[34px] leading-tight" : "text-[22px] leading-tight"}`}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={`truncate text-muted ${size === "lg" ? "text-[15px]" : "text-[13px]"}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        )}
        {right}
      </div>
    </header>
  );
}

export function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back"
      className="panel grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-12 text-center text-sm text-muted">{children}</p>;
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-16" role="status" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

/**
 * Section heading: accent glyph, tracked-out label, and a count that doubles as
 * the collapse control — which is what the chevron promises.
 */
export function SectionTitle({
  children,
  icon,
  count,
  open,
  onToggle,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  count?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  const heading = (
    <>
      <span className="flex items-center gap-2.5">
        {icon ? <span className="text-accent">{icon}</span> : null}
        <span className="text-[13px] font-bold uppercase tracking-[0.14em]">
          {children}
        </span>
      </span>
      {count ? (
        <span className="flex items-center gap-1 text-[13px] text-muted">
          {count}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`transition-transform ${open === false ? "rotate-90" : ""}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      ) : null}
    </>
  );

  if (!onToggle) {
    return (
      <h2 className="flex items-center justify-between px-1 pb-3 pt-6">{heading}</h2>
    );
  }
  return (
    <h2 className="pb-3 pt-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open !== false}
        className="flex w-full items-center justify-between px-1"
      >
        {heading}
      </button>
    </h2>
  );
}

export const StarGlyph = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1.05 6.1L12 17l-5.45 2.9L7.6 13.8 3.2 9.5l6.1-.9z" />
  </svg>
);

export const CalendarGlyph = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="4" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const TrophyGlyph = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 4h10v5a5 5 0 01-10 0z" />
    <path d="M17 5h3v2a4 4 0 01-4 4M7 5H4v2a4 4 0 004 4" />
    <path d="M12 14v3M9 20h6" />
  </svg>
);

export const ChartGlyph = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
    <path d="M5 20V10M12 20V4M19 20v-7" />
  </svg>
);

export const DocGlyph = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="4" y="3" width="16" height="18" rx="3" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
