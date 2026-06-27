#!/usr/bin/env node
/**
 * Publish a stories.zephyrcode.live short from ONE markdown file — no SQL, no deploy.
 *
 *   npm run publish-story -- scripts/content/<file>.md
 *
 * The file carries a JSON header (the landing-card `body` + meta) inside an HTML
 * comment, then the story markdown (## headings, --- rules, **bold**, *italic*,
 * and a final "*— attribution" line all render in the reader):
 *
 *   <!--zc:story
 *   {
 *     "title": "...", "slug": "...", "position": 4,
 *     "into": 12,                // optional: publish INTO a dishwasher placeholder row id
 *     "accent": "#C49A5E", "accent2": "#cdd2dd",   // accent2 optional (secondary highlight)
 *     "dek": "...", "k": "...", "pullquote": "...",
 *     "chips": ["...","...","..."],
 *     "exhibit": { "k": "...", "line": "..." },
 *     "board": { "k": "...", "button": "...", "notes": ["..."], "sentences": [["..."]] },
 *     "paragraphs": ["...","..."]
 *   }
 *   -->
 *   ## 1. ...
 *   ...story...
 *
 * Publishing always sets status = NULL (live). With "into", the named placeholder
 * row is filled in and thereby leaves the "dishwasher" (rinsing) rail. Writing the
 * row fires the Supabase webhook → /api/revalidate, so it's live within seconds.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const f of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(f, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch { /* file optional */ }
  }
  return env;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: npm run publish-story -- <file.md>");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const m = raw.match(/<!--\s*zc:story\s*([\s\S]*?)-->/);
if (!m) {
  console.error(`✗ no <!--zc:story { ... } --> header in ${file}`);
  process.exit(1);
}
let meta;
try {
  meta = JSON.parse(m[1].trim());
} catch (e) {
  console.error("✗ story header is not valid JSON:", e.message);
  process.exit(1);
}

const markdown = raw.slice(m.index + m[0].length).trim();
if (!markdown) {
  console.error("✗ no markdown body after the header");
  process.exit(1);
}

// The landing card (StoryBody) requires these — fail loudly rather than crash the page.
const required = ["title", "slug", "accent", "dek", "k", "pullquote", "chips", "exhibit", "board"];
const missing = required.filter((k) => meta[k] === undefined);
if (missing.length) {
  console.error("✗ missing required field(s): " + missing.join(", "));
  process.exit(1);
}
if (!Array.isArray(meta.paragraphs) || meta.paragraphs.length === 0) {
  console.error("✗ `paragraphs` must be a non-empty array (the card preview)");
  process.exit(1);
}

const body = {
  accent: meta.accent,
  dek: meta.dek,
  k: meta.k,
  pullquote: meta.pullquote,
  paragraphs: meta.paragraphs,
  chips: meta.chips,
  exhibit: meta.exhibit,
  board: meta.board,
};
if (meta.accent2) body.accent2 = meta.accent2;

const row = {
  title: meta.title,
  slug: meta.slug,
  body,
  markdown,
  status: meta.status ?? null, // null = published / live
  featured: meta.featured ?? false,
};
if (meta.position !== undefined) row.position = meta.position;

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

let res;
if (meta.into !== undefined) {
  res = await db.from("story_shorts").update(row).eq("id", meta.into).select("id, slug, status");
} else {
  const { data: existing } = await db.from("story_shorts").select("id").eq("slug", meta.slug).maybeSingle();
  res = existing
    ? await db.from("story_shorts").update(row).eq("id", existing.id).select("id, slug, status")
    : await db.from("story_shorts").insert(row).select("id, slug, status");
}
if (res.error) {
  console.error("✗ DB error:", res.error.message);
  process.exit(1);
}
const r = res.data?.[0];

// Best-effort cache bust so it's live immediately (the Supabase webhook also fires on write).
if (env.REVALIDATE_SECRET) {
  try {
    await fetch(`https://stories.zephyrcode.live/api/revalidate?secret=${encodeURIComponent(env.REVALIDATE_SECRET)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ table: "story_shorts", record: { slug: meta.slug } }),
    });
  } catch { /* webhook + ISR TTL will catch up */ }
}

console.log(`✓ published "${meta.title}" → row ${r?.id}, status=${r?.status === null ? "LIVE" : r?.status}`);
console.log(`  https://stories.zephyrcode.live/story/${meta.slug}`);
console.log("  (it has left the dishwasher; live in seconds, ≤1h TTL fallback)");
