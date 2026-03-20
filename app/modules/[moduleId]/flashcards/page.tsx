"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

type Card = {
  id: string;
  front: string;
  back: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  nextReview: string;
};

type DeckState = "loading" | "error" | "ready" | "done";

const GRADE_LABELS: { grade: number; label: string; note: string }[] = [
  { grade: 0, label: "Bloqueio total", note: "Não lembrei nada" },
  { grade: 1, label: "Errei", note: "Lembrei com dificuldade" },
  { grade: 2, label: "Quase", note: "Lembrei, mas impreciso" },
  { grade: 3, label: "Correto", note: "Com esforço" },
  { grade: 4, label: "Bom", note: "Pequena hesitação" },
  { grade: 5, label: "Perfeito", note: "Imediato e preciso" },
];

export default function FlashcardsPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [state, setState] = useState<DeckState>("loading");
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState<{ grade: number }[]>([]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/modules/${moduleId}/flashcards`);
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = await res.json() as { title: string; cards: Card[] };
      setTitle(data.title);
      setCards(data.cards);
      setIdx(0);
      setFlipped(false);
      setResults([]);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [moduleId]);

  useEffect(() => { load(); }, [load]);

  async function grade(g: number) {
    if (grading || !flipped) return;
    setGrading(true);
    const card = cards[idx];
    try {
      await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: g }),
      });
      setResults((r) => [...r, { grade: g }]);
    } catch {
      // non-fatal — still advance
    }
    setGrading(false);
    if (idx + 1 >= cards.length) {
      setState("done");
    } else {
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  }

  const current = cards[idx];
  const avgGrade =
    results.length > 0
      ? (results.reduce((s, r) => s + r.grade, 0) / results.length).toFixed(1)
      : null;

  if (state === "loading") {
    return (
      <ReadingLayout eyebrow="LICEU / FLASHCARDS" title="Carregando..." subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Buscando conjunto...
        </p>
      </ReadingLayout>
    );
  }

  if (state === "error") {
    return (
      <ReadingLayout eyebrow="LICEU / FLASHCARDS" title="Sem flashcards" subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Nenhum conjunto disponível para este módulo ainda.
        </p>
      </ReadingLayout>
    );
  }

  if (state === "done") {
    const passed = results.filter((r) => r.grade >= 3).length;
    return (
      <ReadingLayout
        eyebrow="LICEU / FLASHCARDS"
        title="Revisão concluída."
        subtitle="O algoritmo registrou seu desempenho."
      >
        <div className="space-y-6">
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  Cartas
                </div>
                <div className="mt-1 font-serif text-2xl text-[var(--liceu-text)]">
                  {cards.length}
                </div>
              </div>
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  Acertos
                </div>
                <div className="mt-1 font-serif text-2xl text-[var(--liceu-accent)]">
                  {passed}
                </div>
              </div>
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  Média
                </div>
                <div className="mt-1 font-serif text-2xl text-[var(--liceu-text)]">
                  {avgGrade}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <MinimalButton onClick={load}>Novo conjunto</MinimalButton>
            <MinimalButton variant="quiet" onClick={() => window.history.back()}>
              Voltar ao módulo
            </MinimalButton>
          </div>
        </div>
      </ReadingLayout>
    );
  }

  return (
    <ReadingLayout
      eyebrow="LICEU / FLASHCARDS"
      title={title}
      subtitle="Avalie com honestidade. O algoritmo ajusta o intervalo."
      right={
        <div className="w-44 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3 space-y-2">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Progresso
          </div>
          <div className="font-serif text-2xl text-[var(--liceu-text)]">
            {idx + 1} / {cards.length}
          </div>
          <div className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
            {results.filter((r) => r.grade >= 3).length} corretas
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Card */}
        <div
          className="min-h-[220px] cursor-pointer border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-6 py-6 transition-colors hover:bg-[var(--liceu-surface)]/60"
          onClick={() => !flipped && setFlipped(true)}
        >
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            {flipped ? "VERSO" : "FRENTE — clique para revelar"}
          </div>
          <p className="mt-4 font-serif text-[17px] leading-[1.85] text-[var(--liceu-text)]">
            {flipped ? current.back : current.front}
          </p>
        </div>

        {/* Grade buttons — only show after flip */}
        {flipped && (
          <div className="space-y-3">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Como foi?
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {GRADE_LABELS.map(({ grade: g, label, note }) => (
                <button
                  key={g}
                  disabled={grading}
                  onClick={() => grade(g)}
                  className={[
                    "border px-3 py-3 text-left transition-colors disabled:opacity-40",
                    g >= 3
                      ? "border-[var(--liceu-accent)]/35 hover:bg-[var(--liceu-accent)]/10"
                      : "border-[var(--liceu-stone)]/70 hover:bg-[var(--liceu-surface)]/40",
                  ].join(" ")}
                >
                  <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                    {g}
                  </div>
                  <div className="mt-1 font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-text)]">
                    {label}
                  </div>
                  <div className="mt-0.5 font-[var(--font-liceu-sans)] text-[10px] text-[var(--liceu-muted)]">
                    {note}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!flipped && (
          <div className="flex justify-end">
            <MinimalButton onClick={() => setFlipped(true)}>
              Revelar
            </MinimalButton>
          </div>
        )}
      </div>
    </ReadingLayout>
  );
}
