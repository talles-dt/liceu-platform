"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [siteUrl, setSiteUrl] = useState("");

  // Set site URL once on client side
  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  // Cooldown effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldown === 0 && sent) {
      // Reset sent state after cooldown
      const resetTimer = setTimeout(() => setSent(false), 60 * 1000); // 60s cool down
      return () => clearTimeout(resetTimer);
    }
  }, [cooldown, sent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Prevent duplicate submits
    if (loading || sent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback`,
      });
      
      if (resetError) {
        // Handle rate limiting specifically
        if (resetError.message.toLowerCase().includes("rate") || 
            resetError.message.includes("429") ||
            resetError.status === 429) {
          setError("Muitos pedidos. Por favor espere alguns minutos antes de tentar novamente.");
          setCooldown(60); // Start 60s cooldown
        } else {
          setError(resetError.message);
        }
        return;
      }
      
      // Success state
      setSent(true);
      setCooldown(60); // Start 60s cooldown
      
    } catch (err) {
      setError("Erro inesperado. Por favor tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  // Format cooldown time
  const formatCooldown = () => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    if (minutes > 0) {
      return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
    }
    return `${seconds} segundo${seconds > 1 ? "s" : ""}`;
  };

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
      title="Recuperar senha"
      subtitle="Enviaremos um link para redefinir sua senha."
    >
      <div className="space-y-8">
        {sent ? (
          <div className="space-y-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5">
            <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)]">
              Link de recuperação enviado. Verifique seu email e clique no link para redefinir sua senha.
            </p>
            <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              Você poderá solicitar outro link em {formatCooldown()}.{cooldown <= 0 && " Clique em enviar novamente se necessário."}
            </p>
            <p className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
              Voltar para{" "}
              <Link
                href="/login"
                className="text-[var(--liceu-text)] underline decoration-[var(--liceu-muted)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
              >
                entrar
              </Link>
              .
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5"
          >
            <div className="space-y-2">
              <label htmlFor="reset-email" className="block font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55"
                disabled={loading}
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
              <MinimalButton
                type="submit"
                disabled={loading || sent}
              >
                {loading ? "Enviando..." : sent ? `Espere ${formatCooldown()}` : "Enviar link de recuperação"}
              </MinimalButton>
            </div>
          </form>
        )}

        <p className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
          Lembrou sua senha?{" "}
          <Link
            href="/login"
            className="text-[var(--liceu-text)] underline decoration-[var(--liceu-muted)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
          >
            Entrar
          </Link>
          .
        </p>
      </div>
    </ReadingLayout>
  );
}