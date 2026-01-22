import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendOrigin) return [];
    return [
      {
        source: "/auth/:path*",
        destination: `${backendOrigin}/auth/:path*`,
      },
      {
        source: "/quick-links/:path*",
        destination: `${backendOrigin}/quick-links/:path*`,
      },
      {
        source: "/health",
        destination: `${backendOrigin}/health`,
      },
    ];
  },
};

export default nextConfig;
