"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing token");
      return;
    }

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
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(token, {
        password: newPassword,
      });
      if (error) throw new Error(error.message);
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
      {success ? (
        <div className="border border-stone-200 bg-surface px-5 py-5">
          <p className="text-sm text-muted">Redirecionando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 border border-stone-200 bg-surface/40 px-5 py-5">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-muted">Nova senha</label>
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
            <label className="block text-xs uppercase tracking-widest text-muted">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-sm border border-stone-200 bg-neutral px-3 py-2 text-sm"
            />
          </div>
          {error && <div className="bg-neutral px-3 py-2 text-xs text-red-500">{error}</div>}
          <div className="flex justify-end pt-5">
            <MinimalButton type="submit" disabled={loading}>
              {loading ? "Atualizando..." : "Redefinir senha"}
            </MinimalButton>
          </div>
        </form>
      )}
    </ReadingLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={(
      <ReadingLayout eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO" title="Carregando...">
        <div className="border border-stone-200 bg-surface px-5 py-5">
          <p className="text-sm text-muted">Carregando interface...</p>
        </div>
      </ReadingLayout>
    )}>
      <ResetPasswordContent />
    </Suspense>
  );
}