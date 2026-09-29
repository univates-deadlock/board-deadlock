import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hide the development indicator (the "N" in the corner) by default.
     Build and runtime errors remain visible; this only hides
     the informational badge. */
  devIndicators: false,
};

export default nextConfig;
