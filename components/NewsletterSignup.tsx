"use client";

import { useState, type FormEvent } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Erro ao subscrever.");
        return;
      }

      setStatus("success");
      setMessage("Subscrito com sucesso.");
    } catch {
      setStatus("error");
      setMessage("Erro de rede. Tenta novamente.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 p-5">
        <p className="font-[var(--font-noto-serif)] text-[15px] text-[var(--liceu-accent)]">
          Obrigado. Estarás na lista.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 p-5">
      <h3 className="mb-2 font-[var(--font-noto-serif)] text-[16px] text-[var(--liceu-text)]">
        Newsletter do Liceu
      </h3>
      <p className="mb-4 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
        Sem spam. Apenas ensaios e atualizações do Liceu.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          placeholder="o-teu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="flex-1 rounded border border-[var(--liceu-stone)] bg-transparent px-3 py-2 font-[var(--font-work-sans)] text-[13px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)] focus:border-[var(--liceu-secondary)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-[var(--liceu-secondary)] px-4 py-2 font-[var(--font-work-sans)] text-[13px] tracking-[0.1em] text-[var(--liceu-bg)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Inscrever-se"}
        </button>
      </form>
      {status === "error" && message && (
        <p className="mt-2 font-[var(--font-work-sans)] text-[11px] text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}
