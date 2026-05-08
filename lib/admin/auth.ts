import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Asserts that the current user is an admin.
 * Returns the user object if admin, null otherwise.
 * Checks both database role and ADMIN_EMAILS environment variable.
 */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    profile?.role === "admin" ||
    (user.email && envAdmins.includes(user.email.toLowerCase()));

  return isAdmin ? user : null;
}
