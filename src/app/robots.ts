import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/**
 * Per-host robots: each subdomain advertises its OWN /sitemap.xml so crawlers
 * discover it without manual submission (mirrors the per-host sitemap in
 * sitemap.ts). The apex additionally points at /sitemap_index.xml — the root
 * index that fans out across every host on the domain. `/sites/` stays disallowed
 * (the internal rewrite target must never be indexed).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = (h.get("host") ?? "zephyrcode.live").split(":")[0].toLowerCase();
  const base = `https://${host}`;
  const isApex = host === "zephyrcode.live" || host === "www.zephyrcode.live";

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/sites/" },
      // Explicitly welcome AI crawlers/answer engines (Bytespider deliberately omitted).
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "anthropic-ai",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
        disallow: "/sites/",
      },
    ],
    sitemap: isApex ? [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`] : `${base}/sitemap.xml`,
    host: base,
  };
}
