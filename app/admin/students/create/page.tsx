"use client";

import { useState } from "react";

export default function AdminCreateStudentPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          password: password || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Failed to create student" });
        return;
      }

      setResult({ ok: true, msg: `Created ${data.email}${data.id ? ` (${data.id.slice(0, 8)}…)` : ""}` });
      setEmail("");
      setName("");
      setPassword("");
    } catch {
      setResult({ ok: false, msg: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="border-b border-[var(--liceu-stone)] pb-4">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/students/create
        </div>
        <h1 className="mt-2 font-[var(--font-noto-serif)] text-[22px] uppercase text-[var(--liceu-text)]">
          Create Student
        </h1>
        <p className="mt-2 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-muted)]">
          Manually provision a student account for migration, deals, or gifts.
          The user is auto-confirmed and enrolled immediately.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] p-6">
        <div>
          <label htmlFor="create-email" className="block font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] mb-1">
            Email *
          </label>
          <input
            id="create-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus:border-[var(--liceu-accent)]"
            placeholder="student@example.com"
          />
        </div>

        <div>
          <label htmlFor="create-name" className="block font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] mb-1">
            Name
          </label>
          <input
            id="create-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus:border-[var(--liceu-accent)]"
            placeholder="Optional display name"
          />
        </div>

        <div>
          <label htmlFor="create-password" className="block font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] mb-1">
            Password
          </label>
          <input
            id="create-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] outline-none focus:border-[var(--liceu-accent)]"
            placeholder="Leave empty to let them set their own"
          />
          <p className="mt-1 font-[var(--font-work-sans)] text-[10px] text-[var(--liceu-muted)]">
            If left blank, an invite email with a magic link is sent so they can set their own password.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="bg-[var(--liceu-primary)] px-6 py-2.5 font-[var(--font-space-grotesk)] text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--liceu-text)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Creating…" : "Create Student"}
        </button>

        {result && (
          <div
            className={`border px-4 py-3 font-[var(--font-work-sans)] text-sm ${
              result.ok
                ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
                : "border-[var(--liceu-critical)]/40 text-[var(--liceu-critical)]"
            }`}
          >
            {result.msg}
          </div>
        )}
      </form>
    </div>
  );
}
