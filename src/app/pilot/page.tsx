import type { Metadata } from "next";
import { PilotForm } from "@/app/pilot/form";

/**
 * /pilot — the pilot-request intake for the personal-OS products and studio
 * engagements (FORGE OS, TEMPER, studio work). Replaces the raw mailto: CTAs.
 * Submissions land in audit_bookings (sku PILOT-*) + SES emails, same rail as
 * the audits form.
 */
export const metadata: Metadata = {
  title: "Request a pilot — ZephyrCode",
  description: "Pilot FORGE OS, TEMPER, or bring the studio a systems problem.",
};

const PRODUCTS: Record<string, { name: string; blurb: string }> = {
  "forge-os": { name: "FORGE OS", blurb: "The body's operating system — protocol, engine, consequences." },
  temper: { name: "TEMPER", blurb: "The mind OS — attention, tempered. Pilot cohort." },
  studio: { name: "Studio engagement", blurb: "Backend systems, applied AI/NLP, interactive product — via ZephyCode FZ-LLC." },
};

export default async function PilotPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const pick = PRODUCTS[p ?? ""] ? p! : "studio";
  return <PilotForm products={PRODUCTS} initial={pick} />;
}
