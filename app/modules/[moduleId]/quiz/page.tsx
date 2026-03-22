"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

type Option = { id: string; label: string };
type Question = { id: string; prompt: string; options: Option[] };

type Phase = "loading" | "empty" | "quiz" | "submitted";

export default function QuizPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/modules/${moduleId}/quiz`)
      .then((r) => r.json())
      .then((d: { questions: Question[] }) => {
        if (!d.questions || d.questions.length === 0) { setPhase("empty"); return; }
        setQuestions(d.questions);
        setPhase("quiz");
      })
      .catch(() => setPhase("empty"));
  }, [moduleId]);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  function confirm() {
    if (!selected || !q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: selected }));
    if (isLast) {
      submitQuiz({ ...answers, [q.id]: selected });
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  async function submitQuiz(finalAnswers: Record<string, string>) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      if (!res.ok) { setError("Erro ao enviar."); return; }
      const d = await res.json() as { score: number; correct: number; total: number };
      setResult(d);
      setPhase("submitted");
    } catch { setError("Erro de rede."); }
    finally { setSubmitting(false); }
  }

  function restart() {
    setIdx(0);
    setAnswers({});
    setSelected(null);
    setResult(null);
    setPhase("quiz");
  }

  if (phase === "loading") {
    return (
      <ReadingLayout eyebrow="LICEU UNDERGROUND / QUIZ" title="Carregando..." subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">Buscando perguntas...</p>
      </ReadingLayout>
    );
  }

  if (phase === "empty") {
    return (
      <ReadingLayout eyebrow="LICEU UNDERGROUND / QUIZ" title="Quiz" subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Nenhuma pergunta cadastrada para este módulo ainda.
        </p>
      </ReadingLayout>
    );
  }

  if (phase === "submitted" && result) {
    const passed = result.score >= 70;
    return (
      <ReadingLayout
        eyebrow="LICEU UNDERGROUND / QUIZ"
        title="Resultado."
        subtitle=""
      >
        <div className="space-y-6">
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Score</div>
                <div className={["mt-1 font-serif text-3xl", passed ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-text)]"].join(" ")}>
                  {result.score}%
                </div>
              </div>
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Corretas</div>
                <div className="mt-1 font-serif text-3xl text-[var(--liceu-text)]">{result.correct}/{result.total}</div>
              </div>
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Mínimo</div>
                <div className="mt-1 font-serif text-3xl text-[var(--liceu-muted)]">70%</div>
              </div>
            </div>
            <div className={[
              "font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em]",
              passed ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-muted)]",
            ].join(" ")}>
              {passed ? "Aprovado — módulo desbloqueado" : "Não aprovado — tente novamente"}
            </div>
          </div>
          {!passed && (
            <MinimalButton onClick={restart}>Tentar novamente</MinimalButton>
          )}
          {passed && (
            <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
              Conclua os demais critérios do módulo para avançar.
            </p>
          )}
        </div>
      </ReadingLayout>
    );
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / QUIZ"
      title="Pergunta única. Atenção plena."
      subtitle="Uma questão por vez. Sem barras de progresso. Sem pressa."
      right={
        <div className="w-32 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-3 py-3 text-center">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
            Pergunta
          </div>
          <div className="mt-1 font-serif text-2xl text-[var(--liceu-text)]">
            {idx + 1}/{questions.length}
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="font-serif text-[18px] leading-[1.7] text-[var(--liceu-text)]">
            {q?.prompt}
          </p>
        </section>

        <section className="space-y-2">
          {q?.options.map((opt) => (
            <label
              key={opt.id}
              className={[
                "flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors",
                selected === opt.id
                  ? "border-[var(--liceu-accent)]/55 bg-[var(--liceu-surface)]/60"
                  : "border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 hover:border-[var(--liceu-accent)]/35",
              ].join(" ")}
            >
              <input
                type="radio"
                name="answer"
                value={opt.id}
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
          <div />
          <div className="flex flex-col items-end gap-2">
            {error && <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</p>}
            <MinimalButton onClick={confirm} disabled={!selected || submitting}>
              {submitting ? "Enviando..." : isLast ? "Finalizar" : "Próxima"}
            </MinimalButton>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}
