"use client";

import { use, useMemo } from "react";
import { GameCard } from "@/components/GameCard";
import { BackButton, Empty, Header, SectionTitle, Spinner } from "@/components/Header";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { useTeamSchedule } from "@/lib/api";
import { isFinal } from "@/lib/format";
import { titleCase } from "@/lib/format";
import { todayISO } from "@/lib/ncaa";

export default function TeamPage({
  params,
}: {
  params: Promise<{ seoname: string }>;
}) {
  const { seoname } = use(params);
  const { data, isLoading, isError } = useTeamSchedule(seoname);
  const today = useMemo(() => todayISO(), []);

  const games = data?.games ?? [];
  const played = games.filter(isFinal);
  const upcoming = games.filter((g) => !isFinal(g));

  const self = games.flatMap((g) => g.teams).find((t) => t.seoname === seoname);
  const name = self?.nameShort ?? titleCase(seoname);
  const conference = games
    .flatMap((g) => g.teams)
    .find((t) => t.seoname === seoname)?.conferenceSeo;

  const record = useMemo(() => {
    let w = 0;
    let l = 0;
    for (const g of played) {
      const me = g.teams.find((t) => t.seoname === seoname);
      if (!me) continue;
      if (me.isWinner) w += 1;
      else l += 1;
    }
    return { w, l };
  }, [played, seoname]);

  return (
    <>
      <Header
        title={name}
        subtitle={conference ? titleCase(conference) : null}
        back={<BackButton />}
        right={<StarButton kind="team" id={seoname} label={name} />}
      />

      <div className="px-4">
        <div className="flex items-center gap-3 py-4">
          <TeamLogo seoname={seoname} label={name} size={56} />
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {record.w}–{record.l}
            </p>
            <p className="text-[11px] text-muted">
              Record in the last 3 weeks of play
            </p>
          </div>
          {conference ? (
            <StarButton
              kind="conference"
              id={conference}
              label={titleCase(conference)}
              className="ml-auto"
            />
          ) : null}
        </div>

        {isLoading ? <Spinner /> : null}
        {isError ? <Empty>Couldn&apos;t load this team&apos;s schedule.</Empty> : null}
        {!isLoading && games.length === 0 ? (
          <Empty>No matches found within three weeks of {today}.</Empty>
        ) : null}

        {upcoming.length > 0 && (
          <section>
            <SectionTitle>Upcoming</SectionTitle>
            <div className="space-y-2">
              {upcoming.map((g) => (
                <GameCard key={g.contestId} game={g} showDate />
              ))}
            </div>
          </section>
        )}

        {played.length > 0 && (
          <section>
            <SectionTitle>Results</SectionTitle>
            <div className="space-y-2">
              {played
                .slice()
                .reverse()
                .map((g) => (
                  <GameCard key={g.contestId} game={g} showDate />
                ))}
            </div>
          </section>
        )}
        <div className="h-6" />
      </div>
    </>
  );
}
