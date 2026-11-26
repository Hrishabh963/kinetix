import type { MediaItem, MediaList, UserEntry, WatchLog } from "./types";

export interface KinetixBackup {
  version: 1;
  exportedAt: string;
  mediaItems: MediaItem[];
  entries: UserEntry[];
  watchLogs: WatchLog[];
  lists: MediaList[];
}

export function exportToJson(backup: Omit<KinetixBackup, "version" | "exportedAt">): string {
  const payload: KinetixBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...backup,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportToCsv(mediaMap: Map<string, MediaItem>, entries: UserEntry[]): string {
  const header = [
    "Title",
    "Type",
    "Status",
    "Score(0-100)",
    "ProgressEpisode",
    "Rewatches",
    "Favorite",
    "Notes",
    "UpdatedAt",
  ].join(",");

  const escapeCsv = (val: string) => `"${val.replaceAll('"', '""')}"`;

  const rows = entries
    .filter((e) => !e.deletedAt)
    .map((e) => {
      const m = mediaMap.get(e.mediaId);
      return [
        escapeCsv(m?.title ?? e.mediaId),
        m?.mediaType ?? "unknown",
        e.status,
        e.score ?? "",
        e.progressEpisode,
        e.rewatchCount,
        e.isFavorite ? "true" : "false",
        escapeCsv(e.notes),
        e.updatedAt,
      ].join(",");
    });

  return [header, ...rows].join("\n");
}

export interface ImportedRow {
  title: string;
  year?: number;
  mediaType: "movie" | "tv" | "anime";
  status: UserEntry["status"];
  score: number | null;
  watchedAt?: string;
}

/**
 * Parse Letterboxd diary/ratings CSV (Date,Name,Year,Letterboxd URI,Rating).
 */
export function parseLetterboxdCsv(csvText: string): ImportedRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headerLine = lines[0]?.toLowerCase() ?? "";
  const hasHeader = headerLine.includes("name") && headerLine.includes("year");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const results: ImportedRow[] = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    // Simple CSV split supporting quoted fields
    const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((c) => c.replace(/^"|"$/g, "")) ?? [];
    const name = cols[1] ?? cols[0];
    if (!name) continue;
    const year = cols[2] ? Number.parseInt(cols[2], 10) : undefined;
    const ratingRaw = cols[4] ? Number.parseFloat(cols[4]) : NaN;
    results.push({
      title: name,
      year: Number.isNaN(year) ? undefined : year,
      mediaType: "movie",
      status: "completed",
      score: Number.isNaN(ratingRaw) ? null : Math.round(ratingRaw * 20),
      watchedAt: cols[0] || undefined,
    });
  }
  return results;
}
