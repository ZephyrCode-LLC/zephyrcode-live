import { z } from "zod";
import "@/styles/sites/home.css";
import { dataOf, getBlocks, getSite } from "@/lib/content";
import { RevealManager } from "@/components/system/Reveal";
import { ParticleFieldLoader } from "@/components/engine/ParticleFieldLoader";
import { ConsequenceWeek } from "@/components/engine/ConsequenceWeek";

const Cta = z.object({ label: z.string(), href: z.string(), style: z.string().optional() });
const Chrome = z.object({
  ogDescription: z.string(),
  topCta: Cta,
  rail: z.array(z.object({ href: z.string(), t: z.string() })),
});
const Signal = z.object({
  eyebrowHtml: z.string(),
  h1Html: z.string(),
  ledeHtml: z.string(),
  scrollcue: z.string(),
});
const Method = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  sub: z.string(),
  moves: z.array(z.object({ k: z.string(), h3: z.string(), p: z.string() })),
  lawsHtml: z.array(z.string()),
  asideHtml: z.string(),
});
const Stories = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  feature: z.object({
    hindi: z.string(),
    h3: z.string(),
    tag: z.string(),
    logId: z.string(),
    logText: z.string(),
    blurbHtml: z.string(),
    chips: z.array(z.object({ label: z.string(), live: z.boolean() })),
    ctas: z.array(Cta),
  }),
  shorts: z.object({ k: z.string(), h4: z.string(), p: z.string(), link: Cta }),
});
const Systems = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  subHtml: z.string(),
  proofHtml: z.string(),
  osCards: z
    .array(z.object({ k: z.string(), h3: z.string(), pHtml: z.string(), link: Cta, live: z.boolean() }))
    .optional(),
  toy: z.object({
    k: z.string(),
    dayLabels: z.array(z.string()),
    seriesParams: z.object({ start: z.number(), hit: z.number(), miss: z.number() }),
    capHtml: z.string(),
  }),
  sims: z.array(z.object({ n: z.string(), p: z.string() })),
  ctas: z.array(Cta),
});
const Library = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  sub: z.string(),
  shelves: z.array(
    z.object({ cls: z.string(), h3: z.string(), axis: z.string(), pHtml: z.string(), link: Cta })
  ),
});
const Operator = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  blurbHtml: z.array(z.string()),
  timetable: z.array(z.object({ h: z.string(), w: z.string() })),
  client: z.object({ k: z.string(), pHtml: z.string(), cta: Cta }),
});
const Constel = z.object({
  k: z.string(),
  map: z.array(z.object({ u: z.string(), what: z.string(), href: z.string() })),
  legal: z.array(z.string()),
});
const Field = z.object({
  grades: z.array(z.tuple([z.array(z.number()), z.array(z.number()), z.number()])),
});

