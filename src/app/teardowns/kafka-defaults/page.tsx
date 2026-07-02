import type { Metadata } from "next";

/**
 * Public teardown #1 — the Trail-of-Bits "report-as-proof" pattern for the audits
 * business. Subject: Apache Kafka's OWN documented defaults (4.1 baseline) + the
 * widely-copied single-broker example configs — never any team's private prod.
 * Every default is sourced; version-gated per the research fairness checklist.
 *
 * PROMOTED 2026-07-02: indexed, linked from the audits #sample section, and in
 * the audits-subdomain sitemap.
 */

const CANON = "https://audits.zephyrcode.live/teardowns/kafka-defaults";

export const metadata: Metadata = {
  title: "The Kafka defaults that page you at 3am — a ZephyrCode teardown",
  description:
    "Apache Kafka's own docs say these defaults must be tuned before production — yet they ship in the quickstarts and compose files teams paste in and forget. Eight, each with the exact key, the mechanism, and the one-line fix.",
  alternates: { canonical: CANON },
  robots: { index: true, follow: true },
  openGraph: {
    type: "article",
    url: CANON,
    siteName: "ZephyrCode — Engineering Audits",
    title: "The Kafka defaults that page you at 3am",
    description:
      "A teardown of the config everyone copies — eight production-hostile Kafka defaults, the mechanism behind each, and the fix. Kafka 4.1 baseline, every default sourced.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Kafka defaults that page you at 3am",
    description: "Eight production-hostile Kafka defaults, the mechanism, and the fix. Every default sourced.",
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
    title: "acks=all that isn’t",
    who: "Pages the on-call the morning after a single broker bounce eats “committed” writes.",
    body: "Since 3.0 the producer default is acks=all — but acks=all waits for the in-sync replicas, not all replicas. When a follower lags or restarts it’s ejected from the ISR rather than blocking writes, so “all” silently shrinks toward just the leader. With min.insync.replicas left at 1, Kafka happily acknowledges a write that lives on exactly one disk; if that leader then dies, the acknowledged record is gone. The strong-looking default is neutralised by the weak one next to it.",
    code: `<span class="c"># broker / topic — the trap that survived the 3.0 change</span>
<span class="flag">min.insync.replicas = <span class="e">1</span><span class="datum">◂ acks=all now means “one disk”</span></span>
<span class="c"># producer (already the 3.0+ default — not the problem)</span>
acks = <span class="e">all</span></span>`,
    fix: "Set min.insync.replicas=2 with replication.factor=3; acks=all is already the default.",
    trade: "A partition that drops below 2 in-sync replicas now rejects writes (NotEnoughReplicasException) — availability traded for durability, the correct trade for anything you can’t reproduce.",
    before: "Silent acceptance of writes during ISR shrink",
    after: "0 acknowledged-then-lost records",
    source: [
      { label: "broker configs", href: "https://kafka.apache.org/41/configuration/broker-configs/" },
      { label: "KIP-679", href: "https://cwiki.apache.org/confluence/display/KAFKA/KIP-679:+Producer+will+enable+the+strongest+delivery+guarantee+by+default" },
    ],
  },
  {
    n: 2,
    sev: "High",
    title: "One disk from a topic-shaped hole",
    who: "Pages whoever owns the disk that died.",
    body: "default.replication.factor is 1 and auto.create.topics.enable is true. Any topic that gets auto-created — a typo’d topic name from a producer, a Connect connector, a mis-set consumer — lands as a single unreplicated partition. There’s no second copy: a single disk or broker loss is unrecoverable, and the partition is fully unavailable while that broker is down. No one ever ran a create-topic command.",
    code: `default.replication.factor = <span class="e">1</span>      <span class="c"># one copy only</span>
<span class="flag">auto.create.topics.enable  = <span class="e">true</span><span class="datum">◂ a typo mints a topic</span></span>
num.partitions             = <span class="e">1</span></span>`,
    fix: "default.replication.factor=3, auto.create.topics.enable=false (create topics explicitly via IaC), and set num.partitions deliberately per workload.",
    trade: "Explicit topic management is more ceremony; RF=3 roughly triples storage and replication bandwidth for that data.",
    before: "One bad-disk event = permanent loss of an auto-created topic",
    after: "Survives loss of any single broker with zero data loss",
    source: [
      { label: "broker configs", href: "https://kafka.apache.org/41/configuration/broker-configs/" },
      { label: "Strimzi broker tuning", href: "https://strimzi.io/blog/2021/06/08/broker-tuning/" },
    ],
  },
  {
    n: 3,
    sev: "High",
    title: "The compose file everyone copies",
    who: "Pages the person who scaled a “dev” cluster into prod.",
    body: "The broker default for offsets.topic.replication.factor is actually 3 — but the single-broker example compose files teams copy override it to 1, because a one-node cluster can’t do more. __consumer_offsets stores every consumer group’s committed positions; at RF=1 it lives on one broker. Lose that broker and every group’s offsets vanish, so on recovery consumers fall back to auto.offset.reset (Finding 4) and either replay everything or skip everything. Teams copy the single-broker example, add brokers, and never revisit the internal-topic replication factor.",
    code: `<span class="c"># what the single-broker quickstart forces — and you inherit</span>
<span class="flag">offsets.topic.replication.factor         = <span class="e">1</span><span class="datum">◂ every group’s offsets, one disk</span></span>
transaction.state.log.replication.factor = <span class="e">1</span></span>`,
    fix: "offsets.topic.replication.factor=3, transaction.state.log.replication.factor=3, transaction.state.log.min.isr=2 on any multi-broker cluster.",
    trade: "These internal topics can’t be created until ≥3 brokers exist — a bootstrapping ordering constraint.",
    before: "Broker loss wipes all committed offsets",
    after: "Offsets survive single-broker loss — no group-wide replay/skip event",
    source: [
      { label: "bitnami single-node compose", href: "https://github.com/bitnami/containers/blob/main/bitnami/kafka/docker-compose.yml" },
      { label: "their own issue #45043", href: "https://github.com/bitnami/containers/issues/45043" },
    ],
  },
  {
    n: 4,
    sev: "Medium",
    title: "The silent data-skipper",
    who: "Pages the data team when a new consumer “processed everything” but the warehouse is missing a day.",
    body: "auto.offset.reset defaults to latest. When a group has no committed offset — a brand-new group, or offsets that expired or were lost per Finding 3 — latest starts at the end of the log. Every record already in the topic is skipped, silently, with no exception, and lag reads ~0. A newly deployed consumer group looks perfectly healthy while dropping its entire backlog.",
    code: `<span class="flag">auto.offset.reset = <span class="e">latest</span><span class="datum">◂ new group starts at the END</span></span></span>`,
    fix: "Choose deliberately: earliest for pipelines that must not drop backlog; none to fail loudly on a missing offset and force an operator decision.",
    trade: "earliest on a fresh group against a long-retained topic can replay millions of records — surprising, and duplicative if downstream isn’t idempotent.",
    before: "New consumer silently skips the backlog",
    after: "Explicit start position; zero silent gaps",
    source: [
      { label: "consumer configs", href: "https://kafka.apache.org/41/configuration/consumer-configs/" },
      { label: "Confluent: auto-reset", href: "https://www.confluent.io/learn/kafka-auto-reset/" },
    ],
  },
  {
    n: 5,
    sev: "High",
    title: "Rebalance storms on every deploy",
    who: "Pages the service owner during every rolling deploy.",
    body: "group.protocol defaults to classic, and the default partition.assignment.strategy is a list — [RangeAssignor, CooperativeStickyAssignor] — with Range used first. Under the classic protocol with Range active, a rebalance is stop-the-world: every consumer revokes all of its partitions and blocks until reassignment completes. A rolling deploy bounces N instances, so a single deploy can cause N stop-the-world pauses and a cascade of duplicate JoinGroup rounds — and you get that eager disruption even though CooperativeSticky is sitting right there in the list, because Range is listed first.",
    code: `<span class="flag">group.protocol                = <span class="e">classic</span><span class="datum">◂ stop-the-world rebalance</span></span>
partition.assignment.strategy = [<span class="e">RangeAssignor</span>,   <span class="c"># used FIRST</span>
                                 CooperativeStickyAssignor]</span>`,
    fix: "(a) Set partition.assignment.strategy=CooperativeStickyAssignor — a single rolling bounce migrates you off Range, so unaffected partitions keep processing. Or (b) on 4.x, opt into the next-gen protocol with group.protocol=consumer (KIP-848).",
    trade: "Cooperative rebalancing requires a two-phase migration if you’re currently eager; the assignor swap must follow the documented upgrade path. KIP-848 is opt-in — classic remains the default through 4.x.",
    before: "Every deploy = full-group pause + lag spike",
    after: "Only reassigned partitions pause — a single-digit-second lag blip",
    source: [
      { label: "consumer configs", href: "https://kafka.apache.org/41/configuration/consumer-configs/" },
      { label: "KIP-429", href: "https://cwiki.apache.org/confluence/display/KAFKA/KIP-429:+Kafka+Consumer+Incremental+Rebalance+Protocol" },
      { label: "KIP-848", href: "https://www.confluent.io/blog/kip-848-consumer-rebalance-protocol/" },
    ],
  },
  {
    n: 6,
    sev: "Medium",
    title: "The consumer that keeps getting kicked out",
    who: "Pages the team whose consumer flaps under load.",
    body: "max.poll.interval.ms is 300000 (5 minutes) and max.poll.records is 500. A background thread heartbeats every 3 seconds, so the consumer looks alive — but if the application takes longer than 5 minutes to process one poll() batch of up to 500 records (a slow DB write, an external API, a GC pause), Kafka assumes the instance is stuck, evicts it, and reassigns its partitions. The consumer that inherits them gets the same slow batch and can also time out — a self-reinforcing eviction/rebalance loop that reads as flapping.",
    code: `max.poll.interval.ms = <span class="e">300000</span>   <span class="c"># 5 min — one batch must finish inside this</span>
<span class="flag">max.poll.records     = <span class="e">500</span><span class="datum">◂ 500 slow records/poll blows the budget</span></span></span>`,
    fix: "Lower max.poll.records so a batch comfortably fits inside the interval, and/or raise max.poll.interval.ms to bound worst-case processing; move genuinely long work off the poll thread.",
    trade: "A larger interval means a genuinely dead consumer takes longer to detect and its partitions longer to reassign.",
    before: "Flapping group under load spikes",
    after: "Stable membership; no eviction-driven rebalance loop",
    source: [
      { label: "consumer configs", href: "https://kafka.apache.org/41/configuration/consumer-configs/" },
      { label: "Strimzi consumer tuning", href: "https://strimzi.io/blog/2021/01/07/consumer-tuning/" },
    ],
  },
  {
    n: 7,
    sev: "Medium",
    title: "At-most-once hiding as at-least-once",
    who: "Pages the team investigating records that were “consumed but never processed.”",
    body: "enable.auto.commit is true and commits on a 5-second timer, based on what poll() returned — not on what your code finished processing. If the consumer crashes after poll() but before handling the records, those offsets may already be committed, so on restart they’re skipped: silent loss. Crash the other way — between processing and the next auto-commit — and they replay. Either way, your delivery semantics are decoupled from your actual processing boundary and set by a timer.",
    code: `<span class="flag">enable.auto.commit      = <span class="e">true</span><span class="datum">◂ commits on a timer, not on success</span></span>
auto.commit.interval.ms = <span class="e">5000</span></span>`,
    fix: "enable.auto.commit=false, and commit explicitly after successful processing (commitSync per batch, or careful manual async).",
    trade: "More code and a small throughput cost from synchronous commits; you must make processing idempotent to tolerate the at-least-once replays this enables.",
    before: "Silent skip/replay tied to a 5-second timer",
    after: "Commit boundary aligned to processing — the semantics you actually chose",
    source: [{ label: "Confluent consumer docs", href: "https://docs.confluent.io/platform/current/clients/consumer.html" }],
  },
  {
    n: 8,
    sev: "Medium",
    title: "Retention outlives nobody’s assumptions",
    who: "Pages the team when a lagging consumer’s data ages out, or when a disk fills.",
    body: "log.retention.hours is 168 (7 days) and log.retention.bytes is -1 (unbounded). Two traps in one. Size retention is off by default, so a topic’s disk usage is bounded only by time — a traffic spike or a stuck compaction can fill the disk and take brokers down. And the 7-day time bound means a consumer that falls more than a week behind loses data even with auto.offset.reset=earliest, because the records are already deleted; the offset it wants no longer exists. “earliest = never lose data” is false once retention has passed.",
    code: `log.retention.hours = <span class="e">168</span>   <span class="c"># 7 days — a &gt;1wk-behind consumer loses data</span>
<span class="flag">log.retention.bytes = <span class="e">-1</span><span class="datum">◂ size retention OFF — disk bounded by time only</span></span></span>`,
    fix: "Set retention intentionally per topic (time and/or log.retention.bytes) to match the worst-case consumer-downtime SLO and available disk; alert on partition-disk headroom and on consumer lag approaching the retention window.",
    trade: "Longer/larger retention costs disk; shorter retention risks purging data a slow consumer still needs.",
    before: "Disk-full broker outage / silent purge for lagging consumers",
    after: "Bounded disk + lag alerting before the retention edge is hit",
    source: [
      { label: "broker configs", href: "https://kafka.apache.org/41/configuration/broker-configs/" },
      { label: "Confluent: auto-reset", href: "https://www.confluent.io/learn/kafka-auto-reset/" },
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

export default function KafkaTeardown() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "The Kafka defaults that page you at 3am — a teardown of the config everyone copies",
    description: metadata.description,
    url: CANON,
    author: {
      "@type": "Person",
      name: "Priyanshu Sekhar Patra",
      sameAs: ["https://www.linkedin.com/in/pspatra/", "https://github.com/priyanshu-sekhar"],
    },
    publisher: { "@type": "Organization", name: "ZephyrCode", url: "https://zephyrcode.live" },
    about: "Apache Kafka production configuration",
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
        <div className="td-eyebrow">ZephyrCode teardown · streaming · No. 01</div>
        <h1 className="td-h1">
          The Kafka defaults that page you <em>at 3am.</em>
        </h1>
        <p className="td-dek">
          Apache Kafka’s own docs say these defaults must be tuned before production — yet they ship in the quickstarts and
          the compose files teams paste in and forget. Here are eight, each with the exact key, the mechanism, and the
          one-line fix. This is the format a fixed-price ZephyrCode audit produces, run against Kafka’s own reference
          configuration instead of your system.
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
            Every default below is from the <b>Apache Kafka 4.1</b> reference docs, linked at each finding. The subject is
            Kafka’s <b>own documented defaults</b> and the widely-copied single-broker example configs — <b>not</b> any
            team’s private production system, which nobody can observe from outside. Before/after figures are labelled{" "}
            <b>typical</b>: representative of the failure class, not any client’s numbers.
          </p>
          <p>
            Three things you’ll read elsewhere that are stale — and that this teardown is careful <em>not</em> to repeat:{" "}
            <b>(1)</b> “Kafka defaults to <span style={{ fontFamily: "var(--mono)" }}>acks=1</span>” — false since 3.0; the
            producer default is <span style={{ fontFamily: "var(--mono)" }}>acks=all</span> and the surviving trap is a weak{" "}
            <span style={{ fontFamily: "var(--mono)" }}>min.insync.replicas</span> (Finding 1). <b>(2)</b> “
            <span style={{ fontFamily: "var(--mono)" }}>unclean.leader.election</span> defaults to true” — false since 0.11;
            it’s <span style={{ fontFamily: "var(--mono)" }}>false</span> by default, so it isn’t listed here. <b>(3)</b> “the
            default assignor is cooperative” — the default is a <em>list</em> with <span style={{ fontFamily: "var(--mono)" }}>RangeAssignor</span>{" "}
            first, so you still get stop-the-world rebalances until you change it (Finding 5).
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
          <h2>That’s one config file. Now picture your system.</h2>
          <p>
            This is the exact deliverable format of a ZephyrCode audit — findings with the mechanism, the evidence, and the
            fix, ranked by what pages you. Run against your Kafka, your inference stack, your Postgres. Fixed scope, fixed
            price, two weeks. Not sure it’s worth it? Start with the $1,200 48-hour triage.
          </p>
          <div className="td-btns">
            <a className="td-btn primary" href="https://audits.zephyrcode.live/?utm_source=teardown-kafka">
              See the audits →
            </a>
            <a className="td-btn ghost" href="https://audits.zephyrcode.live/?utm_source=teardown-kafka#triage">
              Start the $1,200 triage
            </a>
          </div>
        </div>

        <div className="td-foot">ZephyrCode · engineering audits · the price is on the door</div>
      </div>
    </div>
  );
}
