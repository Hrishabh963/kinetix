import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kinetix/core", "@kinetix/db", "@kinetix/metadata"],
  images: {
    // Serve TMDB and AniList CDN posters directly to stay within Vercel Free Tier Image Optimization limits
    unoptimized: true,
  },
};

export default nextConfig;
