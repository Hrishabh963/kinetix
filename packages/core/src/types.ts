import { z } from "zod";

export const MediaTypeSchema = z.enum(["movie", "tv", "anime"]);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const TrackingStatusSchema = z.enum([
  "watching",
  "completed",
  "planned",
  "paused",
  "dropped",
  "rewatching",
]);
export type TrackingStatus = z.infer<typeof TrackingStatusSchema>;

export const AudioPrefSchema = z.enum(["sub", "dub"]);
export type AudioPref = z.infer<typeof AudioPrefSchema>;

export const ScoreScaleSchema = z.enum(["stars_5", "points_10", "points_100"]);
export type ScoreScale = z.infer<typeof ScoreScaleSchema>;

export const ExternalIdsSchema = z.object({
  tmdb: z.number().optional(),
  imdb: z.string().optional(),
  anilist: z.number().optional(),
  mal: z.number().optional(),
  tvdb: z.number().optional(),
});
export type ExternalIds = z.infer<typeof ExternalIdsSchema>;

export const MediaItemSchema = z.object({
  id: z.string(), // e.g. "tmdb:movie:550" or "anilist:anime:21"
  mediaType: MediaTypeSchema,
  externalIds: ExternalIdsSchema.default({}),
  title: z.string(),
  titleNative: z.string().optional(),
  titleRomaji: z.string().optional(),
  overview: z.string().default(""),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  dominantColor: z.string().default("#6366f1"),
  releaseYear: z.number().optional(),
  runtimeMins: z.number().optional(),
  totalEpisodes: z.number().optional(),
  totalSeasons: z.number().optional(),
  genres: z.array(z.string()).default([]),
  studios: z.array(z.string()).default([]),
  averageScore: z.number().optional(), // 0 - 100
  airingStatus: z.enum(["airing", "finished", "upcoming"]).optional(),
  nextAiringAt: z.string().optional(), // ISO timestamp
  nextAiringEpisode: z.number().optional(),
  trailerUrl: z.string().optional(),
  watchProviders: z.array(z.string()).default([]),
  updatedAt: z.string(),
});
export type MediaItem = z.infer<typeof MediaItemSchema>;

export const UserEntrySchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  status: TrackingStatusSchema,
  score: z.number().min(0).max(100).nullable().default(null), // Stored normalized 0..100
  progressEpisode: z.number().int().min(0).default(0),
  progressSeason: z.number().int().min(1).default(1),
  rewatchCount: z.number().int().min(0).default(0),
  audioPref: AudioPrefSchema.nullable().default(null),
  isFavorite: z.boolean().default(false),
  notes: z.string().default(""),
  hasSpoiler: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  watchedWith: z.string().optional(),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().default(null),
});
export type UserEntry = z.infer<typeof UserEntrySchema>;

export const WatchLogSchema = z.object({
  id: z.string(),
  entryId: z.string(),
  mediaId: z.string(),
  seasonNumber: z.number().int().min(1).optional(),
  episodeNumber: z.number().int().min(1).optional(),
  watchedAt: z.string(),
  watchedWith: z.string().optional(),
  note: z.string().optional(),
  updatedAt: z.string(),
});
export type WatchLog = z.infer<typeof WatchLogSchema>;

export const SmartFilterSchema = z.object({
  mediaTypes: z.array(MediaTypeSchema).optional(),
  statuses: z.array(TrackingStatusSchema).optional(),
  genres: z.array(z.string()).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxRuntimeMins: z.number().optional(),
  isFavorite: z.boolean().optional(),
});
export type SmartFilter = z.infer<typeof SmartFilterSchema>;

export const MediaListSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  isPublic: z.boolean().default(false),
  isSmart: z.boolean().default(false),
  smartFilter: SmartFilterSchema.optional(),
  itemIds: z.array(z.string()).default([]), // mediaIds
  updatedAt: z.string(),
});
export type MediaList = z.infer<typeof MediaListSchema>;

export const UserPreferencesSchema = z.object({
  scoreScale: ScoreScaleSchema.default("points_10"),
  animeTitlePref: z.enum(["english", "romaji", "native"]).default("english"),
  showSpoilers: z.boolean().default(false),
  syncEndpoint: z.string().optional(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export interface TrackedMedia {
  media: MediaItem;
  entry: UserEntry;
}
