"use client";

import { useState } from "react";
import { Field, Input, SaveButton } from "./shared";

export function TextSection({ moduleId, initial }: {
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
