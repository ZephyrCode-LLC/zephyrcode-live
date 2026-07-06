import { z } from "zod";
import "@/styles/sites/home.css";
import { dataOf, getBlocks, getSite, getStoryShorts } from "@/lib/content";
import { RevealManager } from "@/components/system/Reveal";
import { SceneAccent } from "@/components/system/SceneAccent";
import { DoorGate } from "@/components/system/DoorGate";
import { doorsFor, DOORS } from "@/components/system/doors";

/** Pre-paint: stamp the remembered/shared door before first paint so returning
 *  visitors never flash the full page. No-JS never runs it → full page renders. */
const DOOR_BOOT = `(function(){try{var A={engineers:'#c6ff45',teams:'#3DE1E6',creators:'#8fd694',body:'#e85d2a',readers:'#7fd6a8',__all:'#e85d2a'};var el=document.querySelector('[data-site="home"]');if(!el)return;var c=new URLSearchParams(location.search).get('door');if(c==='all')c='__all';if(!c||!(c in A)){try{c=localStorage.getItem('zc-door')}catch(e){}if(c==='all')c='__all';}if(c&&(c in A)){el.setAttribute('data-door',c);el.style.setProperty('--door-accent',A[c]);el.classList.add('gate-boot');}}catch(e){}})();`;

/** who → door key (must match DOORS keys + the CMS door order). */
const WHO_KEY: Record<string, string> = {
  "For engineers": "engineers",
  "For teams & CTOs": "teams",
  "For creators & writers": "creators",
  "For body & mind": "body",
  "For readers & the curious": "readers",
};
import { ParticleFieldLoader } from "@/components/engine/ParticleFieldLoader";
import { SystemsDeck } from "@/components/sites/home/SystemsDeck";
import { MethodTrack } from "@/components/sites/home/MethodTrack";
import { StoriesTabs } from "@/components/sites/home/StoriesTabs";

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
const Doors = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  sub: z.string(),
  doors: z.array(
    z.object({
      who: z.string(),
      vibe: z.string(),
      accent: z.string(),
      links: z.array(Cta),
      key: z.string().optional(),
    })
  ),
});
const Method = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  sub: z.string(),
  moves: z.array(z.object({ k: z.string(), h3: z.string(), p: z.string() })),
  lawsHtml: z.array(z.string()),
  asideHtml: z.string(),
});
const Audits = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  subHtml: z.string(),
  items: z.array(z.object({ sku: z.string(), h3: z.string(), p: z.string(), price: z.string() })),
  note: z.string(),
  cta: Cta,
});
const Arena = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  subHtml: z.string(),
  capHtml: z.string(),
  cta: Cta,
});
const Sage = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  subHtml: z.string(),
  flowIn: z.array(z.string()),
  flowOut: z.array(z.string()),
  points: z.array(z.object({ k: z.string(), h3: z.string(), p: z.string() })),
  cta: Cta,
});
const Feature = z.object({
  key: z.string().optional(),
  tabDeva: z.string().optional(),
  tabName: z.string().optional(),
  accent: z.string().optional(),
  hindi: z.string(),
  h3: z.string(),
  tag: z.string(),
  logId: z.string(),
  logText: z.string(),
  blurbHtml: z.string(),
  chips: z.array(z.object({ label: z.string(), live: z.boolean() })),
  ctas: z.array(Cta),
});
const Stories = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  feature: Feature.optional(), // legacy single feature (kept for no-break deploy)
  features: z.array(Feature).optional(), // the two-novel deck
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
const Samhita = z.object({
  eyebrowHtml: z.string(),
  h2Html: z.string(),
  subHtml: z.string(),
  steps: z.array(z.object({ k: z.string(), h3: z.string(), p: z.string() })),
  chips: z.array(z.object({ t: z.string(), c: z.string() })),
  chipCap: z.string(),
  note: z.string(),
  cta: Cta,
});
const Constel = z.object({
  k: z.string(),
  map: z.array(z.object({ u: z.string(), what: z.string(), href: z.string() })),
  legal: z.array(z.string()),
});
const Field = z.object({
  grades: z.array(z.tuple([z.array(z.number()), z.array(z.number()), z.number()])),
});

/** Outbound property links leave the page — open them in a new tab; anchors/mailto stay put. */
const ext = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {});

