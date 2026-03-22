"use client";

import { useEffect, useState } from "react";
import { MinimalButton } from "@/components/MinimalButton";

type Option = { id: string; label: string };
type Question = { id: string; prompt: string; options: Option[] };

type Props = {
  lessonId: string;
  alreadyCompleted: boolean;
};

export function LessonQuiz({ lessonId, alreadyCompleted }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    total: number;
    passed: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/quiz`)
      .then((r) => r.json())
      .then((d: { questions: Question[] }) => {
        setQuestions(d.questions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  async function submit() {
    if (Object.keys(answers).length < questions.length) {
      setError("Responda todas as perguntas antes de enviar.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const d = await res.json() as { score: number; correct: number; total: number; passed: boolean };
      setResult(d);
    } catch {
      setError("Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setError("");
  }

  if (alreadyCompleted) {
    return (
      <div className="border border-[var(--liceu-accent)]/30 bg-[var(--liceu-surface)]/25 px-4 py-3">
        <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
          Lição concluída
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
        Carregando perguntas...
      </p>
    );
  }

  if (questions.length === 0) return null;

  if (result) {
    return (
      <div className="space-y-4">
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Score</div>
              <div className={["mt-1 font-serif text-2xl", result.passed ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-text)]"].join(" ")}>
                {result.score}%
              </div>
            </div>
            <div>
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Corretas</div>
              <div className="mt-1 font-serif text-2xl text-[var(--liceu-text)]">
                {result.correct}/{result.total}
              </div>
            </div>
            <div>
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Mínimo</div>
              <div className="mt-1 font-serif text-2xl text-[var(--liceu-muted)]">70%</div>
            </div>
          </div>
          <div className={[
            "font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em]",
            result.passed ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-muted)]",
          ].join(" ")}>
            {result.passed ? "Aprovado — lição concluída" : "Não aprovado — revise o conteúdo"}
          </div>
        </div>
        {!result.passed && (
          <MinimalButton variant="quiet" onClick={retry}>
            Tentar novamente
          </MinimalButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-3">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
            {i + 1} / {questions.length}
          </div>
          <p className="font-serif text-[16px] leading-[1.7] text-[var(--liceu-text)]">
            {q.prompt}
          </p>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className={[
                  "flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors",
                  answers[q.id] === opt.id
                    ? "border-[var(--liceu-accent)]/55 bg-[var(--liceu-surface)]/60"
                    : "border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 hover:border-[var(--liceu-accent)]/35",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                  className="mt-1 h-3 w-3 accent-[var(--liceu-accent)]"
                />
                <span className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-text)]">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 border-t border-[var(--liceu-stone)]/70 pt-4">
        <MinimalButton
          onClick={submit}
          disabled={submitting || Object.keys(answers).length < questions.length}
        >
          {submitting ? "Enviando..." : "Enviar respostas"}
        </MinimalButton>
        {error && (
          <span className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
