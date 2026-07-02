import type { Metadata } from "next";

/**
 * Public teardown #2 — databases. Subject: PostgreSQL's OWN documented defaults
 * (current/17 reference docs) + the raise-max_connections folklore — never any
 * team's private prod. Every default sourced; figures labelled typical per the
 * research fairness checklist. Ships INDEXED (the teardown thread is public).
 */

const CANON = "https://audits.zephyrcode.live/teardowns/postgres-pools";

export const metadata: Metadata = {
  title: "The Postgres connection pool that isn't one — a ZephyrCode teardown",
  description:
    "PostgreSQL's defaults are tuned for a laptop, and the classic 'fix' — raising max_connections — makes production worse. Eight defaults, each with the exact setting, the mechanism, and the fix. Every default sourced against the current Postgres docs.",
  alternates: { canonical: CANON },
  robots: { index: true, follow: true },
  openGraph: {
    type: "article",
    url: CANON,
    siteName: "ZephyrCode — Engineering Audits",
    title: "The Postgres connection pool that isn't one",
    description:
      "A teardown of the Postgres config everyone inherits — eight production-hostile defaults, the saturation arithmetic behind the classic max_connections mistake, and the fixes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Postgres connection pool that isn't one",
    description:
      "Eight production-hostile Postgres defaults — the mechanism, the fix, every default sourced.",
  },
};

type Finding = {
  n: number;
  sev: "High" | "Medium";
  title: string;
  who: string;
  body: string;
  code: string; // pre-formatted HTML (spans: c=comment, e=value, flag=risky line, datum=right note)
  fix: string;
  trade: string;
  before: string;
  after: string;
  source: { label: string; href: string }[];
};

