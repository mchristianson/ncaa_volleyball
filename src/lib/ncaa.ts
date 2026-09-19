/**
 * Thin server-side client for NCAA's public data services.
 *
 * ncaa.com drives its own site with persisted GraphQL queries against
 * sdataprod.ncaa.com. The sha256 hashes that identify each persisted query are
 * published in the `drupalSettings` JSON blob embedded in ncaa.com pages, and
 * they rotate whenever NCAA redeploys. We scrape them once and cache for a day,
 * falling back to a pinned copy if the scrape fails.
 */

const GQL_HOST = "https://sdataprod.ncaa.com";
const SPORT_CODE = "WVB"; // Division I women's volleyball
const SPORT_URL = "volleyball-women";
const DIVISION = 1;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Last-known-good hashes, used if the live scrape fails. */
const PINNED_SHAS: Record<string, string> = {
  GetContests_web:
    "4bcb5e6432fa9da365c0c19af01b1f9015cc7eb5c21e7af2dba308784a166df7",
  GetGamecenterGameById_web:
    "26d14df5714c5cd454c9032a1f8ebb1b1dc35173065ab858709b0fa84dd07b5f",
  NCAA_GetGamecenterBoxscoreVolleyballById_web:
    "4320484382257c2a7ac3be318db2dee09a7fb74029448825c285d5dbdda365ae",
  NCAA_GetGamecenterTeamStatsVolleyballById_web:
    "9b4d5dcdc81e3df6a8388700f2d54c43a4cf9680ee85eab5b89e4c0e17bedbb2",
  NCAA_GetGamecenterPbpGenericById_web:
    "57f922d56d60d88326b62202b3d88e8cd3cfb6687931bc0b5b3dfab089b84faa",
};

const SHA_SOURCES = [
  // scoreboard page carries scoreboardWidget.shas
  "https://www.ncaa.com/scoreboard/volleyball-women/d1",
  // any gamecenter page carries gamecenter.gqlShas
  "https://www.ncaa.com/game/6330542",
];

function drupalSettings(html: string): Record<string, unknown> | null {
  const m = html.match(
    /data-drupal-selector="drupal-settings-json"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

async function scrapeShas(): Promise<Record<string, string>> {
  const found: Record<string, string> = {};
  for (const url of SHA_SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA },
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;
      const settings = drupalSettings(await res.text());
      if (!settings) continue;
      const widget = settings.scoreboardWidget as
        | { shas?: Record<string, string> }
        | undefined;
      const gamecenter = settings.gamecenter as
        | { gqlShas?: Record<string, string> }
        | undefined;
      Object.assign(found, widget?.shas ?? {}, gamecenter?.gqlShas ?? {});
    } catch {
      // fall through to the next source / pinned hashes
    }
  }
  return found;
}

let shaCache: { at: number; shas: Record<string, string> } | null = null;

async function getSha(operation: string): Promise<string> {
  if (!shaCache || Date.now() - shaCache.at > 86_400_000) {
    const scraped = await scrapeShas();
    // Only overwrite the cache when the scrape produced something usable.
    if (Object.keys(scraped).length) {
      shaCache = { at: Date.now(), shas: { ...PINNED_SHAS, ...scraped } };
    } else {
      shaCache = { at: Date.now(), shas: { ...PINNED_SHAS } };
    }
  }
  const sha = shaCache.shas[operation] ?? PINNED_SHAS[operation];
  if (!sha) throw new Error(`No persisted-query hash for ${operation}`);
  return sha;
}

async function gql<T>(
  operation: string,
  variables: Record<string, unknown>,
  revalidate: number,
): Promise<T> {
  const run = async (sha: string) => {
    const url =
      `${GQL_HOST}?meta=${operation}` +
      `&extensions=${encodeURIComponent(
        JSON.stringify({ persistedQuery: { version: 1, sha256Hash: sha } }),
      )}` +
      `&variables=${encodeURIComponent(JSON.stringify(variables))}`;
    return fetch(url, {
      headers: { "user-agent": UA, referer: "https://www.ncaa.com/" },
      next: { revalidate },
    });
  };

  let res = await run(await getSha(operation));
  if (!res.ok && shaCache) {
    // Hash probably rotated mid-cache-window. Re-scrape once and retry.
    shaCache = null;
    res = await run(await getSha(operation));
  }
  if (!res.ok) {
    throw new Error(`NCAA ${operation} failed: ${res.status}`);
  }
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (!body.data) throw new Error(`NCAA ${operation} returned no data`);
  return body.data;
}

