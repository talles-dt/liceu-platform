"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ReadingLayout } from "@/components/ReadingLayout";

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  if (!token) {
    return (
      <div className="border border-red-200 bg-red-50 px-5 py-5">
        <p className="text-sm text-red-600">Missing token. Request a new recovery link.</p>
      </div>
    );
  }

  const tokenString = token as string;

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
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(tokenString, {
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