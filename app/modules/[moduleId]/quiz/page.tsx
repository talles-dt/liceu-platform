"use client";

import { useMemo, useState } from "react";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

type Question = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

// Placeholder: replace with DB-backed questions later.
const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "Qual é a função do ethos?",
    options: [
      { id: "a", label: "emoção" },
      { id: "b", label: "credibilidade" },
      { id: "c", label: "prova lógica" },
    ],
    correctOptionId: "b",
  },
];

export default function QuizPage() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const q = QUESTIONS[idx];
  const isLast = idx === QUESTIONS.length - 1;

  const score = useMemo(() => {
    if (QUESTIONS.length === 0) return 0;
    return Math.round((correctCount / QUESTIONS.length) * 100);
  }, [correctCount]);

  function submit() {
    if (!selected || submitted) return;
    const isCorrect = selected === q.correctOptionId;
    if (isCorrect) setCorrectCount((c) => c + 1);
    setSubmitted(true);
  }

  function next() {
    if (!submitted) return;
    setSelected(null);
    setSubmitted(false);
    setIdx((i) => Math.min(i + 1, QUESTIONS.length - 1));
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / QUIZ"
      title="Pergunta única. Atenção plena."
      subtitle="Uma questão por vez. Sem barras de progresso. Sem pressa."
    >
      {QUESTIONS.length === 0 ? (
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Nenhuma pergunta cadastrada.
        </p>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Pergunta {idx + 1}
            </div>
            <p className="font-serif text-[18px] leading-[1.7] text-[var(--liceu-text)]">
              {q.prompt}
            </p>
          </section>

          <section className="space-y-2">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3",
                  "border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/55",
                  "hover:border-[var(--liceu-accent)]/35",
                  submitted && selected === opt.id
                    ? "border-[var(--liceu-accent)]/55"
                    : "",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="answer"
                  value={opt.id}
                  disabled={submitted}
                  checked={selected === opt.id}
                  onChange={() => setSelected(opt.id)}
                  className="mt-1 h-3 w-3 accent-[var(--liceu-accent)]"
                />
                <span className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-text)]">
                  {opt.label}
                </span>
              </label>
            ))}
          </section>

          <section className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6">
            <div className="font-[var(--font-liceu-mono)] text-[11px] tracking-[0.22em] text-[var(--liceu-muted)]">
              {submitted ? `SCORE ${score}%` : "—"}
            </div>

            <div className="flex gap-3">
              {!submitted ? (
                <MinimalButton onClick={submit} disabled={!selected}>
                  Enviar
                </MinimalButton>
              ) : (
                <MinimalButton onClick={next} disabled={isLast}>
                  Próxima
                </MinimalButton>
              )}
            </div>
          </section>

          {submitted && isLast && (
            <section className="space-y-3">
              <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-3">
                <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  Resultado
                </div>
                <div className="mt-2 font-serif text-2xl text-[var(--liceu-text)]">
                  {score}%
                </div>
                <p className="mt-2 font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
                  Regra: nota mínima 70%. Tentativas ilimitadas. Nova tentativa
                  exige revisão do módulo (a ser automatizado).
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </ReadingLayout>
  );
}

