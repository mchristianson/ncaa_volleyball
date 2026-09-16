import { NextResponse } from "next/server";
import { getBoxscore, getGame, getTeamStats } from "@/lib/ncaa";

export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  try {
    const info = await getGame(id);
    // Box score / team stats only exist once the match is under way.
    const [boxscore, teamStats] = await Promise.all([
      info.hasBoxscore ? getBoxscore(id).catch(() => null) : null,
      info.hasTeamStats ? getTeamStats(id).catch(() => null) : null,
    ]);
    return NextResponse.json(
      { info, boxscore, teamStats },
      { headers: { "cache-control": "public, s-maxage=20, stale-while-revalidate=60" } },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
