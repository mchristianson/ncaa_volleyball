/**
 * End-to-end smoke check against a running server.
 *
 *   npm run dev            # in one shell
 *   npm run check          # in another
 *
 * This is the check worth having: the NCAA persisted-query hashes rotate and
 * the rankings page is scraped HTML, so the failure mode is "upstream changed",
 * not "our types drifted".
 */
import assert from "node:assert/strict";
import { matchesTeamQuery, safeColor, titleCase } from "../src/lib/format.ts";
import { broadcastFrom, schoolSeo } from "../src/lib/ncaa.ts";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  assert.equal(res.status, 200, `${path} -> ${res.status}`);
  return res.json();
};

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

let failures = 0;
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
};

console.log(`checking ${BASE}\n`);

await check("safeColor keeps usable colors and rescues unusable ones", () => {
  assert.equal(safeColor("#005ca9"), "#005ca9");
  // Hawaii's #154734 is legible on white but disappears on this UI's near-black.
  assert.notEqual(safeColor("#154734"), "#154734");
  assert.equal(safeColor(null), "#707372");
  assert.equal(safeColor("not-a-color"), "#707372");
  // Long Beach State ships #010101, which disappears on a dark background.
  const lifted = safeColor("#010101");
  assert.notEqual(lifted, "#010101");
  assert.ok(parseInt(lifted.slice(1, 3), 16) >= 70, `too dark: ${lifted}`);
  const darkened = safeColor("#ffffff");
  assert.ok(parseInt(darkened.slice(1, 3), 16) < 235, `too light: ${darkened}`);
});

await check("titleCase renders conference and team slugs", () => {
  assert.equal(titleCase("big-ten"), "Big Ten");
  assert.equal(titleCase("acc"), "ACC");
  assert.equal(titleCase("long-beach-st"), "Long Beach St.");
  assert.equal(titleCase("big-12"), "Big 12");
});

// A finished 2024 match with a full box score, team stats and play-by-play.
const FIXTURE_GAME = "6330542";

await check("team search matches on every name the feed gives", () => {
  const game = {
    teams: [
      { nameShort: "Penn St.", name6Char: "PENNST", seoname: "penn-st", conferenceSeo: "big-ten" },
      { nameShort: "Hawaii", name6Char: "HAWAII", seoname: "hawaii", conferenceSeo: "big-west" },
    ],
  };
  assert.equal(matchesTeamQuery(game, ""), true, "empty query should not filter");
  assert.equal(matchesTeamQuery(game, "  "), true);
  assert.equal(matchesTeamQuery(game, "penn"), true);
  assert.equal(matchesTeamQuery(game, "PENN"), true);
  // "State" typed out still finds a feed that abbreviates to "St."
  assert.equal(matchesTeamQuery(game, "penn state"), true);
  assert.equal(matchesTeamQuery(game, "haw"), true);
  assert.equal(matchesTeamQuery(game, "Hawai'i"), true);
  assert.equal(matchesTeamQuery(game, "big ten"), true);
  assert.equal(matchesTeamQuery(game, "nebraska"), false);
  // Terms are ANDed, and must all land on the SAME team.
  assert.equal(matchesTeamQuery(game, "penn big west"), false);
});

await check("schoolSeo maps poll display names to NCAA slugs", () => {
  assert.equal(schoolSeo("Nebraska"), "nebraska");
  assert.equal(schoolSeo("Penn State"), "penn-st");
  assert.equal(schoolSeo("Long Beach St."), "long-beach-st");
  assert.equal(schoolSeo("Texas A&M"), "texas-am");
  assert.equal(schoolSeo("Hawai'i"), "hawaii");
});

await check("poll rows resolve to logos that actually exist", async () => {
  const poll = await get("/api/rankings?poll=avca-rankings");
  const misses = [];
  for (const row of poll.rows.slice(0, 15)) {
    const res = await fetch(
      `https://www.ncaa.com/sites/default/files/images/logos/schools/bgl/${row.seoname}.svg`,
      { method: "HEAD" },
    );
    if (!res.ok) misses.push(`${row.school} -> ${row.seoname}`);
  }
  // A couple of odd names are tolerable; a broken rule is not.
  assert.ok(misses.length <= 2, `logo slugs wrong: ${misses.join(", ")}`);
});

await check("scoreboard responds for today", async () => {
  const data = await get(`/api/scoreboard?date=${today}`);
  assert.ok(Array.isArray(data.games), "games is not an array");
});

await check("scoreboard returns games for a known busy date", async () => {
  const data = await get("/api/scoreboard?date=2024-11-16");
  assert.ok(data.games.length > 50, `only ${data.games.length} games`);
  const g = data.games[0];
  assert.equal(typeof g.contestId, "number");
  assert.equal(g.teams.length, 2);
  assert.ok(g.teams.every((t) => typeof t.seoname === "string"));
});

await check("scoreboard rejects a malformed date", async () => {
  const res = await fetch(`${BASE}/api/scoreboard?date=nope`);
  assert.equal(res.status, 400);
});

await check("game detail carries linescores and team colors", async () => {
  const { info, boxscore, teamStats } = await get(`/api/game/${FIXTURE_GAME}`);
  assert.equal(info.id, FIXTURE_GAME);
  assert.ok(info.linescores.length >= 3, "expected at least 3 sets");
  assert.ok(info.teams.every((t) => t.color), "missing team color");
  assert.ok(boxscore, "no boxscore");
  assert.ok(teamStats, "no team stats");

  const players = boxscore.teamBoxscore.flatMap((t) => t.playerStats ?? []);
  assert.ok(players.length > 10, `only ${players.length} players`);
  const p = players[0];
  for (const k of ["kills", "digs", "assists", "serviceAces", "hittingPercentage"]) {
    assert.ok(k in p, `player stat ${k} missing`);
  }
  const ts = teamStats.teamBoxscore[0].teamStats;
  assert.ok(Number(ts.kills) > 0, "team kills missing");
});

