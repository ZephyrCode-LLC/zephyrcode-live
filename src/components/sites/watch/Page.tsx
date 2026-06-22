import "@/styles/sites/watch.css";
import { z } from "zod";
import { dataOf, getBlocks, getSites, getWatchChannels } from "@/lib/content";
import { ChannelTuner } from "@/components/engine/ChannelTuner";
import { Signature } from "@/components/sites/watch/Signature";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";

/**
 * watch.zephyrcode.live — DOM structure ported 1:1 from /_reference/watch.html.
 * Every string is fetched from the database (seeded by scripts/content/watch.ts);
 * this file contains zero content strings.
 */

const Hero = z.object({ eyebrow: z.string(), h1: z.string(), lede: z.string() });
const Np = z.object({ tunedPrefix: z.string(), footnote: z.string(), aria: z.string() });
const Crumb = z.object({ text: z.string() });

export default async function WatchPage() {
  const slug = "watch";
  const [sites, blocks, channels] = await Promise.all([
    getSites(slug),
    getBlocks(slug),
    getWatchChannels(slug),
  ]);
  const hero = dataOf(blocks, "hero", Hero);
  const np = dataOf(blocks, "np", Np);
  const crumb = dataOf(blocks, "crumb", Crumb);
  if (!hero || !np || !crumb) throw new Error(`${slug}: missing content blocks`);

  return (
    <>
      <div className="beam" aria-hidden="true" />
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <section>
          <p className="eyebrow rv">{hero.eyebrow}</p>
          <h1 className="rv" dangerouslySetInnerHTML={{ __html: hero.h1 }} />
          <p className="lede rv" dangerouslySetInnerHTML={{ __html: hero.lede }} />
          <Signature />
        </section>

        <ChannelTuner
          channels={channels}
          tunedPrefix={np.tunedPrefix}
          footnote={np.footnote}
          tablistLabel={np.aria}
        />
      </main>
      <Constellation sites={sites} current={slug} />
      <RevealManager threshold={0.12} />
    </>
  );
}
