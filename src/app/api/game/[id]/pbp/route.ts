import { NextResponse } from "next/server";
import { getPbp } from "@/lib/ncaa";

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
    return NextResponse.json(await getPbp(id), {
      headers: { "cache-control": "public, s-maxage=20, stale-while-revalidate=60" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
