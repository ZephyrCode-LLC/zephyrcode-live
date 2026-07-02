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
  "eks-defaults": {
    eyebrow: "ZEPHYRCODE TEARDOWN · KUBERNETES · NO. 03",
    title: "The EKS cluster you inherited",
    accent: "runs on defaults.",
    chips: ["8 findings", "every claim sourced", "AWS docs · kubernetes.io"],
  },
  // ---- Field Reports (production AI agent series) ------------------------
  "fr01-redis-only-trap": {
    eyebrow: "ZEPHYRCODE FIELD REPORT · PRODUCTION AGENTS · NO. 01",
    title: "The Redis-only trap",
    accent: "one store, silently wrong.",
    chips: ["a production field report", "CQRS · outbox · pgvector", "WhatsApp pharmacy agent"],
    domain: "zephyrcode.live",
  },
  "fr02-context-engineering": {
    eyebrow: "ZEPHYRCODE FIELD REPORT · PRODUCTION AGENTS · NO. 02",
    title: "Context engineering, in production",
    accent: "44.7k → 2.8k.",
    chips: ["a production field report", "turn slicing · intent routing", "WhatsApp pharmacy agent"],
    domain: "zephyrcode.live",
  },
  "fr03-cant-improve-cant-see": {
    eyebrow: "ZEPHYRCODE FIELD REPORT · PRODUCTION AGENTS · NO. 03",
    title: "You can't improve",
    accent: "what you can't see.",
    chips: ["a production field report", "Langfuse · LLM-as-judge · CI gate", "WhatsApp pharmacy agent"],
    domain: "zephyrcode.live",
  },
  "fr04-hitl-throughput": {
    eyebrow: "ZEPHYRCODE FIELD REPORT · PRODUCTION AGENTS · NO. 04",
    title: "Human-in-the-loop",
    accent: "without killing throughput.",
    chips: ["a production field report", "queues · locks · escalation", "WhatsApp pharmacy agent"],
    domain: "zephyrcode.live",
  },
  "fr05-learning-loop": {
    eyebrow: "ZEPHYRCODE FIELD REPORT · PRODUCTION AGENTS · NO. 05",
    title: "The learning loop",
    accent: "that haunts every AI team.",
    chips: ["a production field report", "corrections → evals → fine-tune", "WhatsApp pharmacy agent"],
    domain: "zephyrcode.live",
  },
  "fr06-one-agent-or-many": {
    eyebrow: "ZEPHYRCODE FIELD REPORT · PRODUCTION AGENTS · NO. 06",
    title: "One agent",
    accent: "or many?",
    chips: ["a production field report", "sub-agents · topology", "WhatsApp pharmacy agent"],
    domain: "zephyrcode.live",
  },
};