const FINDINGS: Finding[] = [
  {
    n: 1,
    sev: "High",
    title: "The pool that isn’t one",
    who: "Pages the on-call the night traffic doubles and someone “fixes” it by raising max_connections.",
    body: "Every Postgres connection is an operating-system process. max_connections=100 isn’t a queue in front of the database — it’s permission for up to 100 backend processes to compete for your cores, your locks, and your buffer pool at once. When latency climbs, the reflex fix is to raise the cap; now 500 backends thrash where a few dozen could work, and throughput falls as p99 rises. The saturation curve looks like a database problem, but it’s arithmetic: a machine does roughly cores-times-a-small-factor of useful database work at once, and every connection past that point pays context-switch and contention tax without adding throughput. The pool your system needs is a real one — in front of Postgres, in transaction mode — not a bigger cap.",
    code: `<span class="flag">max_connections = <span class="e">100</span><span class="datum">◂ processes, not a queue</span></span>
<span class="c"># the classic “fix” that makes it worse</span>
<span class="flag">max_connections = <span class="e">500</span><span class="datum">◂ 500 backends thrash, throughput falls</span></span>`,
    fix: "Put a transaction-mode pooler (PgBouncer or your platform’s equivalent) in front; size its server pool near cores×2–4 for OLTP, and keep max_connections modest — the pooler queues the burst instead of letting it thrash.",
    trade: "Transaction pooling changes session semantics: session-level state (SET, advisory locks, LISTEN) needs care, and prepared statements need a pooler version that tracks them at the protocol level.",
    before: "Typical: raising the cap under load → p99 climbs while total throughput falls",
    after: "Typical: same offered load queues at the pooler; active backends stay near cores×k, p99 stabilises",
    source: [
      { label: "connection settings", href: "https://www.postgresql.org/docs/current/runtime-config-connection.html" },
      { label: "PG wiki: number of connections", href: "https://wiki.postgresql.org/wiki/Number_Of_Database_Connections" },
      { label: "PgBouncer features", href: "https://www.pgbouncer.org/features.html" },
    ],
  },
  {
    n: 2,
    sev: "High",
    title: "The 4 MB that multiplies",
    who: "Pages whoever owns the box when the OOM killer picks Postgres.",
    body: "work_mem defaults to 4 MB — and it is not per query. It’s per sort or hash operation, per node of the plan, and a complex query runs several at once. Multiply by hundreds of connections (Finding 1) and the same setting is either far too small — every sort spills to disk as temp files, quietly — or, after someone raises it globally to “fix reports,” far too large, and a busy hour turns into an out-of-memory kill. The default’s crime is that it invites a global answer to a per-workload question.",
    code: `<span class="flag">work_mem = <span class="e">4MB</span><span class="datum">◂ per sort/hash, PER PLAN NODE</span></span>
<span class="c"># worst case ≈ work_mem × nodes × active connections</span>
<span class="c">#           ≈ 4MB × 4 × 300 = ~4.8 GB … or 64MB × 4 × 300 = 75 GB</span>`,
    fix: "Size work_mem for the workload, not globally: a modest default, raised per role or per session (SET work_mem) for reporting queries; watch temp-file creation (log_temp_files, pg_stat_database.temp_bytes) to see where it’s genuinely too small.",
    trade: "Per-role/session discipline is more moving parts than one global number; raising it anywhere multiplies against concurrency, so the pooler cap from Finding 1 is what makes larger values safe.",
    before: "Sorts spill to disk unnoticed — or a global raise OOMs the box under concurrency",
    after: "Deliberate memory budget: spills visible and bounded, no multiplication surprise",
    source: [
      { label: "resource settings", href: "https://www.postgresql.org/docs/current/runtime-config-resource.html" },
      { label: "PG wiki: tuning", href: "https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server" },
    ],
  },
  {
    n: 3,
    sev: "Medium",
    title: "A cache sized for 2005",
    who: "Pages nobody — it just quietly makes every read slower than the hardware you paid for.",
    body: "shared_buffers defaults to 128 MB — deliberately tiny so Postgres starts anywhere, including the container you first tried it in. On a production box with tens of gigabytes of RAM, the database’s own cache is a rounding error, so reads bounce between Postgres and the OS page cache with double-copying in between. The companion setting effective_cache_size (default 4 GB) allocates nothing — it only tells the planner how much caching to assume — but left at default on a big box it makes index scans look more expensive than they are.",
    code: `<span class="flag">shared_buffers       = <span class="e">128MB</span><span class="datum">◂ container-sized, on a 64 GB box</span></span>
effective_cache_size = <span class="e">4GB</span>     <span class="c"># planner hint only — allocates nothing</span>`,
    fix: "Start shared_buffers around 25% of RAM on a dedicated box (with huge pages configured where available), and set effective_cache_size to roughly what the OS + Postgres can realistically cache (~50–75% of RAM).",
    trade: "Changing shared_buffers requires a restart, and pushing it past ~40% of RAM usually buys nothing — the OS cache is doing real work too.",
    before: "DB cache is a rounding error; reads double-copy through the OS cache",
    after: "Hot set lives in shared_buffers; planner assumptions match the machine",
    source: [
      { label: "resource settings", href: "https://www.postgresql.org/docs/current/runtime-config-resource.html" },
      { label: "query planning settings", href: "https://www.postgresql.org/docs/current/runtime-config-query.html" },
    ],
  },
  {
    n: 4,
    sev: "High",
    title: "The planner still thinks disks spin",
    who: "Pages the team that “fixed” a slow query by forcing an index, without asking why the planner refused it.",
    body: "random_page_cost defaults to 4.0 — a ratio written for spinning disks, where a random read genuinely cost ~4× a sequential one. On NVMe and modern cloud volumes the real ratio is close to 1. Left at 4.0, the planner systematically over-prices index scans, so it reaches for sequential scans and bitmap heaps on queries where a straight index scan is the honest winner. Teams then blame the query, add hints via extensions, or duplicate indexes — treating symptoms of a cost model that still lives in 2005.",
    code: `<span class="flag">random_page_cost = <span class="e">4.0</span><span class="datum">◂ priced for spinning rust</span></span>
seq_page_cost    = <span class="e">1.0</span>   <span class="c"># on NVMe the true ratio is ~1.1 : 1</span>`,
    fix: "Set random_page_cost ≈ 1.1 on SSD/NVMe-backed storage (and check effective_io_concurrency while you’re in the file). Validate with EXPLAIN on your top queries — plans will shift.",
    trade: "If any tablespace really is on spinning disks or throttled network storage, keep its cost honest — this is per-tablespace-settable for exactly that reason. Plan shifts are broad; test before prod.",
    before: "Good indexes ignored; seq scans win arguments they should lose",
    after: "Cost model matches the hardware; the planner picks the index on merit",
    source: [
      { label: "query planning settings", href: "https://www.postgresql.org/docs/current/runtime-config-query.html" },
    ],
  },
  {
    n: 5,
    sev: "High",
    title: "Vacuum arrives after the bloat",
    who: "Pages the team whose 200 GB table is somehow 600 GB, and whose queries got slow “for no reason.”",
    body: "autovacuum is on by default — good — but its trigger is proportional: autovacuum_vacuum_scale_factor = 0.2 means a table earns a vacuum after ~20% of its rows are dead. On a 100-million-row table that’s 20 million dead tuples before cleanup starts, and autovacuum_analyze_scale_factor = 0.1 means the planner’s statistics can be 10 million rows stale on the same table. Proportional triggers are fine for small tables and quietly catastrophic for big ones: bloat accumulates, indexes swell, and the vacuum that finally runs is a monster that fights your peak traffic for I/O.",
    code: `autovacuum                      = <span class="e">on</span>
<span class="flag">autovacuum_vacuum_scale_factor  = <span class="e">0.2</span><span class="datum">◂ 100M rows → 20M dead before vacuum</span></span>
autovacuum_analyze_scale_factor = <span class="e">0.1</span></span>`,
    fix: "For large tables, set per-table storage parameters — a much smaller scale factor (or effectively threshold-based triggering) so vacuum runs early and small; raise autovacuum_vacuum_cost_limit / workers so it can keep up on busy systems.",
    trade: "More frequent vacuums consume steady background I/O — the honest price of never needing the giant one during peak.",
    before: "Typical: big tables bloat 2–3× between vacuums; stats go stale; one monster vacuum at the worst time",
    after: "Small, frequent, boring vacuums; stable table size and fresh statistics",
    source: [
      { label: "autovacuum settings", href: "https://www.postgresql.org/docs/current/runtime-config-autovacuum.html" },
      { label: "routine vacuuming", href: "https://www.postgresql.org/docs/current/routine-vacuuming.html" },
    ],
  },
  {
    n: 6,
    sev: "High",
    title: "The transaction that holds the door open",
    who: "Pages the DBA hunting cluster-wide bloat that no amount of vacuuming fixes.",
    body: "idle_in_transaction_session_timeout defaults to 0 — disabled. One connection that ran BEGIN and then went quiet (an ORM that opened a transaction for a read and never closed it, a developer’s psql over lunch, a crashed worker holding its socket) pins the oldest-visible-transaction horizon. From that moment, vacuum — including every well-tuned autovacuum from Finding 5 — cannot reclaim any row version newer than that horizon, anywhere in the database. The bloat is cluster-wide, the cause is one idle socket, and nothing in the default configuration will ever kill it.",
    code: `<span class="flag">idle_in_transaction_session_timeout = <span class="e">0</span><span class="datum">◂ one idle BEGIN pins vacuum for ALL tables</span></span>
statement_timeout                   = <span class="e">0</span>   <span class="c"># see Finding 7</span>`,
    fix: "Set idle_in_transaction_session_timeout (minutes, not hours) as a server default, with per-role overrides for the rare session that legitimately holds a transaction open.",
    trade: "Long interactive transactions get killed mid-work — which is precisely the point; exempt the specific roles that need them instead of the whole server.",
    before: "One forgotten BEGIN silently blocks vacuum cluster-wide",
    after: "Idle transactions die on a timer; the vacuum horizon keeps moving",
    source: [
      { label: "client connection settings", href: "https://www.postgresql.org/docs/current/runtime-config-client.html" },
    ],
  },
  {
    n: 7,
    sev: "Medium",
    title: "Nothing ever times out",
    who: "Pages everyone at once, the day a noon deploy runs ALTER TABLE.",
    body: "statement_timeout and lock_timeout both default to 0 — no limit. The famous failure isn’t the runaway query itself; it’s the queue behind it. Postgres lock waits are fair: when a migration’s ALTER TABLE waits for an ACCESS EXCLUSIVE lock behind one long-running read, every subsequent query on that table — including plain SELECTs — queues behind the ALTER. One slow report plus one un-timed migration equals a full table outage, at the exact moment the deploy pipeline says everything is fine.",
    code: `<span class="flag">statement_timeout = <span class="e">0</span><span class="datum">◂ runaway queries run forever</span></span>
<span class="flag">lock_timeout      = <span class="e">0</span><span class="datum">◂ DDL queues everything behind it, forever</span></span>`,
    fix: "Set a sane statement_timeout per application role (and a generous one server-wide); in migrations, always set lock_timeout (seconds) and retry — a migration that can’t get the lock quickly should fail fast, not dam the table.",
    trade: "Legitimate long queries (analytics, backups) need explicit per-role or per-session exemptions — deliberate, visible ones.",
    before: "One slow read + one migration = table-wide queue, unbounded",
    after: "Migrations fail fast and retry; runaways die before they page anyone",
    source: [
      { label: "client connection settings", href: "https://www.postgresql.org/docs/current/runtime-config-client.html" },
      { label: "explicit locking", href: "https://www.postgresql.org/docs/current/explicit-locking.html" },
    ],
  },
  {
    n: 8,
    sev: "Medium",
    title: "Checkpoints on a one-gigabyte fuse",
    who: "Pages the team chasing periodic latency spikes that “must be the disks.”",
    body: "max_wal_size defaults to 1 GB and checkpoint_timeout to 5 minutes. Under a write burst, 1 GB of WAL arrives fast, so Postgres forces checkpoints early and often — and immediately after each checkpoint, full_page_writes means every touched page is written to WAL in full, amplifying I/O exactly when you’re busiest. The symptom is a latency sawtooth that correlates with nothing in your application and gets blamed on storage. The signal is sitting in pg_stat_checkpointer: requested checkpoints outnumbering timed ones means the fuse is too short.",
    code: `<span class="flag">max_wal_size       = <span class="e">1GB</span><span class="datum">◂ write bursts force early checkpoints</span></span>
checkpoint_timeout           = <span class="e">5min</span>
checkpoint_completion_target = <span class="e">0.9</span>   <span class="c"># good default since v14 — keep it</span>`,
    fix: "Size max_wal_size to absorb your real write bursts (several GB is normal on busy systems) so checkpoints are timed, not requested; watch pg_stat_checkpointer to confirm.",
    trade: "More WAL on disk and longer crash-recovery replay — the standard durability/latency dial, turned consciously.",
    before: "Typical: forced checkpoints every couple of minutes under load; post-checkpoint I/O spikes read as “slow disks”",
    after: "Checkpoints on the timer, smoothed by completion_target; the sawtooth flattens",
    source: [
      { label: "WAL settings", href: "https://www.postgresql.org/docs/current/runtime-config-wal.html" },
      { label: "WAL configuration", href: "https://www.postgresql.org/docs/current/wal-configuration.html" },
    ],
  },
];

