"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

const verifyCode = async (code: string) => {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "recovery",
    email: "", // Supabase now requires email for recovery OTP
    token: code,
  });
  return error;
};


export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  const params = useSearchParams();
  const code = params.get("code");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [codeVerified, setCodeVerified] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAndVerify() {
      const supabase = createSupabaseBrowserClient();
      let sessionExists = false;

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      sessionExists = !!session;

      if (sessionExists) {
        setValidSession(true);
        return;
      }

      // If no session but code exists, verify it
      if (code) {
        const verifyError = await verifyCode(code);
        if (verifyError) {
          console.log("[reset-password] verification failed:", verifyError);
          setValidSession(false); // Code is invalid
        } else {
          setCodeVerified(true);
          setValidSession(true); // Code is valid
        }
      } else {
        setValidSession(false); // No code provided
      }
    }

    checkAndVerify();
  }, [code]);

  useEffect(() => {
    async function checkAndVerify() {
      const supabase = createSupabaseBrowserClient();
      let sessionExists = false;

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      sessionExists = !!session;

      if (sessionExists) {
        setValidSession(true);
        return;
      }

      // If no session but code exists, verify it
      if (code) {
        const verifyError = await verifyCode(code);
        if (verifyError) {
          console.log("[reset-password] verification failed:", verifyError);
          setValidSession(false); // Code is invalid
        } else {
          setCodeVerified(true);
          setValidSession(true); // Code is valid
        }
      } else {
        setValidSession(false); // No code provided
      }
    }

    checkAndVerify();
  }, [code]);

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
      let userError = null;
      if (code && !codeVerified) {
        // Verify code again if needed
        const verifyError = await verifyCode(code);
        if (verifyError) throw new Error(verifyError.message);
      }
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      router.push("/login?message=Senha atualizada com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
      title="Redefinir senha"
      subtitle={validSession === false ? "Link inválido ou expirado." : codeVerified ? "Defina uma nova senha." : "Verificando link..."}
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
