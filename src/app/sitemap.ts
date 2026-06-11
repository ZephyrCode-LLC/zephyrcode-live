import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/** Per-host sitemap: each subdomain advertises only itself (BRIEF §8). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = (h.get("host") ?? "zephyrcode.live").split(":")[0];
  return [{ url: `https://${host}/`, changeFrequency: "weekly", priority: 1 }];
}
