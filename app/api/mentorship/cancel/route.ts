import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let session_id = "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    session_id = String(body.session_id ?? "");
  } else {
    const form = await req.text();
    const parsed = new URLSearchParams(form);
    session_id = String(parsed.get("session_id") ?? "");
  }

  if (!session_id) return NextResponse.json({ error: "session_id is required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("mentoring_bookings")
    .delete()
    .eq("session_id", session_id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
