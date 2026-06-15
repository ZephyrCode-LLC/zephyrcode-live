import "server-only";
import { z } from "zod";
import { contentClient } from "./supabase/server";

/** Typed content fetchers. blocks.data is validated with zod at the boundary (BRIEF §1). */

export const SiteRow = z.object({
  slug: z.string(),
  host: z.string(),
  title: z.string(),
  description: z.string(),
  accent: z.string(),
  og_image: z.string().nullable(),
  nav_order: z.number(),
});
export type Site = z.infer<typeof SiteRow>;

export const BlockRow = z.object({
  section: z.string(),
  kind: z.string(),
  position: z.number(),
  data: z.record(z.string(), z.unknown()),
});
export type Block = z.infer<typeof BlockRow>;

export type Blocks = Record<string, Block[]>; // keyed by section, ordered by position

export async function getSites(forSlug: string): Promise<Site[]> {
  const { data, error } = await contentClient(forSlug)
    .from("sites")
    .select("*")
    .order("nav_order");
  if (error) throw new Error(`sites: ${error.message}`);
  return z.array(SiteRow).parse(data);
}

export async function getSite(slug: string): Promise<Site | null> {
  const sites = await getSites(slug);
  return sites.find((s) => s.slug === slug) ?? null;
}

export async function getBlocks(slug: string): Promise<Blocks> {
  const { data, error } = await contentClient(slug)
    .from("blocks")
    .select("section, kind, position, data")
    .eq("site_slug", slug)
    .order("position");
  if (error) throw new Error(`blocks: ${error.message}`);
  const rows = z.array(BlockRow).parse(data);
  const by: Blocks = {};
  for (const r of rows) (by[r.section] ??= []).push(r);
  return by;
}

/** Convenience: the single block of a section (heading, lede, …). */
export function one(blocks: Blocks, section: string): Block | undefined {
  return blocks[section]?.[0];
}
export function dataOf<T extends z.ZodTypeAny>(
  blocks: Blocks,
  section: string,
  schema: T
): z.infer<T> | undefined {
  const b = one(blocks, section);
  return b ? schema.parse(b.data) : undefined;
}

/* ---------------- table-backed content ---------------- */

export const BookRow = z.object({
  position: z.number().nullable(),
  title: z.string(),
  author: z.string(),
  pos: z.coerce.number(),
  register: z.string(),
  lang: z.string(),
  note: z.string(),
});
export type Book = z.infer<typeof BookRow>;
export async function getBooks(slug: string): Promise<Book[]> {
  const { data, error } = await contentClient(slug).from("books").select("*").order("position");
  if (error) throw new Error(`books: ${error.message}`);
  return z.array(BookRow.passthrough()).parse(data) as Book[];
}

export const WatchChannel = z.object({
  id: z.number(),
  n: z.string(),
  name: z.string(),
  tagline: z.string(),
  position: z.number(),
  titles: z.array(
    z.object({
      title: z.string(),
      match: z.number(),
      platform: z.string(),
      why: z.string(),
      position: z.number(),
    })
  ),
});
export type WatchChannelT = z.infer<typeof WatchChannel>;
export async function getWatchChannels(slug: string): Promise<WatchChannelT[]> {
  const { data, error } = await contentClient(slug)
    .from("watch_channels")
    .select("id, n, name, tagline, position, titles:watch_titles(title, match, platform, why, position)")
    .order("position");
  if (error) throw new Error(`watch: ${error.message}`);
  const parsed = z.array(WatchChannel).parse(data);
  parsed.forEach((c) => c.titles.sort((a, b) => a.position - b.position));
  return parsed;
}

export const ListenProof = z.object({
  id: z.number(),
  n: z.string(),
  name: z.string(),
  claim: z.string(),
  voices: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))),
  position: z.number(),
  tracks: z.array(
    z.object({ title: z.string(), artist: z.string(), why: z.string(), position: z.number() })
  ),
});
export type ListenProofT = z.infer<typeof ListenProof>;
export async function getListenProofs(slug: string): Promise<ListenProofT[]> {
  const { data, error } = await contentClient(slug)
    .from("listen_proofs")
    .select("id, n, name, claim, voices, position, tracks:listen_tracks(title, artist, why, position)")
    .order("position");
  if (error) throw new Error(`listen: ${error.message}`);
  const parsed = z.array(ListenProof).parse(data);
  parsed.forEach((p) => p.tracks.sort((a, b) => a.position - b.position));
  return parsed;
}

export const SimRow = z.object({
  slug: z.string(),
  name: z.string(),
  grammar: z.string().nullable(),
  blurb: z.string(),
  position: z.number(),
});
export type Sim = z.infer<typeof SimRow>;
export async function getSims(slug: string): Promise<Sim[]> {
  const { data, error } = await contentClient(slug).from("sims").select("*").order("position");
  if (error) throw new Error(`sims: ${error.message}`);
  return z.array(SimRow.passthrough()).parse(data) as Sim[];
}

export const ChapterRow = z.object({
  code: z.string(),
  dateline: z.string().nullable(),
  title: z.string(),
  sealed: z.boolean(),
  position: z.number(),
});
export type Chapter = z.infer<typeof ChapterRow>;
export async function getChapters(slug: string): Promise<Chapter[]> {
  const { data, error } = await contentClient(slug).from("chapters").select("*").order("position");
  if (error) throw new Error(`chapters: ${error.message}`);
  return z.array(ChapterRow.passthrough()).parse(data) as Chapter[];
}

export const DossierRow = z.object({
  role: z.string(),
  name: z.string(),
  blurb: z.string(),
  tiers: z.array(z.object({ label: z.string(), open: z.boolean() })),
  position: z.number(),
});
export type Dossier = z.infer<typeof DossierRow>;
export async function getDossiers(slug: string): Promise<Dossier[]> {
  const { data, error } = await contentClient(slug).from("dossiers").select("*").order("position");
  if (error) throw new Error(`dossiers: ${error.message}`);
  return z.array(DossierRow.passthrough()).parse(data) as Dossier[];
}

export const StoryShort = z.object({
  title: z.string(),
  slug: z.string().nullable(),
  status: z.string().nullable(),
  featured: z.boolean(),
  body: z.record(z.string(), z.unknown()),
  position: z.number(),
});
export type StoryShortT = z.infer<typeof StoryShort>;
/** Index listing — deliberately excludes the heavy `markdown` column. */
export async function getStoryShorts(slug: string): Promise<StoryShortT[]> {
  const { data, error } = await contentClient(slug)
    .from("story_shorts")
    .select("title, slug, status, featured, body, position")
    .order("position");
  if (error) throw new Error(`story_shorts: ${error.message}`);
  return z.array(StoryShort.passthrough()).parse(data) as StoryShortT[];
}

/** One story's full reader payload, by slug. The reader is the only place markdown loads. */
export const StoryFull = z.object({
  title: z.string(),
  slug: z.string(),
  body: z.record(z.string(), z.unknown()),
  markdown: z.string(),
});
export type StoryFullT = z.infer<typeof StoryFull>;
export async function getStoryBySlug(
  forSite: string,
  storySlug: string
): Promise<StoryFullT | null> {
  const { data, error } = await contentClient(forSite)
    .from("story_shorts")
    .select("title, slug, body, markdown")
    .eq("slug", storySlug)
    .maybeSingle();
  if (error) throw new Error(`story_shorts(${storySlug}): ${error.message}`);
  if (!data || data.markdown == null) return null;
  return StoryFull.passthrough().parse(data) as StoryFullT;
}
