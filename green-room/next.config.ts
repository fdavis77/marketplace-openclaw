import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Matches the storage bucket's 5MB image limit, plus multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    // This app is a self-contained subfolder alongside an unrelated project
    // that has its own lockfile one level up — pin the root explicitly.
    root: path.join(__dirname),
  },
};

export default nextConfig;
