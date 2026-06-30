import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingEmails } from "@/lib/booking-email";

/**
 * Audit booking intake (audits.zephyrcode.live form). Validates, writes to
 * public.audit_bookings, fires owner-notify + reader-ack emails (best-effort,
 * via Amazon SES — see src/lib/booking-email.ts), and mirrors the conversion
 * to PostHog server-side.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const str = (v: unknown, max: number) => (v == null ? null : String(v).trim().slice(0, max) || null);
  const name = str(body.name, 200);
  const email = (str(body.email, 320) || "").toLowerCase();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  const row = {
    name,
    email,
    company: str(body.company, 200),
    audit_sku: str(body.audit_sku, 40),
    audit_title: str(body.audit_title, 200),
    message: str(body.message, 5000),
    source: str(body.source, 60) ?? "audits",
  };

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { error } = await sb.from("audit_bookings").insert(row);
  if (error) {
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }

  // Emails — best-effort; a send failure must never fail the booking.
  try {
    await sendBookingEmails(row);
  } catch {
    /* ignore */
  }

  // Mirror the conversion to PostHog (server-side truth for the audits funnel).
  const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (phKey) {
    try {
      await fetch("https://eu.i.posthog.com/capture/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: phKey,
          event: "audit_booking_server",
          distinct_id: email,
          properties: { app: "hub", site: "audits", audit_sku: row.audit_sku, $set: { email } },
        }),
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true });
}
