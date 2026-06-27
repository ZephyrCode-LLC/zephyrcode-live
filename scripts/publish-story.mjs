#!/usr/bin/env node
/**
 * Publish stories.zephyrcode.live shorts from markdown files — no hand-SQL, no deploy.
 *
 *   npm run publish-story -- scripts/content/<file>.md [more.md ...]
 *   npm run publish-story -- --sql scripts/content/<file>.md   # emit SQL instead of writing
 *
 * Each file carries a JSON header (the landing-card `body` + meta) inside an HTML
 * comment, then the story markdown (## headings, --- rules, **bold**, *italic*,
 * and a final "*— attribution" line all render in the reader):
 *
 *   <!--zc:story
 *   {
 *     "title": "...", "slug": "...", "position": 5,
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
 * row fires the Supabase webhook -> /api/revalidate, so it's live within seconds.
 *
 * The SUPABASE_SERVICE_ROLE_KEY lives only in Amplify (never committed), so on a
 * dev machine this script auto-falls back to --sql mode: it prints a dollar-quoted
 * upsert you can run straight against the DB (psql / Supabase SQL editor / MCP).
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

/** Parse one .md into { meta, row }, throwing with a clear message on any gap. */
function parseStory(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/<!--\s*zc:story\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`no <!--zc:story { ... } --> header in ${file}`);
  let meta;
  try {
    meta = JSON.parse(m[1].trim());
  } catch (e) {
    throw new Error(`story header is not valid JSON in ${file}: ${e.message}`);
  }
  const markdown = raw.slice(m.index + m[0].length).trim();
  if (!markdown) throw new Error(`no markdown body after the header in ${file}`);

  // The landing card (StoryBody) requires these — fail loudly rather than crash the page.
  const required = ["title", "slug", "accent", "dek", "k", "pullquote", "chips", "exhibit", "board"];
  const missing = required.filter((k) => meta[k] === undefined);
  if (missing.length) throw new Error(`${file}: missing required field(s): ${missing.join(", ")}`);
  if (!Array.isArray(meta.paragraphs) || meta.paragraphs.length === 0) {
    throw new Error(`${file}: \`paragraphs\` must be a non-empty array (the card preview)`);
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
  return { meta, row };
}

/** Postgres dollar-quote — no escaping needed, the body/markdown go in verbatim. */
const dq = (tag, s) => `$${tag}$${s}$${tag}$`;

function emitSql({ meta, row }) {
  const body = `${dq("zcb", JSON.stringify(row.body))}::jsonb`;
  const md = dq("zcm", row.markdown);
  const title = dq("zct", row.title);
  const slug = dq("zcs", row.slug);
  const status = row.status === null ? "null" : `'${row.status}'`;
  const featured = row.featured ? "true" : "false";
  const position = row.position !== undefined ? row.position : "null";
  if (meta.into !== undefined) {
    return `update public.story_shorts set title=${title}, position=${position}, status=${status}, featured=${featured}, body=${body}, markdown=${md} where id=${Number(meta.into)};`;
  }
  // Idempotent without needing a unique constraint on slug.
  return (
    `insert into public.story_shorts (title, slug, position, status, featured, body, markdown)\n` +
    `select ${title}, ${slug}, ${position}, ${status}, ${featured}, ${body}, ${md}\n` +
    `where not exists (select 1 from public.story_shorts where slug = ${slug});`
  );
}

const argv = process.argv.slice(2);
const sqlMode = argv.includes("--sql");
const files = argv.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.error("usage: npm run publish-story -- [--sql] <file.md> [more.md ...]");
  process.exit(1);
}

let parsed;
try {
  parsed = files.map(parseStory);
} catch (e) {
  console.error("✗ " + e.message);
  process.exit(1);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

// No service key on this machine (it's Amplify-only) — or --sql forced: print SQL.
if (sqlMode || !url || !key) {
  if (!sqlMode) {
    console.error("• SUPABASE_SERVICE_ROLE_KEY not in local env — emitting SQL instead (run it against the DB).\n");
  }
  for (const p of parsed) {
    console.log(`-- ${p.row.slug} (#${p.row.position ?? "?"})`);
    console.log(emitSql(p));
    console.log("");
  }
  process.exit(0);
}

const db = createClient(url, key, { auth: { persistSession: false } });
for (const { meta, row } of parsed) {
  let res;
  if (meta.into !== undefined) {
    res = await db.from("story_shorts").update(row).eq("id", meta.into).select("id, slug, status");
  } else {
    const { data: existing } = await db.from("story_shorts").select("id").eq("slug", row.slug).maybeSingle();
    res = existing
      ? await db.from("story_shorts").update(row).eq("id", existing.id).select("id, slug, status")
      : await db.from("story_shorts").insert(row).select("id, slug, status");
  }
  if (res.error) {
    console.error(`✗ DB error (${row.slug}):`, res.error.message);
    process.exit(1);
  }
  const r = res.data?.[0];

  // Best-effort cache bust so it's live immediately (the Supabase webhook also fires on write).
  if (env.REVALIDATE_SECRET) {
    try {
      await fetch(`https://stories.zephyrcode.live/api/revalidate?secret=${encodeURIComponent(env.REVALIDATE_SECRET)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ table: "story_shorts", record: { slug: row.slug } }),
      });
    } catch { /* webhook + ISR TTL will catch up */ }
  }

  console.log(`✓ published "${row.title}" → row ${r?.id}, status=${r?.status === null ? "LIVE" : r?.status}`);
  console.log(`  https://stories.zephyrcode.live/story/${row.slug}`);
}
