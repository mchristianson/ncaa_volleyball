# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Next.js dev server (localhost:3000)
npm run build    # production build
npm run lint     # eslint (flat config, eslint-config-next)
npm run check    # end-to-end smoke test — REQUIRES a running dev server
```

There is no unit-test framework. `scripts/check.mjs` is the only test: it hits
the live app and the live NCAA feeds. Run `npm run dev` in one shell, then
`npm run check` in another. `BASE_URL=... npm run check` targets a deploy.
Individual checks can't be filtered; the script runs all ~13 and prints
`ok`/`FAIL` per check, exiting non-zero on failure. It imports `.ts` sources
directly via `node --experimental-strip-types`, so pure helpers in
`src/lib/format.ts` / `src/lib/ncaa.ts` can be asserted without a server.

## Architecture

Next.js App Router, TypeScript, Tailwind v4 (CSS-first `@theme` in
`src/app/globals.css`, no tailwind.config). No database, no env vars, no auth.

**Data flows in one direction: NCAA → route handler → TanStack Query hook → client page.**

1. `src/lib/ncaa.ts` — the only module that talks to ncaa.com. Server-only.
   Exports typed `getScoreboard`/`getGame`/`getBoxscore`/`getTeamStats`/`getPbp`/`getRankings`.
2. `src/app/api/*/route.ts` — thin proxies. They validate params, call the
   client, set `cache-control`, and return `502` with `{ error }` on failure.
   The browser never calls ncaa.com directly (CORS + edge caching).
3. `src/lib/api.ts` — `"use client"` TanStack Query hooks, one per route.
   Polling is live-aware: `refetchInterval` returns 20s only while the fetched
   payload says `statusCodeDisplay === "live"`, otherwise `false`.
4. `src/app/*/page.tsx` — all `"use client"`. Pages compose components and
   filter/sort in memory; there is no server-side rendering of feed data.

### Persisted GraphQL queries (the fragile part)

NCAA's GraphQL endpoint only accepts *persisted* queries identified by a sha256
hash. Those hashes rotate on every NCAA redeploy. `src/lib/ncaa.ts` scrapes the
current hashes out of the `drupalSettings` JSON blob on two ncaa.com pages,
caches them in a module-level variable for 24h, retries once with a fresh scrape
when a request fails, and falls back to `PINNED_SHAS`. When upstream breaks,
`npm run check` is the diagnostic — it verifies the queries still resolve *and*
that the fields the UI reads are still present.

Rankings have no GraphQL feed at all; `getRankings` regex-parses the ncaa.com
HTML table. Column order differs per poll, so the record cell is located by
shape (`/^\d+-\d+/`) rather than index.

### Conventions worth knowing

- Dates are ISO `YYYY-MM-DD` throughout; "today" is always
  `todayISO()` (America/New_York), never the browser's local date. NCAA's
  scoreboard query wants `MM/DD/YYYY` — converted inside `getScoreboard`.
- A season is labeled by its starting year (`seasonYearFor`): Jan–Jul belongs to
  the previous season.
- Revalidation is chosen per-request: a past date caches for a day, today/future
  for 30s. Same split is mirrored in the route handlers' `cache-control`.
- Favorites (`src/lib/favorites.ts`) are a hand-rolled `useSyncExternalStore`
  over localStorage, cross-tab synced via the `storage` event. Players have no
  stable id upstream, so they key on `teamSeo|last|first` (`playerKey`).
- Display helpers live in `src/lib/format.ts`: `statusLabel`, `titleCase`
  (slug → display name), `matchesTeamQuery` (the client-side team search),
  `safeColor` (lifts near-black / darkens near-white school colors so they stay
  visible on the near-black UI).
- The theme is dark-only on purpose — the whole UI sits on
  `public/backdrop.webp`, on the Creighton palette. Don't add a light mode or a
  theme toggle without being asked; it would be a second design.
- Box scores are built to fit a phone with no horizontal scroll (one line per
  player). Keep new stat columns within that constraint.
- `public/sw.js` is a hand-written service worker (offline app shell), registered
  by `src/components/ServiceWorker.tsx`.

### Known deliberate limits

Team pages assemble a ±3 week window by walking daily scoreboards in chunks of 8
(no per-team feed exists upstream) — marked with a `ponytail:` comment in
`getTeamSchedule`.
