import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { AssignmentReviewPanel } from "@/components/admin/AssignmentReviewPanel";

type Props = {
  params: Promise<{ submissionId: string }>;
};

export default async function AdminAssignmentDetailPage({ params }: Props) {
  const { submissionId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("id, user_id, assignment_id, content, score, feedback, status, updated_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) notFound();

  const { data: userRow } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", (submission as unknown as { user_id: string }).user_id)
    .maybeSingle();

  const student =
    (userRow as unknown as { name?: string | null; email?: string | null })?.name?.trim() ||
    (userRow as unknown as { email?: string | null })?.email?.trim() ||
    (submission as unknown as { user_id: string }).user_id.slice(0, 8);

  const updatedAt =
    (submission as unknown as { updated_at?: string | null }).updated_at?.slice(0, 10) ?? "—";

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/assignments/{submissionId}
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Review
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Read. Evaluate. Override if necessary.
        </div>
      </header>

      <div className="mt-5">
        <AssignmentReviewPanel
          title={`Submission — ${student}`}
          meta={[
            { k: "student", v: student },
            { k: "submitted", v: updatedAt },
            { k: "status", v: (submission as unknown as { status?: string | null }).status ?? "—" },
          ]}
          text={(submission as unknown as { content?: string | null }).content ?? "—"}
          aiFeedback={{
            score: (submission as unknown as { score?: number | null }).score ?? undefined,
            feedback:
              (submission as unknown as { feedback?: string | null }).feedback ?? undefined,
            status: (submission as unknown as { status?: string | null }).status ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