export default async function HomeSite() {
  const slug = "home";
  const [site, blocks] = await Promise.all([getSite(slug), getBlocks(slug)]);
  if (!site) return null;

  const chrome = dataOf(blocks, "chrome", Chrome)!;
  const signal = dataOf(blocks, "signal", Signal)!;
  const method = dataOf(blocks, "method", Method)!;
  const stories = dataOf(blocks, "stories", Stories)!;
  const systems = dataOf(blocks, "systems", Systems)!;
  const library = dataOf(blocks, "library", Library)!;
  const operator = dataOf(blocks, "operator", Operator)!;
  const constel = dataOf(blocks, "constel", Constel)!;
  const field = dataOf(blocks, "field", Field)!;

  return (
    <>
      <ParticleFieldLoader grades={field.grades} />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <RevealManager />

      <header className="top">
        <a className="wordmark" href="#signal">
          ZEPHYR<span className="dot">·</span>CODE
        </a>
        <a className="top-cta" href={chrome.topCta.href}>
          {chrome.topCta.label}
        </a>
      </header>

      <nav className="rail" aria-label="Scenes">
        {chrome.rail.map((r, i) => (
          <a key={r.href} href={r.href} data-r={i}>
            <span className="d" />
            <span className="t">{r.t}</span>
          </a>
        ))}
      </nav>

      <main>
        <section className="scene hero" id="signal" data-scene="0">
          <p className="eyebrow rv" dangerouslySetInnerHTML={{ __html: signal.eyebrowHtml }} />
          <h1 className="rv" dangerouslySetInnerHTML={{ __html: signal.h1Html }} />
          <p className="lede rv" dangerouslySetInnerHTML={{ __html: signal.ledeHtml }} />
          <p className="scrollcue rv">
            <span className="ln" /> {signal.scrollcue}
          </p>
        </section>

        <section className="scene" id="method" data-scene="1">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: method.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: method.h2Html }} />
            <p className="sub">{method.sub}</p>
          </div>
          <div className="method-track">
            {method.moves.map((m) => (
              <div className="move rv" key={m.k}>
                <p className="k">{m.k}</p>
                <h3>{m.h3}</h3>
                <p>{m.p}</p>
              </div>
            ))}
          </div>
          <p className="laws rv">
            {method.lawsHtml.map((l) => (
              <span key={l} dangerouslySetInnerHTML={{ __html: l }} />
            ))}
          </p>
          <p className="aside-note rv" dangerouslySetInnerHTML={{ __html: method.asideHtml }} />
        </section>

        <section className="scene" id="stories" data-scene="2">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: stories.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: stories.h2Html }} />
          </div>
          <article className="feature rv">
            <p className="hindi">{stories.feature.hindi}</p>
            <h3>{stories.feature.h3}</h3>
            <p className="tag">{stories.feature.tag}</p>
            <div className="log">
              <span className="id">{stories.feature.logId}</span>
              {stories.feature.logText}
            </div>
            <p className="blurb" dangerouslySetInnerHTML={{ __html: stories.feature.blurbHtml }} />
            <div className="chips">
              {stories.feature.chips.map((c) => (
                <span key={c.label} className={`chip${c.live ? " live" : ""}`}>
                  {c.label}
                </span>
              ))}
            </div>
            <div className="btnrow">
              {stories.feature.ctas.map((c) => (
                <a key={c.label} className={`btn ${c.style}`} href={c.href}>
                  {c.label}
                </a>
              ))}
            </div>
          </article>
          <div className="shorts rv">
            <div className="l">
              <p className="k">{stories.shorts.k}</p>
              <h4>{stories.shorts.h4}</h4>
              <p>{stories.shorts.p}</p>
            </div>
            <a className="alink" href={stories.shorts.link.href}>
              {stories.shorts.link.label}
            </a>
          </div>
        </section>

        <section className="scene" id="systems" data-scene="3">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: systems.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: systems.h2Html }} />
            <p className="sub sys-lede" dangerouslySetInnerHTML={{ __html: systems.subHtml }} />
          </div>
          {systems.osCards ? (
            <div className="os-cards rv">
              {systems.osCards.map((c) => (
                <a key={c.h3} className={`os-card${c.live ? " live" : ""}`} href={c.link.href}>
                  <span className="os-k">
                    {c.k}
                    {c.live && <span className="os-live">LIVE</span>}
                  </span>
                  <span className="os-h">{c.h3}</span>
                  <span className="os-p" dangerouslySetInnerHTML={{ __html: c.pHtml }} />
                  <span className="os-link">{c.link.label}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="proof rv" dangerouslySetInnerHTML={{ __html: systems.proofHtml }} />
          )}
          <ConsequenceWeek
            k={systems.toy.k}
            dayLabels={systems.toy.dayLabels}
            seriesParams={systems.toy.seriesParams}
            capHtml={systems.toy.capHtml}
          />
          <div className="arcade rv">
            {systems.sims.map((s) => (
              <div className="sim" key={s.n}>
                <p className="n">{s.n}</p>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
          <div className="btnrow rv">
            {systems.ctas.map((c) => (
              <a key={c.label} className={`btn ${c.style}`} href={c.href}>
                {c.label}
              </a>
            ))}
          </div>
        </section>

        <section className="scene" id="library" data-scene="4">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: library.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: library.h2Html }} />
            <p className="sub">{library.sub}</p>
          </div>
          <div className="shelves">
            {library.shelves.map((s) => (
              <div key={s.h3} className={`shelf ${s.cls} rv`}>
                <div className="spectrum" />
                <h3>{s.h3}</h3>
                <p className="axis">{s.axis}</p>
                <p dangerouslySetInnerHTML={{ __html: s.pHtml }} />
                <a className="alink" href={s.link.href}>
                  {s.link.label}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="scene" id="operator" data-scene="5">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: operator.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: operator.h2Html }} />
          </div>
          <div className="op-grid">
            <div className="blurb rv">
              {operator.blurbHtml.map((p, i) => (
                <p
                  key={i}
                  style={i > 0 ? { marginTop: 18 } : undefined}
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </div>
            <div className="timetable rv" aria-label="A working day">
              {operator.timetable.map((r) => (
                <div className="row" key={r.h}>
                  <span className="h">{r.h}</span>
                  <span className="w">{r.w}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="client-strip rv">
            <div className="l">
              <p className="k">{operator.client.k}</p>
              <p dangerouslySetInnerHTML={{ __html: operator.client.pHtml }} />
            </div>
            <a className="btn solid" href={operator.client.cta.href}>
              {operator.client.cta.label}
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="constel">
          <p className="k">{constel.k}</p>
          <div className="cmap">
            {constel.map.map((m) => (
              <a key={m.u} href={m.href}>
                <span className="u">{m.u}</span>
                <span className="what">{m.what}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="legal">
          {constel.legal.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </footer>
    </>
  );
}
