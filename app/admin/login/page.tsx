"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { adminLoginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "flex items-center gap-2 border px-4 py-2 text-xs uppercase tracking-widest",
        "transition-colors",
        pending
          ? "border-stone-600 text-stone-600 cursor-not-allowed"
          : "border-stone-200 hover:border-stone-400 hover:bg-stone-100",
      ].join(" ")}
    >
      {pending ? "Verificando..." : "Entrar"}
    </button>
  );
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [state, formAction] = useFormState(adminLoginAction, null);
  const [urlError, setUrlError] = useState<string | null>(null);
  // Track submission to distinguish initial null from success-returned null
  const wasSubmitted = useRef(false);

  useEffect(() => {
    searchParams.then((p) => {
      if (p.error) setUrlError(p.error);
    });
  }, [searchParams]);

  // Success = state went from non-null (or initial) to null after submission
  useEffect(() => {
    if (state === null && wasSubmitted.current) {
      window.location.href = "/admin";
    }
    if (state !== null) {
      wasSubmitted.current = true;
    }
  }, [state]);

  const displayError = state?.error || urlError;

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">
            Liceu Underground
          </div>
          <h1 className="mt-2 font-serif text-2xl italic tracking-tight">Admin Access</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-stone-500">
            Restricted — operators only
          </p>
        </div>

        {/* Form */}
        <form
          action={formAction}
          className="space-y-5 border border-stone-200 bg-stone-50 p-6"
        >
          <div className="space-y-1">
            <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full border border-stone-200 bg-white px-3 py-2 text-sm placeholder-stone-300 focus:border-stone-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full border border-stone-200 bg-white px-3 py-2 text-sm placeholder-stone-300 focus:border-stone-400 focus:outline-none"
            />
          </div>

          {displayError && (
            <div className="bg-red-50 border border-red-200 px-3 py-2">
              <p className="font-mono text-[11px] text-red-600">{displayError}</p>
            </div>
          )}

          <div className="flex justify-end border-t border-stone-200 pt-4">
            <SubmitButton />
          </div>
        </form>

        <p className="mt-4 text-center font-mono text-[10px] text-stone-400">
          <a href="/login" className="underline hover:text-stone-600">
            ← Voltar ao login normal
          </a>
        </p>
      </div>
    </div>
  );
}