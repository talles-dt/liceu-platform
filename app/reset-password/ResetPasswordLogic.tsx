"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ResetPasswordLogic() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsResend, setNeedsResend] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function prepareRecoverySession() {
      // Prevent double-execution on React StrictMode
      if ((window as any).__resetPasswordPrep__) {
        setCheckingSession(false);
        return;
      }
      (window as any).__resetPasswordPrep__ = true;

      const supabase = createSupabaseBrowserClient();
      const code = searchParams.get("code");
      const token = searchParams.get("token");
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashError = hashParams.get("error_description");

      if (hashError) {
        setError(hashError);
        setCheckingSession(false);
        return;
      }

      try {
        if (code) {
          // PKCE flow: Supabase redirects here with ?code=xxx&type=recovery
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Detect known PKCE verifier errors for user-friendly messaging
            const msg = exchangeError.message.toLowerCase();
            if (msg.includes("code verifier") || msg.includes("pkce")) {
              setNeedsResend(true);
              setError(
                "O link de recuperação foi aberto em outro navegador ou modo privado, " +
                "ou os dados temporários foram limpos. Isso faz com que o link fique inválido. " +
                "Solicite um novo link abaixo."
              );
              setCheckingSession(false);
              return;
            }
            throw exchangeError;
          }
        } else if (token) {
          // Legacy implicit flow: token in query string (?token=xxx&type=recovery)
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: hashParams.get("refresh_token") || "",
          });
          if (sessionError) throw sessionError;
        } else {
          // Fallback: tokens in URL hash fragment
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }

        // Remove sensitive tokens from URL for security
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("Abra esta página pelo link de recuperação enviado por email.");
          setNeedsResend(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Link de recuperação inválido ou expirado.";
        setError(msg);
        // If we can't establish a session, offer to resend
        setNeedsResend(true);
      } finally {
        setCheckingSession(false);
      }
    }

    prepareRecoverySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  async function handleSubmit(e: React.FormEvent) {
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

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  // ── RENDER ──

  if (checkingSession) {
    return (
      <ReadingLayout
        eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
        title="REDEFINIR SENHA"
        subtitle="Validando link de recuperação..."
      >
        <div className="border border-stone-200 bg-surface px-5 py-5">
          <p className="text-sm text-muted">Aguarde...</p>
        </div>
      </ReadingLayout>
    );
  }

  // Recovery link was invalid — show resend option
  if (needsResend && error) {
    return (
      <ReadingLayout
        eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
        title="LINK INVÁLIDO"
        subtitle="O link de recuperação não pode ser usado."
      >
        <div className="space-y-5 border border-stone-200 bg-surface/40 px-5 py-5">
          <p className="text-sm text-red-600">{error}</p>
          <div className="border-t border-stone-200/70 pt-5">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="flex items-center gap-2 border border-stone-200 px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:border-stone-400 hover:bg-stone-100"
            >
              ← Solicitar novo link
            </button>
          </div>
        </div>
      </ReadingLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <ReadingLayout
        eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
        title="SENHA ATUALIZADA"
        subtitle="Redefinição concluída"
      >
        <div className="border border-green-200 bg-green-50 px-5 py-5">
          <p className="text-sm text-green-600">Senha redefinida com sucesso. Redirecionando para o login...</p>
        </div>
      </ReadingLayout>
    );
  }

  // Recovery session established — show form
  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO"
      title="REDEFINIR SENHA"
      subtitle="Defina uma nova senha para sua conta."
    >
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
        <div className="flex justify-end border-t border-stone-200/70 pt-5">
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-secondary px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Atualizando..." : "Redefinir senha"}
          </button>
        </div>
      </form>
    </ReadingLayout>
  );
}
