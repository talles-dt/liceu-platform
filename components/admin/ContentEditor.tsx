"use client";

import { useState } from "react";

type CardRow = { id: string; front: string; back: string; order_index: number };
type SetRow = { id: string; title: string; flashcards: CardRow[] };

type ModuleData = {
  id: string;
  title: string;
  order_index: number;
  assignment: { assignment_prompt: string; speech_prompt: string } | null;
  text: { title: string; author: string | null; content: string } | null;
};

// ─── Field ───────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full resize-y border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]",
          "px-3 py-2 text-[13px] leading-[1.7] text-[var(--liceu-text)]",
          "placeholder:text-[var(--liceu-muted)]/50 focus:outline-none focus:border-[var(--liceu-accent)]/50",
          mono ? "font-[var(--font-liceu-mono)]" : "font-serif",
        ].join(" ")}
      />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none focus:border-[var(--liceu-accent)]/50"
      />
    </div>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={[
        "border px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] transition-colors disabled:opacity-40",
        saved
          ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
          : "border-[var(--liceu-stone)] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)]/40",
      ].join(" ")}
    >
      {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
    </button>
  );
}

// ─── Prompts section ─────────────────────────────────────────────────────────

function PromptsSection({ moduleId, initial }: {
  moduleId: string;
  initial: { assignment_prompt: string; speech_prompt: string } | null;
}) {
  const [assignmentPrompt, setAssignmentPrompt] = useState(initial?.assignment_prompt ?? "");
  const [speechPrompt, setSpeechPrompt] = useState(initial?.speech_prompt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError(""); setSaving(true); setSaved(false);
    try {
      const res = await fetch("/api/admin/content/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, assignment_prompt: assignmentPrompt, speech_prompt: speechPrompt }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Erro de rede."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <Field label="Exercício retórico — instrução" value={assignmentPrompt} onChange={setAssignmentPrompt} rows={5}
        placeholder="Redija um texto argumentativo (400–800 palavras)..." />
      <Field label="Micro discurso — instrução" value={speechPrompt} onChange={setSpeechPrompt} rows={4}
        placeholder="Construa um micro discurso de 150–400 palavras..." />
      <div className="flex items-center gap-3">
        <SaveButton onClick={save} saving={saving} saved={saved} />
        {error && <span className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</span>}
      </div>
    </div>
  );
}

// ─── Text section ─────────────────────────────────────────────────────────────

function TextSection({ moduleId, initial }: {
  moduleId: string;
  initial: { title: string; author: string | null; content: string } | null;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError(""); setSaving(true); setSaved(false);
    if (!title || !content) { setError("Título e conteúdo obrigatórios."); setSaving(false); return; }
    try {
      const res = await fetch("/api/admin/content/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, title, author: author || null, content }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Erro de rede."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <Input label="Título do texto" value={title} onChange={setTitle} placeholder="Pro Archia Poeta" />
      <Input label="Autor (opcional)" value={author} onChange={setAuthor} placeholder="Cícero" />
      <Field label="Conteúdo" value={content} onChange={setContent} rows={12}
        placeholder="Cole o texto clássico aqui..." />
      <div className="flex items-center gap-3">
        <SaveButton onClick={save} saving={saving} saved={saved} />
        {error && <span className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</span>}
      </div>
    </div>
  );
}

// ─── Flashcards section ───────────────────────────────────────────────────────

function FlashcardsSection({ moduleId }: { moduleId: string }) {
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

// ─── Lições section ───────────────────────────────────────────────────────────

type LessonRow = {
  id: string;
  title: string;
  content: string | null;
  cloudflare_stream_id: string | null;
  order_index: number;
};

function LicoesSection({ moduleId }: { moduleId: string }) {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { content: string; streamId: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadLessons() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/lessons/${moduleId}`);
      if (res.ok) {
        const d = await res.json() as { lessons: LessonRow[] };
        setLessons(d.lessons ?? []);
        // Init drafts with current values
        const initial: Record<string, { content: string; streamId: string }> = {};
        for (const l of d.lessons ?? []) {
          initial[l.id] = {
            content: l.content ?? "",
            streamId: l.cloudflare_stream_id ?? "",
          };
        }
        setDrafts(initial);
        setLoaded(true);
      }
    } catch { setError("Erro ao carregar."); }
    finally { setLoading(false); }
  }

  async function saveLesson(lessonId: string) {
    const draft = drafts[lessonId];
    if (!draft) return;
    setSaving(lessonId); setError("");
    try {
      const res = await fetch(`/api/admin/content/lessons/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          content: draft.content,
          cloudflare_stream_id: draft.streamId,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
      setSaved(lessonId);
      setEditingId(null);
      setTimeout(() => setSaved(null), 3000);
    } catch { setError("Erro de rede."); }
    finally { setSaving(null); }
  }

  if (!loaded) {
    return (
      <button
        onClick={loadLessons}
        disabled={loading}
        className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
      >
        {loading ? "Carregando..." : "Carregar lições"}
      </button>
    );
  }

  if (lessons.length === 0) {
    return (
      <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
        Nenhuma lição cadastrada para este módulo. Adicione lições via seed ou Supabase.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</p>}

      {lessons.map((lesson) => {
        const draft = drafts[lesson.id] ?? { content: "", streamId: "" };
        const isEditing = editingId === lesson.id;
        const isSaving = saving === lesson.id;
        const isSaved = saved === lesson.id;
        const hasContent = !!lesson.content;
        const hasVideo = !!lesson.cloudflare_stream_id;

        return (
          <div key={lesson.id} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
            {/* Lesson header */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--liceu-stone)]/70 px-4 py-3">
              <div className="space-y-0.5">
                <div className="font-serif text-[14px] text-[var(--liceu-text)]">
                  {lesson.order_index + 1}. {lesson.title}
                </div>
                <div className="flex gap-3">
                  {hasContent && (
                    <span className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-accent)]/70">
                      Texto
                    </span>
                  )}
                  {hasVideo && (
                    <span className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-accent)]/70">
                      Vídeo
                    </span>
                  )}
                  {!hasContent && !hasVideo && (
                    <span className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]/50">
                      Sem conteúdo
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditingId(isEditing ? null : lesson.id)}
                className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              >
                {isEditing ? "Fechar" : "Editar"}
              </button>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div className="px-4 py-5 space-y-4">
                <Input
                  label="Cloudflare Stream Video ID"
                  value={draft.streamId}
                  onChange={(v) => setDrafts((p) => ({ ...p, [lesson.id]: { ...draft, streamId: v } }))}
                  placeholder="ex: abc123def456..."
                />
                <Field
                  label="Conteúdo da lição (Markdown)"
                  value={draft.content}
                  onChange={(v) => setDrafts((p) => ({ ...p, [lesson.id]: { ...draft, content: v } }))}
                  rows={16}
                  placeholder="## Título da seção&#10;&#10;Conteúdo do capítulo em markdown..."
                  mono={false}
                />
                <div className="flex items-center gap-3">
                  <SaveButton
                    onClick={() => saveLesson(lesson.id)}
                    saving={isSaving}
                    saved={isSaved}
                  />
                  {error && (
                    <span className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                      {error}
                    </span>
                  )}
                </div>
                <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  O Stream ID é o identificador do vídeo no painel da Cloudflare Stream — não a URL completa.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Quiz section ─────────────────────────────────────────────────────────────

type QuestionRow = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correct_option_id: string;
  order_index: number;
};

function QuizSection({ moduleId }: { moduleId: string }) {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New question form state
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState([
    { id: "a", label: "" },
    { id: "b", label: "" },
    { id: "c", label: "" },
  ]);
  const [correctId, setCorrectId] = useState("a");
  const [adding, setAdding] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/quiz/${moduleId}`);
      if (res.ok) { const d = await res.json(); setQuestions(d.questions ?? []); setLoaded(true); }
    } catch { setError("Erro ao carregar."); }
    finally { setLoading(false); }
  }

  async function addQuestion() {
    const validOptions = options.filter((o) => o.label.trim());
    if (!prompt.trim() || validOptions.length < 2) {
      setError("Pergunta e pelo menos 2 opções obrigatórias.");
      return;
    }
    setAdding(true); setError("");
    try {
      const res = await fetch(`/api/admin/content/quiz/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          options: validOptions,
          correct_option_id: correctId,
          order_index: questions.length,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setQuestions((prev) => [...prev, d.question]);
        setPrompt("");
        setOptions([{ id: "a", label: "" }, { id: "b", label: "" }, { id: "c", label: "" }]);
        setCorrectId("a");
      } else { const d = await res.json(); setError(d.error ?? "Erro"); }
    } catch { setError("Erro de rede."); }
    finally { setAdding(false); }
  }

  async function deleteQuestion(qId: string) {
    try {
      await fetch(`/api/admin/content/quiz/${moduleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: qId }),
      });
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
    } catch { setError("Erro ao deletar."); }
  }

  if (!loaded) {
    return (
      <button
        onClick={loadQuestions}
        disabled={loading}
        className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
      >
        {loading ? "Carregando..." : "Carregar perguntas"}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</p>}

      {/* Existing questions */}
      {questions.length === 0 ? (
        <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">Nenhuma pergunta ainda.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                    Pergunta {i + 1}
                  </div>
                  <p className="font-serif text-[14px] text-[var(--liceu-text)]">{q.prompt}</p>
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className={[
                          "font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em]",
                          opt.id === q.correct_option_id ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-muted)]",
                        ].join(" ")}>
                          {opt.id === q.correct_option_id ? "✓" : "○"}
                        </span>
                        <span className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="shrink-0 font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new question */}
      <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/10 px-4 py-5 space-y-4">
        <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
          Nova pergunta
        </div>
        <Field label="Pergunta" value={prompt} onChange={setPrompt} rows={2} placeholder="Qual é a função do ethos?" />

        <div className="space-y-2">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
            Opções — marque a correta
          </div>
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-3">
              <input
                type="radio"
                name={`correct-${moduleId}`}
                checked={correctId === opt.id}
                onChange={() => setCorrectId(opt.id)}
                className="h-3 w-3 accent-[var(--liceu-accent)]"
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? { ...o, label: e.target.value } : o))}
                placeholder={`Opção ${opt.id.toUpperCase()}`}
                className="flex-1 border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-1.5 font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => setOptions((prev) => [...prev, { id: String.fromCharCode(97 + prev.length), label: "" }])}
            className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.18em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
          >
            + Adicionar opção
          </button>
        </div>

        <button
          onClick={addQuestion}
          disabled={adding}
          className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
        >
          {adding ? "Adicionando..." : "Adicionar pergunta"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "licoes" | "prompts" | "text" | "flashcards" | "quiz";

function ModuleEditor({ module }: { module: ModuleData }) {
  const [tab, setTab] = useState<Tab>("prompts");

  const tabs: { key: Tab; label: string }[] = [
    { key: "licoes", label: "Lições" },
    { key: "prompts", label: "Exercícios" },
    { key: "text", label: "Texto clássico" },
    { key: "flashcards", label: "Flashcards" },
    { key: "quiz", label: "Quiz" },
  ];

  return (
    <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--liceu-stone)]/70">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-3 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] transition-colors",
              tab === t.key
                ? "text-[var(--liceu-text)] border-b-2 border-[var(--liceu-accent)]/60 -mb-px"
                : "text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "licoes" && (
          <LicoesSection moduleId={module.id} />
        )}
        {tab === "prompts" && (
          <PromptsSection moduleId={module.id} initial={module.assignment} />
        )}
        {tab === "text" && (
          <TextSection moduleId={module.id} initial={module.text} />
        )}
        {tab === "flashcards" && (
          <FlashcardsSection moduleId={module.id} />
        )}
        {tab === "quiz" && (
          <QuizSection moduleId={module.id} />
        )}
      </div>
    </div>
  );
}

export function ContentEditor({ modules }: { modules: ModuleData[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    modules[0]?.id ?? null,
  );

  const selected = modules.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      {/* Module list sidebar */}
      <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
        <div className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Módulos
          </div>
        </div>
        <nav>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={[
                "w-full px-4 py-3 text-left border-b border-[var(--liceu-stone)]/50 last:border-b-0",
                "transition-colors",
                selectedId === m.id
                  ? "bg-[var(--liceu-surface)]/40 border-l-2 border-l-[var(--liceu-accent)]/60"
                  : "hover:bg-[var(--liceu-surface)]/20 border-l-2 border-l-transparent",
              ].join(" ")}
            >
              <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                Módulo {m.order_index + 1}
              </div>
              <div className="mt-0.5 font-serif text-[13px] leading-snug text-[var(--liceu-text)]">
                {m.title}
              </div>
              <div className="mt-1 flex gap-2">
                {m.assignment && (
                  <span className="font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-accent)]/60">EX</span>
                )}
                {m.text && (
                  <span className="font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-accent)]/60">TX</span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Editor area */}
      <div>
        {selected ? (
          <div className="space-y-4">
            <div>
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Editando
              </div>
              <div className="mt-1 font-serif text-[20px] text-[var(--liceu-text)]">
                {selected.title}
              </div>
            </div>
            <ModuleEditor module={selected} />
          </div>
        ) : (
          <div className="border border-[var(--liceu-stone)] px-6 py-8">
            <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
              Selecione um módulo para editar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
