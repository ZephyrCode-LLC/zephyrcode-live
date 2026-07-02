// llms.txt for the ZephyrCode hub — a plain-text map for LLMs and answer engines.
// Served at zephyrcode.live/llms.txt; static so it never goes stale at request time.
export const dynamic = "force-static";

export function GET() {
  const lines = [
    "# ZephyrCode",
    "",
    "> A one-operator studio in Bengaluru: fixed-scope/fixed-price engineering audits, an AI-engineering interview arena, interactive novels, and a library of taste. One method — descend, compress, animate, ship.",
    "",
    "## Audits",
    "",
    "- [Engineering Audits](https://audits.zephyrcode.live): Fixed-scope, fixed-price engineering reviews — the price is on the door. Two-week turnaround, written teardown + working call. Contact priyanshu@zephyrcode.live.",
    "  - ZC·TRIAGE — 48-hour triage: one system, three ranked findings, an honest fit-verdict ($1,200 fixed, credited toward any audit within 30 days)",
    "  - ZC·KAFKA — Kafka & event-streaming audit ($6k–9k)",
    "  - ZC·INFER — AI inference cost & latency teardown ($6k–10k)",
    "  - ZC·RESIL — Distributed-systems reliability review ($7k–10k)",
    "  - ZC·SCALE — Scale-readiness review ($5k–8k)",
    "  - ZC·AWS — AWS architecture & cost review ($5k–9k)",
    "  - ZC·RAG — RAG & LLM application review ($6k–9k)",
    "  - ZC·PSQL — Postgres performance & scaling audit ($5k–8k)",
    "  - ZC·OTEL — OpenTelemetry & observability setup ($7k–12k)",
    "  - ZC·BOUND — Microservices boundary review ($6k–9k)",
    "  - ZC·MIGR — Migration de-risking review ($6k–10k)",
    "",
    "## Apps",
    "",
    "- [The Arena](https://arena.zephyrcode.live): AI-engineering interview puzzles, each scored against a provably optimal solution.",
    "- [Antyodaya](https://book-antyodaya.zephyrcode.live): An interactive novel with a live reader.",
    "- [Stories](https://stories.zephyrcode.live): Short fiction with engines behind it.",
    "",
    "## Rooms",
    "",
    "- [Operator](https://operator.zephyrcode.live): The studio — Personal Operating Systems and commissioned builds.",
    "- [Temper](https://zephyrcode.live/temper): DeepWork — a consequence engine for focus.",
    "- [Arcade](https://arcade.zephyrcode.live): Playable simulations of hard systems ideas.",
    "- [Read](https://read.zephyrcode.live): A reading shelf indexed by mood.",
    "- [Watch](https://watch.zephyrcode.live): A watching shelf indexed by mood.",
    "- [Listen](https://listen.zephyrcode.live): A listening shelf indexed by mood.",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
