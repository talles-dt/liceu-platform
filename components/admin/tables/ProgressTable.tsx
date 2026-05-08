"use client";

import { DataTable } from "@/components/admin/DataTable";

export type ProgressRow = {
  moduleId: string;
  title: string;
  order: number;
  total: number;
  completed: number;
  completionRate: number;
  lastUpdate: string;
  medianDays: string;
};

export function ProgressTable({ rows }: { rows: ProgressRow[] }) {
  return (
    <DataTable
      caption="module ledger"
      rows={rows}
      rowKey={(r) => r.moduleId}
      columns={[
        {
          key: "m",
          header: "module",
          render: (r) => (
            <span className="font-[var(--font-noto-serif)] text-[13px]">{r.title}</span>
          ),
        },
        {
          key: "rate",
          header: "completion",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums">
              {r.completionRate}%
            </span>
          ),
        },
        {
          key: "done",
          header: "completed",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[var(--liceu-muted)]">
              {r.completed}/{r.total}
            </span>
          ),
        },
        {
          key: "time",
          header: "median days",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[var(--liceu-muted)]">
              {r.medianDays}
            </span>
          ),
        },
        {
          key: "last",
          header: "last update",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[var(--liceu-muted)]">
              {r.lastUpdate}
            </span>
          ),
        },
      ]}
    />
  );
}
