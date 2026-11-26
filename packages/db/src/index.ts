import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export * from "./schema";

/**
 * Create a Turso / libSQL Drizzle client for personalised cloud sync.
 * Returns null when TURSO_DATABASE_URL is not configured (pure local-first mode).
 */
export function createDbClient(url?: string, authToken?: string) {
  const dbUrl = url ?? process.env.TURSO_DATABASE_URL;
  if (!dbUrl) return null;

  const client = createClient({
    url: dbUrl,
    authToken: authToken ?? process.env.TURSO_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}
