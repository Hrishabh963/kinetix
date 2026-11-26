"use client";

import { Clock, Film, Flame, Sparkles, Trophy, Tv } from "lucide-react";
import type { ScoreScale, TrackedMedia, WatchLog } from "@kinetix/core";
import { computeLibraryStats, formatScore } from "@kinetix/core";

interface StatsViewProps {
  items: TrackedMedia[];
  logs: WatchLog[];
  scoreScale: ScoreScale;
}

export function StatsView({ items, logs, scoreScale }: StatsViewProps) {
  const stats = computeLibraryStats(items, logs);
  const totalHours = Math.round(stats.totalMinutesWatched / 60);
  const totalDays = (totalHours / 24).toFixed(1);

  // Build last 35 days heatmap grid
  const days: Array<{ date: string; count: number }> = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, count: stats.heatmapDays[d] ?? 0 });
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total Watch Time</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-white">{totalHours}h</div>
          <div className="mt-0.5 text-xs text-zinc-400">{totalDays} days of screen time</div>
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Completed Titles</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-white">
            {stats.completedCount}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">
            {stats.watchingCount} currently watching
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Episodes Logged</span>
            <Tv className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-white">
            {stats.totalEpisodesWatched}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">Across TV shows & anime</div>
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Mean Score</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-amber-300">
            {formatScore(stats.meanScore, scoreScale)}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">Across {stats.totalTracked} tracked</div>
        </div>
      </div>

      {/* Heatmap + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Watch Activity Heatmap</h3>
          <p className="text-xs text-zinc-400 mb-4">Last 35 days of logged episodes & movies</p>
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const intensity =
                d.count === 0
                  ? "bg-white/[0.05]"
                  : d.count === 1
                    ? "bg-violet-500/40"
                    : d.count === 2
                      ? "bg-violet-500/70"
                      : "bg-violet-400";
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count} logs`}
                  className={`h-7 rounded-md ${intensity} border border-white/5 transition`}
                />
              );
            })}
          </div>
        </div>

        {/* Top Genres */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Top Genres</h3>
          <p className="text-xs text-zinc-400 mb-4">Your strongest taste affinities</p>
          <div className="space-y-2.5">
            {stats.topGenres.length === 0 ? (
              <p className="text-xs text-zinc-500">Track more titles to unlock genre analytics.</p>
            ) : (
              stats.topGenres.slice(0, 5).map((g) => {
                const max = stats.topGenres[0]?.count || 1;
                const pct = Math.round((g.count / max) * 100);
                return (
                  <div key={g.genre} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-200">{g.genre}</span>
                      <span className="font-mono-num text-zinc-400">{g.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Kinetix Wrapped Card */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-950/60 via-[#121322] to-sky-950/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200">
              <Sparkles className="w-3.5 h-3.5" />
              Kinetix Year-in-Review Card
            </span>
            <h3 className="mt-3 text-xl font-bold text-white">
              {totalHours} Hours • {stats.byMediaType.movie.count} Movies •{" "}
              {stats.byMediaType.tv.count} Shows • {stats.byMediaType.anime.count} Anime
            </h3>
            <p className="mt-1 text-xs text-zinc-300">
              Top Genre: {stats.topGenres[0]?.genre ?? "Explorer"} • Mean Rating:{" "}
              {formatScore(stats.meanScore, scoreScale)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-black/30 rounded-xl px-4 py-3 border border-white/10">
            <Film className="w-4 h-4 text-violet-400" />
            <span>100% Local-First Stats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
