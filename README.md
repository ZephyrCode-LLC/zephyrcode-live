# zephyrcode.live — eight quiet pages, one humming system

One Next.js 15 app serving **zephyrcode.live and seven subdomains** by host-based
middleware rewrite. All copy lives in Supabase (project `iafmiiuxygvsulohmrqz`,
seeded **verbatim** from the hand-built HTML in `/_reference`); components contain
zero content strings. Design system is bespoke CSS on the §7 token set — no UI kit.

## Run

```bash
pnpm install
cp .env.example .env.local   # values in Netlify env / Supabase dashboard
pnpm dev                      # http://localhost:3000/?site=read (or read.localhost:3000)
```

## Architecture decisions

- **Hosting: Netlify (BRIEF §10 option a)** — wildcard subdomains are first-class,
  the MCP connection automated site/env/deploys, and its Next runtime supports
  `revalidateTag` natively, which powers the edit-to-live-in-seconds pipeline.
  Assets ride CloudFront (§5) under AWS profile `lokam`. The one Netlify gotcha
  worth recording: the Next plugin requires `publish = ".next"` in netlify.toml —
  without it every deploy fails with a generic exit code 2.
- **Routing**: `src/middleware.ts` maps host → slug and rewrites `/` to
  `/sites/{slug}` (the brief's `_sites` is impossible — underscore directories are
  *private* in the App Router). Direct `/sites/*` hits 308-redirect to the
  canonical host. Dev: `home.localhost:3000` or `/?site=home`.
- **Content**: `src/lib/content.ts` — typed fetchers, zod at the boundary, every
  request tagged `site:<slug>` + `content`. Pages are SSG+ISR (`revalidate = 3600`).
  Postgres triggers (pg_net) on all 11 content tables POST to `/api/revalidate`,
  which maps table → affected sites and calls `revalidateTag` — an edit in Supabase
  is live in seconds, no deploy.
- **Engines** (`src/components/engine/`): ParticleField (exact shader/formation
  port, dynamic-imported, never blocks LCP), DiyaFlame, MagnetBoard, MoodDial,
  ChannelTuner, ProofWaveform, BootSequence, ConsequenceWeek/Month, CascadeDelays,
  UptimeCounter. All props-driven from DB; all honor `prefers-reduced-motion`
  (static frame / disabled loops, parity with the source pages).
- **The book link**: the antyodaya landing's CTAs and unsealed chapter cards open
  the real reader at **book.zephyrcode.live** (Amplify custom domain on the
  antyodaya reader app). Link targets only — copy untouched.

## DNS (GoDaddy)

| Type | Host | Value |
|---|---|---|
| A | `@` | `75.2.60.5` (Netlify load balancer) |
| CNAME | `www` | `zephyrcode-live.netlify.app` |
| CNAME | `antyodaya` | `zephyrcode-live.netlify.app` |
| CNAME | `stories` | `zephyrcode-live.netlify.app` |
| CNAME | `operator` | `zephyrcode-live.netlify.app` |
| CNAME | `arcade` | `zephyrcode-live.netlify.app` |
| CNAME | `read` | `zephyrcode-live.netlify.app` |
| CNAME | `watch` | `zephyrcode-live.netlify.app` |
| CNAME | `listen` | `zephyrcode-live.netlify.app` |
| CNAME | `book` | `dzgiebcwohf0l.cloudfront.net` (Amplify reader) |
| CNAME | `_f2e90fe508415271fece8a28ea877efa` | `_80a6b941df84229a45bead012ce9594e.xlfgrmvvlj.acm-validations.aws.` (ACM cert for book) |

After DNS: add `zephyrcode.live` + the 7 subdomains as domain aliases in the
Netlify dashboard (Domain management) so certificates issue.

## Ops

- **Seed**: `scripts/content/*.ts` is the verbatim source of truth;
  `SUPABASE_SERVICE_ROLE_KEY=… pnpm tsx scripts/seed.ts` (idempotent), or
  `pnpm tsx scripts/emit-seed-sql.mjs` → `supabase/seed.sql`.
- **Assets**: drop files in `./assets`, run `scripts/deploy-assets.sh`
  (S3 `zephyrcode-assets` → CloudFront `E1OQXM5YAS7O9O`,
  `https://d1chgxu25czul8.cloudfront.net` = `NEXT_PUBLIC_ASSET_BASE`).
- **Types**: regenerate `src/lib/database.types.ts` after schema changes.
- **Acceptance grep (§9.6)**: `grep -rn "sternum\|suspiciously pristine\|load-bearing" src/components` → no hits.
