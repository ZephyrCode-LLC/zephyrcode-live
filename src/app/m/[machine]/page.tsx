import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import "@/styles/sites/arcade.css";
import { z } from "zod";
import { dataOf, getBlocks, getSims } from "@/lib/content";
import { MachineRuntime } from "@/components/sites/arcade/MachineRuntime";

/**
 * The machine itself (P0-1): /m/<slug> renders the FULL standalone simulator
 * (public/machines/<slug>.html) in a full-bleed iframe under a slim bar —
 * back to the arcade, name, grammar, OPEN FULL SCREEN (raw file). Unique
 * og:title/description/image per machine (metadataBase set in app/m/layout.tsx).
 */

export const revalidate = 300; // edge TTL ≤5 min; origin busts instantly via /api/revalidate
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

const Marquee = z.object({ ey: z.string(), h1: z.string(), sub: z.string() });

export default async function MachinePage({ params }: { params: Params }) {
  const { machine } = await params;
  const [blocks, sims] = await Promise.all([getBlocks("arcade"), getSims("arcade")]);
  const sim = sims.find((s) => s.slug === machine);
  if (!sim) notFound();

  const marquee = dataOf(blocks, "marquee", Marquee);
  const src = `/machines/${sim.slug}.html`;

  return (
    <div data-site="arcade" className="machine-shell">
      <div className="machine-bar">
        <a className="mb-back" href={ARCADE}>
          ← {marquee?.h1 ?? "THE ARCADE"}
        </a>
        <span className="mb-name">{sim.name}</span>
        <span className="mb-coin">{sim.grammar}</span>
        <a className="mb-full" href={src} target="_blank" rel="noopener">
          OPEN FULL SCREEN →
        </a>
      </div>
      <iframe
        className="machine-frame"
        src={src}
        title={`${sim.name} — playable simulator`}
        loading="eager"
        allow="clipboard-write"
      />
      <MachineRuntime machine={sim.slug} />
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
    </div>
  );
}
