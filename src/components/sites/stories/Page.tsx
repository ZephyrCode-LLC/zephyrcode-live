import "@/styles/sites/stories.css";
import { z } from "zod";
import { dataOf, getBlocks, getSites, getStoryShorts } from "@/lib/content";
import { MagnetBoard } from "@/components/engine/MagnetBoard";
import { StoriesGallery, type DoneStory } from "@/components/sites/stories/StoriesGallery";
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
const Dishwasher = z.object({ h3: z.string(), sub: z.string() });

/** A published short carries its full featured-card payload in story_shorts.body. */
const DoneBody = z.object({
  slug: z.string(),
  accent: z.string(),
  k: z.string(),
  dek: z.string(),
  pullquote: z.string(),
  paragraphs: z.array(z.string()).min(1),
  chips: z.array(z.string()).min(1),
  exhibit: z.object({ k: z.string(), line: z.string() }),
});

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
  const dw = req(dataOf(blocks, "dishwasher", Dishwasher), "dishwasher");

  // A short with no status is published → it gets the featured gallery treatment.
  // Anything still carrying a status (outline, in edit) stays in the dishwasher.
  const done: DoneStory[] = shorts
    .filter((s) => s.status === null)
    .map((s) => ({ title: s.title, ...DoneBody.parse(s.body) }));
  const rinsing = shorts.filter((s) => s.status !== null);

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

        <StoriesGallery stories={done} />

        {rinsing.length > 0 && (
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
        )}
      </main>
      <RevealManager />
      <Constellation sites={sites} current="stories" />
    </>
  );
}
