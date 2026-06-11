import "@/styles/sites/arcade.css";
import type { ReactNode } from "react";
import { z } from "zod";
import { dataOf, getBlocks, getSims, getSites } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";
import { CascadeDelays } from "@/components/engine/CascadeDelays";

/**
 * arcade.zephyrcode.live — DOM structure mirrors /_reference/arcade.html
 * exactly. Zero content strings here: every word comes from the DB (blocks
 * + the sims table). The per-cabinet attract-loop screens are pure CSS/SVG
 * design markup from the source page, keyed by sim slug below — the SVG
 * paths and glyphs are design, not copy.
 */

const Crumb = z.object({ text: z.string() });
const Marquee = z.object({ ey: z.string(), h1: z.string(), sub: z.string() });
const Lede = z.object({ html: z.string() });
const Play = z.object({ label: z.string(), hrefs: z.record(z.string(), z.string()) });
const Scores = z.object({
  k: z.string(),
  rows: z.array(z.tuple([z.string(), z.string()])),
});

function req<T>(value: T | undefined, section: string): T {
  if (value === undefined) throw new Error(`arcade: missing block "${section}"`);
  return value;
}

/** Attract loops, verbatim from the source page (design, not copy). */
const SCREENS: Record<string, ReactNode> = {
  leap: (
    <div className="screen s-leap">
      <svg viewBox="0 0 250 130" preserveAspectRatio="none">
        <path
          d="M0,40 C60,40 80,95 125,95 C170,95 190,30 250,30"
          fill="none"
          stroke="rgba(201,164,92,.7)"
          strokeWidth="2"
        />
        <circle className="dot" r="5" fill="#E85D2A" />
      </svg>
    </div>
  ),
  bedtime: (
    <div className="screen s-bed">
      <div className="card3">
        <i className="a">✓</i>
        <i className="b">✕</i>
      </div>
      <div className="meters">
        <b />
        <b />
        <b />
        <b />
      </div>
    </div>
  ),
  plate: (
    <div className="screen s-plate">
      <svg viewBox="0 0 250 130" preserveAspectRatio="none">
        <path
          className="p1"
          d="M10,95 C70,90 110,84 240,80"
          fill="none"
          stroke="rgba(201,164,92,.8)"
          strokeWidth="2"
        />
        <path
          className="p2"
          d="M10,95 C60,30 95,18 130,55 C165,92 200,88 240,84"
          fill="none"
          stroke="#E85D2A"
          strokeWidth="2"
        />
      </svg>
    </div>
  ),
  cascade: (
    <div className="screen s-casc">
      <CascadeDelays />
    </div>
  ),
  tax: (
    <div className="screen s-tax">
      <b />
      <b />
      <b />
      <b />
      <b />
      <b />
    </div>
  ),
};

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
            <div key={sim.slug} className="cab rv">
              {SCREENS[sim.slug]}
              <div className="cinfo">
                <p className="n">{sim.name}</p>
                <p>{sim.blurb}</p>
                <a className="play" href={play.hrefs[sim.slug]}>
                  {play.label}
                </a>
              </div>
              <div className="coin">{sim.grammar}</div>
            </div>
          ))}
        </section>

        <section className="scores rv">
          <p className="k">{scores.k}</p>
          {scores.rows.map(([label, value]) => (
            <div key={label} className="r">
              <span>{label}</span>
              <span className="v">{value}</span>
            </div>
          ))}
        </section>
      </main>
      <Constellation sites={sites} current="arcade" />
      <RevealManager threshold={0.12} />
    </>
  );
}
