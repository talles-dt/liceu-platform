"use server";

import { createSupabaseServerClient } from "./supabaseServer";
import { createSupabaseAdminClient } from "./supabaseAdmin";
import type { User } from "@supabase/supabase-js";

/**
 * Sync the current authenticated user to the public.users table.
 * Called after successful login (email/password or OAuth) to ensure
 * the user profile exists with correct role.
 */
export async function syncCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Now check admin emails
  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
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
