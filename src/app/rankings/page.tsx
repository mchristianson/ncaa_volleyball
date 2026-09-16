"use client";

import { useState } from "react";
import Link from "next/link";
import { Backdrop } from "@/components/Backdrop";
import { Empty, Header, Spinner } from "@/components/Header";
import { StarButton } from "@/components/StarButton";
import { TeamLogo } from "@/components/TeamLogo";
import { useRankings } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import { POLLS } from "@/lib/ncaa";

function Trend({ rank, previous }: { rank: number; previous: string | null }) {
  const prev = Number(previous);
  if (!Number.isFinite(prev) || prev === 0) {
    return <span className="text-[11px] text-muted">NR</span>;
  }
  const delta = prev - rank;
  if (delta === 0) return <span className="text-[11px] text-muted">—</span>;
  return (
    <span
      className={`text-[11px] font-semibold ${delta > 0 ? "text-live" : "text-accent"}`}
    >
      {delta > 0 ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

export default function RankingsPage() {
  const [poll, setPoll] = useState<string>(POLLS[0].id);
  const { data, isLoading, isError } = useRankings(poll);
  const favorites = useFavorites();

  return (
    <>
      <Backdrop />
      <Header
        title="Rankings"
        subtitle={
          data?.updated
            ? `Updated ${new Date(data.updated).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}`
            : "Division I women's volleyball"
        }
      />
      <div className="no-scrollbar relative z-10 flex gap-2 overflow-x-auto px-5 py-2">
        {POLLS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPoll(p.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition ${
              poll === p.id ? "accent-fill text-white" : "panel text-muted"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="relative z-10 px-5">
        {isLoading ? <Spinner /> : null}
        {isError ? <Empty>Couldn&apos;t load this poll.</Empty> : null}
        {data && data.rows.length === 0 ? <Empty>This poll hasn&apos;t been published yet.</Empty> : null}

        {data && data.rows.length > 0 && (
          <ol className="panel overflow-hidden rounded-2xl">
            {data.rows.map((row) => {
              const fav = favorites.team.includes(row.seoname);
              return (
                <li
                  key={`${row.rank}-${row.school}`}
                  className={`flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0 ${fav ? "bg-accent-soft" : ""}`}
                >
                  <span className="w-6 text-center text-[17px] font-bold tabular-nums">
                    {row.rank}
                  </span>
                  <TeamLogo seoname={row.seoname} label={row.school} size={30} />
                  <Link href={`/team/${row.seoname}`} className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold">
                      {row.school}
                      {row.firstPlaceVotes ? (
                        <span className="ml-1 text-[11px] text-muted">
                          ({row.firstPlaceVotes})
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[12px] text-muted">
                      {row.record ?? ""}
                      {row.points ? ` · ${row.points} pts` : ""}
                    </span>
                  </Link>
                  <Trend rank={row.rank} previous={row.previous} />
                  <StarButton kind="team" id={row.seoname} label={row.school} size={16} />
                </li>
              );
            })}
          </ol>
        )}
        <p className="px-1 py-4 text-[12px] text-muted">
          Polls are published by the AVCA and the NCAA and refresh weekly.
        </p>
        <div className="h-8" />
      </div>
    </>
  );
}
