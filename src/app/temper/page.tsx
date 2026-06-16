import type { Metadata } from "next";
import TemperPage from "@/components/sites/temper/Page";
import { getSite } from "@/lib/content";

/**
 * TEMPER as a dedicated PATH (zephyrcode.live/temper) rather than a subdomain —
 * same Next app, same Amplify deploy, no DNS/subdomain needed. Mirrors the
 * /sites/[site] wrapper (data-site scope + per-page metadata). Content still loads
 * from the temper blocks in Supabase.
 */
export const revalidate = 300;

const BLADE_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M10 40 L44 40 L54 32 L44 24 L10 24 Z' fill='none' stroke='%238B7FD4' stroke-width='3' stroke-linejoin='round'/%3E%3Crect x='6' y='27' width='6' height='10' rx='1' fill='%23C9A45C'/%3E%3C/svg%3E";

export async function generateMetadata(): Promise<Metadata> {
  const row = await getSite("temper").catch(() => null);
  const url = "https://zephyrcode.live/temper";
  if (!row) return { title: "TEMPER · ZephyrCode", icons: { icon: BLADE_FAVICON } };
  return {
    title: row.title,
    description: row.description,
    alternates: { canonical: url },
    icons: { icon: BLADE_FAVICON },
    openGraph: { title: row.title, description: row.description, url, type: "website" },
  };
}

export default function TemperRoute() {
  return (
    <div data-site="temper">
      <TemperPage />
    </div>
  );
}
