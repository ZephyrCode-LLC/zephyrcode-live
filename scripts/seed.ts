/**
 * Idempotent seed: run twice, same result. Requires SUPABASE_SERVICE_ROLE_KEY
 * (RLS allows anon SELECT only). Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=… pnpm tsx scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import { ALL_SITES } from "./content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iafmiiuxygvsulohmrqz.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error("SUPABASE_SERVICE_ROLE_KEY required (content tables are read-only for anon).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  for (const seed of ALL_SITES) {
    const { site, blocks } = seed;
    await must(db.from("sites").upsert(site, { onConflict: "slug" }));
    await must(db.from("blocks").delete().eq("site_slug", site.slug));
    if (blocks.length) {
      await must(
        db.from("blocks").insert(blocks.map((b) => ({ ...b, site_slug: site.slug })))
      );
    }
    if (seed.books) {
      await must(db.from("books").delete().neq("id", 0));
      await must(db.from("books").insert(seed.books));
    }
    if (seed.watch) {
      await must(db.from("watch_titles").delete().neq("id", 0));
      await must(db.from("watch_channels").delete().neq("id", 0));
      for (const ch of seed.watch) {
        const { titles, ...row } = ch;
        const { data, error } = await db.from("watch_channels").insert(row).select("id").single();
        if (error) throw error;
        await must(db.from("watch_titles").insert(titles.map((t) => ({ ...t, channel_id: data.id }))));
      }
    }
    if (seed.listenProofs) {
      await must(db.from("listen_tracks").delete().neq("id", 0));
      await must(db.from("listen_proofs").delete().neq("id", 0));
      for (const p of seed.listenProofs) {
        const { tracks, ...row } = p;
        const { data, error } = await db.from("listen_proofs").insert(row).select("id").single();
        if (error) throw error;
        await must(db.from("listen_tracks").insert(tracks.map((t) => ({ ...t, proof_id: data.id }))));
      }
    }
    if (seed.sims) {
      await must(db.from("sims").delete().neq("id", 0));
      await must(db.from("sims").insert(seed.sims));
    }
    if (seed.chapters) {
      await must(db.from("chapters").delete().neq("id", 0));
      await must(db.from("chapters").insert(seed.chapters));
    }
    if (seed.dossiers) {
      await must(db.from("dossiers").delete().neq("id", 0));
      await must(db.from("dossiers").insert(seed.dossiers));
    }
    if (seed.storyShorts) {
      await must(db.from("story_shorts").delete().neq("id", 0));
      await must(db.from("story_shorts").insert(seed.storyShorts));
    }
    console.log(`✓ ${site.slug}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function must(p: PromiseLike<{ error: any }>) {
  const { error } = await p;
  if (error) throw new Error(error.message ?? String(error));
}

main().then(() => console.log("seeded."));
