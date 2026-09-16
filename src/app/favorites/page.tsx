"use client";

import Link from "next/link";
import { Empty, Header, SectionTitle } from "@/components/Header";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { clearFavorites, parsePlayerKey, useFavorites } from "@/lib/favorites";
import { titleCase } from "@/lib/format";

export default function FavoritesPage() {
  const favorites = useFavorites();
  const empty =
    favorites.team.length + favorites.conference.length + favorites.player.length === 0;

  return (
    <>
      <Header
        title="Favorites"
        subtitle="Stored on this device only"
        right={
          empty ? undefined : (
            <button
              onClick={() => {
                if (confirm("Remove all favorites from this device?")) clearFavorites();
              }}
              className="rounded-full bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-muted"
            >
              Clear
            </button>
          )
        }
      />

      <div className="px-4">
        {empty ? (
          <Empty>
            Tap the star next to any team, conference or player and they&apos;ll show up
            here — and at the top of your scores list.
          </Empty>
        ) : null}

        {favorites.team.length > 0 && (
          <section>
            <SectionTitle>Teams</SectionTitle>
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {favorites.team.map((seo) => (
                <li key={seo} className="flex items-center gap-3 border-b border-line/60 px-3 py-2.5 last:border-0">
                  <TeamLogo seoname={seo} label={seo} size={26} />
                  <Link href={`/team/${seo}`} className="flex-1 truncate text-[15px] font-medium">
                    {titleCase(seo)}
                  </Link>
                  <StarButton kind="team" id={seo} label={titleCase(seo)} size={16} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {favorites.conference.length > 0 && (
          <section>
            <SectionTitle>Conferences</SectionTitle>
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {favorites.conference.map((seo) => (
                <li key={seo} className="flex items-center gap-3 border-b border-line/60 px-3 py-2.5 last:border-0">
                  <span className="flex-1 truncate text-[15px] font-medium">
                    {titleCase(seo)}
                  </span>
                  <StarButton kind="conference" id={seo} label={titleCase(seo)} size={16} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {favorites.player.length > 0 && (
          <section>
            <SectionTitle>Players</SectionTitle>
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {favorites.player.map((key) => {
                const { teamSeo, first, last } = parsePlayerKey(key);
                return (
                  <li key={key} className="flex items-center gap-3 border-b border-line/60 px-3 py-2.5 last:border-0">
                    <TeamLogo seoname={teamSeo} label={teamSeo} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium capitalize">
                        {first} {last}
                      </span>
                      <Link href={`/team/${teamSeo}`} className="text-[11px] text-muted">
                        {titleCase(teamSeo)}
                      </Link>
                    </span>
                    <StarButton kind="player" id={key} label={`${first} ${last}`} size={16} />
                  </li>
                );
              })}
            </ul>
            <p className="px-1 py-3 text-[11px] text-muted">
              Favorited players are highlighted in every box score they appear in.
            </p>
          </section>
        )}
        <div className="h-6" />
      </div>
    </>
  );
}
