"use client";

import { useState } from "react";
import { Field, Input, SaveButton } from "./shared";

type LessonRow = {
  id: string;
  title: string;
  content: string | null;
  cloudflare_stream_id: string | null;
  order_index: number;
};

export function LicoesSection({ moduleId }: { moduleId: string }) {
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
