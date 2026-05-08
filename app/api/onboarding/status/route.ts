import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createSupabaseServerClient();

  // Check for purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const hasPurchase = (purchases?.length ?? 0) > 0;

  // Check for diagnosis (mentoring_applications with email)
  const { data: applications } = await supabase
    .from("mentoring_applications")
    .select("id")
    .eq("email", (user.email ?? "").toLowerCase())
    .limit(1);

  const hasDiagnosis = (applications?.length ?? 0) > 0;

  // Check for module progress and find first accessible module
  let firstModuleId: string | null = null;
  let moduleName: string | null = null;

  if (hasPurchase) {
    const { data: progressData } = await supabase
      .from("module_progress")
      .select("module_id")
      .eq("user_id", user.id);

    const progressModuleIds = new Set(
      progressData?.map((p: { module_id: string }) => p.module_id) ?? [],
    );

    // Find the first module the user has progress on (not yet completed)
    if (progressModuleIds.size > 0) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title")
        .in("id", [...progressModuleIds])
        .order("order_index", { ascending: true })
        .limit(1);

      if (modules && modules.length > 0) {
        firstModuleId = modules[0].id;
        moduleName = modules[0].title;
      }
    }
  }

  return NextResponse.json({
    hasAccount: true,
    hasPurchase,
    hasDiagnosis,
    firstModuleId,
    moduleName,
  });
}
