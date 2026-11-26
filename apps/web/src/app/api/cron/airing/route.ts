import { NextResponse } from "next/server";
import { fetchTrendingAniList } from "@kinetix/metadata";

export async function GET() {
  // Vercel Cron endpoint to warm AniList airing schedule cache
  const trending = await fetchTrendingAniList(12);
  return NextResponse.json({
    ok: true,
    refreshed: trending.length,
    timestamp: new Date().toISOString(),
  });
}
