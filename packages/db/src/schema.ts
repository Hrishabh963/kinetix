import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const mediaItems = sqliteTable("media_items", {
  id: text("id").primaryKey(),
  mediaType: text("media_type").notNull(), // 'movie' | 'tv' | 'anime'
  title: text("title").notNull(),
  titleNative: text("title_native"),
  titleRomaji: text("title_romaji"),
  overview: text("overview").notNull().default(""),
  posterUrl: text("poster_url"),
  backdropUrl: text("backdrop_url"),
  dominantColor: text("dominant_color").notNull().default("#6366f1"),
  releaseYear: integer("release_year"),
  runtimeMins: integer("runtime_mins"),
  totalEpisodes: integer("total_episodes"),
  totalSeasons: integer("total_seasons"),
  genresJson: text("genres_json").notNull().default("[]"),
  studiosJson: text("studios_json").notNull().default("[]"),
  averageScore: real("average_score"),
  airingStatus: text("airing_status"),
  nextAiringAt: text("next_airing_at"),
  nextAiringEpisode: integer("next_airing_episode"),
  updatedAt: text("updated_at").notNull(),
});

export const userEntries = sqliteTable("user_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  mediaId: text("media_id").notNull(),
  status: text("status").notNull(),
  score: real("score"),
  progressEpisode: integer("progress_episode").notNull().default(0),
  progressSeason: integer("progress_season").notNull().default(1),
  rewatchCount: integer("rewatch_count").notNull().default(0),
  audioPref: text("audio_pref"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  hasSpoiler: integer("has_spoiler", { mode: "boolean" }).notNull().default(false),
  tagsJson: text("tags_json").notNull().default("[]"),
  watchedWith: text("watched_with"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const watchLogs = sqliteTable("watch_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  entryId: text("entry_id").notNull(),
  mediaId: text("media_id").notNull(),
  seasonNumber: integer("season_number"),
  episodeNumber: integer("episode_number"),
  watchedAt: text("watched_at").notNull(),
  watchedWith: text("watched_with"),
  note: text("note"),
  updatedAt: text("updated_at").notNull(),
});

export const lists = sqliteTable("lists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  isSmart: integer("is_smart", { mode: "boolean" }).notNull().default(false),
  smartFilterJson: text("smart_filter_json"),
  itemIdsJson: text("item_ids_json").notNull().default("[]"),
  updatedAt: text("updated_at").notNull(),
});
