import "@/styles/sites/stories.css";
import { z } from "zod";
import { dataOf, getBlocks, getSites, getStoryShorts } from "@/lib/content";
import { MagnetBoard } from "@/components/engine/MagnetBoard";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";

/**
 * stories.zephyrcode.live — same DOM as /_reference/stories.html.
 * All copy comes from Supabase (blocks + story_shorts); this file
 * contains zero content strings.
 */

const Crumb = z.object({ text: z.string() });
const Hero = z.object({ eyebrow: z.string(), h1Html: z.string(), lede: z.string() });
const Fridge = z.object({
  ariaLabel: z.string(),
  k: z.string(),
  sentences: z.array(z.array(z.string())).min(1),
  notes: z.array(z.string()).min(1),
  button: z.string(),
});
const Feature = z.object({
  k: z.string(),
  h2: z.string(),
  pullquote: z.string(),
  paragraphsHtml: z.array(z.string()).min(1),
  chips: z.array(z.string()),
  cta: z.object({ label: z.string(), href: z.string() }),
});
const Dishwasher = z.object({ h3: z.string(), sub: z.string() });

function req<T>(value: T | undefined, section: string): T {
  if (value === undefined) throw new Error(`stories: missing "${section}" block`);
  return value;
}

export default async function StoriesPage() {
  const [sites, blocks, shorts] = await Promise.all([
    getSites("stories"),
    getBlocks("stories"),
    getStoryShorts("stories"),
  ]);

  const crumb = req(dataOf(blocks, "top", Crumb), "top");
  const hero = req(dataOf(blocks, "hero", Hero), "hero");
  const fridge = req(dataOf(blocks, "fridge", Fridge), "fridge");
  const feature = req(dataOf(blocks, "feature", Feature), "feature");
  const dw = req(dataOf(blocks, "dishwasher", Dishwasher), "dishwasher");
  const rinsing = shorts.filter((s) => !s.featured);

  return (
    <>
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <section>
          <p className="eyebrow rv">{hero.eyebrow}</p>
          <h1 className="rv" dangerouslySetInnerHTML={{ __html: hero.h1Html }} />
          <p className="lede rv">{hero.lede}</p>
        </section>

        <section className="fridge rv" aria-label={fridge.ariaLabel}>
          <p className="k">{fridge.k}</p>
          <MagnetBoard
            sentences={fridge.sentences}
            notes={fridge.notes}
            buttonLabel={fridge.button}
          />
        </section>

        <article className="story rv">
          <p className="k">{feature.k}</p>
          <h2>{feature.h2}</h2>
          <p className="pq">{feature.pullquote}</p>
          {feature.paragraphsHtml.map((html, i) => (
            <p
              key={i}
              className="body"
              style={i > 0 ? { marginTop: 14 } : undefined}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
          <div className="meta">
            {feature.chips.map((chip) => (
              <span key={chip} className="mchip">
                {chip}
              </span>
            ))}
          </div>
          <a className="btn solid" href={feature.cta.href}>
            {feature.cta.label}
          </a>
        </article>

        <section className="dw rv">
          <h3>{dw.h3}</h3>
          <p className="sub">{dw.sub}</p>
          {rinsing.map((s) => (
            <div key={s.title} className="row">
              <span className="t">{s.title}</span>
              <span className="s">{s.status}</span>
            </div>
          ))}
        </section>
      </main>
      <RevealManager />
      <Constellation sites={sites} current="stories" />
    </>
  );
}
