import type { NextConfig } from "next";

const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
  async headers() {
    return [
      {
        // Hashed build assets are safe to cache forever.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Root-level static files in /public (favicon, logos, covers, …).
        source: "/:file(png|jpg|jpeg|webp|svg|ico|avif|txt|xml)",
        headers: [{ key: "Cache-Control", value: CACHE_CONTROL }],
      },
      {
        source: "/covers/:path*",
        headers: [{ key: "Cache-Control", value: CACHE_CONTROL }],
      },
      {
        // Baseline hardening for every response (incl. HTML).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
