import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * Asserts that the current user is an admin.
 * Returns the user object if admin, null otherwise.
 * Checks both database role and ADMIN_EMAILS environment variable.
 */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const appMetadata = user.app_metadata as {
    role?: unknown;
    roles?: unknown;
    is_admin?: unknown;
  };
  const appRole = typeof appMetadata.role === "string" ? appMetadata.role : "";
  const appRoles = Array.isArray(appMetadata.roles) ? appMetadata.roles : [];

  const isAdmin =
    profile?.role === "admin" ||
    appRole === "admin" ||
    appRoles.includes("admin") ||
    appMetadata.is_admin === true ||
    (user.email && envAdmins.includes(user.email.toLowerCase()));

  if (!isAdmin) {
    console.warn("[admin/auth] access denied", {
      userId: user.id,
      email: user.email,
      hasProfile: Boolean(profile),
      profileRole: profile?.role ?? null,
      hasAdminEmailConfig: envAdmins.length > 0,
      appRole,
      appRoles,
      appIsAdmin: appMetadata.is_admin === true,
    });
  }

  return isAdmin ? user : null;
}
