import { StudentsTable } from "@/components/admin/tables/StudentsTable";
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
        <StudentsTable rows={rows} />
      </div>
    </div>
  );
}