const CSS = `
.td-page{--ink:#0A0C0F;--ink-1:#10141A;--ink-2:#171C24;--paper:#EEF2F6;--dim:#AEB8C4;--faint:#8593A2;--signal:#3DE1E6;--signal-deep:#1FB6C9;--alert:#FF5D6E;--alert-soft:rgba(255,93,110,.1);--ok:#5CE0A8;--line:#1B222B;--line-2:#27303B;--serif:"Spectral",Georgia,"Times New Roman",serif;--mono:"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace;background:var(--ink);color:var(--paper);min-height:100vh;font-family:var(--serif);-webkit-font-smoothing:antialiased}
.td-page *{box-sizing:border-box}
.td-page a{color:var(--signal);text-decoration:none}
.td-page a:hover{text-decoration:underline}
.td-wrap{max-width:820px;margin:0 auto;padding:64px 24px 96px}
.td-eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--signal);display:flex;align-items:center;gap:10px}
.td-eyebrow::before{content:"";width:22px;height:1px;background:var(--signal)}
.td-h1{font-weight:500;font-size:clamp(2rem,5vw,3.1rem);line-height:1.1;letter-spacing:-.015em;margin:20px 0 0}
.td-h1 em{font-style:italic;color:var(--signal)}
.td-dek{color:var(--dim);font-size:1.12rem;line-height:1.6;margin-top:20px;max-width:60ch}
.td-byline{font-family:var(--mono);font-size:.8rem;color:var(--faint);margin-top:26px;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline;padding-top:22px;border-top:1px solid var(--line)}
.td-byline b{color:var(--paper);font-weight:500}
.td-note{margin:34px 0 8px;padding:20px 22px;border:1px solid var(--line-2);border-left:2px solid var(--signal-deep);border-radius:0 8px 8px 0;background:var(--ink-1)}
.td-note .lab{font-family:var(--mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--signal);margin-bottom:10px}
.td-note p{color:var(--dim);font-size:.96rem;line-height:1.62;margin:0 0 10px}
.td-note p:last-child{margin-bottom:0}
.td-note b{color:var(--paper);font-weight:500}
.td-count{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin:56px 0 18px;display:flex;align-items:center;gap:10px}
.td-count::after{content:"";flex:1;height:1px;background:var(--line)}
.finding{border:1px solid var(--line-2);border-radius:12px;background:var(--ink-1);overflow:hidden;margin-bottom:26px}
.f-head{display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid var(--line);background:var(--ink-2);flex-wrap:wrap}
.sev{font-family:var(--mono);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;padding:4px 10px;border-radius:3px}
.sev.high{background:var(--alert-soft);color:var(--alert);border:1px solid rgba(255,93,110,.4)}
.sev.medium{background:rgba(61,225,230,.08);color:var(--signal);border:1px solid rgba(61,225,230,.3)}
.f-id{font-family:var(--mono);font-size:.68rem;color:var(--faint);letter-spacing:.08em}
.f-title{font-weight:500;font-size:1.5rem;letter-spacing:-.01em;width:100%;line-height:1.2}
.f-body{padding:24px 26px}
.f-who{font-family:var(--mono);font-size:.76rem;color:var(--signal);margin-bottom:16px;opacity:.9}
.f-body>p{color:var(--dim);font-size:1.02rem;line-height:1.66;margin:0 0 20px}
.codeblk{background:var(--ink);border:1px solid var(--line);border-radius:7px;padding:16px 18px;font-family:var(--mono);font-size:.8rem;line-height:1.85;color:var(--dim);overflow-x:auto;white-space:pre;font-variant-numeric:tabular-nums}
.codeblk .c{color:var(--faint)}
.codeblk .e{color:var(--alert)}
.codeblk .flag{display:block;background:var(--alert-soft);box-shadow:inset 2px 0 0 var(--alert);margin:0 -18px;padding:0 18px}
.codeblk .datum{float:right;color:var(--signal);letter-spacing:.04em}
.impact{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
.metric{padding:14px 16px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2)}
.metric .k{font-family:var(--mono);font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.metric .v{font-size:.98rem;margin-top:7px;line-height:1.4}
.metric.before .v{color:var(--alert)}
.metric.after .v{color:var(--ok)}
.fix{margin-top:18px;padding:16px 20px;border-left:2px solid var(--signal);background:var(--ink-2);border-radius:0 7px 7px 0}
.fix .lab{font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;color:var(--signal);text-transform:uppercase}
.fix p{margin:8px 0 0;color:var(--paper);font-size:.98rem;line-height:1.55}
.fix .trade{color:var(--faint);font-size:.9rem;margin-top:8px}
.f-src{font-family:var(--mono);font-size:.72rem;color:var(--faint);margin-top:18px;display:flex;flex-wrap:wrap;gap:6px 14px}
.td-cta{margin-top:64px;padding:34px 30px;border:1px solid var(--line-2);border-radius:14px;background:linear-gradient(160deg,var(--ink-2),var(--ink-1));text-align:center}
.td-cta h2{font-weight:500;font-size:1.7rem;letter-spacing:-.01em}
.td-cta p{color:var(--dim);font-size:1.02rem;line-height:1.6;margin:12px auto 24px;max-width:52ch}
.td-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.td-btn{font-family:var(--mono);font-size:.85rem;padding:13px 22px;border-radius:5px;letter-spacing:.02em}
.td-btn.primary{background:var(--signal);color:#04181b;font-weight:600}
.td-btn.ghost{border:1px solid var(--line-2);color:var(--paper)}
.td-foot{text-align:center;font-family:var(--mono);font-size:.72rem;color:var(--faint);margin-top:48px}
@media(max-width:560px){.impact{grid-template-columns:1fr}}
`;