/* ---------------------------------------------------------------- types --- */

export type ScoreboardTeam = {
  isHome: boolean;
  seoname: string;
  nameShort: string;
  name6Char: string;
  seed: string | null;
  teamRank: string | null;
  score: string | number | null;
  isWinner: boolean;
  conferenceSeo: string | null;
};

export type ScoreboardGame = {
  contestId: number;
  url: string;
  gameState: string;
  statusCodeDisplay: string;
  currentPeriod: string;
  contestClock: string;
  finalMessage: string;
  startTimeEpoch: number;
  startTime: string;
  startDate: string;
  hasStartTime: boolean;
  broadcasterName: string | null;
  tba: boolean;
  isChampionship: boolean;
  teams: ScoreboardTeam[];
};

export type Linescore = { period: string; home: string; visit: string };

export type ContestTeam = {
  teamId: string;
  isHome: boolean;
  color: string | null;
  seoname: string;
  nameFull: string;
  nameShort: string;
  name6Char: string;
  teamName?: string | null;
  teamRank: string | null;
  score: number | string | null;
  record: string | null;
  isWinner: boolean;
};

/**
 * What the match-details screen shows under "Broadcast", already normalized.
 *
 * `watchUrl` is deliberately absent: NCAA's gamecenter payload carries the
 * broadcaster's *name* and no link, and a URL guessed from the name would be a
 * fabrication. If upstream ever starts sending one, add it here and in
 * `broadcastFrom` — `npm run check` prints any URL-valued field the payload
 * gained (see "gamecenter payload broadcast fields").
 */
export type Broadcast = { network: string };

export type GameInfo = {
  id: string;
  sportUrl: string;
  currentPeriod: string;
  finalMessage: string;
  statusCodeDisplay: string;
  gameState: string;
  startTime: string;
  startTimeEpoch: number;
  seasonYear: number;
  /** NCAA's raw broadcaster name. Prefer `broadcast` in UI code. */
  network: string | null;
  /** Derived in `getGame` so the UI never reads NCAA's raw shape. */
  broadcast: Broadcast | null;
  hasBoxscore: boolean;
  hasPbp: boolean;
  hasTeamStats: boolean;
  linescores: Linescore[];
  teams: ContestTeam[];
  location: {
    venue: string | null;
    city: string | null;
    stateUsps: string | null;
  } | null;
};

export type PlayerStats = {
  firstName: string;
  lastName: string;
  position: string | null;
  number: number | string | null;
  gamesPlayed: string;
  points: string;
  kills: string;
  attackErrors: string;
  attackAttempts: string;
  hittingPercentage: string;
  assists: string;
  setErrors: string;
  setAttempts: string;
  serviceAces: string;
  serviceErrors: string;
  serveAttempts: string;
  digs: string;
  receptionAttempts: string;
  receptionErrors: string;
  blockSolos: string;
  blockAssists: string;
  blockingErrors: string;
  totalBlocks: string;
  ballHandlingErrors: string;
  starter: boolean;
  participated: boolean;
};

export type TeamStats = {
  points: string | null;
  kills: string | null;
  attackErrors: string | null;
  attackAttempts: string | null;
  hittingPercentage: string | null;
  assists: string | null;
  setErrors: string | null;
  setAttempts: string | null;
  serviceAces: string | null;
  serviceErrors: string | null;
  serveAttempts: string | null;
  digs: string | null;
  receptionAttempts: string | null;
  receptionErrors: string | null;
  blockSolos: string | null;
  blockAssists: string | null;
  blockingErrors: string | null;
  totalBlocks: string | null;
};

