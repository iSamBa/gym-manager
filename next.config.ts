import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  // Note: HMR error suppression is handled by dev-error-handler.ts (client-side)
  // Turbopack doesn't support webpack infrastructureLogging configuration
};

export default withBundleAnalyzer(nextConfig);