await check("broadcastFrom normalizes what the UI shows under Broadcast", () => {
  assert.deepEqual(broadcastFrom({ network: "ESPN+" }), { network: "ESPN+" });
  assert.deepEqual(broadcastFrom({ network: "  FS1 " }), { network: "FS1" });
  assert.deepEqual(broadcastFrom({ network: "BTN" }), { network: "BTN" });
  // No broadcaster -> no section at all, never a placeholder row.
  assert.equal(broadcastFrom({ network: null }), null);
  assert.equal(broadcastFrom({ network: "" }), null);
  assert.equal(broadcastFrom({ network: "   " }), null);
  for (const junk of ["TBA", "tbd", "N/A", "na", "None", "null", "-", "--"]) {
    assert.equal(broadcastFrom({ network: junk }), null, `"${junk}" should not render`);
  }
});

await check("completed match exposes a normalized broadcast field", async () => {
  const { info } = await get(`/api/game/${FIXTURE_GAME}`);
  assert.ok("broadcast" in info, "info.broadcast missing");
  if (info.broadcast === null) {
    // Legitimate: this match simply had no broadcaster. The UI hides the section.
    assert.ok(!broadcastFrom({ network: info.network ?? null }), "null despite a network");
  } else {
    assert.equal(typeof info.broadcast.network, "string");
    assert.ok(info.broadcast.network.length > 0, "empty network string");
  }
});

/*
 * The persisted GraphQL query is fixed upstream, so the gamecenter payload can
 * carry fields this repo never named. That makes "does NCAA give us a watch
 * URL?" a question only a live response can answer — so answer it here rather
 * than guessing a field name in src/lib/ncaa.ts. This check reports; it only
 * fails if a URL turns up that the UI is throwing away.
 */
await check("gamecenter payload broadcast fields", async () => {
  const BROADCASTY = /network|broadcast|\btv\b|watch|stream|video|media|digital/i;
  const URLISH = /^https?:\/\//i;

  const busy = await get("/api/scoreboard?date=2024-11-16");
  const onTv = busy.games.filter((g) => g.broadcasterName);
  const offTv = busy.games.filter((g) => !g.broadcasterName);
  console.log(
    `       scoreboard 2024-11-16: ${onTv.length}/${busy.games.length} games carry broadcasterName`,
  );
  if (onTv[0]) console.log(`       sample broadcasterName: ${onTv[0].broadcasterName}`);

  const ids = [FIXTURE_GAME];
  if (onTv[0]) ids.push(String(onTv[0].contestId));
  if (offTv[0]) ids.push(String(offTv[0].contestId));

  const stray = [];
  for (const id of ids) {
    const { info } = await get(`/api/game/${id}`);
    const hits = Object.entries(info)
      .filter(([k, v]) => BROADCASTY.test(k) || (typeof v === "string" && URLISH.test(v)))
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`);
    console.log(`       game ${id}: ${hits.length ? hits.join(" ") : "(no broadcast fields)"}`);
    for (const [k, v] of Object.entries(info)) {
      if (k === "broadcast") continue;
      if (typeof v === "string" && URLISH.test(v) && BROADCASTY.test(k)) stray.push(`${id}.${k}`);
    }
  }
  // If NCAA starts sending a real watch link, wire it into Broadcast rather
  // than dropping it: add watchUrl to the Broadcast type and broadcastFrom.
  assert.equal(
    stray.length,
    0,
    `NCAA now sends a watch URL the UI ignores: ${stray.join(", ")}`,
  );
});

await check("play-by-play yields a usable momentum series", async () => {
  const pbp = await get(`/api/game/${FIXTURE_GAME}/pbp`);
  const scored = pbp.periods
    .flatMap((p) => p.playbyplayStats ?? [])
    .flatMap((g) => g.plays ?? [])
    .filter((p) => p.homeScore !== null && p.visitorScore !== null);
  assert.ok(scored.length > 40, `only ${scored.length} scoring plays`);
  const last = scored[scored.length - 1];
  assert.ok(Math.max(last.homeScore, last.visitorScore) >= 15, "set never reached 15");
});

await check("bad game id is rejected", async () => {
  const res = await fetch(`${BASE}/api/game/abc`);
  assert.equal(res.status, 400);
});

await check("AVCA poll parses into ranked rows", async () => {
  const poll = await get("/api/rankings?poll=avca-rankings");
  assert.ok(poll.rows.length >= 20, `only ${poll.rows.length} rows`);
  assert.equal(poll.rows[0].rank, 1);
  // Ranks must be a clean 1..n sequence — a parser that grabs the wrong cell
  // shows up here first.
  poll.rows.forEach((r, i) => assert.equal(r.rank, i + 1, `row ${i} rank drifted`));
  assert.ok(poll.rows[0].school.length > 2, "empty school name");
  assert.ok(/^\d+-\d+$/.test(poll.rows[0].record ?? ""), `bad record ${poll.rows[0].record}`);
});

await check("RPI poll parses too", async () => {
  const poll = await get("/api/rankings?poll=ncaa-womens-volleyball-rpi");
  assert.ok(poll.rows.length >= 20, `only ${poll.rows.length} rows`);
});

await check("team schedule finds a known team's matches", async () => {
  const data = await get("/api/team/nebraska?date=2024-11-16");
  assert.ok(data.games.length > 0, "no games found");
  assert.ok(
    data.games.every((g) => g.teams.some((t) => t.seoname === "nebraska")),
    "returned a game Nebraska isn't in",
  );
});

console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
