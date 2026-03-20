"use client";

import { useState } from "react";
import { MinimalButton } from "@/components/MinimalButton";

type Kind = "ebook" | "video" | "mentoring";

export function PurchaseButton({
  kind,
  children,
}: {
  kind: Kind;
  children: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function onClick() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <MinimalButton disabled={loading} onClick={onClick}>
        {loading ? "Aguarde..." : children}
      </MinimalButton>
      {error ? (
        <div className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

