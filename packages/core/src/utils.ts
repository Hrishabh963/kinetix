import type { ScoreScale, SmartFilter, TrackedMedia, WatchLog } from "./types";

/**
 * Format a normalized 0-100 score according to user preference.
 */
export function formatScore(score: number | null | undefined, scale: ScoreScale): string {
  if (score === null || score === undefined) return "—";
  switch (scale) {
    case "stars_5": {
      const stars = Math.round((score / 20) * 2) / 2;
      return `${stars.toFixed(1)} ★`;
    }
    case "points_10": {
      const ten = Math.round(score) / 10;
      return `${ten.toFixed(1)}`;
    }
    case "points_100":
      return `${Math.round(score)}`;
  }
}

/**
 * Convert user-entered score from a chosen scale into normalized 0-100.
 */
export function normalizeScore(value: number, scale: ScoreScale): number {
  switch (scale) {
    case "stars_5":
      return Math.max(0, Math.min(100, Math.round(value * 20)));
    case "points_10":
      return Math.max(0, Math.min(100, Math.round(value * 10)));
    case "points_100":
      return Math.max(0, Math.min(100, Math.round(value)));
  }
}

/**
 * Evaluate a Smart List filter against tracked media items.
 */
export function evaluateSmartFilter(items: TrackedMedia[], filter: SmartFilter): TrackedMedia[] {
  return items.filter(({ media, entry }) => {
    if (entry.deletedAt) return false;
    if (filter.mediaTypes?.length && !filter.mediaTypes.includes(media.mediaType)) return false;
    if (filter.statuses?.length && !filter.statuses.includes(entry.status)) return false;
    if (filter.isFavorite !== undefined && entry.isFavorite !== filter.isFavorite) return false;
    if (filter.minScore !== undefined && (entry.score ?? 0) < filter.minScore) return false;
    if (
      filter.maxRuntimeMins !== undefined &&
      media.runtimeMins !== undefined &&
      media.runtimeMins > filter.maxRuntimeMins
    ) {
      return false;
    }
    if (filter.genres?.length) {
      const lowerGenres = media.genres.map((g) => g.toLowerCase());
      const hasAny = filter.genres.some((g) => lowerGenres.includes(g.toLowerCase()));
      if (!hasAny) return false;
    }
    return true;
  });
}

export interface LibraryStats {
  totalTracked: number;
  completedCount: number;
  watchingCount: number;
  plannedCount: number;
  totalMinutesWatched: number;
  totalEpisodesWatched: number;
  meanScore: number | null;
  byMediaType: Record<"movie" | "tv" | "anime", { count: number; minutes: number }>;
  topGenres: Array<{ genre: string; count: number }>;
  scoreBuckets: Array<{ label: string; count: number }>;
  heatmapDays: Record<string, number>; // YYYY-MM-DD -> log count
}

export function computeLibraryStats(items: TrackedMedia[], logs: WatchLog[]): LibraryStats {
  const active = items.filter((i) => !i.entry.deletedAt);
  let completedCount = 0;
  let watchingCount = 0;
  let plannedCount = 0;
  let totalMinutesWatched = 0;
  let totalEpisodesWatched = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  const byMediaType: LibraryStats["byMediaType"] = {
    movie: { count: 0, minutes: 0 },
    tv: { count: 0, minutes: 0 },
    anime: { count: 0, minutes: 0 },
  };
  const genreMap = new Map<string, number>();
  const buckets = new Array(10).fill(0) as number[];

  for (const { media, entry } of active) {
    if (entry.status === "completed") completedCount++;
    if (entry.status === "watching" || entry.status === "rewatching") watchingCount++;
    if (entry.status === "planned") plannedCount++;

    byMediaType[media.mediaType].count++;

    const unitMins = media.runtimeMins ?? (media.mediaType === "movie" ? 110 : 24);
    let itemMins = 0;
    if (media.mediaType === "movie") {
      const watches = entry.status === "completed" ? 1 + entry.rewatchCount : entry.rewatchCount;
      itemMins = watches * unitMins;
    } else {
      const eps =
        entry.status === "completed"
          ? (media.totalEpisodes ?? entry.progressEpisode) +
            entry.rewatchCount * (media.totalEpisodes ?? entry.progressEpisode)
          : entry.progressEpisode;
      totalEpisodesWatched += eps;
      itemMins = eps * unitMins;
    }

    totalMinutesWatched += itemMins;
    byMediaType[media.mediaType].minutes += itemMins;

    if (entry.score !== null && entry.score !== undefined) {
      scoreSum += entry.score;
      scoreCount++;
      const idx = Math.min(9, Math.max(0, Math.floor(entry.score / 10)));
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }

    for (const g of media.genres) {
      genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
    }
  }

  const topGenres = Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const scoreBuckets = buckets.map((count, idx) => ({
    label: `${idx + 1}`,
    count,
  }));

  const heatmapDays: Record<string, number> = {};
  for (const log of logs) {
    const day = log.watchedAt.slice(0, 10);
    heatmapDays[day] = (heatmapDays[day] ?? 0) + 1;
  }

  return {
    totalTracked: active.length,
    completedCount,
    watchingCount,
    plannedCount,
    totalMinutesWatched,
    totalEpisodesWatched,
    meanScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null,
    byMediaType,
    topGenres,
    scoreBuckets,
    heatmapDays,
  };
}
