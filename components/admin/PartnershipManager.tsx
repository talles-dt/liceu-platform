"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export interface Partnership {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string;
  contact_name: string | null;
  status: "pending" | "active" | "suspended" | "terminated";
  partner_type: string;
  modules: string[] | null;
  courses: string[] | null;
  max_seats: number | null;
  used_seats: number;
  access_grant_type: string;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  terminated_at: string | null;
  terminated_by: string | null;
  termination_reason: string | null;
  partnership_members?: Array<{ count: number }>;
  users?: { name: string; email: string };
}

const PARTNER_TYPES = [
  { value: "institution", label: "Institution" },
  { value: "company", label: "Company" },
  { value: "influencer", label: "Influencer" },
  { value: "affiliate", label: "Affiliate" },
  { value: "other", label: "Other" },
];

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  active: "bg-green-900/30 text-green-400 border-green-800",
  suspended: "bg-orange-900/30 text-orange-400 border-orange-800",
  terminated: "bg-red-900/30 text-red-400 border-red-800",
};

interface PartnershipManagerProps {
  partnerships: Partnership[];
  modules: { id: string; code: string; title: string }[];
  courses: { id: string; title: string }[];
  onCreate: (data: Partial<Partnership>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Partnership>) => Promise<void>;
  onAddMember: (partnershipId: string, userId: string) => Promise<void>;
  onRemoveMember: (partnershipId: string, memberId: string, reason: string) => Promise<void>;
  onActivate: (partnershipId: string) => Promise<void>;
  onTerminate: (partnershipId: string, reason: string) => Promise<void>;
}

