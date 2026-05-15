"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
const Spinner = () => (
  <div className="animate-spin inline-block w-6 h-6 border-stone-400 border-b-transparent rounded-full"></div>
);

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"loading" | "form" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [weakness, setWeakness] = useState({
    length: false,
    uppercase: false,
    symbol: false,
  });

  // Extract code from query params
  useEffect(() => {
    const codeParam = searchParams.code;
    if (!codeParam) {
      setError("Link inválido. Solicite um novo link de recuperação.");
      setState("error");
      return;
    }
    setCode(codeParam);
    verifyCode(codeParam);
  }, [searchParams.code]);

  // Verify code with Supabase
  async function verifyCode(token: string) {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      email: "", // Supabase now requires email for recovery OTP
      token,
    });
    if (error) {
      setError("Link expirado ou inválido. Solicite um novo link.");
      setState("error");
    } else {
      setState("form");
    }
  }

  // Password strength validation
  useEffect(() => {
    if (state !== "form") return;
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+{};':\"\\|,.<>?~-]/.test(password);
    setWeakness({
      length: !minLength,
      uppercase: !hasUppercase,
      symbol: !hasSymbol,
    });
  }, [password, state]);

  // Form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não correspondem.");
      setState("error");
      return;
    }
    if (Object.values(weakness).some(Boolean)) {
      setError("Senha não atende aos requisitos.");
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      setState("success");
      setTimeout(() => router.push("/account" as never), 3000);
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.");
      setState("error");
    }
  }

  // Render states
  if (state === "loading") {
    return (
      <ReadingLayout title="Validando link...">
        <Spinner />
      </ReadingLayout>
    );
  }

  if (state === "error") {
    return (
      <ReadingLayout title="Erro">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push("/forgot-password")}
          className="text-xs uppercase bg-stone-800 text-white px-3 py-2 mt-6"
        >
          Solicitar novo link
        </button>
      </ReadingLayout>
    );
  }

  if (state === "success") {
    return (
      <ReadingLayout title="Senha redefinida">
        <p>Sua senha foi atualizada. Redirecionando...</p>
      </ReadingLayout>
    );
  }

  // Form state
  return (
    <ReadingLayout title="Redefinir senha">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nova senha"
          className="w-full border border-stone-300 px-3 py-2"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirme a nova senha"
          className="w-full border border-stone-300 px-3 py-2"
          required
        />

        {/* Weakness hints */}
        <div className="space-y-1 text-xs text-muted">
          <p className={weakness.length ? "text-red-500" : "text-green-600"}>
            {weakness.length ? "✗ Mínimo 8 caracteres" : "✓ Mínimo 8 caracteres"}
          </p>
          <p className={weakness.uppercase ? "text-red-500" : "text-green-600"}>
            {weakness.uppercase ? "✗ Pelo menos 1 letra maiúscula" : "✓ 1 letra maiúscula"}
          </p>
          <p className={weakness.symbol ? "text-red-500" : "text-green-600"}>
            {weakness.symbol ? "✗ Pelo menos 1 símbolo (!@#$%)" : "✓ 1 símbolo"}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-stone-900 text-white py-2 uppercase tracking-wider"
        >
          Atualizar senha
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </ReadingLayout>
  );
}