export type Boxscore = {
  contestId: number;
  status: string;
  period: string;
  teams: Pick<
    ContestTeam,
    "teamId" | "isHome" | "color" | "seoname" | "nameShort" | "nameFull"
  >[];
  description?: string | null;
  teamBoxscore: {
    teamId: number | string;
    playerStats?: PlayerStats[];
    teamStats?: TeamStats | null;
  }[];
};

export type PbpPlay = {
  playText: string;
  homeScore: number | null;
  visitorScore: number | null;
  clock: string | null;
};

export type PbpGroup = { clock: string | null; teamId: number | null; plays: PbpPlay[] };

export type Pbp = {
  contestId: number;
  status: string;
  period: number | string;
  teams: Pick<
    ContestTeam,
    "teamId" | "isHome" | "seoname" | "nameShort" | "color"
  >[];
  periods: {
    periodNumber: number | string;
    periodDisplay?: string | null;
    playbyplayStats: PbpGroup[];
  }[];
};

/* ------------------------------------------------------------- requests --- */

/** `date` is ISO `YYYY-MM-DD`; NCAA wants `MM/DD/YYYY`. */
export async function getScoreboard(date: string): Promise<ScoreboardGame[]> {
  const [y, m, d] = date.split("-");
  const data = await gql<{ contests: ScoreboardGame[] }>(
    "GetContests_web",
    {
      sportCode: SPORT_CODE,
      division: DIVISION,
      seasonYear: seasonYearFor(date),
      contestDate: `${m}/${d}/${y}`,
      week: null,
    },
    // Finished days never change; today/future days need to stay live.
    date < todayISO() ? 86400 : 30,
  );
  return data.contests ?? [];
}

