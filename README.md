# 🎬 Kinetix — Open-Source Movie, Show & Anime Tracker

A local-first, zero-latency tracker for **Movies, TV Shows, and Anime** with **personalised storage**, **unified AniList + TMDB search**, **cinematic dark-mode UX**, and **Vercel Free Tier** deployment.

## Architecture
- `apps/web`: Next.js 15 (App Router, React 19, Tailwind CSS v4) PWA & Vercel API proxy (`/api/metadata/search`, `/api/sync`, `/api/cron/airing`).
- `packages/core`: Shared TypeScript schemas (Zod), score normalizers, smart list evaluator, analytics/heatmap calculator, and JSON/CSV/Letterboxd portability helpers.
- `packages/metadata`: Unified TMDB + AniList GraphQL client with built-in demo catalog fallback.
- `packages/db`: Drizzle ORM schema for Turso (`@libsql/client`) personalised cloud sync.

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to Vercel (Free Tier)
1. Push this repo to GitHub and import into Vercel (Root Directory: `apps/web`, Build Command: `cd ../.. && npx turbo run build --filter=@kinetix/web`).
2. Optional environment variables (see `.env.example`):
   - `TMDB_API_KEY`: TMDB v4 Read Access Token for live Movies & TV search.
   - `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN`: Personal Turso libSQL database for cloud sync.

## Mobile Native (Capacitor iOS & Android)
```bash
cd apps/web
npx cap add ios
npx cap add android
npm run cap:sync
```

## License
MIT — see [LICENSE](./LICENSE).
