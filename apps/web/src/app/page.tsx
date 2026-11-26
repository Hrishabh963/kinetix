"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  Compass,
  Dices,
  Film,
  Heart,
  Library,
  ListFilter,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Tv,
} from "lucide-react";
import type { MediaItem, MediaType, TrackingStatus, UserEntry, WatchLog } from "@kinetix/core";
import { evaluateSmartFilter, formatScore } from "@kinetix/core";
import { CommandSearch } from "@/components/CommandSearch";
import { MediaModal } from "@/components/MediaModal";
import { PortabilityModal } from "@/components/PortabilityModal";
import { StatsView } from "@/components/StatsView";
import { loadLocalStore, saveLocalStore, type LocalStoreState } from "@/lib/local-store";
import { triggerHaptic } from "@/lib/haptics";

type TabKey = "home" | "library" | "calendar" | "lists" | "stats";

export default function HomePage() {
  const [store, setStore] = useState<LocalStoreState | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [portabilityOpen, setPortabilityOpen] = useState(false);
  const [libTypeFilter, setLibTypeFilter] = useState<MediaType | "all">("all");
  const [libStatusFilter, setLibStatusFilter] = useState<TrackingStatus | "all">("all");
  const [libFavOnly, setLibFavOnly] = useState(false);
  const [spunPick, setSpunPick] = useState<MediaItem | null>(null);

  // Hydrate local-first store immediately on mount
  useEffect(() => {
    setStore(loadLocalStore());
  }, []);

  // Fetch trending media from edge-cached API
  useEffect(() => {
    fetch("/api/metadata/search")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: MediaItem[] } | null) => {
        if (data?.items) setTrending(data.items);
      })
      .catch(() => {});
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const updateStore = (updater: (prev: LocalStoreState) => LocalStoreState) => {
    setStore((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveLocalStore(next);
      return next;
    });
  };

  const trackedItems = useMemo(() => {
    if (!store) return [];
    return Object.values(store.entries)
      .filter((e) => !e.deletedAt && store.mediaMap[e.mediaId])
      .map((entry) => ({
        entry,
        media: store.mediaMap[entry.mediaId]!,
      }))
      .sort((a, b) => b.entry.updatedAt.localeCompare(a.entry.updatedAt));
  }, [store]);

  const upNextItems = useMemo(
    () =>
      trackedItems.filter(
        ({ entry }) => entry.status === "watching" || entry.status === "rewatching",
      ),
    [trackedItems],
  );

  const filteredLibrary = useMemo(() => {
    return trackedItems.filter(({ media, entry }) => {
      if (libTypeFilter !== "all" && media.mediaType !== libTypeFilter) return false;
      if (libStatusFilter !== "all" && entry.status !== libStatusFilter) return false;
      if (libFavOnly && !entry.isFavorite) return false;
      return true;
    });
  }, [trackedItems, libTypeFilter, libStatusFilter, libFavOnly]);

  const airingItems = useMemo(() => {
    const map = new Map<string, MediaItem>();
    for (const { media } of trackedItems) {
      if (media.airingStatus === "airing" || media.nextAiringAt) map.set(media.id, media);
    }
    for (const media of trending) {
      if (media.airingStatus === "airing" || media.nextAiringAt) map.set(media.id, media);
    }
    return Array.from(map.values());
  }, [trackedItems, trending]);

  const handleSaveEntry = (entry: UserEntry, media: MediaItem) => {
    updateStore((prev) => ({
      ...prev,
      mediaMap: { ...prev.mediaMap, [media.id]: media },
      entries: { ...prev.entries, [media.id]: entry },
    }));
  };

  const handleDeleteEntry = (mediaId: string) => {
    updateStore((prev) => {
      const existing = prev.entries[mediaId];
      if (!existing) return prev;
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [mediaId]: { ...existing, deletedAt: new Date().toISOString() },
        },
      };
    });
  };

  const handleQuickIncrementEpisode = (media: MediaItem, entry: UserEntry) => {
    void triggerHaptic("light");
    const nextEp = entry.progressEpisode + 1;
    const isFinished = media.totalEpisodes ? nextEp >= media.totalEpisodes : false;
    const now = new Date().toISOString();

    const updatedEntry: UserEntry = {
      ...entry,
      progressEpisode: nextEp,
      status: isFinished ? "completed" : entry.status,
      completedAt: isFinished ? now : entry.completedAt,
      updatedAt: now,
    };

    const newLog: WatchLog = {
      id: `log-${Date.now()}`,
      entryId: entry.id,
      mediaId: media.id,
      seasonNumber: entry.progressSeason,
      episodeNumber: nextEp,
      watchedAt: now,
      updatedAt: now,
    };

    updateStore((prev) => ({
      ...prev,
      entries: { ...prev.entries, [media.id]: updatedEntry },
      watchLogs: [newLog, ...prev.watchLogs],
    }));
  };

  const handleSpinWheel = () => {
    void triggerHaptic("medium");
    const planned = trackedItems.filter((i) => i.entry.status === "planned");
    if (planned.length === 0) return;
    const pick = planned[Math.floor(Math.random() * planned.length)];
    if (pick) setSpunPick(pick.media);
  };

  if (!store) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-zinc-400 text-sm">
        Loading local library...
      </div>
    );
  }

  const trackedIds = new Set(trackedItems.map((i) => i.media.id));

  return (
    <div className="min-h-dvh pb-24 sm:pb-12">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08090d]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                Kinetix
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/25">
                Local-First
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 px-3 sm:px-4 py-2 text-xs sm:text-sm text-zinc-300 transition"
            >
              <Search className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">Search movies, shows, anime...</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden md:inline-block rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono-num text-zinc-400 border border-white/10">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setPortabilityOpen(true)}
              aria-label="Storage and Preferences"
              className="rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 p-2 text-zinc-300 hover:text-white transition"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden sm:flex mx-auto max-w-6xl px-6 gap-1 pb-2.5">
          {(
            [
              { key: "home", label: "Up Next & Discover", icon: Compass },
              { key: "library", label: `Library (${trackedItems.length})`, icon: Library },
              { key: "calendar", label: "Airing Calendar", icon: Calendar },
              { key: "lists", label: "Lists & Spin", icon: ListFilter },
              { key: "stats", label: "Stats & Wrapped", icon: BarChart3 },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === key
                  ? "bg-violet-500/20 text-violet-100 border border-violet-400/35"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-8">
        {activeTab === "home" && (
          <>
            {/* Up Next Queue */}
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Up Next</h2>
                  <p className="text-xs text-zinc-400">
                    Tap +1 Ep for instant 0ms optimistic check-off
                  </p>
                </div>
              </div>

              {upNextItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-zinc-400">
                  Nothing in your watching queue. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">⌘K</kbd> to track something!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {upNextItems.map(({ media, entry }) => {
                    const pct = media.totalEpisodes
                      ? Math.min(100, Math.round((entry.progressEpisode / media.totalEpisodes) * 100))
                      : 45;
                    return (
                      <div
                        key={media.id}
                        className="group relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-4 hover:border-white/20 transition"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedMedia(media)}
                          className="shrink-0"
                        >
                          {media.posterUrl ? (
                            <img
                              src={media.posterUrl}
                              alt={media.title}
                              className="w-16 h-24 rounded-xl object-cover ring-1 ring-white/15"
                            />
                          ) : (
                            <div className="w-16 h-24 rounded-xl bg-white/5 flex items-center justify-center">
                              <Tv className="w-5 h-5 text-zinc-500" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                              {media.mediaType}
                            </span>
                            {entry.audioPref && (
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-200">
                                {entry.audioPref}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMedia(media)}
                            className="mt-1 block text-left font-semibold text-sm sm:text-base text-white truncate hover:text-violet-300 transition w-full"
                          >
                            {media.title}
                          </button>
                          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                            <span className="font-mono-num">
                              Ep {entry.progressEpisode}
                              {media.totalEpisodes ? ` / ${media.totalEpisodes}` : ""}
                            </span>
                            <span className="font-mono-num text-amber-300">
                              {formatScore(entry.score, store.preferences.scoreScale)}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {media.mediaType !== "movie" && (
                          <button
                            type="button"
                            onClick={() => handleQuickIncrementEpisode(media, entry)}
                            className="shrink-0 rounded-xl bg-violet-600/80 hover:bg-violet-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95"
                          >
                            +1 Ep
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Trending & Discover */}
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Trending Now</h2>
                  <p className="text-xs text-zinc-400">
                    Live AniList &amp; TMDB feeds, cached at the Vercel Edge
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  Explore all →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {trending.map((item) => {
                  const isTracked = trackedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMedia(item)}
                      className="group text-left rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-violet-400/50 transition"
                    >
                      <div className="relative aspect-[2/3] w-full bg-white/5 overflow-hidden">
                        {item.posterUrl ? (
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-7 h-7 text-zinc-600" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-200">
                          {item.mediaType}
                        </span>
                        {isTracked && (
                          <span className="absolute top-2 right-2 rounded-full bg-emerald-500/90 p-1 text-white">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="font-semibold text-xs text-white truncate">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-400 truncate">
                          {item.releaseYear ?? "—"} • {item.genres[0] ?? "Media"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === "library" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(["all", "movie", "tv", "anime"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLibTypeFilter(t)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize border transition ${
                      libTypeFilter === t
                        ? "bg-violet-500/25 border-violet-400/50 text-white"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t === "tv" ? "Shows" : t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setLibFavOnly(!libFavOnly)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition ${
                    libFavOnly
                      ? "bg-rose-500/20 border-rose-400/50 text-rose-200"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${libFavOnly ? "fill-rose-400" : ""}`} />
                  Favorites
                </button>
              </div>

              <select
                value={libStatusFilter}
                onChange={(e) => setLibStatusFilter(e.target.value as TrackingStatus | "all")}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-200"
              >
                <option value="all">All Statuses</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="planned">Plan to Watch</option>
                <option value="paused">On Hold</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredLibrary.map(({ media, entry }) => (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => setSelectedMedia(media)}
                  className="group text-left rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden hover:border-violet-400/50 transition"
                >
                  <div className="relative aspect-[2/3] bg-white/5">
                    {media.posterUrl && (
                      <img
                        src={media.posterUrl}
                        alt={media.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    )}
                    <span className="absolute top-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-200">
                      {entry.status}
                    </span>
                    {entry.score !== null && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 font-mono-num text-xs font-bold text-amber-300">
                        {formatScore(entry.score, store.preferences.scoreScale)}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-xs text-white truncate">{media.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="uppercase">{media.mediaType}</span>
                      {media.mediaType !== "movie" && (
                        <span className="font-mono-num">
                          Ep {entry.progressEpisode}/{media.totalEpisodes ?? "?"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "calendar" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Airing Schedule</h2>
              <p className="text-xs text-zinc-400">
                Upcoming episodes for currently airing shows and anime
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {airingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMedia(item)}
                  className="flex items-center gap-4 rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 text-left hover:border-violet-400/40 transition"
                >
                  {item.posterUrl && (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-14 h-20 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                      Airing • {item.mediaType}
                    </span>
                    <h3 className="mt-1 font-semibold text-sm text-white truncate">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {item.nextAiringEpisode ? `Episode ${item.nextAiringEpisode}` : "New Episode"}{" "}
                      {item.nextAiringAt
                        ? `• ${new Date(item.nextAiringAt).toLocaleDateString()}`
                        : "• Weekly"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "lists" && (
          <section className="space-y-6">
            {/* Random Picker */}
            <div className="rounded-2xl bg-gradient-to-r from-violet-950/50 to-sky-950/40 border border-violet-400/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Dices className="w-5 h-5 text-violet-400" />
                  Indecisive? Spin Your Plan-to-Watch Queue
                </h2>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Randomly pick a title from your planned backlog.
                </p>
                {spunPick && (
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(spunPick)}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-400/30"
                  >
                    Picked: {spunPick.title} →
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleSpinWheel}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white shrink-0"
              >
                Spin the Wheel
              </button>
            </div>

            {/* Smart Lists */}
            <div className="space-y-4">
              {store.lists.map((list) => {
                const matched = list.smartFilter
                  ? evaluateSmartFilter(trackedItems, list.smartFilter)
                  : [];
                return (
                  <div
                    key={list.id}
                    className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-white">{list.name}</h3>
                        <p className="text-xs text-zinc-400">{list.description}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono-num text-zinc-200">
                        {matched.length} items
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {matched.map(({ media }) => (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => setSelectedMedia(media)}
                          className="shrink-0 w-24 text-left group"
                        >
                          {media.posterUrl && (
                            <img
                              src={media.posterUrl}
                              alt={media.title}
                              className="w-24 h-36 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-violet-400 transition"
                            />
                          )}
                          <div className="mt-1 text-[11px] font-medium text-zinc-200 truncate">
                            {media.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "stats" && (
          <StatsView
            items={trackedItems}
            logs={store.watchLogs}
            scoreScale={store.preferences.scoreScale}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#08090d]/90 backdrop-blur-xl px-2 py-1.5 flex justify-around">
        {(
          [
            { key: "home", label: "Home", icon: Compass },
            { key: "library", label: "Library", icon: Library },
            { key: "calendar", label: "Calendar", icon: Calendar },
            { key: "lists", label: "Lists", icon: ListFilter },
            { key: "stats", label: "Stats", icon: BarChart3 },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium ${
              activeTab === key ? "text-violet-300" : "text-zinc-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Native <dialog> Modals */}
      <CommandSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectMedia={(m) => setSelectedMedia(m)}
        trackedIds={trackedIds}
      />

      <MediaModal
        media={selectedMedia}
        entry={selectedMedia ? store.entries[selectedMedia.id] ?? null : null}
        scoreScale={store.preferences.scoreScale}
        animeTitlePref={store.preferences.animeTitlePref}
        onClose={() => setSelectedMedia(null)}
        onSave={(entry) => selectedMedia && handleSaveEntry(entry, selectedMedia)}
        onDelete={handleDeleteEntry}
      />

      <PortabilityModal
        open={portabilityOpen}
        onClose={() => setPortabilityOpen(false)}
        userId={store.userId}
        mediaMap={store.mediaMap}
        entries={store.entries}
        watchLogs={store.watchLogs}
        lists={store.lists}
        preferences={store.preferences}
        lastSyncedAt={store.lastSyncedAt}
        onUpdatePreferences={(preferences) => updateStore((prev) => ({ ...prev, preferences }))}
        onImportLetterboxd={(rows) => {
          updateStore((prev) => {
            const nextMedia = { ...prev.mediaMap };
            const nextEntries = { ...prev.entries };
            const now = new Date().toISOString();
            for (const row of rows) {
              const id = `import:movie:${row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              nextMedia[id] = {
                id,
                mediaType: row.mediaType,
                externalIds: {},
                title: row.title,
                overview: "Imported from Letterboxd CSV.",
                dominantColor: "#8b5cf6",
                releaseYear: row.year,
                runtimeMins: 110,
                genres: [],
                studios: [],
                watchProviders: [],
                updatedAt: now,
              };
              nextEntries[id] = {
                id: `entry-${id}`,
                mediaId: id,
                status: row.status,
                score: row.score,
                progressEpisode: 1,
                progressSeason: 1,
                rewatchCount: 0,
                audioPref: null,
                isFavorite: false,
                notes: "",
                hasSpoiler: false,
                tags: ["Letterboxd Import"],
                startedAt: row.watchedAt ?? now,
                completedAt: row.watchedAt ?? now,
                updatedAt: now,
                deletedAt: null,
              };
            }
            return { ...prev, mediaMap: nextMedia, entries: nextEntries };
          });
        }}
        onSyncComplete={(syncedAt) => updateStore((prev) => ({ ...prev, lastSyncedAt: syncedAt }))}
      />
    </div>
  );
}
