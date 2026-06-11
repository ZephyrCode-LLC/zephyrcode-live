import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** The email gate: posts to `leads`, sets a cookie. No auth (BRIEF §11 non-goals). */
export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { error } = await sb.from("leads").insert({ email, source: body.source ?? null });
  if (error) {
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("zc_lead", "1", { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
