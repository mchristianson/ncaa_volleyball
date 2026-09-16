import Link from "next/link";

export function Header({
  title,
  subtitle,
  right,
  back,
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-line bg-bg/85 px-4 pb-2 pt-3 backdrop-blur"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex items-center gap-2">
        {back}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>
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
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-12 text-center text-sm text-muted">{children}</p>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-16" role="status" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 pb-2 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted">
      {children}
    </h2>
  );
}
