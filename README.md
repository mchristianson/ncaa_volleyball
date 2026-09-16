# Volley Scores

Mobile-first scores, schedules, box scores and rankings for **NCAA Division I
women's volleyball**. No account, no backend database — favorites live in the
browser's localStorage.

## What it does

- **Scores** — every D1 match for a day, with your favorites pinned to the top,
  then ranked teams, then everything else. Swipeable date strip covering ±10 days.
- **Search** — the magnifier in the header expands to a field that filters the
  day's matches as you type, against team names, abbreviations, slugs and
  conference ("penn state" finds "Penn St.", "big ten" finds every Big Ten
  match). Purely client-side over the already-loaded day.
- **Favorites** — star teams, conferences and players. A favorited conference
  pulls in every match its teams play.
- **Game detail** — set-by-set line score, match leaders, full player box score
  (kills, errors, attempts, hitting %, assists, digs, aces, blocks, points),
  team-vs-team comparison, rally-by-rally play-by-play.
- **Momentum** — play-by-play rendered as a score-differential area chart per
  set, with the biggest run and largest lead called out.
- **Rankings** — AVCA Coaches poll, RPI and the committee's top 16, with
  week-over-week movement and your favorites highlighted.
- **Team pages** — record, upcoming matches and recent results.
- **PWA** — installable, with an offline app shell. Live matches poll every 20s.

The interface is dark-only by design: every screen sits on the arena art in
`public/backdrop.webp` (16KB, masked so it hands off to the page background with
no seam), lit by the Creighton palette — navy surfaces, light blue as the accent. A light variant would be a second design
rather than a toggle, so there isn't one.

Box scores fit a phone on one line per player — no horizontal scrolling. Long
names are clipped with a soft fade; tapping a name expands it in place.

## Where the data comes from

Everything is read from NCAA's own public endpoints, server-side, so the browser
never hits ncaa.com directly (no CORS, and responses are cached at the edge):

| Data | Source |
| --- | --- |
| Scoreboard | `sdataprod.ncaa.com` persisted query `GetContests_web` |
| Game summary | `GetGamecenterGameById_web` |
| Box score | `NCAA_GetGamecenterBoxscoreVolleyballById_web` |
| Team stats | `NCAA_GetGamecenterTeamStatsVolleyballById_web` |
| Play-by-play | `NCAA_GetGamecenterPbpGenericById_web` |
| Rankings | `ncaa.com/rankings/volleyball-women/d1/...` (HTML, parsed) |
| Logos | `ncaa.com/sites/default/files/images/logos/schools/bgl\|bgd/{seoname}.svg` |

Those GraphQL queries are *persisted*: each is identified by a sha256 hash that
NCAA publishes in the `drupalSettings` blob on its own pages and rotates on
redeploy. `src/lib/ncaa.ts` scrapes the current hashes, caches them for a day,
retries once on failure, and falls back to a pinned set. If NCAA rotates a hash
and changes a query shape at the same time, `npm run check` is what tells you.

This is an unofficial app and is not affiliated with or endorsed by the NCAA.

## Running it

```bash
npm install
npm run dev
```

Then, with the dev server up:

```bash
npm run check
```

`npm run check` is an end-to-end smoke test against the live NCAA feeds — it
verifies the persisted queries still resolve, the box score still carries the
stat fields the UI reads, the rankings HTML still parses into a clean 1..n
sequence, and that poll school names still map to real logo slugs. Run it after
any upstream weirdness.

## Deploying

The app is a stock Next.js App Router project with no environment variables and
no database, so Vercel needs no configuration:

```bash
npx vercel
```

Route handlers set their own `cache-control`, so the edge does the heavy
lifting: finished days are cached for a day, live scoreboards for 30 seconds.

## Layout

```
src/lib/ncaa.ts       NCAA client: persisted queries, hash rotation, rankings parser
src/lib/favorites.ts  localStorage store (useSyncExternalStore, cross-tab synced)
src/lib/api.ts        TanStack Query hooks, live-aware polling
src/app/api/*         server routes that proxy and cache the NCAA feeds
src/app/*             Scores / Game / Team / Rankings / Favorites
src/components/*      GameCard, BoxScore, MomentumChart, TeamStatsCompare, ...
scripts/check.mjs     end-to-end smoke test
```

## Known limits

- Team pages cover a ±3 week window, because NCAA has no per-team schedule feed
  — the page is assembled from daily scoreboards. A full season view would want
  a nightly job that walks every date once.
- Player favorites key on `team|last|first`, since the public box score has no
  stable player id. A transfer will read as a new player.
