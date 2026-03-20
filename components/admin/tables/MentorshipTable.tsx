"use client";

import { DataTable } from "@/components/admin/DataTable";

export type SessionRow = {
  id: string;
  student: string;
  when: string;
  status: string;
  readiness: string;
};

export function MentorshipTable({ rows }: { rows: SessionRow[] }) {
  return (
    <DataTable
      caption="sessions"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        {
          key: "student",
          header: "student",
          render: (r) => <span className="font-serif">{r.student}</span>,
        },
        {
          key: "when",
          header: "scheduled",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] tabular-nums text-[var(--liceu-muted)]">
              {r.when}
            </span>
          ),
        },
        {
          key: "status",
          header: "status",
          render: (r) => (
            <span
              className={[
                "inline-flex items-center border px-2 py-0.5",
                "font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em]",
                r.status === "completed"
                  ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
                  : r.status === "missed"
                    ? "border-[var(--liceu-stone)] text-[var(--liceu-text)]"
                    : "border-[var(--liceu-stone)]/70 text-[var(--liceu-muted)]",
              ].join(" ")}
            >
              {r.status}
            </span>
          ),
        },
        {
          key: "readiness",
          header: "readiness",
          className: "text-right",
          render: (r) => (
            <span
              className={[
                "font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.18em]",
                r.readiness === "ready"
                  ? "text-[var(--liceu-accent)]"
                  : "text-[var(--liceu-muted)]",
              ].join(" ")}
            >
              {r.readiness}
            </span>
          ),
        },
      ]}
    />
  );
}
