import { NextRequest, NextResponse } from "next/server";
import { createDbClient, ensureTursoSchema, userEntries } from "@kinetix/db";
import { UserEntrySchema } from "@kinetix/core";
import { z } from "zod";

const SyncPayloadSchema = z.object({
  userId: z.string().min(1),
  entries: z.array(UserEntrySchema),
});

export async function POST(req: NextRequest) {
  const db = createDbClient();
  if (!db) {
    return NextResponse.json({
      synced: false,
      mode: "local-only",
      message: "TURSO_DATABASE_URL not configured. Data remains safely stored locally on device.",
    });
  }

  try {
    await ensureTursoSchema();
    const body = await req.json();
    const parsed = SyncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
    }

    const { userId, entries } = parsed.data;
    for (const entry of entries) {
      await db
        .insert(userEntries)
        .values({
          id: entry.id,
          userId,
          mediaId: entry.mediaId,
          status: entry.status,
          score: entry.score,
          progressEpisode: entry.progressEpisode,
          progressSeason: entry.progressSeason,
          rewatchCount: entry.rewatchCount,
          audioPref: entry.audioPref,
          isFavorite: entry.isFavorite,
          notes: entry.notes,
          hasSpoiler: entry.hasSpoiler,
          tagsJson: JSON.stringify(entry.tags),
          watchedWith: entry.watchedWith ?? null,
          startedAt: entry.startedAt,
          completedAt: entry.completedAt,
          updatedAt: entry.updatedAt,
          deletedAt: entry.deletedAt,
        })
        .onConflictDoUpdate({
          target: userEntries.id,
          set: {
            status: entry.status,
            score: entry.score,
            progressEpisode: entry.progressEpisode,
            progressSeason: entry.progressSeason,
            rewatchCount: entry.rewatchCount,
            audioPref: entry.audioPref,
            isFavorite: entry.isFavorite,
            notes: entry.notes,
            hasSpoiler: entry.hasSpoiler,
            tagsJson: JSON.stringify(entry.tags),
            watchedWith: entry.watchedWith ?? null,
            startedAt: entry.startedAt,
            completedAt: entry.completedAt,
            updatedAt: entry.updatedAt,
            deletedAt: entry.deletedAt,
          },
        });
    }

    return NextResponse.json({
      synced: true,
      mode: "turso-cloud",
      count: entries.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
