import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { TypebotEmbed } from "@/components/TypebotEmbed";

export default function DiagnosticoPage() {
  const typebotUrl = process.env.NEXT_PUBLIC_TYPEBOT_URL ?? "";

  return (
    <ReadingLayout
      eyebrow="LICEU / DIAGNÓSTICO"
      title="Diagnóstico técnico gratuito"
      subtitle="Sem palco. Sem truque. Um raio‑x do colapso sob pressão."
    >
      <div className="space-y-12">
        <section className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            Esta é a porta de entrada. Você descreve o contexto, o tipo de
            conflito e os pontos onde sua inteligência falha sob cobrança ao
            vivo. Nós analisamos estrutura — não carisma.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Diagnóstico (Typebot)
            </div>
            <div className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
              Sem truques motivacionais. Avaliação puramente tática.
            </div>
          </div>

          {typebotUrl ? (
            <TypebotEmbed url={typebotUrl} />
          ) : (
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-6 py-6">
              <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
                Falta configurar o Typebot. Defina{" "}
                <span className="font-[var(--font-liceu-mono)] text-[12px] text-[var(--liceu-text)]">
                  NEXT_PUBLIC_TYPEBOT_URL
                </span>{" "}
                com o link do seu diagnóstico.
              </p>
            </div>
          )}
        </section>

        <section className="border-t border-[var(--liceu-stone)]/70 pt-8">
          <div className="flex flex-wrap gap-3">
            <Link href="/metodo">
              <MinimalButton variant="quiet">Ver método</MinimalButton>
            </Link>
            <Link href="/programa">
              <MinimalButton variant="quiet">Ver programa</MinimalButton>
            </Link>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

