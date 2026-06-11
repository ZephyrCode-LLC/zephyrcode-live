# zephyrcode.live — eight quiet pages, one humming system

One Next.js 15 app serving **zephyrcode.live and seven subdomains** by host-based
middleware rewrite. All copy lives in Supabase (project `iafmiiuxygvsulohmrqz`,
seeded **verbatim** from the hand-built HTML in `/_reference`); components contain
zero content strings. Design system is bespoke CSS on the §7 token set — no UI kit.

## Run

```bash
pnpm install
cp .env.example .env.local   # values in Amplify console env / Supabase dashboard
pnpm dev                      # http://localhost:3000/?site=read (or read.localhost:3000)
```

## Architecture decisions

- **Hosting: AWS Amplify** (app `zephyrcode-live`, id `d29g10v1y8ncpb`, region
  `ap-south-1`, profile `lokam`, platform WEB_COMPUTE/SSR). GitHub-connected:
  pushes to `main` auto-build and deploy. Amplify's Next.js adapter runs the
  middleware host-rewrite + ISR `revalidateTag` natively. Build config lives in
  `amplify.yml` — the key detail is enabling pnpm via corepack in preBuild
  (`corepack enable && corepack prepare pnpm@10.11.0 --activate`), since Amplify's
  image ships only npm/yarn. Env vars are set in the Amplify console (Supabase
  URL/anon key, REVALIDATE_SECRET, NEXT_PUBLIC_ASSET_BASE, NEXT_PUBLIC_BOOK_URL).
  Assets ride a separate CloudFront dist (§5) under the same profile.
  (Previously Netlify — fully migrated off; the site there was deleted.)
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

## DNS (Namecheap) — pointed at Amplify

The zephyrcode-live Amplify app serves the apex + 7 content subdomains off one
CloudFront dist (`d228z59xlexxog.cloudfront.net`); the antyodaya reader app serves
`book` off its own dist. The apex uses a Namecheap ALIAS (apex CNAME is invalid).

| Type | Host | Value |
|---|---|---|
| ALIAS | `@` | `d228z59xlexxog.cloudfront.net` |
| CNAME | `www` `antyodaya` `stories` `operator` `arcade` `read` `watch` `listen` | `d228z59xlexxog.cloudfront.net` |
| CNAME | `book` | `d3w567ixpqet2a.cloudfront.net` (antyodaya reader app) |
| CNAME | `_f2e90fe508415271fece8a28ea877efa` | `_80a6b941df84229a45bead012ce9594e.xlfgrmvvlj.acm-validations.aws.` (shared ACM validation for zephyrcode.live) |

Custom domains are attached via `aws amplify create-domain-association` on each
app; Amplify issues the Let's Encrypt/ACM cert once the records above resolve.

## Ops

- **Seed**: `scripts/content/*.ts` is the verbatim source of truth;
  `SUPABASE_SERVICE_ROLE_KEY=… pnpm tsx scripts/seed.ts` (idempotent), or
  `pnpm tsx scripts/emit-seed-sql.mjs` → `supabase/seed.sql`.
- **Assets**: drop files in `./assets`, run `scripts/deploy-assets.sh`
  (S3 `zephyrcode-assets` → CloudFront `E1OQXM5YAS7O9O`,
  `https://d1chgxu25czul8.cloudfront.net` = `NEXT_PUBLIC_ASSET_BASE`).
- **Types**: regenerate `src/lib/database.types.ts` after schema changes.
- **Acceptance grep (§9.6)**: `grep -rn "sternum\|suspiciously pristine\|load-bearing" src/components` → no hits.
