import "@/styles/sites/read.css";
import { z } from "zod";
import { dataOf, getBlocks, getBooks, getSites } from "@/lib/content";
import { Signature } from "@/components/sites/read/Signature";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";

/**
 * read.zephyrcode.live — same DOM as /_reference/read.html.
 * All copy comes from Supabase (blocks + books); this file contains
 * zero content strings. The source page's reveal observer uses
 * threshold .1 (vs the shared .15), hence the prop below.
 */

const Crumb = z.object({ text: z.string() });
const Hero = z.object({ eyebrow: z.string(), h1Html: z.string(), ledeHtml: z.string() });
const Dial = z.object({
  fire: z.string(),
  still: z.string(),
  ariaLabel: z.string(),
  askLines: z.array(z.tuple([z.number(), z.string()])).min(2),
});
const Start = z.object({
  k: z.string(),
  picks: z.array(z.tuple([z.string(), z.string()])).min(1),
  tail: z.string(),
});

function req<T>(value: T | undefined, section: string): T {
  if (value === undefined) throw new Error(`read: missing "${section}" block`);
  return value;
}

export default async function ReadPage() {
  const [sites, blocks, books] = await Promise.all([
    getSites("read"),
    getBlocks("read"),
    getBooks("read"),
  ]);

  const crumb = req(dataOf(blocks, "top", Crumb), "top");
  const hero = req(dataOf(blocks, "hero", Hero), "hero");
  const dial = req(dataOf(blocks, "dial", Dial), "dial");
  const start = req(dataOf(blocks, "start", Start), "start");

  return (
    <>
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <section>
          <p className="eyebrow rv">{hero.eyebrow}</p>
          <h1 className="rv" dangerouslySetInnerHTML={{ __html: hero.h1Html }} />
          <p className="lede rv" dangerouslySetInnerHTML={{ __html: hero.ledeHtml }} />
        </section>

        <Signature
          ariaLabel={dial.ariaLabel}
          books={books.map((b) => ({ title: b.title, pos: b.pos }))}
        />

        <section className="start rv">
          <p className="k">{start.k}</p>
          <div className="four">
            {start.picks.map(([title, role]) => (
              <div key={title}>
                <b>{title}</b>
                <span>{role}</span>
              </div>
            ))}
          </div>
          <p className="tail">{start.tail}</p>
        </section>
      </main>
      <RevealManager threshold={0.1} />
      <Constellation sites={sites} current="read" />
    </>
  );
}
