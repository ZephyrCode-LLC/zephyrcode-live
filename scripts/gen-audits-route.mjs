// Regenerates src/app/audits/route.ts from public/audits.html.
//
// Why this exists: audits.zephyrcode.live is a standalone landing page (its own
// <html>/<head>, fonts, inline CSS) — not a CMS room. Serving it via a Next
// middleware rewrite of `/` -> `/audits.html` (a public/ file) returns a 404 on
// Amplify, because public assets live behind a separate CDN behaviour that the
// SSR rewrite can't resolve. So instead we serve the document from a real route
// handler (/audits) and middleware rewrites `/` -> `/audits` for the audits host.
//
// The HTML is base64-inlined so the compute response has zero filesystem/public
// dependency. Run this after editing public/audits.html:
//   node scripts/gen-audits-route.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync(new URL("../public/audits.html", import.meta.url), "utf-8");
const b64 = Buffer.from(html, "utf-8").toString("base64");

const ts = `// AUTO-GENERATED from public/audits.html by scripts/gen-audits-route.mjs — do not edit by hand.
// Serves the standalone Engineering Audits landing at audits.zephyrcode.live.
// (A middleware rewrite of the public/*.html file 404s on Amplify, so we serve
// the document from compute here; middleware rewrites \`/\` -> \`/audits\`.)
export const dynamic = "force-dynamic";

const HTML = Buffer.from(
  "${b64}",
  "base64",
).toString("utf-8");

export function GET() {
  return new Response(HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
`;

mkdirSync(new URL("../src/app/audits/", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/app/audits/route.ts", import.meta.url), ts);
console.log(`wrote src/app/audits/route.ts (html ${html.length}B, base64 ${b64.length}B)`);
