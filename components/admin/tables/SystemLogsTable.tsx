"use client";

import { DataTable } from "@/components/admin/DataTable";

export type LogRow = {
  ts: string;
  actor: string;
  action: string;
  target: string;
};

export function SystemLogsTable({ rows }: { rows: LogRow[] }) {
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => `${r.ts}-${r.action}-${r.target}`}
      columns={[
        {
          key: "ts",
          header: "ts",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] tabular-nums text-[var(--liceu-muted)]">
              {r.ts}
            </span>
          ),
        },
        {
          key: "actor",
          header: "actor",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] text-[11px]">{r.actor}</span>
          ),
        },
        {
          key: "action",
          header: "action",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] text-[11px]">{r.action}</span>
          ),
        },
        {
          key: "target",
          header: "target",
          render: (r) => (
            <span className="font-[var(--font-liceu-mono)] text-[11px] text-[var(--liceu-text)]">
              {r.target}
            </span>
          ),
        },
      ]}
    />
  );
}
