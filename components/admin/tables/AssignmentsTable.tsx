"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";

export type AssignmentRow = {
  id: string;
  student: string;
  module: string;
  status: string;
  updatedAt: string;
};

export function AssignmentsTable({ rows }: { rows: AssignmentRow[] }) {
  return (
    <DataTable
      caption="submissions"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        {
          key: "student",
          header: "student",
          render: (r) =>
            r.id === "placeholder" ? (
              <span className="text-[var(--liceu-muted)]">—</span>
            ) : (
              <Link
                href={`/admin/assignments/${r.id}` as never}
                className="font-serif underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
              >
                {r.student}
              </Link>
            ),
        },
        {
          key: "module",
          header: "module",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] text-[12px]">
              {r.module}
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
                r.status === "approved"
                  ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
                  : r.status === "revision"
                    ? "border-[var(--liceu-stone)] text-[var(--liceu-text)]"
                    : "border-[var(--liceu-stone)]/70 text-[var(--liceu-muted)]",
              ].join(" ")}
            >
              {r.status}
            </span>
          ),
        },
        {
          key: "updated",
          header: "updated",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] tabular-nums text-[var(--liceu-muted)]">
              {r.updatedAt}
            </span>
          ),
        },
      ]}
    />
  );
}
