"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Scores",
    icon: (
      <>
        <path d="M4 7h13M4 12h9M4 17h11" />
      </>
    ),
  },
  {
    href: "/rankings",
    label: "Rankings",
    icon: (
      <>
        <path d="M5 20V11M12 20V4M19 20v-6" />
      </>
    ),
  },
  {
    href: "/favorites",
    label: "Favorites",
    icon: (
      <>
        <path d="M12 3.5l2.6 5.4 5.9.85-4.25 4.15 1 5.9L12 17l-5.25 2.8 1-5.9L3.5 9.75l5.9-.85z" />
      </>
    ),
  },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav
      className="sticky bottom-0 z-30 rounded-t-3xl border-t border-line bg-bg-2/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1.5 pb-3 pt-3 text-[12px] font-semibold ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  style={active ? { filter: "drop-shadow(0 0 8px rgb(255 95 46 / 0.55))" } : undefined}
                >
                  {t.icon}
                </svg>
                {t.label}
                {active ? (
                  <span className="accent-fill absolute bottom-1 h-[3px] w-7 rounded-full" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