export default function PostgresTeardown() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "The Postgres connection pool that isn't one — a teardown of the config everyone inherits",
    description: metadata.description,
    url: CANON,
    author: {
      "@type": "Person",
      name: "Priyanshu Sekhar Patra",
      sameAs: ["https://www.linkedin.com/in/pspatra/", "https://github.com/priyanshu-sekhar"],
    },
    publisher: { "@type": "Organization", name: "ZephyrCode", url: "https://zephyrcode.live" },
    about: "PostgreSQL production configuration",
  };

  return (
    <div className="td-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="td-wrap">
        <div className="td-eyebrow">ZephyrCode teardown · databases · No. 02</div>
        <h1 className="td-h1">
          The Postgres connection pool <em>that isn’t one.</em>
        </h1>
        <p className="td-dek">
          PostgreSQL’s defaults are tuned so a laptop quickstart works on the first try — and the classic production
          “fix,” raising max_connections, makes the real problem worse. Here are eight defaults, each with the exact
          setting, the mechanism, and the fix. This is the format a fixed-price ZephyrCode audit produces, run against
          Postgres’s own reference configuration instead of your system.
        </p>
        <div className="td-byline">
          <b>Priyanshu Sekhar Patra</b>
          <span>ex-Amazon Alexa · distributed systems</span>
          <a href="https://www.linkedin.com/in/pspatra/" target="_blank" rel="noopener">LinkedIn ↗</a>
          <a href="https://github.com/priyanshu-sekhar" target="_blank" rel="noopener">GitHub ↗</a>
        </div>

        <div className="td-note">
          <div className="lab">What this is (and isn’t)</div>
          <p>
            Every default below is from the <b>current PostgreSQL</b> reference documentation, linked at each finding.
            The subject is Postgres’s <b>own documented defaults</b> and the folklore fixes teams apply to them —{" "}
            <b>not</b> any team’s private production system, which nobody can observe from outside. Before/after figures
            are labelled <b>typical</b>: representative of the failure class, not any client’s numbers. Managed platforms
            (RDS, Cloud SQL, and friends) override some of these — check what <em>your</em> parameter group actually says.
          </p>
          <p>
            Three pieces of tuning folklore this teardown is careful <em>not</em> to repeat: <b>(1)</b> “tune{" "}
            <span style={{ fontFamily: "var(--mono)" }}>checkpoint_segments</span>” — removed in 9.5, a decade ago; the
            dial is <span style={{ fontFamily: "var(--mono)" }}>max_wal_size</span> (Finding 8). <b>(2)</b> “set{" "}
            <span style={{ fontFamily: "var(--mono)" }}>fsync=off</span> for speed” — never in production; one crash and
            the database is corrupt, and no finding here trades durability for speed. <b>(3)</b> “raise{" "}
            <span style={{ fontFamily: "var(--mono)" }}>effective_cache_size</span> to give Postgres more memory” — it
            allocates nothing; it’s a planner assumption (Finding 3), and treating it as an allocation is how it ends up
            both huge and irrelevant.
          </p>
        </div>

        <div className="td-count">8 findings · High → Medium</div>

        {FINDINGS.map((f) => (
          <article className="finding" key={f.n}>
            <div className="f-head">
              <span className={`sev ${f.sev.toLowerCase()}`}>{f.sev} severity</span>
              <span className="f-id">FINDING {String(f.n).padStart(2, "0")} / 08</span>
              <h2 className="f-title">{f.title}</h2>
            </div>
            <div className="f-body">
              <div className="f-who">{f.who}</div>
              <p>{f.body}</p>
              <pre className="codeblk" dangerouslySetInnerHTML={{ __html: f.code }} />
              <div className="impact">
                <div className="metric before">
                  <div className="k">Before · default</div>
                  <div className="v">{f.before}</div>
                </div>
                <div className="metric after">
                  <div className="k">After · fixed</div>
                  <div className="v">{f.after}</div>
                </div>
              </div>
              <div className="fix">
                <div className="lab">Recommended fix</div>
                <p>{f.fix}</p>
                <p className="trade">Tradeoff — {f.trade}</p>
              </div>
              <div className="f-src">
                <span>Sources:</span>
                {f.source.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noopener">
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}

        <div className="td-cta">
          <h2>That’s the reference config. Now picture yours.</h2>
          <p>
            This is the exact deliverable format of a ZephyrCode audit — findings with the mechanism, the evidence, and
            the fix, ranked by what pages you. Run against your Postgres, your Kafka, your inference stack. Fixed scope,
            fixed price, two weeks. Not sure it’s worth it? Start with the $1,200 48-hour triage.
          </p>
          <div className="td-btns">
            <a className="td-btn primary" href="https://audits.zephyrcode.live/?utm_source=teardown-postgres">
              See the audits →
            </a>
            <a className="td-btn ghost" href="https://audits.zephyrcode.live/?utm_source=teardown-postgres#triage">
              Start the $1,200 triage
            </a>
          </div>
        </div>

        <div className="td-foot">
          ZephyrCode · engineering audits · the price is on the door · previously:{" "}
          <a href="/teardowns/kafka-defaults">the Kafka teardown</a>
        </div>
      </div>
    </div>
  );
}
