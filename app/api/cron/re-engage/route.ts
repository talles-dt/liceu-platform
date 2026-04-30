import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendReEngagementEmail } from "@/lib/email/reEngagement";

/**
 * POST /api/cron/re-engage
 *
 * Cron job that emails students who haven't updated any module_progress
 * row in the last 7 days. Protected by CRON_SECRET bearer token.
 */
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find users whose most recent module_progress update is older than 7 days
  const { data: inactiveProgress, error: progressError } = await supabase
    .from("module_progress")
    .select("user_id, module_id, updated_at, modules(title)")
    .lt("updated_at", sevenDaysAgo.toISOString())
    .order("updated_at", { ascending: false });

  if (progressError) {
    return NextResponse.json(
      { error: "Failed to query module_progress", details: progressError.message },
      { status: 500 },
    );
  }

  // Group by user and pick their most recent module
  const userLastActivity = new Map<
    string,
    { moduleId: string; moduleName: string; updatedAt: string }
  >();

interface InactiveProgressRow {
  user_id: string;
  module_id: string;
  updated_at: string;
  modules: { title: string } | null;
}

// ... dentro do for:
for (const row of inactiveProgress ?? []) {
  const uid = row.user_id;
  const existing = userLastActivity.get(uid);
  const moduleName = row.modules?.title ?? "desconhecido";
    if (!existing || new Date(row.updated_at) > new Date(existing.updatedAt)) {
      userLastActivity.set(uid, {
        moduleId: row.module_id,
        moduleName,
        updatedAt: row.updated_at,
      });
    }
  }

  // Fetch user emails for inactive users
  const inactiveUserIds = Array.from(userLastActivity.keys());
  if (inactiveUserIds.length === 0) {
    return NextResponse.json({ reEngaged: 0, errors: [] });
  }

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, email, name")
    .in("id", inactiveUserIds);

  if (usersError) {
    return NextResponse.json(
      { error: "Failed to query users", details: usersError.message },
      { status: 500 },
    );
  }

  const errors: string[] = [];
  let reEngaged = 0;

  for (const user of users ?? []) {
    const activity = userLastActivity.get(user.id);
    if (!activity) continue;

    try {
      await sendReEngagementEmail(
        user.email,
        user.name ?? "Estudante",
        activity.moduleName,
        activity.moduleId,
      );
      reEngaged++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to email ${user.email}: ${msg}`);
      console.error("[re-engage]", err);
    }
  }

  return NextResponse.json({ reEngaged, errors });
}
