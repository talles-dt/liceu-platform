import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

/** Database roles are authoritative. Provision admins explicitly, never during login. */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data: profile, error } = await createSupabaseAdminClient()
    .from("users").select("role, suspended_at").eq("id", user.id).maybeSingle();
  return !error && !profile?.suspended_at && profile?.role === "admin" ? user : null;
}
