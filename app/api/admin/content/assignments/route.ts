import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const envAdmins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = profile?.role === "admin" || (user.email && envAdmins.includes(user.email.toLowerCase()));
  return isAdmin ? user : null;
}

/** GET — all module_assignments rows */
export async function GET() {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("module_assignments")
    .select("id, module_id, assignment_prompt, speech_prompt");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignments: data ?? [] });
}

/** POST — upsert prompts for a module */
export async function POST(req: Request) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    module_id?: string;
    assignment_prompt?: string;
    speech_prompt?: string;
  };

  if (!body.module_id) return NextResponse.json({ error: "module_id required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("module_assignments")
    .upsert(
      {
        module_id: body.module_id,
        assignment_prompt: body.assignment_prompt ?? "",
        speech_prompt: body.speech_prompt ?? "",
      },
      { onConflict: "module_id" },
    )
    .select("id, module_id, assignment_prompt, speech_prompt")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignment: data });
}
