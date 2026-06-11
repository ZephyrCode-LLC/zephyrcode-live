import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/** Supabase Database Webhooks land here → edits are live within seconds (BRIEF §4). */

const TABLE_SITES: Record<string, string[]> = {
  books: ["read", "home"],
  watch_channels: ["watch", "home"],
  watch_titles: ["watch", "home"],
  listen_proofs: ["listen", "home"],
  listen_tracks: ["listen", "home"],
  sims: ["arcade", "home"],
  chapters: ["antyodaya", "home"],
  dossiers: ["antyodaya", "home"],
  story_shorts: ["stories", "home"],
};

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let slugs: string[] = [];
  try {
    const payload = await req.json();
    const table: string | undefined = payload?.table;
    const rowSlug: string | undefined = payload?.record?.site_slug ?? payload?.record?.slug;
    if (table === "sites" || table === "blocks") {
      slugs = rowSlug ? [rowSlug, "home"] : [];
    } else if (table && TABLE_SITES[table]) {
      slugs = TABLE_SITES[table];
    }
  } catch {
    /* fall through to full purge */
  }
  if (slugs.length === 0) {
    revalidateTag("content");
    return NextResponse.json({ ok: true, revalidated: ["content (all sites)"] });
  }
  const tags = [...new Set(slugs)].map((s) => `site:${s}`);
  tags.forEach((t) => revalidateTag(t));
  return NextResponse.json({ ok: true, revalidated: tags });
}
