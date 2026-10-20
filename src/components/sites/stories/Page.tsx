import "@/styles/sites/stories.css";
import type { CSSProperties } from "react";
import { z } from "zod";
import { dataOf, getBlocks, getSites, getStoryShorts } from "@/lib/content";
import { StoriesStage, type GalleryStory } from "@/components/sites/stories/StoriesStage";
import { Signature } from "@/components/sites/stories/Signature";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";

/**
 * stories.zephyrcode.live — the page is pure tech: hero + the interactive stage
 * (fridge board + accordion) + a long-read signpost + the dishwasher. Every
 * story is a Supabase story_shorts row; this file holds zero content strings.
 */

const Crumb = z.object({ text: z.string() });
const Hero = z.object({ eyebrow: z.string(), h1Html: z.string(), lede: z.string() });
const Dishwasher = z.object({ h3: z.string(), sub: z.string() });
/** A signpost out to long-form work that has its own reader (not a short). */
const LongRead = z.object({
  k: z.string(),
  title: z.string(),
  dek: z.string(),
  meta: z.string(),
  cta: z.string(),
  href: z.string().url(),
  accent: z.string(),
  accent2: z.string(),
});

/** Everything a published short needs for the card + the fridge board it themes. */
const StoryBody = z.object({
  accent: z.string(),
  accent2: z.string().optional(), // secondary highlight (board magnets + pullquote); falls back to accent
  dek: z.string(),
  k: z.string(),
  pullquote: z.string(),
  paragraphs: z.array(z.string()).min(1),
  chips: z.array(z.string()).min(1),
  exhibit: z.object({ k: z.string(), line: z.string() }),
  board: z.object({
    k: z.string(),
    sentences: z.array(z.array(z.string())).min(1),
    notes: z.array(z.string()).min(1),
    button: z.string(),
  }),
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
  const dw = req(dataOf(blocks, "dishwasher", Dishwasher), "dishwasher");
  // Optional, unlike the blocks above: deleting the row retires the signpost.
  const longread = dataOf(blocks, "longread", LongRead);

  // Published (status === null) → the interactive stage. Anything with a status
  // (outline, in edit) is still rinsing in the dishwasher.
  const done: GalleryStory[] = shorts
    .filter((s) => s.status === null && s.slug)
    .map((s) => ({ title: s.title, slug: s.slug!, ...StoryBody.parse(s.body) }));
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

        <Signature />

        <StoriesStage stories={done} />

        {longread && (
          <section
            className="longread rv"
            aria-label={longread.k}
            style={{ "--sel": longread.accent, "--sel2": longread.accent2 } as CSSProperties}
          >
            <p className="gk">{longread.k}</p>
            <a className="lr" href={longread.href} target="_blank" rel="noopener">
              <span className="lr-title">{longread.title}</span>
              <span className="lr-dek">{longread.dek}</span>
              <span className="lr-foot">
                <span className="lr-meta">{longread.meta}</span>
                <span className="lr-go">
                  {longread.cta} <span aria-hidden>&#8599;</span>
                </span>
              </span>
            </a>
          </section>
        )}

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
