import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // The /covers route fs-reads its TTFs from src/ — trace them into the
  // serverless bundle so spec-driven covers also render on Amplify.
  outputFileTracingIncludes: {
    "/covers/[slug]": ["./src/app/covers/fonts/*.ttf"],
  },
  // PostHog ingest reverse proxy (EU) — events flow through our own origin so
  // ad-blockers don't drop them. Client inits with api_host:"/ingest".
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      { source: "/ingest/:path*", destination: "https://eu.i.posthog.com/:path*" },
    ];
  },
};

export default nextConfig;
