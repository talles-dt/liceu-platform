import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Typed client — as schema stabilizes, replace `any` with `Database`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SafeClient = SupabaseClient<any, string, any>;

export function createSupabaseAdminClient(): SafeClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  }
  if (!key) {
    throw new Error(
      "Missing env var: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as SafeClient;
}

