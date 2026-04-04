import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";
import { sendMentoringRejectedEmail } from "@/lib/email";

type Context = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Context) {
  // Admin guard
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: application, error } = await supabase
    .from("mentoring_applications")
    .select("id, email, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "pending_interview") {
    return NextResponse.json(
      { error: `Cannot reject application with status: ${application.status}` },
      { status: 400 },
    );
  }

  await supabase
    .from("mentoring_applications")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await sendMentoringRejectedEmail(application.email).catch((e) =>
    console.error("[reject] sendMentoringRejectedEmail failed", e),
  );

  return NextResponse.json({ ok: true });
}
