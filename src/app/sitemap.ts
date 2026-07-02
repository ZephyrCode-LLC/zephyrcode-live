import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getStoryShorts, getSims } from "@/lib/content";

/**
 * Per-host sitemap: each subdomain advertises only its own pages (BRIEF §8).
 * Most rooms are a single landing page, so they list just `/`. The two content
 * rooms also enumerate their published sub-pages so crawlers can discover them:
 *   stories.zephyrcode.live → /story/<slug> (published shorts)
 *   arcade.zephyrcode.live  → /m/<machine>  (sims)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = (h.get("host") ?? "zephyrcode.live").split(":")[0].toLowerCase();
  const base = `https://${host}`;
  // subdomain → site slug (mirrors middleware HOSTS); apex/www/unknown → hub.
  const slug = host.endsWith(".zephyrcode.live") ? host.replace(".zephyrcode.live", "") : "home";

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
  ];

  // The temper (DeepWork) room has no subdomain of its own — it lives at the hub
  // path /temper — so the apex sitemap is where crawlers discover it.
  if (slug === "home") {
    urls.push({ url: `${base}/temper`, changeFrequency: "monthly", priority: 0.8 });
  }

  // The operator domain has a /commission door beyond its root landing.
  if (slug === "operator") {
    urls.push({ url: `${base}/commission`, changeFrequency: "monthly", priority: 0.8 });
  }

  // Audits publishes its public teardowns (the report-as-proof pattern).
  if (slug === "audits") {
    urls.push({ url: `${base}/teardowns/kafka-defaults`, changeFrequency: "monthly", priority: 0.9 });
    urls.push({ url: `${base}/teardowns/postgres-pools`, changeFrequency: "monthly", priority: 0.9 });
  }

  // Content rooms list their sub-pages too. Best-effort — a content/CMS hiccup
  // must never fail the sitemap, so swallow and return at least the root.
  try {
    if (slug === "stories") {
      const shorts = await getStoryShorts("stories");
      for (const s of shorts) {
        if (s.status === null && s.slug) {
          urls.push({ url: `${base}/story/${s.slug}`, changeFrequency: "monthly", priority: 0.8 });
        }
      }
    } else if (slug === "arcade") {
      const sims = await getSims("arcade");
      for (const s of sims) {
        urls.push({ url: `${base}/m/${s.slug}`, changeFrequency: "monthly", priority: 0.8 });
      }
    }
  } catch {
    /* best-effort: root-only sitemap is still valid */
  }

  return urls;
}
