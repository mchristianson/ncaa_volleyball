import { NextRequest, NextResponse } from "next/server";
import { getTeamSchedule, todayISO } from "@/lib/ncaa";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ seoname: string }> },
) {
  const { seoname } = await params;
  const around = req.nextUrl.searchParams.get("date") ?? todayISO();
  try {
    const games = await getTeamSchedule(seoname, around);
    return NextResponse.json(
      { seoname, games },
      { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=600" } },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