export function todayISO(tz = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftISO(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * NCAA has no per-team schedule feed, so a team page is assembled from the
 * daily scoreboards around the current date.
 * ponytail: fixed +/- window, not the full season. If a full season view is
 * wanted, back this with a nightly job that walks every date once.
 */
export async function getTeamSchedule(
  seoname: string,
  around: string,
  back = 21,
  forward = 21,
): Promise<ScoreboardGame[]> {
  const dates: string[] = [];
  for (let i = -back; i <= forward; i++) dates.push(shiftISO(around, i));

  const out: ScoreboardGame[] = [];
  const CHUNK = 8;
  for (let i = 0; i < dates.length; i += CHUNK) {
    const results = await Promise.all(
      dates.slice(i, i + CHUNK).map((d) => getScoreboard(d).catch(() => [])),
    );
    for (const games of results) {
      for (const g of games) {
        if (g.teams.some((t) => t.seoname === seoname)) out.push(g);
      }
    }
  }
  return out.sort((a, b) => a.startTimeEpoch - b.startTimeEpoch);
}

/**
 * NCAA labels a season by the calendar year it starts in. Women's volleyball
 * runs Aug -> Dec, so anything in Jan-Jul belongs to the previous season year.
 */
export function seasonYearFor(date: string): number {
  const [y, m] = date.split("-").map(Number);
  return m >= 8 ? y : y - 1;
}

/**
 * NCAA reports a match's broadcaster as a bare name ("ESPN+", "FS1", "BTN"),
 * and fills the field with a placeholder rather than null when nothing is set.
 * Anything that isn't a real broadcaster name becomes `null` so the UI can hide
 * the section outright instead of printing "TBA".
 */
const NOT_A_NETWORK = /^(tba|tbd|n\/?a|none|null|-+)$/i;

export function broadcastFrom(game: { network: string | null }): Broadcast | null {
  const network = game.network?.trim() ?? "";
  if (!network || NOT_A_NETWORK.test(network)) return null;
  return { network };
}

export async function getGame(contestId: string): Promise<GameInfo> {
  const data = await gql<{ contests: Omit<GameInfo, "broadcast">[] }>(
    "GetGamecenterGameById_web",
    { id: contestId },
    30,
  );
  const game = data.contests?.[0];
  if (!game) throw new Error(`Game ${contestId} not found`);
  return { ...game, broadcast: broadcastFrom(game) };
}

export async function getBoxscore(contestId: string): Promise<Boxscore> {
  const data = await gql<{ boxscore: Boxscore }>(
    "NCAA_GetGamecenterBoxscoreVolleyballById_web",
    { contestId, staticTestEnv: null },
    30,
  );
  return data.boxscore;
}

export async function getTeamStats(contestId: string): Promise<Boxscore> {
  const data = await gql<{ boxscore: Boxscore }>(
    "NCAA_GetGamecenterTeamStatsVolleyballById_web",
    { contestId, staticTestEnv: null },
    30,
  );
  return data.boxscore;
}

export async function getPbp(contestId: string): Promise<Pbp> {
  const data = await gql<{ playbyplay: Pbp }>(
    "NCAA_GetGamecenterPbpGenericById_web",
    { contestId, staticTestEnv: null },
    30,
  );
  return data.playbyplay;
}

/* ------------------------------------------------------------- rankings --- */

export type RankingRow = {
  rank: number;
  school: string;
  seoname: string;
  firstPlaceVotes: number | null;
  points: string | null;
  record: string | null;
  previous: string | null;
};

export type RankingPoll = {
  id: string;
  name: string;
  updated: string | null;
  rows: RankingRow[];
};

export const POLLS = [
  { id: "avca-rankings", name: "AVCA Coaches" },
  { id: "ncaa-womens-volleyball-rpi", name: "RPI" },
  { id: "di-committees-top-16", name: "Committee Top 16" },
] as const;

const TAG = /<[^>]+>/g;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** NCAA publishes polls as an HTML table only, so we parse the page. */
export async function getRankings(pollId: string): Promise<RankingPoll> {
  const poll = POLLS.find((p) => p.id === pollId) ?? POLLS[0];
  const res = await fetch(
    `https://www.ncaa.com/rankings/${SPORT_URL}/d${DIVISION}/${poll.id}`,
    { headers: { "user-agent": UA }, next: { revalidate: 3600 } },
  );
  if (!res.ok) throw new Error(`Rankings ${poll.id} failed: ${res.status}`);
  const html = await res.text();

  const updated =
    html.match(/"article_published_time":"([^"]+)"/)?.[1] ?? null;

  const rows: RankingRow[] = [];
  for (const [, tr] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      decode(c[1].replace(TAG, " ").replace(/\s+/g, " ")),
    );
    if (cells.length < 3) continue;
    const rank = Number(cells[0]);
    if (!Number.isFinite(rank) || rank < 1) continue;

    // "Nebraska (48)" -> school + first-place votes
    const votes = cells[1].match(/\((\d+)\)\s*$/);
    const school = cells[1].replace(/\s*\(\d+\)\s*$/, "").trim();

    // Column order differs between polls: the coaches poll has a points column,
    // RPI does not. Detect the record cell (e.g. "12-1") wherever it lands.
    const recordIdx = cells.findIndex((c, i) => i > 1 && /^\d+-\d+/.test(c));
    rows.push({
      rank,
      school,
      seoname: schoolSeo(school),
      firstPlaceVotes: votes ? Number(votes[1]) : null,
      points: recordIdx > 2 ? cells[2] : null,
      record: recordIdx >= 0 ? cells[recordIdx] : null,
      previous: recordIdx >= 0 ? (cells[recordIdx + 1] ?? null) : null,
    });
  }
  return { id: poll.id, name: poll.name, updated, rows };
}

/**
 * Rankings tables give display names ("Long Beach St."), not the seonames the
 * rest of the API uses. This gets the common cases right; anything it misses
 * simply renders without a logo.
 */
export function schoolSeo(school: string): string {
  return school
    .toLowerCase()
    .replace(/\bstate\b/g, "st")
    .replace(/\bst\./g, "st")
    .replace(/&/g, "")
    .replace(/[().,']/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ----------------------------------------------------------------- misc --- */

export function logoUrl(seoname: string, theme: "light" | "dark" = "light") {
  const dir = theme === "dark" ? "bgd" : "bgl";
  return `https://www.ncaa.com/sites/default/files/images/logos/schools/${dir}/${seoname}.svg`;
}
