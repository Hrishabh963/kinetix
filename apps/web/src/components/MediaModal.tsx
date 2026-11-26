"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Eye,
  EyeOff,
  Flame,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Tv,
  X,
} from "lucide-react";
import type {
  AudioPref,
  MediaItem,
  ScoreScale,
  TrackingStatus,
  UserEntry,
} from "@kinetix/core";
import { formatScore } from "@kinetix/core";

interface MediaModalProps {
  media: MediaItem | null;
  entry: UserEntry | null;
  scoreScale: ScoreScale;
  animeTitlePref: "english" | "romaji" | "native";
  onClose: () => void;
  onSave: (entry: UserEntry) => void;
  onDelete: (mediaId: string) => void;
}

const STATUS_OPTIONS: Array<{ value: TrackingStatus; label: string }> = [
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "planned", label: "Plan to Watch" },
  { value: "paused", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
  { value: "rewatching", label: "Rewatching" },
];

export function MediaModal({
  media,
  entry,
  scoreScale,
  animeTitlePref,
  onClose,
  onSave,
  onDelete,
}: MediaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<TrackingStatus>("planned");
  const [score, setScore] = useState<number | null>(null);
  const [progressEpisode, setProgressEpisode] = useState(0);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [audioPref, setAudioPref] = useState<AudioPref | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notes, setNotes] = useState("");
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [revealNotes, setRevealNotes] = useState(true);
  const [watchedWith, setWatchedWith] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (media) {
      setStatus(entry?.status ?? "planned");
      setScore(entry?.score ?? null);
      setProgressEpisode(entry?.progressEpisode ?? 0);
      setRewatchCount(entry?.rewatchCount ?? 0);
      setAudioPref(entry?.audioPref ?? (media.mediaType === "anime" ? "sub" : null));
      setIsFavorite(entry?.isFavorite ?? false);
      setNotes(entry?.notes ?? "");
      setHasSpoiler(entry?.hasSpoiler ?? false);
      setRevealNotes(!(entry?.hasSpoiler ?? false));
      setWatchedWith(entry?.watchedWith ?? "");
      setTags(entry?.tags ?? []);

      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [media, entry]);

  // Fallback light-dismiss for browsers without native closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    const onDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) dialog.close();
    };
    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  const displayTitle =
    media?.mediaType === "anime"
      ? animeTitlePref === "romaji"
        ? media.titleRomaji || media.title
        : animeTitlePref === "native"
          ? media.titleNative || media.title
          : media.title
      : media?.title ?? "";

  const handleSave = () => {
    if (!media) return;
    const now = new Date().toISOString();
    const nextEntry: UserEntry = {
      id: entry?.id ?? `entry-${media.id}-${Date.now()}`,
      mediaId: media.id,
      status,
      score,
      progressEpisode:
        status === "completed" && media.totalEpisodes ? media.totalEpisodes : progressEpisode,
      progressSeason: entry?.progressSeason ?? 1,
      rewatchCount,
      audioPref: media.mediaType === "anime" ? audioPref : null,
      isFavorite,
      notes,
      hasSpoiler,
      tags,
      watchedWith: watchedWith.trim() || undefined,
      startedAt: entry?.startedAt ?? (status !== "planned" ? now : null),
      completedAt: status === "completed" ? entry?.completedAt ?? now : null,
      updatedAt: now,
      deletedAt: null,
    };
    onSave(nextEntry);
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="media-modal-title"
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = "";
        onClose();
      }}
      className="overflow-y-auto text-zinc-100"
    >
      {media && (
        <div className="relative">
          {/* Dynamic Ambient Poster Glow */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-35 blur-3xl"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${media.dominantColor}, transparent 70%)`,
            }}
          />

          <div className="relative p-6 sm:p-7 space-y-6">
            {/* Header */}
            <div className="flex gap-4 sm:gap-5 items-start">
              {media.posterUrl ? (
                <img
                  src={media.posterUrl}
                  alt={displayTitle}
                  className="w-24 sm:w-28 aspect-[2/3] rounded-xl object-cover shadow-2xl ring-1 ring-white/15 shrink-0"
                />
              ) : (
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Tv className="w-8 h-8 text-zinc-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                      {media.mediaType}
                      {media.releaseYear ? ` • ${media.releaseYear}` : ""}
                      {media.runtimeMins ? ` • ${media.runtimeMins}m` : ""}
                    </span>
                    <h1
                      id="media-modal-title"
                      className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight"
                    >
                      {displayTitle}
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    aria-label="Close modal"
                    className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-zinc-300/90 line-clamp-3 leading-relaxed">
                  {media.overview || "No synopsis available."}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {media.genres.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-300 ring-1 ring-white/10"
                    >
                      {g}
                    </span>
                  ))}
                  {media.watchProviders.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200 ring-1 ring-violet-400/20"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Pills */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Tracking Status
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    autoFocus={opt.value === status}
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-xl px-2.5 py-2 text-xs font-medium transition border ${
                      status === opt.value
                        ? "bg-violet-500/25 border-violet-400/60 text-white shadow-sm"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Scrubber + Episode Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.04] p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Your Score
                  </span>
                  <span className="font-mono-num text-sm font-bold text-amber-300">
                    {formatScore(score, scoreScale)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={score ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setScore(v === 0 ? null : v);
                  }}
                  className="w-full cursor-pointer"
                />
                <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                  <button
                    type="button"
                    onClick={() => setScore(null)}
                    className="hover:text-zinc-300"
                  >
                    Clear
                  </button>
                  <span>Drag 0–100</span>
                </div>
              </div>

              {media.mediaType !== "movie" ? (
                <div className="rounded-xl bg-white/[0.04] p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Episode Progress
                    </span>
                    <span className="font-mono-num text-sm font-semibold text-zinc-200">
                      {progressEpisode} / {media.totalEpisodes ?? "?"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProgressEpisode(Math.max(0, progressEpisode - 1))}
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/15"
                      aria-label="Decrease episode"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={media.totalEpisodes ?? 9999}
                      value={progressEpisode}
                      onChange={(e) => setProgressEpisode(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg bg-black/30 px-3 py-1.5 text-center font-mono-num text-sm border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProgressEpisode(
                          media.totalEpisodes
                            ? Math.min(media.totalEpisodes, progressEpisode + 1)
                            : progressEpisode + 1,
                        )
                      }
                      className="rounded-lg bg-violet-500/30 p-2 hover:bg-violet-500/45 text-violet-100"
                      aria-label="Increase episode"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.04] p-4 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Rewatches
                    </span>
                    <span className="text-xs text-zinc-400">Track theatrical & home rewatches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRewatchCount(Math.max(0, rewatchCount - 1))}
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/15"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono-num w-6 text-center font-bold">{rewatchCount}</span>
                    <button
                      type="button"
                      onClick={() => setRewatchCount(rewatchCount + 1)}
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/15"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Anime Sub/Dub + Favorite + Watched With */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium border transition ${
                  isFavorite
                    ? "bg-rose-500/20 border-rose-400/50 text-rose-200"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-400 text-rose-400" : ""}`} />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </button>

              {media.mediaType === "anime" && (
                <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                  {(["sub", "dub"] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setAudioPref(pref)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase transition ${
                        audioPref === pref
                          ? "bg-violet-500/30 text-white"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Watched with (e.g. Alex, Movie Night)..."
                value={watchedWith}
                onChange={(e) => setWatchedWith(e.target.value)}
                className="flex-1 min-w-[180px] rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 border border-white/10 focus:outline-none focus:border-violet-400"
              />
            </div>

            {/* Notes with Spoiler Toggle */}
            <div className="rounded-xl bg-white/[0.04] p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Personal Notes & Mini-Review
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSpoiler}
                      onChange={(e) => setHasSpoiler(e.target.checked)}
                      className="rounded"
                    />
                    Contains Spoilers
                  </label>
                  {hasSpoiler && (
                    <button
                      type="button"
                      onClick={() => setRevealNotes(!revealNotes)}
                      className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                    >
                      {revealNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {revealNotes ? "Hide" : "Reveal"}
                    </button>
                  )}
                </div>
              </div>
              {revealNotes ? (
                <textarea
                  rows={3}
                  placeholder="Jot down your thoughts, favorite scene, or mood..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg bg-black/30 p-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 border border-white/10 focus:outline-none focus:border-violet-400"
                />
              ) : (
                <div className="rounded-lg bg-black/40 p-4 text-center text-xs text-zinc-400 border border-dashed border-white/10">
                  Spoiler-protected note hidden. Click Reveal to edit.
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs text-violet-200 border border-violet-400/20"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="hover:text-white"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom tag (e.g. Comfort, IMAX, Rainy Day)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 border border-white/10"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              {entry ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(media.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/15 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from Library
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  0ms Local-First Save
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition"
                >
                  <Check className="w-4 h-4" />
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
