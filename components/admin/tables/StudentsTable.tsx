"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import type { AdminStudentRow } from "@/lib/admin/queries";

function compactId(id: string) { return id.slice(0, 8); }

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
          key: "email",
          header: "email",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] text-[11px] text-[var(--liceu-muted)]">
              {r.email}
            </span>
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
          key: "progress",
          header: "progress",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[12px]">
              {r.completedLessons}/{r.totalLessons}
              <span className="text-[var(--liceu-muted)] ml-1">({r.completionPct}%)</span>
            </span>
          ),
        },
        {
          key: "grants",
          header: "access",
          render: (r) => (
            <div className="space-y-0.5">
              {r.accessGrants.length === 0 ? (
                <span className="font-[var(--font-space-grotesk)] text-[10px] text-[var(--liceu-muted)]/50">
                  none
                </span>
              ) : (
                r.accessGrants.map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-accent)]/70">
                      {g.grantType}
                    </span>
                    <span className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)] truncate max-w-[180px]">
                      {g.moduleTitle}
                    </span>
                    {g.expiresAt && (
                      <span className="font-[var(--font-space-grotesk)] text-[9px] text-[var(--liceu-muted)]/50">
                        até {g.expiresAt}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          ),
        },
        {
          key: "last",
          header: "last active",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[var(--liceu-muted)] text-[11px]">
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