export function PartnershipManager({
  partnerships,
  modules,
  courses,
  onCreate,
  onUpdate,
  onAddMember,
  onRemoveMember,
  onActivate,
  onTerminate,
}: PartnershipManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [memberAction, setMemberAction] = useState<{ partnershipId: string; action: "add" | "remove"; memberId?: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    contact_email: "",
    contact_name: "",
    partner_type: "institution",
    max_seats: "",
    access_grant_type: "partnership",
    modules: [] as string[],
    courses: [] as string[],
    status: "pending",
    settings: {},
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      contact_email: "",
      contact_name: "",
      partner_type: "institution",
      max_seats: "",
      access_grant_type: "partnership",
      modules: [],
      courses: [],
      status: "pending",
      settings: {},
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        max_seats: formData.max_seats ? parseInt(formData.max_seats) : null,
        modules: formData.modules.length > 0 ? formData.modules : null,
        courses: formData.courses.length > 0 ? formData.courses : null,
        status: formData.status as Partnership["status"],
      };

      if (editingPartnership) {
        await onUpdate(editingPartnership.id, payload);
      } else {
        await onCreate(payload);
      }
      setShowCreateDialog(false);
      setEditingPartnership(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save partnership");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (partnershipId: string, userId: string) => {
    try {
      await onAddMember(partnershipId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const handleRemoveMember = async (partnershipId: string, memberId: string, reason: string) => {
    try {
      await onRemoveMember(partnershipId, memberId, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleActivate = async (partnershipId: string) => {
    try {
      await onActivate(partnershipId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate partnership");
    }
  };

  const handleTerminate = async (partnershipId: string, reason: string) => {
    try {
      await onTerminate(partnershipId, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to terminate partnership");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-bold uppercase tracking-tight text-[var(--liceu-text)]">
            Partnerships
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
            Manage institutional partners and bulk access grants
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingPartnership(null); setShowCreateDialog(true); }}
          className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider bg-[var(--liceu-accent)] text-[var(--liceu-primary)] font-bold hover:bg-[var(--liceu-accent)]/90 transition-colors"
        >
          New Partnership
        </button>
      </div>

      {/* Partnerships Table */}
      <div className="bg-[var(--liceu-surface-container-lowest)] border border-[var(--liceu-stone)] overflow-hidden">
        {partnerships.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-[var(--liceu-muted)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20l-2-2m10 0l2-2m-10 0v-2a3 3 0 015.356-1.857M14 20l2-2" />
            </svg>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
              No partnerships configured
            </p>
            <button
              onClick={() => { resetForm(); setEditingPartnership(null); setShowCreateDialog(true); }}
              className="mt-4 px-4 py-2 font-mono text-[10px] uppercase tracking-wider bg-[var(--liceu-accent)] text-[var(--liceu-primary)] font-bold hover:bg-[var(--liceu-accent)]/90 transition-colors"
            >
              Create First Partnership
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--liceu-surface-container)]">
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Partnership
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Type
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Status
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Members
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Access Type
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Created
                  </th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {partnerships.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--liceu-stone)] hover:bg-[var(--liceu-surface-container-low)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-[var(--font-noto-serif)] text-sm font-bold text-[var(--liceu-text)]">
                        {p.name}
                      </div>
                      <div className="font-mono text-xs text-[var(--liceu-muted)] mt-0.5">
                        {p.slug} • {p.contact_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--liceu-muted)] capitalize">
                      {p.partner_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded border ${STATUS_BADGES[p.status] || STATUS_BADGES.pending}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--liceu-text)] tabular-nums">
                      {p.partnership_members?.[0]?.count || 0} / {p.max_seats || "∞"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--liceu-muted)] capitalize">
                      {p.access_grant_type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--liceu-muted)]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingPartnership(p); setFormData({
                            name: p.name,
                            slug: p.slug,
                            description: p.description || "",
                            contact_email: p.contact_email,
                            contact_name: p.contact_name || "",
                            partner_type: p.partner_type,
                            max_seats: p.max_seats?.toString() || "",
                            access_grant_type: p.access_grant_type,
                            modules: p.modules || [],
                            courses: p.courses || [],
                            status: p.status,
                            settings: p.settings as Record<string, unknown>,
                          }); setShowCreateDialog(true); }}
                          className="p-2 text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:bg-[var(--liceu-surface-container)] rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {p.status === "pending" && (
                          <button
                            onClick={() => handleActivate(p.id)}
                            className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider bg-green-900/30 text-green-400 border border-green-800 rounded hover:bg-green-900/50 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                        {p.status === "active" && (
                          <button
                            onClick={() => {
                              const reason = prompt("Termination reason:");
                              if (reason) handleTerminate(p.id, reason);
                            }}
                            className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider bg-red-900/30 text-red-400 border border-red-800 rounded hover:bg-red-900/50 transition-colors"
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-[var(--liceu-surface)] border border-[var(--liceu-stone)] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--liceu-stone)]">
                <h2 className="font-[var(--font-noto-serif)] text-lg font-bold text-[var(--liceu-text)]">
                  {editingPartnership ? "Edit Partnership" : "Create Partnership"}
                </h2>
                <button
                  onClick={() => { setShowCreateDialog(false); setEditingPartnership(null); resetForm(); }}
                  className="p-2 text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 max-h-[70vh]">
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Partner Type
                    </label>
                    <select
                      value={formData.partner_type}
                      onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                    >
                      {PARTNER_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Max Seats
                    </label>
                    <input
                      type="number"
                      value={formData.max_seats}
                      onChange={(e) => setFormData({ ...formData, max_seats: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
                      Access Grant Type
                    </label>
                    <select
                      value={formData.access_grant_type}
                      onChange={(e) => setFormData({ ...formData, access_grant_type: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
                    >
                      <option value="partnership">Partnership</option>
                      <option value="course_bundle">Course Bundle</option>
                      <option value="early_access">Early Access</option>
                      <option value="mentorship">Mentorship</option>
                    </select>
                  </div>
                </div>

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

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--liceu-stone)]">
                  <button
                    type="button"
                    onClick={() => { setShowCreateDialog(false); setEditingPartnership(null); resetForm(); }}
                    className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider bg-[var(--liceu-accent)] text-[var(--liceu-primary)] font-bold hover:bg-[var(--liceu-accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Saving..." : (editingPartnership ? "Update Partnership" : "Create Partnership")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}