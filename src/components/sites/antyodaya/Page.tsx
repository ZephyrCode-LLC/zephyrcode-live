import { z } from "zod";
import "@/styles/sites/antyodaya.css";
import { getBlocks, getChapters, getDossiers, getSite, getSites, dataOf } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Constellation } from "@/components/system/Constellation";
import { Vignette } from "@/components/system/Vignette";
import { RevealManager } from "@/components/system/Reveal";
import { DiyaFlame } from "@/components/engine/DiyaFlame";

const Chrome = z.object({ crumb: z.string() });
const HeroHead = z.object({ eyebrow: z.string(), hindi: z.string(), h1: z.string(), tag: z.string() });
const Log = z.object({ id: z.string(), text: z.string() });
const Lede = z.object({ html: z.string() });
const Ctas = z.object({
  ctas: z.array(z.object({ label: z.string(), href: z.string(), style: z.string() })),
});
const Lamp = z.object({ idle: z.string(), watched: z.string() });
const Excerpt = z.object({ text: z.string(), src: z.string() });
const DossHead = z.object({ eyebrow: z.string(), h2: z.string(), sub: z.string() });
const How = z.object({ cards: z.array(z.object({ k: z.string(), html: z.string() })) });

export default async function AntyodayaSite() {
  const slug = "antyodaya";
  const [site, sites, blocks, chapters, dossiers] = await Promise.all([
    getSite(slug),
    getSites(slug),
    getBlocks(slug),
    getChapters(slug),
    getDossiers(slug),
  ]);
  if (!site) return null;

  const chrome = dataOf(blocks, "chrome", Chrome)!;
  const head = HeroHead.parse(blocks.hero![0].data);
  const log = Log.parse(blocks.hero![1].data);
  const lede = Lede.parse(blocks.hero![2].data);
  const ctas = Ctas.parse(blocks.hero![3].data);
  const lamp = dataOf(blocks, "lamp", Lamp)!;
  const excerpt = dataOf(blocks, "excerpt", Excerpt)!;
  const dossHead = dataOf(blocks, "dossiers", DossHead)!;
  const how = dataOf(blocks, "how", How)!;
  const bookUrl = ctas.ctas[0]?.href ?? "#read";

  return (
    <>
      <Vignette />
      <TopBar crumb={chrome.crumb} />
      <RevealManager />
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow rv">{head.eyebrow}</p>
            <p className="hindi rv">{head.hindi}</p>
            <h1 className="rv">{head.h1}</h1>
            <p className="tag rv">{head.tag}</p>
            <div className="log rv">
              <span className="id">{log.id}</span>
              {log.text}
            </div>
            <p className="blurb rv" dangerouslySetInnerHTML={{ __html: lede.html }} />
            <div className="btnrow rv">
              {ctas.ctas.map((c) => (
                <a key={c.label} className={`btn ${c.style}`} href={c.href}>
                  {c.label}
                </a>
              ))}
            </div>
          </div>
          <DiyaFlame idleCaption={lamp.idle} watchedCaption={lamp.watched} />
        </section>

        <section className="rail rv" id="read" aria-label="Chapters">
          {chapters.map((c) =>
            c.sealed ? (
              <div key={c.code} className="dl sealed">
                <span className="d">{c.code}</span>
                <div className="t">{c.title === "" ? <span className="bar" /> : c.title}</div>
              </div>
            ) : (
              <a key={c.code} className="dl" href={bookUrl}>
                <span className="d">{c.code}</span>
                <div className="t">{c.title}</div>
              </a>
            )
          )}
        </section>

        <section className="excerpt rv">
          <p>{excerpt.text}</p>
          <p className="src">{excerpt.src}</p>
        </section>

        <section className="sec" id="dossiers">
          <p className="eyebrow rv">{dossHead.eyebrow}</p>
          <h2 className="rv" dangerouslySetInnerHTML={{ __html: dossHead.h2 }} />
          <p className="sub rv">{dossHead.sub}</p>
          <div className="doss">
            {dossiers.map((d) => (
              <div key={d.name} className="dcard rv">
                <p className="who">{d.role}</p>
                <h3>{d.name}</h3>
                <p>{d.blurb}</p>
                <div className="tier">
                  {d.tiers.map((t) => (
                    <span key={t.label} className={`tc${t.open ? " open" : ""}`}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="how rv">
          {how.cards.map((c) => (
            <div key={c.k}>
              <p className="k">{c.k}</p>
              <p dangerouslySetInnerHTML={{ __html: c.html }} />
            </div>
          ))}
        </section>
      </main>
      <Constellation sites={sites} current={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: head.h1,
            description: site.description,
            url: `https://${site.host}`,
            workExample: { "@type": "Book", bookFormat: "https://schema.org/EBook", url: bookUrl },
          }),
        }}
      />
    </>
  );
}
