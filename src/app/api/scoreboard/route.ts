import { NextRequest, NextResponse } from "next/server";
import { getScoreboard } from "@/lib/ncaa";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const date =
    req.nextUrl.searchParams.get("date") ??
    new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }
  try {
    const games = await getScoreboard(date);
    return NextResponse.json(
      { date, games },
      { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, date, games: [] },
      { status: 502 },
    );
  }
}
