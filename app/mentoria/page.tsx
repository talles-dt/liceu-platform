import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { PurchaseButton } from "@/components/PurchaseButton";

export default function MentoriaPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / MENTORIA"
      title="Mentoria seletiva. Correção real."
      subtitle="1:1. Seis sessões. Vagas limitadas."
    >
      <div className="space-y-12">
        <section className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            A mentoria não é conversa inspiracional. É correção técnica.
            Linguagem, estrutura, corte, refutação e presença intelectual.
          </p>
        </section>

        <section className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Formato
          </div>
          <ul className="list-disc space-y-2 pl-5 font-serif text-[15px] leading-[1.9] text-[var(--liceu-text)]">
            <li>1:1 sessões</li>
            <li>6 sessões</li>
            <li>Exige conclusão do módulo correspondente</li>
            <li>Vagas limitadas</li>
          </ul>
        </section>

        <section className="space-y-4 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-6 py-6">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Lista de espera
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            Quando as vagas estiverem preenchidas, você entra numa lista de
            espera. O objetivo é manter qualidade — não escala.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/diagnostico">
              <MinimalButton>Entrar via diagnóstico</MinimalButton>
            </Link>
            <Link href="/login">
              <MinimalButton variant="quiet">Login</MinimalButton>
            </Link>
            <PurchaseButton kind="mentoring">Comprar mentoria</PurchaseButton>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

