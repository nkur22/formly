import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevents @anthropic-ai/sdk from being bundled into the client bundle
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
