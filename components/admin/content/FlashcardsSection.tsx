"use client";

import { useState } from "react";
import { Input } from "./shared";

type CardRow = { id: string; front: string; back: string; order_index: number };
type SetRow = { id: string; title: string; flashcards: CardRow[] };

export function FlashcardsSection({ moduleId }: { moduleId: string }) {
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);
  const [error, setError] = useState("");

  // New card state per set
  const [newCards, setNewCards] = useState<Record<string, { front: string; back: string }>>({});

  async function loadSets() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/flashcard-sets/${moduleId}`);
      if (res.ok) { const d = await res.json(); setSets(d.sets ?? []); setLoaded(true); }
    } catch { setError("Erro ao carregar."); }
    finally { setLoading(false); }
  }

  async function createSet() {
    if (!newSetTitle.trim()) return;
    setCreatingSet(true);
    try {
      const res = await fetch(`/api/admin/content/flashcard-sets/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSetTitle }),
      });
      if (res.ok) {
        const d = await res.json();
        setSets((prev) => [...prev, { ...d.set, flashcards: [] }]);
        setNewSetTitle("");
      }
    } catch { setError("Erro ao criar."); }
    finally { setCreatingSet(false); }
  }

  async function addCard(setId: string) {
    const card = newCards[setId];
    if (!card?.front || !card?.back) return;
    try {
      const res = await fetch(`/api/admin/content/flashcards/${setId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: card.front, back: card.back, order_index: sets.find(s => s.id === setId)?.flashcards.length ?? 0 }),
      });
      if (res.ok) {
        const d = await res.json();
        setSets((prev) => prev.map((s) => s.id === setId
          ? { ...s, flashcards: [...s.flashcards, d.card] }
          : s));
        setNewCards((prev) => ({ ...prev, [setId]: { front: "", back: "" } }));
      }
    } catch { setError("Erro ao adicionar carta."); }
  }

  async function deleteCard(setId: string, cardId: string) {
    try {
      await fetch(`/api/admin/content/flashcards/${setId}/cards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: cardId }),
      });
      setSets((prev) => prev.map((s) => s.id === setId
        ? { ...s, flashcards: s.flashcards.filter((c) => c.id !== cardId) }
        : s));
    } catch { setError("Erro ao deletar."); }
  }

  if (!loaded) {
    return (
      <button
        onClick={loadSets}
        disabled={loading}
        className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
      >
        {loading ? "Carregando..." : "Carregar flashcards"}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</p>}

      {/* Create new set */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Novo conjunto" value={newSetTitle} onChange={setNewSetTitle} placeholder="ex: Conjunto A — Inventio" />
        </div>
        <button
          onClick={createSet}
          disabled={creatingSet || !newSetTitle.trim()}
          className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
        >
          {creatingSet ? "..." : "Criar"}
        </button>
      </div>

      {sets.length === 0 && (
        <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
          Nenhum conjunto criado ainda.
        </p>
      )}

      {/* Each set */}
      {sets.map((set) => {
        const nc = newCards[set.id] ?? { front: "", back: "" };
        return (
          <div key={set.id} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
            <div className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
              <div className="font-serif text-[15px] text-[var(--liceu-text)]">{set.title}</div>
              <div className="font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)] mt-0.5">
                {set.flashcards.length} cartas
              </div>
            </div>

            {/* Existing cards */}
            {set.flashcards.length > 0 && (
              <div className="divide-y divide-[var(--liceu-stone)]/50">
                {set.flashcards.map((card) => (
                  <div key={card.id} className="flex items-start gap-4 px-4 py-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)] mb-1">Frente</div>
                        <p className="font-serif text-[12px] leading-snug text-[var(--liceu-text)]">{card.front}</p>
                      </div>
                      <div>
                        <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)] mb-1">Verso</div>
                        <p className="font-serif text-[12px] leading-snug text-[var(--liceu-muted)]">{card.back}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCard(set.id, card.id)}
                      className="shrink-0 font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new card */}
            <div className="border-t border-[var(--liceu-stone)]/70 px-4 py-4 space-y-3">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                Nova carta
              </div>
              <div className="grid grid-cols-2 gap-3">
                <textarea rows={2} value={nc.front}
                  onChange={(e) => setNewCards((p) => ({ ...p, [set.id]: { ...nc, front: e.target.value } }))}
                  placeholder="Frente..."
                  className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-serif text-[12px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none resize-none"
                />
                <textarea rows={2} value={nc.back}
                  onChange={(e) => setNewCards((p) => ({ ...p, [set.id]: { ...nc, back: e.target.value } }))}
                  placeholder="Verso..."
                  className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-serif text-[12px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={() => addCard(set.id)}
                disabled={!nc.front || !nc.back}
                className="border border-[var(--liceu-stone)] px-3 py-1.5 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
              >
                Adicionar carta
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