export default async function HomeSite() {
  const slug = "home";
  const [site, blocks, shorts] = await Promise.all([
    getSite(slug),
    getBlocks(slug),
    getStoryShorts(slug).catch(() => []), // no-break: section still renders the novels
  ]);
  if (!site) return null;
  const shortStories = shorts.filter((s) => s.slug);

  const chrome = dataOf(blocks, "chrome", Chrome)!;
  const signal = dataOf(blocks, "signal", Signal)!;
  const doors = dataOf(blocks, "doors", Doors); // optional: no-break deploy while the CMS row propagates
  const method = dataOf(blocks, "method", Method)!;
  const audits = dataOf(blocks, "audits", Audits)!;
  const arena = dataOf(blocks, "arena", Arena)!;
  const sage = dataOf(blocks, "sage", Sage)!;
  const stories = dataOf(blocks, "stories", Stories)!;
  const samhita = dataOf(blocks, "samhita", Samhita); // optional: no-break deploy while the CMS row propagates
  const systems = dataOf(blocks, "systems", Systems)!;
  const library = dataOf(blocks, "library", Library)!;
  const operator = dataOf(blocks, "operator", Operator)!;
  const constel = dataOf(blocks, "constel", Constel)!;
  const field = dataOf(blocks, "field", Field)!;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DOOR_BOOT }} />
      <ParticleFieldLoader grades={field.grades} />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <RevealManager />
      <SceneAccent />
      <DoorGate />

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
          <a key={r.href} href={r.href} data-r={i} data-doors={doorsFor(r.href.replace("#", ""))}>
            <span className="d" />
            <span className="t">{r.t}</span>
          </a>
        ))}
      </nav>

      <main>
        <section className="scene hero" id="signal" data-doors={doorsFor("signal")} data-scene="0" data-accent="#e85d2a">
          <p className="eyebrow rv" dangerouslySetInnerHTML={{ __html: signal.eyebrowHtml }} />
          <h1 className="rv" dangerouslySetInnerHTML={{ __html: signal.h1Html }} />
          <p className="lede rv" dangerouslySetInnerHTML={{ __html: signal.ledeHtml }} />
          <p className="scrollcue rv">
            <span className="ln" /> {signal.scrollcue}
          </p>
        </section>

        {doors && (
          <section className="scene" id="doors" data-doors={doorsFor("doors")} data-scene="1" data-accent="#e85d2a">
            <div className="shead rv">
              <p className="eyebrow" dangerouslySetInnerHTML={{ __html: doors.eyebrowHtml }} />
              <h2 dangerouslySetInnerHTML={{ __html: doors.h2Html }} />
              <p className="sub">{doors.sub}</p>
            </div>
            <div className="doors rv">
              {doors.doors.map((d) => {
                const key = (d as { key?: string }).key ?? WHO_KEY[d.who];
                const short = key && DOORS[key] ? DOORS[key].short : "this door";
                return (
                  <div
                    className="door"
                    key={d.who}
                    data-door-key={key}
                    role="button"
                    tabIndex={0}
                    aria-pressed="false"
                    style={{ ["--dc" as string]: d.accent }}
                  >
                    <p className="door-who">{d.who}</p>
                    <p className="door-vibe">{d.vibe}</p>
                    <div className="door-links">
                      {d.links.map((l) => (
                        <a key={l.href} href={l.href} {...ext(l.href)}>
                          <span>{l.label}</span>
                          <span className="door-arrow">→</span>
                        </a>
                      ))}
                    </div>
                    <button type="button" className="door-focus" data-focus={key}>
                      <span>Read as {short}</span>
                      <span className="door-arrow">→</span>
                    </button>
                  </div>
                );
              })}
              {/* the "everything" door — the full constellation, one scroll */}
              <div
                className="door door-all"
                data-door-key="__all"
                role="button"
                tabIndex={0}
                aria-pressed="false"
                style={{ ["--dc" as string]: "#e85d2a" }}
              >
                <p className="door-who">Show me everything</p>
                <p className="door-vibe">The full constellation — every room in one scroll. You can focus a single door anytime.</p>
                <button type="button" className="door-focus" data-focus="__all">
                  <span>Open all doors</span>
                  <span className="door-arrow">→</span>
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="scene" id="method" data-doors={doorsFor("method")} data-scene="2" data-accent="#e85d2a">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: method.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: method.h2Html }} />
            <p className="sub">{method.sub}</p>
          </div>
          <MethodTrack moves={method.moves} />
          <p className="laws rv">
            {method.lawsHtml.map((l) => (
              <span key={l} dangerouslySetInnerHTML={{ __html: l }} />
            ))}
          </p>
          <p className="aside-note rv" dangerouslySetInnerHTML={{ __html: method.asideHtml }} />
        </section>

        <section className="scene" id="audits" data-doors={doorsFor("audits")} data-scene="3" data-accent="#3DE1E6">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: audits.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: audits.h2Html }} />
            <p className="sub" dangerouslySetInnerHTML={{ __html: audits.subHtml }} />
          </div>
          <svg className="audit-trace rv" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 40 L120 40 L150 40 L168 14 L186 52 L206 40 L300 40 L360 38 L520 40 L760 40 L900 40 L930 40 L948 18 L966 50 L984 40 L1200 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="audit-cards rv">
            {audits.items.map((it) => (
              <a key={it.sku} className="audit-card" href={audits.cta.href} {...ext(audits.cta.href)}>
                <span className="ac-sku">{it.sku}</span>
                <span className="ac-h">{it.h3}</span>
                <span className="ac-p">{it.p}</span>
                <span className="ac-price">{it.price}</span>
              </a>
            ))}
          </div>
          <p className="audit-note rv">{audits.note}</p>
          <div className="btnrow rv">
            <a className="btn solid" href={audits.cta.href} {...ext(audits.cta.href)}>
              {audits.cta.label}
            </a>
          </div>
        </section>

        <section className="scene arena-scene" id="arena" data-doors={doorsFor("arena")} data-scene="4" data-accent="#c6ff45">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: arena.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: arena.h2Html }} />
            <p className="sub" dangerouslySetInnerHTML={{ __html: arena.subHtml }} />
          </div>
          <div className="arena-demo rv">
            <div className="ad-row">
              <span className="ad-k">Greedy pack</span>
              <div className="ad-bar"><span className="ad-fill greedy" /></div>
              <span className="ad-sc">123</span>
            </div>
            <div className="ad-row">
              <span className="ad-k">Optimal</span>
              <div className="ad-bar"><span className="ad-fill opt" /></div>
              <span className="ad-sc gold">162</span>
            </div>
            <p className="ad-cap" dangerouslySetInnerHTML={{ __html: arena.capHtml }} />
          </div>
          <div className="btnrow rv">
            <a className="btn solid" href={arena.cta.href} {...ext(arena.cta.href)}>
              {arena.cta.label}
            </a>
          </div>
        </section>

        <section className="scene" id="sage" data-doors={doorsFor("sage")} data-scene="5" data-accent="#8fd694">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: sage.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: sage.h2Html }} />
            <p className="sub" dangerouslySetInnerHTML={{ __html: sage.subHtml }} />
          </div>

          {/* the explainer: everything you capture flows through the brain onto the calendar */}
          <div className="sage-flow rv" aria-hidden>
            <div className="sf-col">
              {sage.flowIn.map((t, i) => (
                <span key={t} className="sf-chip in" style={{ animationDelay: `${i * 0.9}s` }}>{t}</span>
              ))}
            </div>
            <svg className="sf-paths" viewBox="0 0 120 100" preserveAspectRatio="none">
              <path d="M0 18 C 45 18 65 50 118 50" />
              <path d="M0 50 C 50 50 70 50 118 50" />
              <path d="M0 82 C 45 82 65 50 118 50" />
              {["M0 18 C 45 18 65 50 118 50", "M0 50 C 50 50 70 50 118 50", "M0 82 C 45 82 65 50 118 50"].map((d, i) => (
                <circle key={i} className="sf-dot" r="2.4">
                  <animateMotion dur="2.7s" begin={`${i * 0.9}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))}
            </svg>
            <div className="sf-node">
              <span className="sf-ring" />
              <span className="sf-leaf">SAGE</span>
            </div>
            <svg className="sf-paths" viewBox="0 0 120 100" preserveAspectRatio="none">
              <path d="M2 50 C 55 50 75 18 120 18" />
              <path d="M2 50 C 50 50 70 50 120 50" />
              <path d="M2 50 C 55 50 75 82 120 82" />
              {["M2 50 C 55 50 75 18 120 18", "M2 50 C 50 50 70 50 120 50", "M2 50 C 55 50 75 82 120 82"].map((d, i) => (
                <circle key={i} className="sf-dot" r="2.4">
                  <animateMotion dur="2.7s" begin={`${0.45 + i * 0.9}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))}
            </svg>
            <div className="sf-col">
              {sage.flowOut.map((t, i) => (
                <span key={t} className="sf-chip out" style={{ animationDelay: `${0.5 + i * 0.9}s` }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="sage-points rv">
            {sage.points.map((p) => (
              <div className="sage-point" key={p.k}>
                <p className="k">{p.k}</p>
                <h3>{p.h3}</h3>
                <p>{p.p}</p>
              </div>
            ))}
          </div>
          <div className="btnrow rv">
            <a className="btn solid" href={sage.cta.href} {...ext(sage.cta.href)}>{sage.cta.label}</a>
          </div>
        </section>

        <section className="scene" id="stories" data-doors={doorsFor("stories")} data-scene="6" data-accent="#7fd6a8">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: stories.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: stories.h2Html }} />
          </div>
          <p className="story-cat rv">The novels <span>— interactive, serialized, from the same desk</span></p>
          <StoriesTabs features={stories.features ?? (stories.feature ? [stories.feature] : [])} />

          <div className="story-cat-row rv">
            <p className="story-cat">Short stories <span>— comedies of the optimized life</span></p>
            <a className="alink" href={stories.shorts.link.href} {...ext(stories.shorts.link.href)}>
              {stories.shorts.link.label}
            </a>
          </div>
          {shortStories.length > 0 ? (
            <div className="shorts-grid rv">
              {shortStories.map((s) => {
                const dek = typeof s.body.dek === "string" ? s.body.dek : "a short story";
                const accent = typeof s.body.accent === "string" ? s.body.accent : "#c9a45c";
                return (
                  <a key={s.slug} className="short-card" href={`/story/${s.slug}`} style={{ ["--sc" as string]: accent }}>
                    <span className="short-dek">{dek}</span>
                    <span className="short-title">{s.title}</span>
                    <span className="short-go mono">Read <span className="short-arrow">→</span></span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="shorts rv">
              <div className="l">
                <p className="k">{stories.shorts.k}</p>
                <h4>{stories.shorts.h4}</h4>
                <p>{stories.shorts.p}</p>
              </div>
            </div>
          )}
        </section>

        {samhita && (
        <section className="scene" id="samhita" data-doors={doorsFor("samhita")} data-scene="7" data-accent="#6f8bff">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: samhita.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: samhita.h2Html }} />
            <p className="sub" dangerouslySetInnerHTML={{ __html: samhita.subHtml }} />
          </div>

          {/* the pipeline, drawn — Commit → Review → Approve → Live */}
          <div className="sam-pipe rv">
            {samhita.steps.map((s, i) => (
              <div className="sam-step" key={s.h3} style={{ transitionDelay: `${i * 0.12}s` }}>
                <span className="ss-dot" />
                <span className="ss-k">{s.k}</span>
                <span className="ss-h">{s.h3}</span>
                <span className="ss-p">{s.p}</span>
              </div>
            ))}
          </div>

          <div className="sam-verdicts rv">
            {samhita.chips.map((c) => (
              <span key={c.t} className="sam-chip" style={{ ["--chip" as string]: c.c }}>
                {c.t}
              </span>
            ))}
            <span className="sam-chip-cap">{samhita.chipCap}</span>
          </div>

          <p className="sam-note rv">{samhita.note}</p>
          <div className="btnrow rv">
            <a className="btn solid" href={samhita.cta.href} {...ext(samhita.cta.href)}>
              {samhita.cta.label}
            </a>
          </div>
        </section>
        )}

        <section className="scene" id="systems" data-doors={doorsFor("systems")} data-scene="8" data-accent="#54d38a">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: systems.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: systems.h2Html }} />
            <p className="sub sys-lede" dangerouslySetInnerHTML={{ __html: systems.subHtml }} />
          </div>
          <SystemsDeck toy={systems.toy} />
        </section>

        <section className="scene" id="library" data-doors={doorsFor("library")} data-scene="9" data-accent="#8fb6e8">
          <div className="shead rv">
            <p className="eyebrow" dangerouslySetInnerHTML={{ __html: library.eyebrowHtml }} />
            <h2 dangerouslySetInnerHTML={{ __html: library.h2Html }} />
            <p className="sub">{library.sub}</p>
          </div>
          <div className="shelves">
            {library.shelves.map((s) => (
              <div key={s.h3} className={`shelf ${s.cls} rv`}>
                <div className={`spectrum sp-${s.cls}`} aria-hidden="true">
                  {s.cls === "watch" && Array.from({ length: 8 }).map((_, i) => <i key={i} style={{ ["--b" as string]: i }} />)}
                  {s.cls === "listen" && Array.from({ length: 16 }).map((_, i) => <i key={i} style={{ ["--b" as string]: i }} />)}
                </div>
                <h3>{s.h3}</h3>
                <p className="axis">{s.axis}</p>
                <p dangerouslySetInnerHTML={{ __html: s.pHtml }} />
                <a className="alink" href={s.link.href} {...ext(s.link.href)}>
                  {s.link.label}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="scene" id="operator" data-doors={doorsFor("operator")} data-scene="10" data-accent="#54d38a">
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
            <a className="btn solid" href={operator.client.cta.href} {...ext(operator.client.cta.href)}>
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
              <a key={m.u} href={m.href} {...ext(m.href)}>
                <span className="u">{m.u}</span>
                <span className="what">{m.what}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="footer-writing">
          <a href="https://priyanshusekhar.substack.com/" target="_blank" rel="noopener">
            The Optimum — essays &amp; field reports on <b>Substack</b> <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="legal">
          {constel.legal.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `https://${site.host}/#org`,
                name: "ZephyrCode",
                url: `https://${site.host}`,
                email: "priyanshu@zephyrcode.live",
              },
              {
                "@type": "WebSite",
                "@id": `https://${site.host}/#website`,
                name: site.title,
                url: `https://${site.host}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
