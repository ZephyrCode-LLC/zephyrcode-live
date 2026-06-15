/**
 * Seed data shapes. THE COPY IS SACRED (BRIEF prime directive): every string
 * in scripts/content/<slug>.ts is extracted VERBATIM from /_reference/<slug>.html.
 * Components contain zero content strings — they render these rows.
 */

export type SiteRowSeed = {
  slug: string;
  host: string;
  title: string; // the <title> of the source page
  description: string; // the meta description, verbatim
  accent: string; // per-site accent hex
  og_image: string | null;
  nav_order: number;
};

export type BlockSeed = {
  section: string;
  kind: string;
  position: number;
  data: Record<string, unknown>;
};

export type SiteSeed = {
  site: SiteRowSeed;
  blocks: BlockSeed[];
  books?: Array<{ position: number; title: string; author: string; pos: number; register: string; lang: string; note: string }>;
  watch?: Array<{ n: string; name: string; tagline: string; position: number; titles: Array<{ title: string; match: number; platform: string; why: string; position: number }> }>;
  listenProofs?: Array<{ n: string; name: string; claim: string; voices: Array<Record<string, string | number | boolean>>; position: number; tracks: Array<{ title: string; artist: string; why: string; position: number }> }>;
  sims?: Array<{ slug: string; name: string; grammar: string | null; blurb: string; position: number }>;
  chapters?: Array<{ code: string; dateline: string | null; title: string; sealed: boolean; position: number }>;
  dossiers?: Array<{ role: string; name: string; blurb: string; tiers: Array<{ label: string; open: boolean }>; position: number }>;
  storyShorts?: Array<{ title: string; slug: string | null; status: string | null; featured: boolean; body: Record<string, unknown>; markdown: string | null; position: number }>;
};
