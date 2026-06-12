"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Browser client for the private ops layer (/ops). Sessions persist under
 *  their own storage key so they never collide with future public auth. */
export function opsSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { storageKey: "zc-ops-auth" } }
    );
  }
  return client;
}
