import { AssignmentsTable, type AssignmentRow } from "@/components/admin/tables/AssignmentsTable";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export default async function AdminAssignmentsPage() {
  const supabase = createSupabaseAdminClient();

  const { data: subs, error } = await supabase
    .from("assignment_submissions")
    .select("id, user_id, assignment_id, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  const submissions =
    (!error
      ? ((subs as unknown as {
          id: string;
          user_id: string;
          assignment_id: string;
          status: string | null;
          updated_at: string | null;
        }[]) ?? [])
      : []) ?? [];

  const userIds = Array.from(new Set(submissions.map((s) => s.user_id)));
  const assignmentIds = Array.from(new Set(submissions.map((s) => s.assignment_id)));

  const [{ data: usersData }, { data: assignmentsData }] = await Promise.all([
    userIds.length > 0
      ? supabase.from("users").select("id, name, email").in("id", userIds)
      : Promise.resolve({ data: [] as unknown[] }),
    assignmentIds.length > 0
      ? supabase.from("assignments").select("id, module_id, title").in("id", assignmentIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, title, order_index");

  const users =
    (usersData as unknown as { id: string; name?: string | null; email?: string | null }[]) ?? [];
  const assignments =
    (assignmentsData as unknown as { id: string; module_id?: string | null; title?: string | null }[]) ?? [];
  const modules =
    (modulesData as unknown as { id: string; title: string; order_index: number }[]) ?? [];

  const userById = new Map(users.map((u) => [u.id, u]));
  const assignmentById = new Map(assignments.map((a) => [a.id, a]));
  const moduleById = new Map(modules.map((m) => [m.id, m]));

  const rows: AssignmentRow[] = submissions.map((s) => {
    const u = userById.get(s.user_id);
    const a = assignmentById.get(s.assignment_id);
    const m = a?.module_id ? moduleById.get(a.module_id) : undefined;

    return {
      id: s.id,
      student: (u?.name?.trim() || u?.email?.trim() || s.user_id.slice(0, 8)) as string,
      module: m?.title ?? "—",
      status: (s.status ?? "pending").toLowerCase(),
      updatedAt: s.updated_at ? s.updated_at.slice(0, 10) : "—",
    };
  });

  const safeRows: AssignmentRow[] =
    rows.length > 0
      ? rows
      : [{ id: "placeholder", student: "—", module: "—", status: "pending", updatedAt: "—" }];

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/assignments
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Manuscripts
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Pending reviews, approved, revision required. Read like a ledger.
        </div>
      </header>

      <div className="mt-5">
        <AssignmentsTable rows={safeRows} />
      </div>
    </div>
  );
}
