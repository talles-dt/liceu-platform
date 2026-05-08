"use client";

import { DataTable } from "@/components/admin/DataTable";

export type StudentProgressRow = {
  module_id: string;
  title: string;
  order: number;
  completed: boolean | null;
  quiz_score: number | null;
  assignment_submitted: boolean | null;
  updated_at: string | null;
};

export type StudentQuizRow = {
  module: string;
  score: number | null;
};

export function StudentProgressTable({ rows }: { rows: StudentProgressRow[] }) {
  return (
    <DataTable
      caption="module progress"
      rows={rows}
      rowKey={(r) => r.module_id}
      columns={[
        {
          key: "module",
          header: "module",
          render: (r) => <span className="font-[var(--font-noto-serif)] text-[13px]">{r.title}</span>,
        },
        {
          key: "completed",
          header: "completed",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] text-[11px]">
              {r.completed ? "yes" : "no"}
            </span>
          ),
        },
        {
          key: "quiz",
          header: "quiz",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[11px]">
              {r.quiz_score ?? "—"}
            </span>
          ),
        },
        {
          key: "assignment",
          header: "assignment",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] text-[11px]">
              {r.assignment_submitted ? "submitted" : "missing"}
            </span>
          ),
        },
        {
          key: "updated",
          header: "updated",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[11px] text-[var(--liceu-muted)]">
              {r.updated_at ? r.updated_at.slice(0, 10) : "—"}
            </span>
          ),
        },
      ]}
    />
  );
}

export function StudentQuizTable({ rows }: { rows: StudentQuizRow[] }) {
  return (
    <DataTable
      caption="quiz scores"
      rows={rows}
      rowKey={(r) => r.module}
      columns={[
        {
          key: "m",
          header: "module",
          render: (r) => <span className="font-[var(--font-noto-serif)] text-[13px]">{r.module}</span>,
        },
        {
          key: "s",
          header: "score",
          className: "text-right",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[11px]">
              {r.score ?? "—"}
            </span>
          ),
        },
      ]}
    />
  );
}
