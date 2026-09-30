import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hide the development indicator (the "N" in the corner) by default.
     Build and runtime errors remain visible; this only hides
     the informational badge. */
  devIndicators: false,
  async rewrites() {
    const apiInternal = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternal}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
