"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

const handleGoogleLogin = async (setError: (error: string) => void) => {
  setError("");
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  } catch (err) {
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
      
      // Try password login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // ALWAYS log login attempt (server decides importance)
      await logAdminLoginAttempt(email, !signInError);
      
      if (signInError) {
        handleLoginError(signInError);
        return;
      }
      
      window.location.href = "/dashboard";
      
    } catch {
      setError("Erro inesperado. Por favor tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const handleLoginError = (signInError: any) => {
    if (signInError.message.toLowerCase().includes("rate") || 
        signInError.message.includes("429")) {
      setError("Muitos pedidos. Por favor espere alguns minutos.");
    } else if (signInError.message.includes("Email not confirmed")) {
      setError("Email não verificado. Por favor verifique seu email.");
    } else {
      setError(signInError.message);
    }
  };

  const logAdminLoginAttempt = async (email: string, success: boolean) => {
    try {
      await fetch("/api/admin/login-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          success
        }),
      });
    } catch {
      // Silent failure - logging shouldn't break login flow
    }
  };

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / ACESSO"
      title="Entrar"
      subtitle="Sem pressa. Sem ruído."
    >
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5"
        >
          <div className="space-y-2">
            <label htmlFor="login-email" className="block font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55"
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="font-[var(--font-work-sans)] text-[10px] text-[var(--liceu-muted)] underline decoration-[var(--liceu-muted)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          {error && (
            <p
              className="border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-3 py-2 font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[var(--liceu-stone)]/70 pt-5">
            <MinimalButton type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </MinimalButton>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => handleGoogleLogin(setError)}
              className="flex w-full items-center justify-center gap-3 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-6 py-3 text-sm font-medium text-[var(--liceu-text)] transition-colors hover:bg-[var(--liceu-surface-hover)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.87-.67z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.03.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continuar com Google</span>
            </button>
          </div>
        </form>

        <p className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="text-[var(--liceu-text)] underline decoration-[var(--liceu-muted)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
          >
            Criar conta
          </Link>
          .
        </p>
      </div>
    </ReadingLayout>
  );}