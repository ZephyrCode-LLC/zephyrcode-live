import type { Metadata } from "next";
import "@/styles/sites/arcade.css";
import { z } from "zod";
import { dataOf, getBlocks, getSims } from "@/lib/content";
import { Vignette } from "@/components/system/Vignette";

/**
 * P1-5: the arcade's commission CTA lands HERE — a creator-facing door on the
 * operator domain (operator.zephyrcode.live/commission), not the Rail-2
 * Personal-OS pitch. Copy lives in blocks (operator/commission). The five
 * machine pages double as the portfolio. The existing operator page is linked,
 * untouched, below.
 */

export const revalidate = 300;

const OPERATOR = "https://operator.zephyrcode.live";

const Commission = z.object({
  ey: z.string(),
  h1: z.string(),
  body: z.string(),
  cta: z.object({ label: z.string(), href: z.string() }),
  proof: z.object({ label: z.string(), href: z.string() }),
});

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getBlocks("operator");
  const c = dataOf(blocks, "commission", Commission);
  return {
    metadataBase: new URL(OPERATOR),
    title: `${c?.ey ?? "COMMISSION A MACHINE"} — ZephyrCode`,
    description: c?.body,
    alternates: { canonical: `${OPERATOR}/commission` },
    openGraph: {
      title: c?.ey ?? "COMMISSION A MACHINE",
      description: c?.body,
      url: `${OPERATOR}/commission`,
      siteName: "ZephyrCode",
      type: "website",
    },
  };
}

export default async function CommissionPage() {
  const [blocks, sims] = await Promise.all([getBlocks("operator"), getSims("arcade")]);
  const c = dataOf(blocks, "commission", Commission);
  if (!c) return null;

  return (
    <div data-site="arcade">
      <Vignette />
      <main className="commission">
        <p className="ey">{c.ey}</p>
        <h1>{c.h1}</h1>
        <p className="body">{c.body}</p>
        <div className="ctas">
          <a className="cta hot" href={c.cta.href}>
            {c.cta.label}
          </a>
          <a className="cta" href={c.proof.href}>
            {c.proof.label}
          </a>
        </div>
        <div className="proofrow">
          {sims.map((s) => (
            <a key={s.slug} href={`https://arcade.zephyrcode.live/m/${s.slug}`} className="proofcard">
              <span className="pn">{s.name}</span>
              <span className="pg">{s.grammar}</span>
            </a>
          ))}
        </div>
        <a className="below" href={OPERATOR}>
          THE REST OF THE OPERATOR PAGE →
        </a>
      </main>
    </div>
  );
}
