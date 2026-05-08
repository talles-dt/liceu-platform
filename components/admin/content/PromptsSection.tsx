"use client";

import { useState } from "react";
import { Field, SaveButton } from "./shared";

export function PromptsSection({ moduleId, initial }: {
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
