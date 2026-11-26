import { NextRequest, NextResponse } from "next/server";
import type { MediaType } from "@kinetix/core";
import { getTrendingMedia, searchUnifiedMedia } from "@kinetix/metadata";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const typeParam = (searchParams.get("type") ?? "all") as MediaType | "all";
  const tmdbToken = process.env.TMDB_API_KEY;

  if (!query) {
    const trending = await getTrendingMedia(tmdbToken);
    return NextResponse.json(
      { items: trending, source: tmdbToken ? "live" : "anilist+demo" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }

  const items = await searchUnifiedMedia({
    query,
    mediaType: typeParam,
    tmdbToken,
    limit: 20,
  });

  return NextResponse.json(
    { items, source: tmdbToken ? "live" : "anilist+demo" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=43200",
      },
    },
  );
}
