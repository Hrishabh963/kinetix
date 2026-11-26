import type { MediaItem } from "@kinetix/core";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      idMal
      title {
        english
        romaji
        native
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        color
      }
      bannerImage
      seasonYear
      duration
      episodes
      genres
      studios(isMain: true) {
        nodes {
          name
        }
      }
      averageScore
      status
      nextAiringEpisode {
        airingAt
        episode
      }
    }
  }
}
`;

const ANILIST_TRENDING_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: TRENDING_DESC) {
      id
      idMal
      title {
        english
        romaji
        native
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        color
      }
      bannerImage
      seasonYear
      duration
      episodes
      genres
      studios(isMain: true) {
        nodes {
          name
        }
      }
      averageScore
      status
      nextAiringEpisode {
        airingAt
        episode
      }
    }
  }
}
`;

interface AniListNode {
  id: number;
  idMal?: number | null;
  title: { english?: string | null; romaji?: string | null; native?: string | null };
  description?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null; color?: string | null };
  bannerImage?: string | null;
  seasonYear?: number | null;
  duration?: number | null;
  episodes?: number | null;
  genres?: string[] | null;
  studios?: { nodes?: Array<{ name: string }> | null } | null;
  averageScore?: number | null;
  status?: string | null;
  nextAiringEpisode?: { airingAt: number; episode: number } | null;
}

function mapAniListStatus(status?: string | null): MediaItem["airingStatus"] {
  if (status === "RELEASING") return "airing";
  if (status === "NOT_YET_RELEASED") return "upcoming";
  return "finished";
}

function stripHtml(text?: string | null): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeAniListMedia(node: AniListNode): MediaItem {
  return {
    id: `anilist:anime:${node.id}`,
    mediaType: "anime",
    externalIds: {
      anilist: node.id,
      mal: node.idMal ?? undefined,
    },
    title: node.title.english || node.title.romaji || node.title.native || "Untitled Anime",
    titleRomaji: node.title.romaji ?? undefined,
    titleNative: node.title.native ?? undefined,
    overview: stripHtml(node.description),
    posterUrl: node.coverImage?.extraLarge || node.coverImage?.large || undefined,
    backdropUrl: node.bannerImage || undefined,
    dominantColor: node.coverImage?.color || "#8b5cf6",
    releaseYear: node.seasonYear ?? undefined,
    runtimeMins: node.duration ?? 24,
    totalEpisodes: node.episodes ?? undefined,
    totalSeasons: 1,
    genres: node.genres ?? [],
    studios: node.studios?.nodes?.map((s) => s.name) ?? [],
    averageScore: node.averageScore ?? undefined,
    airingStatus: mapAniListStatus(node.status),
    nextAiringAt: node.nextAiringEpisode
      ? new Date(node.nextAiringEpisode.airingAt * 1000).toISOString()
      : undefined,
    nextAiringEpisode: node.nextAiringEpisode?.episode ?? undefined,
    watchProviders: ["Crunchyroll"],
    updatedAt: new Date().toISOString(),
  };
}

export async function searchAniList(query: string, limit = 10): Promise<MediaItem[]> {
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ANILIST_SEARCH_QUERY,
        variables: { search: query, page: 1, perPage: limit },
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { Page?: { media?: AniListNode[] } } };
    return (json.data?.Page?.media ?? []).map(normalizeAniListMedia);
  } catch {
    return [];
  }
}

export async function fetchTrendingAniList(limit = 10): Promise<MediaItem[]> {
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ANILIST_TRENDING_QUERY,
        variables: { page: 1, perPage: limit },
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { Page?: { media?: AniListNode[] } } };
    return (json.data?.Page?.media ?? []).map(normalizeAniListMedia);
  } catch {
    return [];
  }
}
