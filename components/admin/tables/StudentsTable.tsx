"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import type { AdminStudentRow } from "@/lib/admin/queries";

export function StudentsTable({ rows }: { rows: AdminStudentRow[] }) {
  return (
    <DataTable
      caption="students"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        {
          key: "name",
          header: "name",
          render: (r) => (
            <Link
              href={`/admin/students/${r.id}`}
              className="font-[var(--font-noto-serif)] underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
            >
              {r.name}
            </Link>
          ),
        },
        {
          key: "module",
          header: "current module",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] text-[12px]">
              {r.currentModule}
            </span>
          ),
        },
        {
          key: "pct",
          header: "completion",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums">
              {r.completionPct}%
            </span>
          ),
        },
        {
          key: "last",
          header: "last activity",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[var(--liceu-muted)]">
              {r.lastActivity}
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
                "font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em]",
                r.status === "active"
                  ? "border-[var(--liceu-secondary)]/40 text-[var(--liceu-secondary)]"
                  : r.status === "stuck"
                    ? "border-[var(--liceu-stone)] text-[var(--liceu-text)]"
                    : "border-[var(--liceu-stone)]/70 text-[var(--liceu-muted)]",
              ].join(" ")}
            >
              {r.status}
            </span>
          ),
        },
      ]}
    />
  );
}
