import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/styles/sites/arcade.css";
import { z } from "zod";
import { dataOf, getBlocks, getSims } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { SCREENS } from "@/components/sites/arcade/screens";

/**
 * Per-machine deep link (operator-author brief §3): every arcade cabinet has
 * its own URL with unique og:title/description/image so shared links unfurl.
 * Canonical host: arcade.zephyrcode.live/m/<machine>.
 */

export const revalidate = 300; // edge TTL: author edits live in ≤5 min (CloudFront can't be purged on demand); origin busts instantly via /api/revalidate
export const dynamicParams = true;

const ARCADE = "https://arcade.zephyrcode.live";

type Params = Promise<{ machine: string }>;

export async function generateStaticParams() {
  const sims = await getSims("arcade");
  return sims.map((s) => ({ machine: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { machine } = await params;
  const sims = await getSims("arcade");
  const sim = sims.find((s) => s.slug === machine);
  if (!sim) return {};
  return {
    title: `${sim.name} — THE ARCADE · ZephyrCode`,
    description: sim.blurb,
    alternates: { canonical: `${ARCADE}/m/${sim.slug}` },
    openGraph: {
      title: `${sim.name} — THE ARCADE`,
      description: sim.blurb,
      url: `${ARCADE}/m/${sim.slug}`,
      siteName: "THE ARCADE · ZephyrCode",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

const Crumb = z.object({ text: z.string() });
const Marquee = z.object({ ey: z.string(), h1: z.string(), sub: z.string() });
const Play = z.object({ label: z.string(), hrefs: z.record(z.string(), z.string()) });

export default async function MachinePage({ params }: { params: Params }) {
  const { machine } = await params;
  const [blocks, sims] = await Promise.all([getBlocks("arcade"), getSims("arcade")]);
  const sim = sims.find((s) => s.slug === machine);
  if (!sim) notFound();

  const crumb = dataOf(blocks, "crumb", Crumb);
  const marquee = dataOf(blocks, "marquee", Marquee);
  const play = dataOf(blocks, "play", Play);
  const anchor = play?.hrefs[sim.slug] ?? `#${sim.slug}`;

  return (
    <div data-site="arcade">
      <Vignette />
      <TopBar crumb={crumb?.text ?? ""} />
      <main className="machine-page">
        <article className="cab solo" aria-label={sim.name}>
          {SCREENS[sim.slug]}
          <div className="cinfo">
            <p className="n">{sim.name}</p>
            <p>{sim.blurb}</p>
            {play && (
              <a className="play" href={`${ARCADE}/${anchor}`} aria-label={`${play.label} ${sim.name}`}>
                {play.label}
              </a>
            )}
          </div>
          <div className="coin">{sim.grammar}</div>
        </article>
        {marquee && (
          <a className="backrow" href={ARCADE}>
            {marquee.h1} →
          </a>
        )}
      </main>
    </div>
  );
}
