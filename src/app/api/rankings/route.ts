import { NextRequest, NextResponse } from "next/server";
import { getRankings, POLLS } from "@/lib/ncaa";

export async function GET(req: NextRequest) {
  const poll = req.nextUrl.searchParams.get("poll") ?? POLLS[0].id;
  try {
    const data = await getRankings(poll);
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
