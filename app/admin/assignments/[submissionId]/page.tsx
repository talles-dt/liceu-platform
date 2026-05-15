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
    .select("id, user_id, assignment_id, content, file_url, score, feedback, status, updated_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) notFound();

  const sub = submission as unknown as {
    user_id: string;
    content: string | null;
    file_url: string | null;
    score: number | null;
    feedback: string | null;
    status: string | null;
    updated_at: string | null;
  };

  const { data: userRow } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", sub.user_id)
    .maybeSingle();

  const user = userRow as unknown as { name?: string | null; email?: string | null } | null;
  const student = user?.name?.trim() || user?.email?.trim() || sub.user_id.slice(0, 8);
  const updatedAt = sub.updated_at?.slice(0, 10) ?? "—";

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/assignments/{submissionId}
        </div>
        <div className="mt-2 font-[var(--font-noto-serif)] text-[22px] leading-tight text-[var(--liceu-text)]">
          Review
        </div>
        <div className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Read. Evaluate. Override if necessary.
        </div>
      </header>

      <div className="mt-5">
        <AssignmentReviewPanel
          title={`Submission — ${student}`}
          submissionId={submissionId}
          fileUrl={sub.file_url}
          meta={[
            { k: "student", v: student },
            { k: "submitted", v: updatedAt },
            { k: "status", v: sub.status ?? "—" },
          ]}
          text={sub.content ?? "—"}
          aiFeedback={{
            score: sub.score ?? undefined,
            feedback: sub.feedback ?? undefined,
            status: sub.status ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

