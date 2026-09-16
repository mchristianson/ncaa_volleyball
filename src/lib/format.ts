import type { ScoreboardGame, ScoreboardTeam } from "@/lib/ncaa";

export function isLive(g: { statusCodeDisplay?: string; gameState?: string }) {
  return g.statusCodeDisplay === "live" || g.gameState === "I";
}

export function isFinal(g: { statusCodeDisplay?: string; gameState?: string }) {
  return g.statusCodeDisplay === "final" || g.gameState === "F";
}

export function startLabel(g: ScoreboardGame) {
  if (g.tba || !g.hasStartTime) return "TBA";
  return new Date(g.startTimeEpoch * 1000).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusLabel(g: ScoreboardGame) {
  if (isFinal(g)) return g.finalMessage || "Final";
  if (isLive(g)) return g.currentPeriod || "Live";
  if (g.statusCodeDisplay === "postponed") return "Postponed";
  if (g.statusCodeDisplay === "canceled") return "Canceled";
  return startLabel(g);
}

export function homeAway(g: ScoreboardGame) {
  const home = g.teams.find((t) => t.isHome) ?? g.teams[0];
  const away = g.teams.find((t) => !t.isHome) ?? g.teams[1];
  return { home, away };
}

export function teamScore(t: ScoreboardTeam | undefined) {
  if (!t || t.score === null || t.score === "") return null;
  return String(t.score);
}

/**
 * Renders a slug as a display name. Single short slugs are conference
 * acronyms ("acc", "meac"); multi-word slugs are school or conference names
 * ("big-ten" -> "Big Ten", "long-beach-st" -> "Long Beach St.").
 */
export function titleCase(seo: string) {
  const words = seo.split("-").filter(Boolean);
  if (words.length === 1 && words[0].length <= 5 && !/\d/.test(words[0])) {
    return words[0].toUpperCase();
  }
  return words
    .map((w) => {
      if (w === "st") return "St.";
      if (/^\d+$/.test(w)) return w;
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export function dayLabel(iso: string, today: string) {
  if (iso === today) return "Today";
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * School colors include near-black and near-white marks, which vanish against
 * one of our two themes. Nudge those to a readable lightness instead of
 * dropping the team's identity entirely.
 */
export function safeColor(hex: string | null | undefined, fallback = "#707372") {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return fallback;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Rec. 601 luma, which tracks perceived brightness well enough here.
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // The UI is near-black, so deep navies and forest greens need lifting too,
  // not just literal black.
  if (luma > 0.22 && luma < 0.9) return `#${h}`;

  const target = luma <= 0.22 ? 0.5 : 0.55;
  const scale = luma === 0 ? target : target / Math.max(luma, 0.001);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * scale)));
  const mix = (v: number) => (luma <= 0.22 ? Math.max(clamp(v), 70) : clamp(v));
  return `#${[mix(r), mix(g), mix(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Normalizes a name for loose matching: case, accents and punctuation go away,
 * and "State" collapses to "St" so typing "penn state" finds "Penn St.".
 */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bstate\b/g, "st")
    .trim();
}

/**
 * True when any team in the match matches the query. Matching is on every name
 * the feed gives us — display name, six-char abbreviation, slug — plus the
 * conference slug, so "big ten", "neb" and "huskers"-adjacent slugs all land.
 */
export function matchesTeamQuery(game: ScoreboardGame, query: string): boolean {
  const q = normalizeName(query);
  if (!q) return true;
  const terms = q.split(" ");
  return game.teams.some((t) => {
    const hay = normalizeName(
      [t.nameShort, t.name6Char, t.seoname, t.conferenceSeo].filter(Boolean).join(" "),
    );
    return terms.every((term) => hay.includes(term));
  });
}
