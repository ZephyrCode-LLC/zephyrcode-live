/**
 * Cover spec sheet — one entry per Substack/social post. The /covers/[slug]
 * route renders these as 1200×630 (2× output) editorial cards using the audits
 * design system (Fraunces + JetBrains Mono, diagnostic cyan on graphite), so a
 * post cover is never a hand-cropped screenshot again.
 *
 * Add a spec → `node scripts/cover.mjs <slug>` → PNG in docs/covers + ~/Downloads.
 */

export type CoverSpec = {
  /** Small mono eyebrow, e.g. "ZEPHYRCODE TEARDOWN · STREAMING · NO. 01" */
  eyebrow: string;
  /** Title line(s); `accent` renders after it in italic cyan Fraunces. */
  title: string;
  accent?: string;
  /** Small bordered mono chips under the title (keep ≤3, short). */
  chips?: string[];
  /** Bottom-left byline; defaults to the standard credential line. */
  byline?: string;
  /** Bottom-right domain; defaults to audits.zephyrcode.live */
  domain?: string;
};

export const DEFAULT_BYLINE =
  "Priyanshu Sekhar Patra — ex-Amazon Alexa · distributed systems";

export const COVERS: Record<string, CoverSpec> = {
  "kafka-defaults": {
    eyebrow: "ZEPHYRCODE TEARDOWN · STREAMING · NO. 01",
    title: "The Kafka defaults that page you",
    accent: "at 3am.",
    chips: ["8 findings", "every default sourced", "Kafka 4.1 baseline"],
  },
  "postgres-pools": {
    eyebrow: "ZEPHYRCODE TEARDOWN · DATABASES · NO. 02",
    title: "The Postgres connection pool",
    accent: "that isn't one.",
    chips: ["8 findings", "every default sourced", "current Postgres docs"],
  },
};
