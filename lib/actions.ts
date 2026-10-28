"use server";
import { getCurrentUser } from "./supabaseServer";
import { createSupabaseAdminClient } from "./supabaseAdmin";
import { assertAdmin } from "./admin/auth";

export async function getRedirectUrl(): Promise<"/admin" | "/dashboard"> {
  return await assertAdmin() ? "/admin" : "/dashboard";
}

export async function syncCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Aluno";
  const { error } = await createSupabaseAdminClient().from("users").upsert({
    id: user.id, name, email: user.email, role: "student",
  }, { onConflict: "id", ignoreDuplicates: true });
  return error ? { success: false, error: "Não foi possível sincronizar o perfil." } : { success: true };
}
