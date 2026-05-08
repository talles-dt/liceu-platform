"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setValidSession(!!session);
    }
    checkSession();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/login?message=Senha atualizada com sucesso");
    } catch {
      setError("Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
      title="Redefinir senha"
      subtitle={validSession === false ? "Link inválido ou expirado." : "Defina uma nova senha."}
    >
      <div className="space-y-8">
        {validSession === false ? (
          <div className="space-y-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5">
            <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              O link de recuperação é inválido ou expirado. Solicite um novo link.
            </p>
            <p className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
              Voltar para{" "}
              <Link
                href="/forgot-password"
                className="text-[var(--liceu-text)] underline decoration-[var(--liceu-muted)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
              >
                recuperar senha
              </Link>
              .
            </p>
          </div>
        ) : validSession === null ? (
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5">
            <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              Verificando...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5"
          >
            <div className="space-y-2">
              <label htmlFor="new-password" className="block font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Nova senha
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Confirmar senha
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55"
              />
              <p className="font-[var(--font-work-sans)] text-[10px] text-[var(--liceu-muted)]">
                Mínimo 6 caracteres.
              </p>
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
                {loading ? "Atualizando..." : "Redefinir senha"}
              </MinimalButton>
            </div>
          </form>
        )}
      </div>
    </ReadingLayout>
  );
}
