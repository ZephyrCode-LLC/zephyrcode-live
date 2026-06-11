import "@/styles/sites/listen.css";
import { Fragment } from "react";
import { z } from "zod";
import { dataOf, getBlocks, getListenProofs, getSites } from "@/lib/content";
import { ProofWaveform } from "@/components/engine/ProofWaveform";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";

/**
 * listen.zephyrcode.live — DOM structure ported 1:1 from /_reference/listen.html.
 * Every string is fetched from the database (seeded by scripts/content/listen.ts);
 * this file contains zero content strings.
 */

const Hero = z.object({ eyebrow: z.string(), h1: z.string(), lede: z.string() });
const Scope = z.object({ labPrefix: z.string(), hzLine: z.string(), aria: z.string() });
const Ignition = z.object({ k: z.string(), t: z.string(), s: z.string() });
const Rig = z.object({ k: z.string(), chain: z.array(z.string()), note: z.string() });
const Crumb = z.object({ text: z.string() });

/** The oscilloscope voice params from listen_proofs.voices (jsonb), validated. */
const Voice = z.object({
  c: z.string(),
  w: z.number(),
  f: z.number(),
  a: z.number(),
  sp: z.number(),
  ph: z.number().optional(),
  off: z.number().optional(),
  sub: z.number().optional(),
  noise: z.number().optional(),
  ripF: z.number().optional(),
  ripA: z.number().optional(),
  burst: z.boolean().optional(),
});

export default async function ListenPage() {
  const slug = "listen";
  const [sites, blocks, proofRows] = await Promise.all([
    getSites(slug),
    getBlocks(slug),
    getListenProofs(slug),
  ]);
  const hero = dataOf(blocks, "hero", Hero);
  const scope = dataOf(blocks, "scope", Scope);
  const ign = dataOf(blocks, "ignition", Ignition);
  const rig = dataOf(blocks, "rig", Rig);
  const crumb = dataOf(blocks, "crumb", Crumb);
  if (!hero || !scope || !ign || !rig || !crumb)
    throw new Error(`${slug}: missing content blocks`);

  const proofs = proofRows.map((p) => ({
    ...p,
    voices: p.voices.map((v) => Voice.parse(v)),
  }));

  return (
    <>
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <section>
          <p className="eyebrow rv">{hero.eyebrow}</p>
          <h1 className="rv" dangerouslySetInnerHTML={{ __html: hero.h1 }} />
          <p className="lede rv" dangerouslySetInnerHTML={{ __html: hero.lede }} />
        </section>

        <ProofWaveform
          proofs={proofs}
          labPrefix={scope.labPrefix}
          hzLine={scope.hzLine}
          tablistLabel={scope.aria}
        />

        <section className="ign rv">
          <span className="k">{ign.k}</span>
          <span className="t">{ign.t}</span>
          <span className="s">{ign.s}</span>
        </section>

        <section className="rig rv">
          <p className="k">{rig.k}</p>
          <div className="chain">
            {rig.chain.map((step, i) => (
              <Fragment key={step}>
                {i > 0 ? <i>→</i> : null}
                <b>{step}</b>
              </Fragment>
            ))}
          </div>
          <p className="note" dangerouslySetInnerHTML={{ __html: rig.note }} />
        </section>
      </main>
      <Constellation sites={sites} current={slug} />
      <RevealManager threshold={0.12} />
    </>
  );
}
