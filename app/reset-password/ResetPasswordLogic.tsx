"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ResetPasswordLogic() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepareRecoverySession() {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashError = hashParams.get("error_description");

      if (hashError) {
        setError(hashError);
        setCheckingSession(false);
        return;
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          window.history.replaceState({}, document.title, url.pathname);
        } else {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            window.history.replaceState({}, document.title, url.pathname);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("Abra esta página pelo link de recuperação enviado por email.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Link de recuperação inválido ou expirado.");
      } finally {
        setCheckingSession(false);
      }
    }

    prepareRecoverySession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
      title="REDEFINIR SENHA"
      subtitle={success ? "Senha atualizada!" : "Defina uma nova senha"}
    >
      {checkingSession ? (
        <div className="border border-stone-200 bg-surface px-5 py-5">
          <p className="text-sm text-muted">Validando link de recuperação...</p>
        </div>
      ) : success ? (
        <div className="border border-green-200 bg-green-50 px-5 py-5">
          <p className="text-sm text-green-600">Redirecionando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 border border-stone-200 bg-surface/40 px-5 py-5">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-muted">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-sm border border-stone-200 bg-neutral px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-muted">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-sm border border-stone-200 bg-neutral px-3 py-2 text-sm"
            />
          </div>
          {error && <div className="bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
          <div className="flex justify-end pt-5">
            <button type="submit" disabled={loading} className="rounded-sm bg-secondary px-4 py-2 text-sm text-white disabled:opacity-50">
              {loading ? "Atualizando..." : "Redefinir senha"}
            </button>
          </div>
        </form>
      )}
    </ReadingLayout>
  );
}
