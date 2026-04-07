import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getCurrentUser } from "@/lib/supabaseServer";

/**
 * GET /api/notifications
 * Returns the current user's 10 most recent notifications.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[notifications] fetch failed", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  // Mark all as read
  const unreadIds = (data ?? [])
    .filter((n: { read: boolean }) => !n.read)
    .map((n: { id: string }) => n.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/notifications
 * Creates a notification. Admin-only.
 * Body: { user_id: string, type: "assignment_feedback", title: string, body: string, link?: string }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin role
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    profile?.role === "admin" ||
    (user.email && envAdmins.includes(user.email.toLowerCase()));

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    user_id?: string;
    submission_id?: string;
    type: "assignment_feedback";
    title: string;
    body: string;
    link?: string;
  };

  if (!body.type || !body.title || !body.body) {
    return NextResponse.json(
      { error: "type, title, and body are required" },
      { status: 400 },
    );
  }

  let userId = body.user_id;

  // Resolve user_id from submission if provided
  if (!userId && body.submission_id) {
    const { data: submission } = await supabase
      .from("assignment_submissions")
      .select("user_id")
      .eq("id", body.submission_id)
      .maybeSingle();
    userId = (submission as unknown as { user_id?: string } | null)?.user_id;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "user_id or submission_id is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: body.type,
      title: body.title,
      body: body.body,
      link: body.link ?? null,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select("id, type, title, body, link, read, created_at")
    .single();

  if (error) {
    console.error("[notifications] insert failed", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }

  return NextResponse.json(data);
}
