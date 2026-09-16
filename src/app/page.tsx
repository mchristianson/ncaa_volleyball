"use client";

import { useMemo, useState } from "react";
import { Backdrop } from "@/components/Backdrop";
import { DateStrip } from "@/components/DateStrip";
import { GameCard } from "@/components/GameCard";
import {
  CalendarGlyph,
  ChartGlyph,
  Empty,
  Header,
  SectionTitle,
  Spinner,
  StarGlyph,
} from "@/components/Header";
import { TeamSearch } from "@/components/TeamSearch";
import { useRankings, useScoreboard } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import { dayLabel, matchesTeamQuery } from "@/lib/format";
import { todayISO, type ScoreboardGame } from "@/lib/ncaa";

/** Best (lowest) poll rank among a game's teams, or null. */
function gameRank(g: ScoreboardGame, pollRank: Map<string, number>) {
  const ranks = g.teams
    .map((t) => (t.teamRank ? Number(t.teamRank) : pollRank.get(t.seoname)))
    .filter((n): n is number => Number.isFinite(n));
  return ranks.length ? Math.min(...ranks) : null;
}

type SectionId = "mine" | "ranked" | "rest";

export default function ScoresPage() {
  const today = useMemo(() => todayISO(), []);
  const [date, setDate] = useState(today);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState<Record<SectionId, boolean>>({
    mine: false,
    ranked: false,
    rest: false,
  });
  const toggle = (id: SectionId) =>
    setClosed((c) => ({ ...c, [id]: !c[id] }));

  const { data, isLoading, isError } = useScoreboard(date);
  const favorites = useFavorites();

  // Scoreboard only carries teamRank for some games; the coaches poll fills gaps.
  const { data: poll } = useRankings("avca-rankings");
  const pollRank = useMemo(() => {
    const m = new Map<string, number>();
    poll?.rows.forEach((r) => m.set(r.seoname, r.rank));
    return m;
  }, [poll]);

  const { mine, ranked, rest, matched } = useMemo(() => {
    const games = [...(data?.games ?? [])]
      .filter((g) => matchesTeamQuery(g, query))
      .sort((a, b) => a.startTimeEpoch - b.startTimeEpoch);
    const isMine = (g: ScoreboardGame) =>
      g.teams.some(
        (t) =>
          favorites.team.includes(t.seoname) ||
          (t.conferenceSeo && favorites.conference.includes(t.conferenceSeo)),
      );

    const mine = games.filter(isMine);
    const others = games.filter((g) => !isMine(g));
    const ranked = others
      .filter((g) => gameRank(g, pollRank) !== null)
      .sort((a, b) => gameRank(a, pollRank)! - gameRank(b, pollRank)!);
    const rankedIds = new Set(ranked.map((g) => g.contestId));
    return {
      mine,
      ranked,
      rest: others.filter((g) => !rankedIds.has(g.contestId)),
      matched: games.length,
    };
  }, [data, favorites, pollRank, query]);

  const total = (data?.games ?? []).length;
  const label = (n: number) => `${n} ${n === 1 ? "match" : "matches"}`;

  return (
    <>
      <Backdrop />
      <Header
        title="Volley Scores"
        subtitle={`${dayLabel(date, today)} · ${label(total)}`}
        collapseTitle={searchOpen}
        right={
          <TeamSearch
            open={searchOpen}
            query={query}
            count={matched}
            onOpen={() => setSearchOpen(true)}
            onClose={() => {
              setSearchOpen(false);
              setQuery("");
            }}
            onChange={setQuery}
          />
        }
      />

      <div className="relative z-10 px-5 pt-1">
        <DateStrip value={date} today={today} onChange={setDate} />
      </div>

      <div className="relative z-10 px-5">
        {isLoading ? <Spinner /> : null}
        {isError ? <Empty>Couldn&apos;t reach the NCAA feed. Pull to retry.</Empty> : null}
        {!isLoading && !isError && total === 0 ? (
          <Empty>No Division I matches scheduled.</Empty>
        ) : null}
        {!isLoading && !isError && total > 0 && matched === 0 ? (
          <Empty>
            No team matching &ldquo;{query}&rdquo; plays{" "}
            {date === today ? "today" : `on ${dayLabel(date, today)}`}.
          </Empty>
        ) : null}

        {mine.length > 0 && (
          <section>
            <SectionTitle
              icon={StarGlyph}
              count={label(mine.length)}
              open={!closed.mine}
              onToggle={() => toggle("mine")}
            >
              Your favorites
            </SectionTitle>
            {!closed.mine && (
              <div className="space-y-2.5">
                {mine.map((g) => (
                  <GameCard key={g.contestId} game={g} pinned />
                ))}
              </div>
            )}
          </section>
        )}

        {ranked.length > 0 && (
          <section>
            <SectionTitle
              icon={ChartGlyph}
              count={label(ranked.length)}
              open={!closed.ranked}
              onToggle={() => toggle("ranked")}
            >
              Ranked teams
            </SectionTitle>
            {!closed.ranked && (
              <div className="space-y-2.5">
                {ranked.map((g) => (
                  <GameCard key={g.contestId} game={g} />
                ))}
              </div>
            )}
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <SectionTitle
              icon={CalendarGlyph}
              count={label(rest.length)}
              open={!closed.rest}
              onToggle={() => toggle("rest")}
            >
              All matches
            </SectionTitle>
            {!closed.rest && (
              <div className="space-y-2.5">
                {rest.map((g) => (
                  <GameCard key={g.contestId} game={g} />
                ))}
              </div>
            )}
          </section>
        )}
        <div className="h-8" />
      </div>
    </>
  );
}
