import Link from "next/link";
import { MinimalButton } from "@/components/MinimalButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--liceu-neutral)] text-[var(--liceu-text)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="font-[var(--font-space-grotesk)] text-[72px] font-bold leading-none tracking-[-0.04em] text-[var(--liceu-secondary)] select-none">
          404
        </div>
        <div className="mt-6 h-px w-16 bg-[var(--liceu-secondary)]/30" />
        <h1 className="mt-6 font-[var(--font-noto-serif)] text-[32px] leading-tight">
          Página não encontrada
        </h1>
        <p className="mt-4 max-w-md font-[var(--font-work-sans)] text-[15px] leading-relaxed text-[var(--liceu-muted)]">
          O conteúdo que você procura não existe ou foi removido. Verifique o endereço ou volte à página inicial.
        </p>
        <div className="mt-8">
          <Link href="/">
            <MinimalButton variant="primary">Voltar ao início</MinimalButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
