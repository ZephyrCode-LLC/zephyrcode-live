import "@/styles/sites/temper.css";
import { z } from "zod";
import { dataOf, getBlocks, getSites } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { TemperBlade } from "@/components/engine/TemperBlade";
import { InterruptionTax } from "@/components/engine/InterruptionTax";
import { DayClock } from "@/components/engine/DayClock";

/**
 * temper.zephyrcode.live — OS 02, the mind. DOM mirrors /_reference/temper.html
 * exactly. Zero content strings here: every word comes from the DB blocks.
 */

const Crumb = z.object({ text: z.string() });
const Hero = z.object({
  eyebrow: z.string(),
  h1: z.string(),
  thesis: z.string(),
  stops: z.array(z.object({ h: z.number(), rgb: z.tuple([z.number(), z.number(), z.number()]) })),
  grades: z.array(z.object({ max: z.number(), hex: z.string(), label: z.string(), desc: z.string() })),
  hint: z.string(),
  ctas: z.array(z.object({ label: z.string(), href: z.string() })),
});
const Premise = z.object({ lead: z.string(), small: z.string() });
const Layers = z.object({
  tag: z.string(),
  tiles: z.array(
    z.object({
      nm: z.string(),
      pr: z.string(),
      bullets: z.array(z.object({ b: z.string(), text: z.string() })),
    })
  ),
});
const Engine = z.object({
  k: z.string(),
  sub: z.string(),
  labStart: z.string(),
  labMid: z.string(),
  labEnd: z.string(),
  hint: z.string(),
  addLabel: z.string(),
  resetLabel: z.string(),
  total: z.number(),
  ramp: z.number(),
  deepLabel: z.string(),
  fragLabel: z.string(),
  taxLabel: z.string(),
  verdicts: z.array(z.tuple([z.number(), z.string()])),
});
const Blk = z.object({ s: z.number(), e: z.number(), cls: z.string(), label: z.string() });
const CZ = z.object({
  eyebrow: z.string(),
  h2: z.string(),
  who: z.string(),
  week0Label: z.string(),
  week8Label: z.string(),
  hours: z.array(z.string()),
  week0: z.array(Blk),
  week8: z.array(Blk),
  cap0: z.string(),
  cap8: z.string(),
  moved: z.array(z.tuple([z.string(), z.string(), z.string()])),
  shippedK: z.string(),
  shippedH: z.string(),
  output: z.array(z.object({ u: z.string(), h4: z.string(), p: z.string(), href: z.string() })),
  punch: z.string(),
});
const Build = z.object({
  eyebrow: z.string(),
  h2: z.string(),
  split: z.array(z.object({ k: z.string(), b: z.string(), p: z.string() })),
  steps: z.array(z.object({ n: z.string(), b: z.string(), p: z.string() })),
  kill: z.string(),
  ctas: z.array(z.object({ label: z.string(), href: z.string() })),
});

function req<T>(value: T | undefined, section: string): T {
  if (value === undefined) throw new Error(`temper: missing block "${section}"`);
  return value;
}

export default async function TemperPage() {
  const [sites, blocks] = await Promise.all([getSites("temper"), getBlocks("temper")]);
  const crumb = req(dataOf(blocks, "crumb", Crumb), "crumb");
  const hero = req(dataOf(blocks, "hero", Hero), "hero");
  const premise = req(dataOf(blocks, "premise", Premise), "premise");
  const layers = req(dataOf(blocks, "layers", Layers), "layers");
  const engine = req(dataOf(blocks, "engine", Engine), "engine");
  const cz = req(dataOf(blocks, "cz", CZ), "cz");
  const build = req(dataOf(blocks, "build", Build), "build");

  return (
    <>
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <section className="hero">
          <p className="eyebrow rv">{hero.eyebrow}</p>
          <h1 className="rv">{hero.h1}</h1>
          <p className="thesis rv">{hero.thesis}</p>
          <TemperBlade stops={hero.stops} grades={hero.grades} hint={hero.hint} />
          <div className="btnrow rv">
            {hero.ctas.map((cta, i) => (
              <a key={cta.href} className={i === 0 ? "btn solid" : "btn ghost"} href={cta.href}>
                {cta.label}
              </a>
            ))}
          </div>
        </section>

        <section className="sec rv">
          <p className="premise">
            <span dangerouslySetInnerHTML={{ __html: premise.lead }} />
            <span className="small" dangerouslySetInnerHTML={{ __html: premise.small }} />
          </p>
        </section>

        <section className="sec rv">
          <p className="tag">{layers.tag}</p>
          <div className="tiles">
            {layers.tiles.map((t) => (
              <details key={t.nm} className="tile">
                <summary className="row">
                  <span className="lhs">
                    <span className="nm">{t.nm}</span>
                    <span className="pr">{t.pr}</span>
                  </span>
                  <span className="pl">+</span>
                </summary>
                <div className="body">
                  <div className="inner">
                    {t.bullets.map((bl, i) => (
                      <span key={i}>
                        <b>{bl.b}</b>
                        {bl.text}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="sec rv" id="engine">
          <InterruptionTax
            k={engine.k}
            sub={engine.sub}
            labStart={engine.labStart}
            labMid={engine.labMid}
            labEnd={engine.labEnd}
            hint={engine.hint}
            addLabel={engine.addLabel}
            resetLabel={engine.resetLabel}
            total={engine.total}
            ramp={engine.ramp}
            deepLabel={engine.deepLabel}
            fragLabel={engine.fragLabel}
            taxLabel={engine.taxLabel}
            verdicts={engine.verdicts}
          />
        </section>

        <section className="sec rv" id="proof">
          <div className="cz-head">
            <p className="eyebrow">{cz.eyebrow}</p>
            <h2 dangerouslySetInnerHTML={{ __html: cz.h2 }} />
            <p className="who">{cz.who}</p>
          </div>
          <DayClock
            week0Label={cz.week0Label}
            week8Label={cz.week8Label}
            hours={cz.hours}
            week0={cz.week0}
            week8={cz.week8}
            cap0={cz.cap0}
            cap8={cz.cap8}
            moved={cz.moved}
          />
          <div className="shipped">
            <p className="k">{cz.shippedK}</p>
            <h3>{cz.shippedH}</h3>
            <div className="outgrid">
              {cz.output.map((o) => (
                <a key={o.href} className="out" href={o.href}>
                  <span className="u">{o.u}</span>
                  <h4>{o.h4}</h4>
                  <p>{o.p}</p>
                </a>
              ))}
            </div>
            <p className="punch" dangerouslySetInnerHTML={{ __html: cz.punch }} />
          </div>
        </section>

        <section className="sec rv">
          <p className="eyebrow">{build.eyebrow}</p>
          <h2 dangerouslySetInnerHTML={{ __html: build.h2 }} />
          <div className="split">
            {build.split.map((s) => (
              <div key={s.k} className="s">
                <p className="k">{s.k}</p>
                <b>{s.b}</b>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
          <div className="steps">
            {build.steps.map((s) => (
              <div key={s.n} className="st">
                <span className="n">{s.n}</span>
                <div>
                  <b>{s.b}</b>
                  <p dangerouslySetInnerHTML={{ __html: s.p }} />
                </div>
              </div>
            ))}
          </div>
          <p className="kill">{build.kill}</p>
          <div className="btnrow" style={{ marginTop: "32px" }}>
            {build.ctas.map((cta, i) => (
              <a key={cta.href} className={i === 0 ? "btn solid" : "btn ghost"} href={cta.href}>
                {cta.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <Constellation sites={sites} current="temper" />
      <RevealManager threshold={0.1} />
    </>
  );
}
