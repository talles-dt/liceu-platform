"use server";

import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function loginWithPassword(email: string, password: string) {
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password)
    return { error: "Informe seu email e sua senha." };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user || !data.session)
      return { error: error?.code === "invalid_credentials" ? "Email ou senha incorretos." : "Não foi possível entrar. Confira suas credenciais e tente novamente." };

    // Auth establishes identity before profile lookup. Never derive privileges from email or user metadata.
    const db = createSupabaseAdminClient();
    const user = data.user;
    const { error: syncError } = await db.from("users").upsert({
      id: user.id, email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || "Aluno",
      role: "student",
    }, { onConflict: "id", ignoreDuplicates: true });
    const { data: profile, error: profileError } = await db.from("users").select("role,suspended_at").eq("id", user.id).maybeSingle();
    if (syncError || profileError || !profile) {
      await supabase.auth.signOut();
      return { error: "Não foi possível carregar seu cadastro. Tente novamente em instantes." };
    }
    if (profile.suspended_at) {
      await supabase.auth.signOut();
      return { error: "Seu acesso está suspenso. Entre em contato com o Liceu." };
    }
    return { destination: profile.role === "admin" ? "/admin" as const : "/dashboard" as const };
  } catch {
    return { error: "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes." };
  }
}

/** A separate request proves that the browser returned the newly issued cookies. */
export async function confirmLoginSession() {
  try {
    return { confirmed: !!await getCurrentUser() };
  } catch {
    return { confirmed: false };
  }
}
