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
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

