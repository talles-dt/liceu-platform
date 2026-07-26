"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export interface AccessGrant {
  id: string;
  user_id: string;
  grant_type: string;
  source_id: string | null;
  source_type: string | null;
  modules: string[] | null;
  courses: string[] | null;
  expires_at: string | null;
  granted_by: string;
  granted_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  users?: { name: string; email: string };
}

interface AccessGrantDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    user_id: string;
    grant_type: string;
    modules?: string[];
    courses?: string[];
    expires_at?: string;
    source_id?: string;
    source_type?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  editingGrant?: AccessGrant | null;
  users: { id: string; name: string; email: string }[];
  modules: { id: string; code: string; title: string }[];
  courses: { id: string; title: string }[];
}

const GRANT_TYPES = [
  { value: "payment", label: "Payment" },
  { value: "early_access", label: "Early Access" },
  { value: "partnership", label: "Partnership" },
  { value: "admin_override", label: "Admin Override" },
  { value: "mentorship", label: "Mentorship" },
  { value: "course_bundle", label: "Course Bundle" },
];

export function AccessGrantDialog({ 
  open, 
  onClose, 
  onSubmit, 
  editingGrant,
  users,
  modules,
  courses
}: AccessGrantDialogProps) {
  const [formData, setFormData] = useState({
    user_id: "",
    grant_type: "payment",
    modules: [] as string[],
    courses: [] as string[],
    expires_at: "",
    source_id: "",
    source_type: "manual",
    metadata: {} as Record<string, unknown>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog opens/closes
  if (!open) return null;

  const isEditing = !!editingGrant;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        user_id: formData.user_id,
        grant_type: formData.grant_type,
        modules: formData.modules.length > 0 ? formData.modules : undefined,
        courses: formData.courses.length > 0 ? formData.courses : undefined,
        expires_at: formData.expires_at || undefined,
        source_id: formData.source_id || undefined,
        source_type: formData.source_type,
        metadata: formData.metadata,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--liceu-surface)] border border-[var(--liceu-stone)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--liceu-stone)]">
          <h2 className="font-[var(--font-noto-serif)] text-lg font-bold text-[var(--liceu-text)]">
            {isEditing ? "Edit Access Grant" : "Grant Access"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              User <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
              required
            >
              <option value="">Select user...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Grant Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.grant_type}
              onChange={(e) => setFormData({ ...formData, grant_type: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
              required
            >
              {GRANT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                Modules
              </label>
              <div className="max-h-40 overflow-y-auto border border-[var(--liceu-stone)] rounded p-2 bg-[var(--liceu-surface-container)] space-y-1">
                {modules.map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.modules.includes(m.id)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...formData.modules, m.id]
                          : formData.modules.filter(id => id !== m.id);
                        setFormData({ ...formData, modules: next });
                      }}
                      className="w-4 h-4 accent-[var(--liceu-accent)]"
                    />
                    <span className="text-sm text-[var(--liceu-text)]">{m.code} - {m.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                Courses
              </label>
              <div className="max-h-40 overflow-y-auto border border-[var(--liceu-stone)] rounded p-2 bg-[var(--liceu-surface-container)] space-y-1">
                {courses.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.courses.includes(c.id)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...formData.courses, c.id]
                          : formData.courses.filter(id => id !== c.id);
                        setFormData({ ...formData, courses: next });
                      }}
                      className="w-4 h-4 accent-[var(--liceu-accent)]"
                    />
                    <span className="text-sm text-[var(--liceu-text)]">{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Expires At (optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Source Type
            </label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
            >
              <option value="manual">Manual</option>
              <option value="payment">Payment</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Source ID (optional)
            </label>
            <input
              type="text"
              value={formData.source_id}
              onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--liceu-stone)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider bg-[var(--liceu-accent)] text-[var(--liceu-primary)] font-bold hover:bg-[var(--liceu-accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : (isEditing ? "Update Grant" : "Create Grant")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}