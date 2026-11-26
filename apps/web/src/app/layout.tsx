import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kinetix — Local-First Movie, Show & Anime Tracker",
  description:
    "Open-source, local-first tracker for movies, TV shows, and anime with personalised storage, instant search, and zero-latency UX.",
};

export const viewport: Viewport = {
  themeColor: "#08090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh cinematic-grid-bg selection:bg-violet-500/30 selection:text-violet-100">
        {children}
      </body>
    </html>
  );
}
