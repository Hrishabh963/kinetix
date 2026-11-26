import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export * from "./schema";

function resolveTursoUrl(url?: string): string | undefined {
  return (
    url ??
    process.env.TURSO_DATABASE_URL ??
    process.env.KINETIX_DATABASE_TURSO_DATABASE_URL ??
    process.env.KINETIX_DATABASE_URL
  );
}

function resolveTursoToken(authToken?: string): string | undefined {
  return (
    authToken ??
    process.env.TURSO_AUTH_TOKEN ??
    process.env.KINETIX_DATABASE_TURSO_AUTH_TOKEN ??
    process.env.KINETIX_DATABASE_AUTH_TOKEN
  );
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS media_items (
    id TEXT PRIMARY KEY,
    media_type TEXT NOT NULL,
    title TEXT NOT NULL,
    title_native TEXT,
    title_romaji TEXT,
    overview TEXT NOT NULL DEFAULT '',
    poster_url TEXT,
    backdrop_url TEXT,
    dominant_color TEXT NOT NULL DEFAULT '#6366f1',
    release_year INTEGER,
    runtime_mins INTEGER,
    total_episodes INTEGER,
    total_seasons INTEGER,
    genres_json TEXT NOT NULL DEFAULT '[]',
    studios_json TEXT NOT NULL DEFAULT '[]',
    average_score REAL,
    airing_status TEXT,
    next_airing_at TEXT,
    next_airing_episode INTEGER,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    status TEXT NOT NULL,
    score REAL,
    progress_episode INTEGER NOT NULL DEFAULT 0,
    progress_season INTEGER NOT NULL DEFAULT 1,
    rewatch_count INTEGER NOT NULL DEFAULT 0,
    audio_pref TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    has_spoiler INTEGER NOT NULL DEFAULT 0,
    tags_json TEXT NOT NULL DEFAULT '[]',
    watched_with TEXT,
    started_at TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS watch_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    season_number INTEGER,
    episode_number INTEGER,
    watched_at TEXT NOT NULL,
    watched_with TEXT,
    note TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_public INTEGER NOT NULL DEFAULT 0,
    is_smart INTEGER NOT NULL DEFAULT 0,
    smart_filter_json TEXT,
    item_ids_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  )`,
];

let rawClient: Client | null = null;
let schemaReady = false;

/**
 * Create a Turso / libSQL Drizzle client for personalised cloud sync.
 * Supports both standard TURSO_* and Vercel integration KINETIX_DATABASE_* env vars.
 */
export function createDbClient(url?: string, authToken?: string) {
  const dbUrl = resolveTursoUrl(url);
  if (!dbUrl) return null;

  rawClient = createClient({
    url: dbUrl,
    authToken: resolveTursoToken(authToken),
  });

  return drizzle(rawClient, { schema });
}

/**
 * Idempotently ensure Turso tables exist on first sync.
 */
export async function ensureTursoSchema(): Promise<void> {
  if (schemaReady || !rawClient) return;
  for (const sql of SCHEMA_STATEMENTS) {
    await rawClient.execute(sql);
  }
  schemaReady = true;
}
