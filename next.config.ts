import type { NextConfig } from "next";

// Browsers honour Next's default stale-while-revalidate, which shows an old profile on the next tap after an edit.
const revalidateHtml = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];

const nextConfig: NextConfig = {
  async headers() {
    return ["/", "/:page", "/t/:code", "/shop/:slug", "/legal/:doc"].map((source) => ({ source, headers: revalidateHtml }));
  },
  // Stops `next dev` from rewriting AGENTS.md with its own text.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Pin the root to this project so a lockfile in a parent folder is never picked up.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
