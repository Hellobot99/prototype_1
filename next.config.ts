import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty Turbopack config: `next build` uses Turbopack by default and
  // otherwise errors when it sees a `webpack` config below (which only
  // applies to `next dev --webpack`).
  turbopack: {},
  webpack: (config, { dev }) => {
    // The persistent webpack filesystem cache occasionally gets corrupted
    // in dev mode (CSS chunks referenced in the manifest never get written
    // to disk, causing 404s and unstyled pages). Disabling it for dev
    // avoids that at the cost of slightly slower rebuilds.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
