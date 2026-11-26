import type { MediaItem, MediaType } from "@kinetix/core";
import { fetchTrendingAniList, searchAniList } from "./anilist";
import { DEMO_CATALOG } from "./demo-catalog";
import { fetchTrendingTmdb, searchTmdb } from "./tmdb";

export { DEMO_CATALOG } from "./demo-catalog";
export { fetchTrendingAniList, searchAniList } from "./anilist";
export { fetchTrendingTmdb, searchTmdb } from "./tmdb";

export interface SearchOptions {
  query: string;
  mediaType?: MediaType | "all";
  tmdbToken?: string;
  limit?: number;
}

/**
 * Unified search across TMDB (Movies/TV) and AniList (Anime),
 * falling back to DEMO_CATALOG matches when offline or unconfigured.
 */
export async function searchUnifiedMedia({
  query,
  mediaType = "all",
  tmdbToken,
  limit = 16,
}: SearchOptions): Promise<MediaItem[]> {
  const q = query.trim();
  if (!q) return [];

  const tasks: Promise<MediaItem[]>[] = [];
  if (mediaType === "all" || mediaType === "movie" || mediaType === "tv") {
    tasks.push(searchTmdb(q, tmdbToken, limit));
  }
  if (mediaType === "all" || mediaType === "anime") {
    tasks.push(searchAniList(q, limit));
  }

  const settled = await Promise.all(tasks);
  let combined = settled.flat();

  if (mediaType !== "all") {
    combined = combined.filter((m) => m.mediaType === mediaType);
  }

  // Always include matching local demo items if live TMDB isn't configured
  const lower = q.toLowerCase();
  const demoMatches = DEMO_CATALOG.filter((item) => {
    if (mediaType !== "all" && item.mediaType !== mediaType) return false;
    return (
      item.title.toLowerCase().includes(lower) ||
      item.titleRomaji?.toLowerCase().includes(lower) ||
      item.genres.some((g) => g.toLowerCase().includes(lower))
    );
  });

  const seen = new Set<string>();
  const deduped: MediaItem[] = [];
  for (const item of [...combined, ...demoMatches]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }

  return deduped.slice(0, limit);
}

export async function getTrendingMedia(tmdbToken?: string): Promise<MediaItem[]> {
  const [tmdb, anilist] = await Promise.all([
    fetchTrendingTmdb(tmdbToken, 8),
    fetchTrendingAniList(8),
  ]);

  const seen = new Set<string>();
  const merged: MediaItem[] = [];
  for (const item of [...tmdb, ...anilist, ...DEMO_CATALOG]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.slice(0, 18);
}
