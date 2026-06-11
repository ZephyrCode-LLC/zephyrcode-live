import { createClient } from "@supabase/supabase-js";

/**
 * Server-side anon client for CONTENT READS ONLY (BRIEF §4): every fetch is
 * tagged `site:<slug>` so a Supabase webhook → /api/revalidate makes edits
 * live within seconds. The anon key never does client-side page fetching —
 * client components receive data as props.
 */
export function contentClient(slug: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            next: { revalidate: 3600, tags: [`site:${slug}`, "content"] },
          } as RequestInit),
      },
    }
  );
}
