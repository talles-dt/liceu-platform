"use server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/admin/auth";
import { redirect } from "next/navigation";

export type AdminLoginState = { error: string } | null;
export async function adminLoginAction(_previous: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password)
    return { error: "Email e senha são obrigatórios." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return { error: "Email ou senha incorretos." };
  if (!await assertAdmin()) {
    await supabase.auth.signOut();
    return { error: "Acesso restrito a administradores." };
  }
  redirect("/admin");
}
