import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/content";
import HomeSite from "@/components/sites/home/Page";
import AntyodayaSite from "@/components/sites/antyodaya/Page";
import StoriesSite from "@/components/sites/stories/Page";
import OperatorSite from "@/components/sites/operator/Page";
import TemperSite from "@/components/sites/temper/Page";
import ArcadeSite from "@/components/sites/arcade/Page";
import ReadSite from "@/components/sites/read/Page";
import WatchSite from "@/components/sites/watch/Page";
import ListenSite from "@/components/sites/listen/Page";
import WispSite from "@/components/sites/wisp/Page";

export const revalidate = 300; // edge TTL: author edits live in ≤5 min (CloudFront can't be purged on demand); origin busts instantly via /api/revalidate

const PAGES: Record<string, React.ComponentType> = {
  home: HomeSite,
  antyodaya: AntyodayaSite,
  stories: StoriesSite,
  operator: OperatorSite,
  temper: TemperSite,
  arcade: ArcadeSite,
  read: ReadSite,
  watch: WatchSite,
  listen: ListenSite,
  wisp: WispSite,
};

/** Inline-SVG favicons, verbatim from the source pages (design, not copy). */
const FAVICONS: Record<string, string> = {
  home: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='14' fill='%23E85D2A'/%3E%3Ccircle cx='32' cy='32' r='26' fill='none' stroke='%23C9A45C' stroke-width='2' opacity='.5'/%3E%3C/svg%3E",
  antyodaya: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M32 10c8 10 6 16 0 22-6-6-8-12 0-22z' fill='%23E85D2A'/%3E%3Crect x='22' y='36' width='20' height='6' rx='3' fill='%23C9A45C'/%3E%3C/svg%3E",
  stories: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='14' y='8' width='36' height='48' rx='4' fill='none' stroke='%23C9A45C' stroke-width='3'/%3E%3Ccircle cx='32' cy='26' r='5' fill='%238B7FD4'/%3E%3C/svg%3E",
  operator: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='10' width='44' height='44' rx='6' fill='none' stroke='%23E85D2A' stroke-width='4'/%3E%3Cpath d='M24 32h16M32 24v16' stroke='%23C9A45C' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E",
  temper: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M10 40 L44 40 L54 32 L44 24 L10 24 Z' fill='none' stroke='%238B7FD4' stroke-width='3' stroke-linejoin='round'/%3E%3Crect x='6' y='27' width='6' height='10' rx='1' fill='%23C9A45C'/%3E%3C/svg%3E",
  arcade: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='22' fill='none' stroke='%23E85D2A' stroke-width='4'/%3E%3Ccircle cx='32' cy='32' r='7' fill='%23C9A45C'/%3E%3C/svg%3E",
  read: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='12' y='10' width='10' height='44' fill='%23E85D2A'/%3E%3Crect x='27' y='10' width='10' height='44' fill='%23C9A45C'/%3E%3Crect x='42' y='10' width='10' height='44' fill='%238B7FD4'/%3E%3C/svg%3E",
  watch: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='8' y='14' width='48' height='32' rx='4' fill='none' stroke='%23C9A45C' stroke-width='3'/%3E%3Ccircle cx='32' cy='30' r='6' fill='%23E85D2A'/%3E%3Cpath d='M22 52h20' stroke='%23C9A45C' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
  listen: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M8 32h8l6-14 8 28 8-22 6 8h12' fill='none' stroke='%23E85D2A' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  wisp: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%237CC7E8' stroke-width='4' stroke-linecap='round'%3E%3Cpath d='M10 22h30a6 6 0 1 0-6-6'/%3E%3Cpath d='M10 34h36a7 7 0 1 1-7 7'/%3E%3Cpath d='M10 46h22a5 5 0 1 0-5-5'/%3E%3C/g%3E%3C/svg%3E",
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((site) => ({ site }));
}
export const dynamicParams = true; // unknown slugs 404 via PAGES lookup; evicted pages re-render on demand

export async function generateMetadata({
  params,
}: {
  params: Promise<{ site: string }>;
}): Promise<Metadata> {
  const { site } = await params;
  const row = await getSite(site).catch(() => null);
  if (!row) {
    // Wisp's copy is inline (not DB-managed), so give it real metadata here.
    if (site === "wisp") {
      return {
        title: "Wisp — the featherweight macOS browser",
        description:
          "Same WebKit engine as Safari, a fraction of the footprint. A native, private, lightweight macOS browser with real tab suspension and ad-blocking on by default.",
        icons: { icon: FAVICONS.wisp },
      };
    }
    return {};
  }
  const url = `https://${row.host}`;
  const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE;
  return {
    title: row.title,
    description: row.description,
    alternates: { canonical: url },
    icons: { icon: FAVICONS[site] },
    openGraph: {
      title: row.title,
      description: row.description,
      url,
      type: "website",
      // P0-2: every site gets a card — DB-pinned art if set, else the
      // generated cabinet-style default (absolute via root metadataBase)
      images: row.og_image && assetBase ? [`${assetBase}${row.og_image}`] : [`/sites/${site}/opengraph-image`],
    },
  };
}

export default async function SitePage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const Page = PAGES[site];
  if (!Page) notFound();
  return (
    <div data-site={site}>
      <Page />
    </div>
  );
}
