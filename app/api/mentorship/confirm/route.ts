import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let user_id = "";
  let email = "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    user_id = String(body.user_id ?? user.id);
    email = String(body.email ?? user.email ?? "");
  } else {
    const form = await req.text();
    const parsed = new URLSearchParams(form);
    user_id = String(parsed.get("user_id") ?? user.id);
    email = String(parsed.get("email") ?? user.email ?? "");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("mentoring_bookings")
    .insert({
      user_id: user_id || user.id,
      email: email.toLowerCase(),
      session_id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    })
    .select("id, session_id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, booking: data });
}
