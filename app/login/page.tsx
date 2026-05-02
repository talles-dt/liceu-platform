"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

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
    const isAdminEmail = isPotentialAdminEmail(email);
    
    // Try password login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      // Log admin attempt if applicable
      if (isAdminEmail) {
        await logAdminLoginAttempt(email);
      }
      
      // Custom error for rate limits
      if (signInError.message.toLowerCase().includes("rate") || 
          signInError.message.includes("429") ||
          signInError.status === 429) {
        setError("Muitos pedidos. Por favor espere alguns minutos.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Email não verificado. Por favor verifique seu email.");
      } else {
        setError(signInError.message);
      }
      return;
    }
    
    window.location.href = "/dashboard";
    
  } catch (err) {
    setError("Erro inesperado. Por favor tente novamente.");
  } finally {
    setLoading(false);
  }
}

const logAdminLoginAttempt = async (email: string) => {
  try {
    await fetch("/api/admin/login-attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    // Silently fail - logging shouldn't break login flow
  }
};

const isPotentialAdminEmail = (email: string): boolean => {
  // Check if email domain matches any admin domains
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (!emailDomain) return false;
  
  const adminDomains = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.toLowerCase().trim())
    .filter(e => e && e.includes("@")) // Only valid emails
    .map(e => e.split("@")[1])
    .filter(d => d);
  
  return adminDomains.includes(emailDomain);
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
  );
}

