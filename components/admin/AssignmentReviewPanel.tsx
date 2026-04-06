"use client";

import { useState } from "react";

type Props = {
  title: string;
  fileUrl?: string | null;
  submissionId?: string;
  meta: { k: string; v: string }[];
  text: string;
  aiFeedback?: { score?: number; feedback?: string; status?: string };
};

export function AssignmentReviewPanel({ title, fileUrl, submissionId, meta, text, aiFeedback }: Props) {
  const [currentStatus, setCurrentStatus] = useState(aiFeedback?.status ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function updateStatus(status: "approved" | "revision" | "rejected") {
    if (!submissionId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/assignments/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewer_notes: notes || undefined }),
      });
      if (res.ok) {
        setCurrentStatus(status);
        setSaved(true);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }
  return (
    <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)]">
      <header className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="font-[var(--font-noto-serif)] text-[16px] text-[var(--liceu-text)]">
            {title}
          </div>
          {aiFeedback?.status && (
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-secondary)]">
              {aiFeedback.status}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_360px]">
        <article className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-4">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            manuscript
          </div>
          {fileUrl && (
            <div className="mt-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.15em] text-[var(--liceu-accent)] underline underline-offset-4 hover:text-[var(--liceu-text)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download attached file
              </a>
            </div>
          )}
          <div className="mt-3 whitespace-pre-wrap font-[var(--font-noto-serif)] text-[14px] leading-[1.85] text-[var(--liceu-text)]">
            {text}
          </div>
        </article>

        <aside className="space-y-3">
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-4">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              metadata
            </div>
            <div className="mt-3 space-y-2">
              {meta.map((r) => (
                <div
                  key={r.k}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                    {r.k}
                  </div>
                  <div className="text-right font-[var(--font-space-grotesk)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-4">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              AI feedback
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                  score
                </div>
                <div className="text-right font-[var(--font-space-grotesk)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                  {aiFeedback?.score ?? "—"}
                </div>
              </div>
              <div className="border-t border-[var(--liceu-stone)]/70 pt-2 font-[var(--font-noto-serif)] text-[13px] leading-[1.8] text-[var(--liceu-text)]">
                {aiFeedback?.feedback ?? "No automated feedback available."}
              </div>
            </div>
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-4">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              reviewer notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Feedback for the student..."
              rows={4}
              className="mt-2 w-full bg-[var(--liceu-bg)] border border-[var(--liceu-stone)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus:border-[var(--liceu-accent)] resize-none"
            />
          </div>

          <div className="border border-[var(--liceu-secondary)]/35 bg-[var(--liceu-neutral)] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-secondary)]">
                {saved ? "✓ Saved" : "operator override"}
              </div>
              {currentStatus && (
                <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
                  {currentStatus}
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["approved", "revision", "rejected"] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  disabled={saving}
                  onClick={() => updateStatus(x)}
                  className={[
                    "border px-2 py-2 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] transition-colors",
                    currentStatus === x
                      ? "border-[var(--liceu-accent)] bg-[var(--liceu-accent)] text-[var(--liceu-on-primary)]"
                      : "border-[var(--liceu-stone)] bg-[var(--liceu-surface)] hover:bg-[var(--liceu-surface-container-high)] text-[var(--liceu-text)]",
                    saving ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {saving ? "..." : x}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

