import type { Metadata } from "next";
import { OpsApp } from "@/components/ops/OpsApp";

/**
 * THE OPERATOR'S LEDGER (v0) — private ops layer behind Supabase Auth,
 * allowlisted to the owner. Two non-negotiables, learned the hard way:
 *  - noindex: this page must never appear in a crawler
 *  - no edge caching: force-dynamic → cache-control: no-store, so CloudFront
 *    can never serve anyone a cached ledger
 * Auth lives client-side; data behind owner-only RLS either way.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "THE OPERATOR'S LEDGER · ZephyrCode",
  robots: { index: false, follow: false, nocache: true },
};

export default function OpsPage() {
  return <OpsApp />;
}
