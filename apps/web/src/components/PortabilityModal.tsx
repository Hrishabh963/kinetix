"use client";

import { useEffect, useRef, useState } from "react";
import { Cloud, Download, FileSpreadsheet, Upload, X } from "lucide-react";
import type { MediaItem, MediaList, ScoreScale, UserEntry, UserPreferences, WatchLog } from "@kinetix/core";
import { exportToCsv, exportToJson, parseLetterboxdCsv } from "@kinetix/core";

interface PortabilityModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  mediaMap: Record<string, MediaItem>;
  entries: Record<string, UserEntry>;
  watchLogs: WatchLog[];
  lists: MediaList[];
  preferences: UserPreferences;
  lastSyncedAt: string | null;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onImportLetterboxd: (rows: ReturnType<typeof parseLetterboxdCsv>) => void;
  onSyncComplete: (syncedAt: string) => void;
}

export function PortabilityModal({
  open,
  onClose,
  userId,
  mediaMap,
  entries,
  watchLogs,
  lists,
  preferences,
  lastSyncedAt,
  onUpdatePreferences,
  onImportLetterboxd,
  onSyncComplete,
}: PortabilityModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const json = exportToJson({
      mediaItems: Object.values(mediaMap),
      entries: Object.values(entries),
      watchLogs,
      lists,
    });
    downloadFile(`kinetix-backup-${new Date().toISOString().slice(0, 10)}.json`, json, "application/json");
  };

  const handleExportCsv = () => {
    const map = new Map(Object.entries(mediaMap));
    const csv = exportToCsv(map, Object.values(entries));
    downloadFile(`kinetix-library-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
  };

  const handleCsvUpload = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const rows = parseLetterboxdCsv(text);
    onImportLetterboxd(rows);
    setImportMsg(`Imported ${rows.length} entries from ${file.name}!`);
  };

  const handleCloudSync = async () => {
    setSyncStatus("Syncing...");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entries: Object.values(entries),
        }),
      });
      const data = (await res.json()) as { synced?: boolean; message?: string; syncedAt?: string };
      if (data.synced && data.syncedAt) {
        onSyncComplete(data.syncedAt);
        setSyncStatus("Synced to Personal Turso Cloud!");
      } else {
        setSyncStatus(data.message ?? "Local-only mode active.");
      }
    } catch {
      setSyncStatus("Offline — changes safely queued locally.");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="portability-title"
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = "";
        onClose();
      }}
      className="overflow-y-auto text-zinc-100"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 id="portability-title" className="text-lg font-bold text-white">
              Personalised Storage & Preferences
            </h1>
            <p className="text-xs text-zinc-400">
              Your data lives locally first. Export anytime or sync to your personal Turso DB.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close settings"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/[0.04] p-4 border border-white/10">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Rating Scale
            </label>
            <select
              value={preferences.scoreScale}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, scoreScale: e.target.value as ScoreScale })
              }
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm border border-white/10"
            >
              <option value="points_10">10-Point (e.g. 9.2)</option>
              <option value="stars_5">5-Star Half Steps (e.g. 4.5 ★)</option>
              <option value="points_100">100-Point (e.g. 92)</option>
            </select>
          </div>

          <div className="rounded-xl bg-white/[0.04] p-4 border border-white/10">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Anime Title Language
            </label>
            <select
              value={preferences.animeTitlePref}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  animeTitlePref: e.target.value as UserPreferences["animeTitlePref"],
                })
              }
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm border border-white/10"
            >
              <option value="english">English</option>
              <option value="romaji">Romaji (e.g. Sousou no Frieren)</option>
              <option value="native">Native (e.g. 葬送のフリーレン)</option>
            </select>
          </div>
        </div>

        {/* Cloud Sync */}
        <div className="rounded-xl bg-violet-500/10 border border-violet-400/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Cloud className="w-4 h-4 text-violet-400" />
              Personal Turso Cloud Sync
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              {lastSyncedAt
                ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
                : "Push local delta to your configured Turso libSQL database."}
            </p>
            {syncStatus && <p className="text-xs text-violet-200 mt-1">{syncStatus}</p>}
          </div>
          <button
            type="button"
            onClick={handleCloudSync}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white shrink-0"
          >
            Sync Now
          </button>
        </div>

        {/* Export & Import */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-3 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Export Full JSON Backup
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-3 text-xs font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Library CSV
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-white/15 p-4 text-center">
          <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-medium text-zinc-200 hover:text-white">
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Import Letterboxd Diary/Ratings CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleCsvUpload(e.target.files?.[0])}
            />
          </label>
          {importMsg && <p className="mt-2 text-xs text-emerald-300">{importMsg}</p>}
        </div>
      </div>
    </dialog>
  );
}
