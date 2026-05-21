"use server";

import { createSupabaseServerClient } from "./supabaseServer";
import { createSupabaseAdminClient } from "./supabaseAdmin";

/**
 * Returns the correct post-login redirect URL based on admin status.
 * Uses server-side ADMIN_EMAILS (not NEXT_PUBLIC_) so no public env var needed.
 * Checks public.users role first, then falls back to ADMIN_EMAILS env var.
 */
export async function getRedirectUrl(): Promise<"/admin" | "/dashboard"> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return "/dashboard"; // Not logged in, fallback
  }

  const user = session.user;

  // 1. Check public.users role
  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    return "/admin";
  }

  // 2. Fall back to ADMIN_EMAILS env var (strip surrounding quotes for safety)
  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/^["']+|["']+$/g, "").toLowerCase())
    .filter((s) => s.length > 0 && s.includes("@"));

  const isAdminEmail = user.email ? envAdmins.includes(user.email.toLowerCase()) : false;

  if (isAdminEmail) {
    // Promote to admin in DB if not already (so future checks hit the DB row)
    if (!profile) {
      // User doesn't exist in public.users yet — create them as admin
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";
      await adminClient.from("users").insert({ id: user.id, name, email: user.email, role: "admin" });
    } else if (profile.role !== "admin") {
      await adminClient.from("users").update({ role: "admin" }).eq("id", user.id);
    }
    return "/admin";
  }

  return "/dashboard";
}

/**
 * Sync the current authenticated user to the public.users table.
 * Called after successful login (email/password or OAuth) to ensure
 * the user profile exists with correct role.
 */
export async function syncCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Now check admin emails
  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/^["']+|["']+$/g, "").toLowerCase())
    .filter(Boolean);

  const isAdminEmail = user.email ? envAdmins.includes(user.email.toLowerCase()) : false;

  // Check if user exists in public.users
  const adminClient = createSupabaseAdminClient();
  const { data: existing } = await adminClient
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    // Ensure admin role for env-listed admins
    if (isAdminEmail && existing.role !== "admin") {
      await adminClient.from("users").update({ role: "admin" }).eq("id", user.id);
      return { success: true, action: "updated-to-admin" };
    }
    return { success: true, action: "already-exists" };
  }

  // Create user in public.users
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const { error: insertError } = await adminClient.from("users").insert({
    id: user.id,
    name,
    email: user.email,
    role: isAdminEmail ? "admin" : "student",
  });

  if (insertError) {
    console.error("[syncCurrentUserProfile] Insert failed:", insertError.message);
    return { success: false, error: insertError.message };
  }

  return { success: true, action: "created" };
}
