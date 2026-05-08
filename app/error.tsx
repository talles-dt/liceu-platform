"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { MinimalButton } from "@/components/MinimalButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--liceu-neutral)] text-[var(--liceu-text)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-secondary)]">
          Erro
        </div>
        <h1 className="mt-4 font-[var(--font-noto-serif)] text-[32px] leading-tight">
          Algo deu errado
        </h1>
        <p className="mt-4 max-w-md font-[var(--font-work-sans)] text-[15px] leading-relaxed text-[var(--liceu-muted)]">
          Ocorreu um erro inesperado. Nossa equipe foi notificada. Tente recarregar a pagina ou volte a pagina inicial.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-[var(--font-space-grotesk)] text-xs tracking-[0.15em] uppercase font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--liceu-accent)] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 border border-[var(--liceu-secondary)] bg-[var(--liceu-surface)] text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] hover:text-[var(--liceu-accent)]"
          >
            Tentar novamente
          </button>
          <Link href="/">
            <MinimalButton variant="quiet">Voltar ao inicio</MinimalButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
