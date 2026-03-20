"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

export default function RegisterPage() {
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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / MATRÍCULA"
      title="Criar conta"
      subtitle="Um compromisso com método."
    >
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5"
        >
          <div className="space-y-2">
            <label className="block font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-accent)]/55"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-accent)]/55"
            />
          </div>

          {error && (
            <p
              className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-muted)]"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[var(--liceu-stone)]/70 pt-5">
            <MinimalButton type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </MinimalButton>
          </div>
        </form>

        <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-[var(--liceu-text)] underline decoration-[var(--liceu-muted)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
          >
            Entrar
          </Link>
          .
        </p>
      </div>
    </ReadingLayout>
  );
}

