import type { MediaItem } from "@kinetix/core";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";

const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
};

interface TmdbSearchResult {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average?: number;
}

export function normalizeTmdbResult(
  item: TmdbSearchResult,
  forcedType?: "movie" | "tv",
): MediaItem | null {
  const mType = forcedType ?? (item.media_type === "tv" ? "tv" : item.media_type === "movie" ? "movie" : null);
  if (!mType) return null;

  const dateStr = item.release_date || item.first_air_date || "";
  const year = dateStr ? Number.parseInt(dateStr.slice(0, 4), 10) : undefined;

  return {
    id: `tmdb:${mType}:${item.id}`,
    mediaType: mType,
    externalIds: { tmdb: item.id },
    title: item.title || item.name || "Untitled",
    titleNative: item.original_title || item.original_name || undefined,
    overview: item.overview ?? "",
    posterUrl: item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : undefined,
    backdropUrl: item.backdrop_path ? `${TMDB_IMG}/w1280${item.backdrop_path}` : undefined,
    dominantColor: mType === "movie" ? "#e11d48" : "#0ea5e9",
    releaseYear: Number.isNaN(year) ? undefined : year,
    runtimeMins: mType === "movie" ? 115 : 45,
    genres: (item.genre_ids ?? []).map((id) => TMDB_GENRES[id]).filter((g): g is string => Boolean(g)),
    studios: [],
    averageScore: item.vote_average ? Math.round(item.vote_average * 10) : undefined,
    airingStatus: mType === "movie" ? "finished" : "airing",
    watchProviders: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function searchTmdb(query: string, apiKey?: string, limit = 10): Promise<MediaItem[]> {
  if (!apiKey) return [];
  try {
    const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: TmdbSearchResult[] };
    return (json.results ?? [])
      .map((r) => normalizeTmdbResult(r))
      .filter((m): m is MediaItem => m !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchTrendingTmdb(apiKey?: string, limit = 10): Promise<MediaItem[]> {
  if (!apiKey) return [];
  try {
    const url = `${TMDB_BASE}/trending/all/week?language=en-US`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: TmdbSearchResult[] };
    return (json.results ?? [])
      .map((r) => normalizeTmdbResult(r))
      .filter((m): m is MediaItem => m !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}
