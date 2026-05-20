"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { syncCurrentUserProfile } from "@/lib/actions";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

const handleGoogleLogin = async (setError: (error: string) => void) => {
  setError("");
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  } catch {
    setError("Falha ao iniciar login com Google. Tente novamente.");
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Sync user to public.users (ensures admin role for env-listed admins)
      try {
        await syncCurrentUserProfile();
      } catch (syncErr) {
        console.error("[login] Failed to sync user profile:", syncErr);
        // Continue anyway
      }

      // Redirect: admins → /admin, everyone else → /dashboard
      // We need to check role client-side since server auth was already done by signInWithPassword
      const browserClient = createSupabaseBrowserClient();
      const { data: { user } } = await browserClient.auth.getUser();
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && s.includes("@"));
      const isAdminEmail = user?.email
        ? envAdmins.includes(user.email.toLowerCase())
        : false;

      if (isAdminEmail) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / ACESSO"
      title="ENTRAR"
      subtitle="Sem pressa. Sem ruído."
    >
      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-5 border border-stone-200 bg-surface/40 px-5 py-5">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-xs uppercase tracking-wider text-muted">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-sm border border-stone-200 bg-neutral px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-xs uppercase tracking-wider text-muted">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-sm border border-stone-200 bg-neutral px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>
          {error && (
            <p className="bg-neutral px-3 py-2 text-xs text-red-500" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 border-t border-stone-200/70 pt-5">
            <MinimalButton type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </MinimalButton>
          </div>
        </form>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => handleGoogleLogin(setError)}
            className="flex w-full items-center justify-center gap-3 border border-stone-200 bg-surface px-4 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.2 8.56 0 10.64 0 12s1.2 3.44 2.84 4.93l2.96-2.28z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.03.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.3 1 3.34 4.28 1.97 8.87l3.4 2.48c.89-.34 1.95-.55 3.06-.55z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>
        </div>
        <p className="text-xs text-muted">
          Ainda não tem conta? <Link href="/register" className="underline">Criar conta</Link>.
        </p>
      </div>
    </ReadingLayout>
  );
}
