import "@/styles/sites/arcade.css";
import Script from "next/script";
import { z } from "zod";
import { dataOf, getBlocks, getSims, getSites } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { SCREENS } from "./screens";
import { Capture } from "./Capture";
import { ArcadeRuntime } from "./Runtime";

/**
 * arcade.zephyrcode.live — DOM structure mirrors /_reference/arcade.html
 * exactly, plus the operator-author refinement brief: email capture, studio
 * strip, per-machine deep links (/m/[machine] + anchors), shareVerdict
 * helper, cookieless analytics, a11y pass. Zero content strings here: every
 * word comes from the DB (blocks + the sims table).
 */

const Crumb = z.object({ text: z.string() });
const Marquee = z.object({ ey: z.string(), h1: z.string(), sub: z.string() });
const Lede = z.object({ html: z.string() });
const Play = z.object({ label: z.string(), hrefs: z.record(z.string(), z.string()) });
const Scores = z.object({
  k: z.string(),
  rows: z.array(z.tuple([z.string(), z.string()])),
});
const CaptureBlock = z.object({
  k: z.string(),
  sub: z.string(),
  placeholder: z.string(),
  button: z.string(),
  ok: z.string(),
  err: z.string(),
});
const Studio = z.object({
  k: z.string(),
  body: z.string(),
  cta: z.object({ label: z.string(), href: z.string() }),
});

function req<T>(value: T | undefined, section: string): T {
  if (value === undefined) throw new Error(`arcade: missing block "${section}"`);
  return value;
}

export default async function ArcadePage() {
  const [sites, blocks, sims] = await Promise.all([
    getSites("arcade"),
    getBlocks("arcade"),
    getSims("arcade"),
  ]);
  const crumb = req(dataOf(blocks, "crumb", Crumb), "crumb");
  const marquee = req(dataOf(blocks, "marquee", Marquee), "marquee");
  const lede = req(dataOf(blocks, "lede", Lede), "lede");
  const play = req(dataOf(blocks, "play", Play), "play");
  const scores = req(dataOf(blocks, "scores", Scores), "scores");
  const capture = dataOf(blocks, "capture", CaptureBlock);
  const studio = dataOf(blocks, "studio", Studio);

  return (
    <>
      <Vignette />
      <TopBar crumb={crumb.text} />
      <main>
        <section className="marquee rv">
          <p className="ey">{marquee.ey}</p>
          <h1>{marquee.h1}</h1>
          <p className="sub" dangerouslySetInnerHTML={{ __html: marquee.sub }} />
        </section>
        <p className="lede rv" dangerouslySetInnerHTML={{ __html: lede.html }} />

        <section className="row5">
          {sims.map((sim) => (
            <article key={sim.slug} id={sim.slug} className="cab rv" aria-label={sim.name}>
              {SCREENS[sim.slug]}
              <div className="cinfo">
                <p className="n">{sim.name}</p>
                <p>{sim.blurb}</p>
                <a
                  className="play"
                  href={play.hrefs[sim.slug] ?? `/m/${sim.slug}`}
                  aria-label={`${play.label} ${sim.name}`}
                >
                  {play.label}
                </a>
              </div>
              <div className="coin">{sim.grammar}</div>
            </article>
          ))}
        </section>

        {capture && <Capture {...capture} />}

        <section className="scores rv">
          <p className="k">{scores.k}</p>
          {scores.rows.map(([label, value]) => (
            <div key={label} className="r">
              <span>{label}</span>
              <span className="v">{value}</span>
            </div>
          ))}
        </section>

        {studio && (
          <section className="studio rv" aria-label={studio.k}>
            <p className="k">{studio.k}</p>
            <p className="b">{studio.body}</p>
            <a className="cta" href={studio.cta.href}>
              {studio.cta.label}
            </a>
          </section>
        )}
      </main>
      <Constellation sites={sites} current="arcade" />
      <RevealManager threshold={0.12} />
      <ArcadeRuntime />
      {/* cookieless analytics — create "arcade.zephyrcode.live" in Plausible
          (or point src at a self-hosted Umami script) and events flow */}
      <Script
        id="arcade-plausible-q"
        strategy="afterInteractive"
      >{`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}</Script>
      <Script
        defer
        data-domain="arcade.zephyrcode.live"
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    </>
  );
}
