"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import type { MediaItem, MediaType } from "@kinetix/core";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  trackedIds: Set<string>;
}

export function CommandSearch({
  open,
  onClose,
  onSelectMedia,
  trackedIds,
}: CommandSearchProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaType | "all">("all");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/metadata/search?q=${encodeURIComponent(query)}&type=${mediaType}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = (await res.json()) as { items?: MediaItem[] };
          setResults(data.items ?? []);
        }
      } catch {
        // Ignore aborted requests
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mediaType, open]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="cmd-search-title"
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = "";
        onClose();
      }}
      className="overflow-hidden text-zinc-100"
    >
      <div className="flex flex-col max-h-[82dvh]">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-violet-400 shrink-0" />
          <h1 id="cmd-search-title" className="sr-only">
            Search Movies, Shows, and Anime
          </h1>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, or anime (live AniList + TMDB)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-zinc-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-violet-400" />}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close search"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Type Filter */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
          {(["all", "movie", "tv", "anime"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMediaType(t)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
                mediaType === t
                  ? "bg-violet-500/25 text-violet-100 border border-violet-400/40"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              {t === "tv" ? "TV Shows" : t === "all" ? "All Media" : t}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="overflow-y-auto p-3 space-y-1.5">
          {results.length === 0 && !loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No matches found. Try searching an anime like &ldquo;Frieren&rdquo; or &ldquo;Cyberpunk&rdquo;.
            </div>
          ) : (
            results.map((item) => {
              const isTracked = trackedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectMedia(item);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left hover:bg-white/[0.06] transition group"
                >
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-11 h-16 rounded-lg object-cover shrink-0 ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-11 h-16 rounded-lg bg-white/5 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {item.title}
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-300 shrink-0">
                        {item.mediaType}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {item.releaseYear ?? "—"} • {item.genres.slice(0, 3).join(", ") || "Media"}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium shrink-0 inline-flex items-center gap-1 ${
                      isTracked
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-violet-500/15 text-violet-200 border border-violet-500/30 group-hover:bg-violet-500/30"
                    }`}
                  >
                    {isTracked ? (
                      "Tracked"
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Track
                      </>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-400" />
            Edge-cached unified search (AniList GraphQL + TMDB)
          </span>
          <span>ESC to close</span>
        </div>
      </div>
    </dialog>
  );
}
