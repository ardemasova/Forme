import type { NextConfig } from "next";

// Static export for GitHub Pages. BASE_PATH is set by the deploy workflow
// ("/repo-name" on <user>.github.io/repo-name, empty with a custom domain).
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
