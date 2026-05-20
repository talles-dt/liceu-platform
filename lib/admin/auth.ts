import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * Parse the ADMIN_EMAILS environment variable into an array of normalized emails.
 * Handles quoted values, comma-separated, semicolon-separated, and whitespace-separated emails.
 */
function getEnvAdminEmails(): string[] {
  let raw = process.env.ADMIN_EMAILS;
  if (!raw) return [];
  // Strip surrounding/inline quotes that may remain from .env file formatting
  raw = raw.replace(/\s*[;,]\s*/g, ",").replace(/"/g, "").replace(/'/g, "");
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.includes("@"));
}

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

  const envAdmins = getEnvAdminEmails();

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
    (user.email ? envAdmins.includes(user.email.toLowerCase()) : false);

  if (!isAdmin) {
    console.warn("[admin/auth] Access denied:", {
      userId: user.id,
      email: user.email,
      userEmailLower: user.email?.toLowerCase(),
      envAdmins,
      isInEnvAdmins: user.email ? envAdmins.includes(user.email.toLowerCase()) : false,
      profileRole: profile?.role ?? null,
      appRole,
      appRoles,
      appIsAdmin: appMetadata.is_admin === true,
    });
  }

  return isAdmin ? user : null;
}
