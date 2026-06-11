import "@/styles/sites/operator.css";
import { z } from "zod";
import { dataOf, getBlocks, getSites } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { BootSequence } from "@/components/engine/BootSequence";
import { UptimeCounter } from "@/components/engine/UptimeCounter";
import { ConsequenceMonth } from "@/components/engine/ConsequenceMonth";

/**
 * operator.zephyrcode.live — DOM structure mirrors /_reference/operator.html
 * exactly. Zero content strings here: every word comes from the DB blocks.
 */

const Crumb = z.object({ text: z.string() });
const Boot = z.object({
  aria: z.string(),
  lines: z.array(z.tuple([z.string(), z.string()])),
});
const Hero = z.object({
  eyebrow: z.string(),
  h1: z.string(),
  lede: z.string(),
  ctas: z.array(z.object({ label: z.string(), href: z.string() })),
});
const Layers = z.object({
  windows: z.array(z.object({ bar: z.string(), h3: z.string(), p: z.string() })),
});
const Engine = z.object({
  k: z.string(),
  sub: z.string(),
  monthAria: z.string(),
  verdicts: z.array(z.tuple([z.number(), z.string()])),
  integrityLabel: z.string(),
  verdictLabel: z.string(),
  preloadedMisses: z.array(z.number()),
  seriesParams: z.object({ start: z.number(), hit: z.number(), miss: z.number() }),
});
const Uptime = z.object({
  uptimePrefix: z.string(),
  uptimeSuffix: z.string(),
  epoch: z.object({ y: z.number(), m: z.number(), d: z.number() }),
  fallback: z.string(),
});
const Flagships = z.object({
  eyebrow: z.string(),
  h2: z.string(),
  cards: z.array(
    z.object({ k: z.string(), h3: z.string(), p: z.string(), up: z.union([Uptime, z.string()]) })
  ),
});
const Roadmap = z.object({
  eyebrow: z.string(),
  h2: z.string(),
  acts: z.array(z.object({ n: z.string(), h3: z.string(), p: z.string() })),
  kill: z.string(),
});

function req<T>(value: T | undefined, section: string): T {
  if (value === undefined) throw new Error(`operator: missing block "${section}"`);
  return value;
}

export default async function OperatorPage() {
  const [sites, blocks] = await Promise.all([getSites("operator"), getBlocks("operator")]);
  const crumb = req(dataOf(blocks, "crumb", Crumb), "crumb");
  const boot = req(dataOf(blocks, "boot", Boot), "boot");
  const hero = req(dataOf(blocks, "hero", Hero), "hero");
  const layers = req(dataOf(blocks, "layers", Layers), "layers");
  const engine = req(dataOf(blocks, "engine", Engine), "engine");
  const flagships = req(dataOf(blocks, "flagships", Flagships), "flagships");
  const roadmap = req(dataOf(blocks, "roadmap", Roadmap), "roadmap");

  return (
    <>
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <BootSequence lines={boot.lines} ariaLabel={boot.aria} />

        <section id="hero" className="rv">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 dangerouslySetInnerHTML={{ __html: hero.h1 }} />
          <p className="lede" dangerouslySetInnerHTML={{ __html: hero.lede }} />
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "30px" }}>
            {hero.ctas.map((cta, i) => (
              <a key={cta.href} className={i === 0 ? "btn solid" : "btn ghost"} href={cta.href}>
                {cta.label}
              </a>
            ))}
          </div>
        </section>

        <section className="layers">
          {layers.windows.map((w) => (
            <div key={w.bar} className="win rv">
              <div className="bar">
                <i className="e" />
                <i />
                <i />
                {w.bar}
              </div>
              <div className="body">
                <h3>{w.h3}</h3>
                <p dangerouslySetInnerHTML={{ __html: w.p }} />
              </div>
            </div>
          ))}
        </section>

        <section className="engine rv">
          <p className="k">{engine.k}</p>
          <p className="sub">{engine.sub}</p>
          <ConsequenceMonth
            preloadedMisses={engine.preloadedMisses}
            seriesParams={engine.seriesParams}
            verdicts={engine.verdicts}
            integLabel={engine.integrityLabel}
            verdictLabel={engine.verdictLabel}
            monthAria={engine.monthAria}
          />
        </section>

        <section className="rv">
          <p className="eyebrow">{flagships.eyebrow}</p>
          <h2 dangerouslySetInnerHTML={{ __html: flagships.h2 }} />
          <div className="flag">
            {flagships.cards.map((card) => (
              <div key={card.h3} className="fcard">
                <p className="k">{card.k}</p>
                <h3>{card.h3}</h3>
                <p>{card.p}</p>
                {typeof card.up === "string" ? (
                  <p className="up">{card.up}</p>
                ) : (
                  <UptimeCounter
                    prefix={card.up.uptimePrefix}
                    suffix={card.up.uptimeSuffix}
                    epoch={card.up.epoch}
                    fallback={card.up.fallback}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="acts rv">
          <p className="eyebrow">{roadmap.eyebrow}</p>
          <h2 dangerouslySetInnerHTML={{ __html: roadmap.h2 }} />
          {roadmap.acts.map((act) => (
            <div key={act.n} className="act">
              <span className="n">{act.n}</span>
              <div>
                <h3>{act.h3}</h3>
                <p>{act.p}</p>
              </div>
            </div>
          ))}
          <p className="kill">{roadmap.kill}</p>
        </section>
      </main>
      <Constellation sites={sites} current="operator" />
      <RevealManager threshold={0.12} />
    </>
  );
}
