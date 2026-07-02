#!/usr/bin/env node
/**
 * Generate a post cover from the spec sheet (src/lib/cover-specs.ts).
 *
 *   node scripts/cover.mjs kafka-defaults          # against local dev (:3010)
 *   node scripts/cover.mjs kafka-defaults --live   # against the deployed site
 *
 * Saves docs/covers/<slug>.png and ~/Downloads/<slug>-cover.png.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const slug = process.argv[2];
const live = process.argv.includes("--live");
if (!slug) {
  console.error("usage: node scripts/cover.mjs <slug> [--live]");
  process.exit(1);
}

const base = live ? "https://audits.zephyrcode.live" : "http://localhost:3010";
const url = `${base}/covers/${slug}`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`${url} → ${res.status} ${await res.text()}`);
  process.exit(1);
}
const png = Buffer.from(await res.arrayBuffer());

const repoOut = path.join(process.cwd(), "docs", "covers", `${slug}.png`);
const dlOut = path.join(homedir(), "Downloads", `${slug}-cover.png`);
await mkdir(path.dirname(repoOut), { recursive: true });
await writeFile(repoOut, png);
await writeFile(dlOut, png);
console.log(`${url}\n → ${repoOut}\n → ${dlOut}  (${(png.length / 1024).toFixed(0)} KB)`);
