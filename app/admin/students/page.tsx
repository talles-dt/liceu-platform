import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { getAdminStudents } from "@/lib/admin/queries";

export default async function AdminStudentsPage() {
  const rows = await getAdminStudents();

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/students
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Active roster
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Dense table. Click a student for diagnosis.
        </div>
      </header>

      <div className="mt-5">
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
                  href={`/admin/students/${r.id}` as never}
                  className="font-serif underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
                >
                  {r.name}
                </Link>
              ),
            },
            {
              key: "module",
              header: "current module",
              render: (r) => (
                <span className="font-[var(--font-liceu-mono)] text-[12px]">
                  {r.currentModule}
                </span>
              ),
            },
            {
              key: "pct",
              header: "completion",
              className: "text-right",
              render: (r) => (
                <span className="font-[var(--font-liceu-mono)] tabular-nums">
                  {r.completionPct}%
                </span>
              ),
            },
            {
              key: "last",
              header: "last activity",
              render: (r) => (
                <span className="font-[var(--font-liceu-mono)] tabular-nums text-[var(--liceu-muted)]">
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
                    "font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em]",
                    r.status === "active"
                      ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
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
      </div>
    </div>
  );
}

