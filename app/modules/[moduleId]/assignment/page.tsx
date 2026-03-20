"use client";

import { useMemo, useState } from "react";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { WritingArea } from "@/components/WritingArea";

export default function AssignmentPage() {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const wordCount = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [text]);

  async function submit() {
    setSubmitting(true);
    try {
      // Placeholder: wire to an assignment submission API + OpenAI evaluation later.
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / PRODUÇÃO"
      title="Escrita. Sem distração."
      subtitle="Estrutura lógica, clareza, evidência, estilo. Escreva como quem treina."
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Instrução
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            Redija um texto argumentativo curto (400–800 palavras) defendendo uma
            tese clara, com pelo menos duas razões e um contra-argumento
            respondido.
          </p>
        </section>

        <WritingArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Comece aqui. Frases completas. Rigor. Sem pressa."
        />

        <section className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6">
          <div className="font-[var(--font-liceu-mono)] text-[11px] tracking-[0.22em] text-[var(--liceu-muted)]">
            {wordCount} palavras
          </div>
          <div className="flex gap-3">
            <MinimalButton
              variant="quiet"
              type="button"
              onClick={() => setText("")}
              disabled={!text || submitting}
            >
              Limpar
            </MinimalButton>
            <MinimalButton
              type="button"
              onClick={submit}
              disabled={text.trim().length < 50 || submitting}
            >
              Enviar
            </MinimalButton>
          </div>
        </section>

        <p className="font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
          Correção: IA baseada em obras clássicas + revisão humana final (a
          integração será adicionada em seguida).
        </p>
      </div>
    </ReadingLayout>
  );
}

