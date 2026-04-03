"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";

export type ApplicationRow = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
};

function ActionCell({
  id,
  status,
  onDone,
}: {
  id: string;
  status: string;
  onDone: (id: string, newStatus: string) => void;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  if (status !== "pending_interview") {
    return (
      <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        —
      </span>
    );
  }

  async function act(action: "approve" | "reject") {
    setError("");
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/mentoring/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed");
        return;
      }
      onDone(id, action === "approve" ? "approved_pending_payment" : "rejected");
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => act("approve")}
        disabled={loading !== null}
        className={[
          "border px-2 py-0.5",
          "font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em]",
          "border-[var(--liceu-secondary)]/50 text-[var(--liceu-secondary)]",
          "hover:bg-[var(--liceu-secondary)]/10 disabled:opacity-40",
        ].join(" ")}
      >
        {loading === "approve" ? "..." : "aprovar"}
      </button>
      <button
        onClick={() => act("reject")}
        disabled={loading !== null}
        className={[
          "border px-2 py-0.5",
          "font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em]",
          "border-[var(--liceu-stone)] text-[var(--liceu-muted)]",
          "hover:text-[var(--liceu-text)] disabled:opacity-40",
        ].join(" ")}
      >
        {loading === "reject" ? "..." : "rejeitar"}
      </button>
      {error && (
        <span className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
          {error}
        </span>
      )}
    </div>
  );
}

export function ApplicationsTable({ rows: initial }: { rows: ApplicationRow[] }) {
  const [rows, setRows] = useState(initial);

  function handleDone(id: string, newStatus: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
  }

  return (
    <DataTable
      caption="applications"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        {
          key: "email",
          header: "candidate",
          render: (r) => (
            <span className="font-[var(--font-noto-serif)] text-[13px]">{r.email}</span>
          ),
        },
        {
          key: "status",
          header: "status",
          render: (r) => {
            const colors: Record<string, string> = {
              pending_interview:
                "border-[var(--liceu-stone)] text-[var(--liceu-text)]",
              approved_pending_payment:
                "border-[var(--liceu-secondary)]/40 text-[var(--liceu-secondary)]",
              active:
                "border-[var(--liceu-secondary)]/40 text-[var(--liceu-secondary)]",
              rejected:
                "border-[var(--liceu-stone)]/50 text-[var(--liceu-muted)]",
            };
            return (
              <span
                className={[
                  "inline-flex items-center border px-2 py-0.5",
                  "font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em]",
                  colors[r.status] ?? "border-[var(--liceu-stone)] text-[var(--liceu-muted)]",
                ].join(" ")}
              >
                {r.status.replace(/_/g, " ")}
              </span>
            );
          },
        },
        {
          key: "date",
          header: "applied",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[11px] text-[var(--liceu-muted)]">
              {r.createdAt}
            </span>
          ),
        },
        {
          key: "actions",
          header: "actions",
          render: (r) => (
            <ActionCell id={r.id} status={r.status} onDone={handleDone} />
          ),
        },
      ]}
    />
  );
}
