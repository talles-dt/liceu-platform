import { createSupabaseAdminClient } from "./supabaseAdmin";
import type { User } from "@supabase/supabase-js";

/**
 * Ensures a user exists in the public.users table.
 * Creates the record if missing, updates if needed.
 * Returns the synced user profile.
 */
export async function syncUserProfile(user: User, opts: { autoAdmin?: boolean } = {}) {
  const supabase = createSupabaseAdminClient();

  // Check if user already exists in public.users
  const { data: existing } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    // Update email/name if changed
    const updates: Record<string, unknown> = {};
    if (user.email && existing.email !== user.email) {
      updates.email = user.email;
    }
    if (user.user_metadata?.full_name && existing.name !== user.user_metadata.full_name) {
      updates.name = user.user_metadata.full_name;
    }
    if (user.user_metadata?.name && existing.name !== user.user_metadata.name) {
      updates.name = user.user_metadata.name;
    }

    // If auto-admin flag, ensure role is set
    if (opts.autoAdmin && existing.role !== "admin") {
      updates.role = "admin";
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("users").update(updates).eq("id", user.id);
    }

    return { ...existing, ...updates } as typeof existing;
  }

  // Create new user record in public.users
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const newUser = {
    id: user.id,
    name,
    email: user.email,
    role: opts.autoAdmin ? "admin" : "student",
  };

  const { data, error } = await supabase.from("users").insert(newUser).select().single();

  if (error) {
    console.error("[syncUserProfile] Failed to create user profile:", error.message);
    throw error;
  }

  return data;
}

/**
 * Check if an email is in the admin list from env.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return envAdmins.includes(email.toLowerCase());
}
