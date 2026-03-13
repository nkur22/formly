import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevents @anthropic-ai/sdk from being bundled into the client bundle
  serverExternalPackages: ["@anthropic-ai/sdk"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Forms at /f/[id] may be intentionally embeddable in the future (Typeform supports it).
          // Set to SAMEORIGIN for now; loosen per-route if embedding is needed.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
