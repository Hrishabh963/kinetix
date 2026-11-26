"use client";

import type {
  MediaItem,
  MediaList,
  UserEntry,
  UserPreferences,
  WatchLog,
} from "@kinetix/core";
import { DEMO_CATALOG } from "@kinetix/metadata";

const STORAGE_KEY = "kinetix_local_v1";

export interface LocalStoreState {
  userId: string;
  mediaMap: Record<string, MediaItem>;
  entries: Record<string, UserEntry>;
  watchLogs: WatchLog[];
  lists: MediaList[];
  preferences: UserPreferences;
  lastSyncedAt: string | null;
}

function createInitialState(): LocalStoreState {
  const mediaMap: Record<string, MediaItem> = {};
  for (const item of DEMO_CATALOG) {
    mediaMap[item.id] = item;
  }

  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  const initialEntries: Record<string, UserEntry> = {
    "tmdb:tv:95396": {
      id: "entry-severance",
      mediaId: "tmdb:tv:95396",
      status: "watching",
      score: 92,
      progressEpisode: 9,
      progressSeason: 2,
      rewatchCount: 0,
      audioPref: null,
      isFavorite: true,
      notes: "The cinematography and tension in Season 2 are unreal.",
      hasSpoiler: false,
      tags: ["Mind-bending", "Sci-Fi"],
      startedAt: threeDaysAgo,
      completedAt: null,
      updatedAt: now,
      deletedAt: null,
    },
    "anilist:anime:171018": {
      id: "entry-dandadan",
      mediaId: "anilist:anime:171018",
      status: "watching",
      score: 88,
      progressEpisode: 8,
      progressSeason: 1,
      rewatchCount: 0,
      audioPref: "sub",
      isFavorite: false,
      notes: "Science SARU animation goes crazy every single week.",
      hasSpoiler: false,
      tags: ["Weekly", "Comedy"],
      startedAt: threeDaysAgo,
      completedAt: null,
      updatedAt: now,
      deletedAt: null,
    },
    "tmdb:movie:693134": {
      id: "entry-dune2",
      mediaId: "tmdb:movie:693134",
      status: "completed",
      score: 95,
      progressEpisode: 1,
      progressSeason: 1,
      rewatchCount: 1,
      audioPref: null,
      isFavorite: true,
      notes: "IMAX experience of the decade.",
      hasSpoiler: false,
      tags: ["IMAX", "Masterpiece"],
      watchedWith: "Friends",
      startedAt: yesterday,
      completedAt: yesterday,
      updatedAt: yesterday,
      deletedAt: null,
    },
    "anilist:anime:154587": {
      id: "entry-frieren",
      mediaId: "anilist:anime:154587",
      status: "completed",
      score: 96,
      progressEpisode: 28,
      progressSeason: 1,
      rewatchCount: 0,
      audioPref: "sub",
      isFavorite: true,
      notes: "Quiet, melancholic, and deeply human fantasy.",
      hasSpoiler: false,
      tags: ["Comfort", "Fantasy"],
      startedAt: threeDaysAgo,
      completedAt: yesterday,
      updatedAt: yesterday,
      deletedAt: null,
    },
    "tmdb:movie:157336": {
      id: "entry-interstellar",
      mediaId: "tmdb:movie:157336",
      status: "planned",
      score: null,
      progressEpisode: 0,
      progressSeason: 1,
      rewatchCount: 0,
      audioPref: null,
      isFavorite: false,
      notes: "",
      hasSpoiler: false,
      tags: ["Rewatch Queue"],
      startedAt: null,
      completedAt: null,
      updatedAt: threeDaysAgo,
      deletedAt: null,
    },
  };

  const initialLogs: WatchLog[] = [
    {
      id: "log-1",
      entryId: "entry-severance",
      mediaId: "tmdb:tv:95396",
      seasonNumber: 2,
      episodeNumber: 9,
      watchedAt: now,
      updatedAt: now,
    },
    {
      id: "log-2",
      entryId: "entry-dandadan",
      mediaId: "anilist:anime:171018",
      seasonNumber: 1,
      episodeNumber: 8,
      watchedAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "log-3",
      entryId: "entry-dune2",
      mediaId: "tmdb:movie:693134",
      watchedAt: threeDaysAgo,
      watchedWith: "Friends",
      updatedAt: threeDaysAgo,
    },
  ];

  const initialLists: MediaList[] = [
    {
      id: "list-favorites",
      name: "All-Time Favorites",
      description: "Smart list of everything marked as Favorite.",
      isPublic: false,
      isSmart: true,
      smartFilter: { isFavorite: true },
      itemIds: [],
      updatedAt: now,
    },
    {
      id: "list-scifi",
      name: "Peak Sci-Fi & Mystery",
      description: "High-rated Sci-Fi across movies, shows, and anime.",
      isPublic: true,
      isSmart: true,
      smartFilter: { genres: ["Sci-Fi"], minScore: 80 },
      itemIds: [],
      updatedAt: now,
    },
  ];

  return {
    userId: `local-${Math.random().toString(36).slice(2, 10)}`,
    mediaMap,
    entries: initialEntries,
    watchLogs: initialLogs,
    lists: initialLists,
    preferences: {
      scoreScale: "points_10",
      animeTitlePref: "english",
      showSpoilers: false,
    },
    lastSyncedAt: null,
  };
}

export function loadLocalStore(): LocalStoreState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as LocalStoreState;
  } catch {
    return createInitialState();
  }
}

export function saveLocalStore(state: LocalStoreState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors in private browsing
  }
}
