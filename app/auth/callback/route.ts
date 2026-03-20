import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ensureCourseProgressForUserAdmin } from "@/lib/provisioning";
import { recordPurchaseAdmin, type PurchaseKind } from "@/lib/purchases";
import { sendAccessReadyEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Exchange the magic link code for a session
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession failed", error);
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const user = data.user;
  const userEmail = user.email?.toLowerCase() ?? "";

  // --- Claim all pending purchases for this email ---
  const adminSupabase = createSupabaseAdminClient();

  const { data: pending } = await adminSupabase
    .from("pending_purchases")
    .select("id, kind, course_id, stripe_session_id")
    .eq("email", userEmail)
    .eq("claimed", false);

  if (pending && pending.length > 0) {
    for (const p of pending as {
      id: string;
      kind: string;
      course_id: string;
      stripe_session_id: string;
    }[]) {
      // Provision the course
      if (p.course_id) {
        await ensureCourseProgressForUserAdmin(user.id, p.course_id);
      }

      // Record the purchase against the real user
      await recordPurchaseAdmin({
        userId: user.id,
        kind: p.kind as PurchaseKind,
        stripeSessionId: p.stripe_session_id,
      });

      // Mark as claimed
      await adminSupabase
        .from("pending_purchases")
        .update({ claimed: true })
        .eq("id", p.id);
    }

    // Send confirmation now that account + access are fully set up
    await sendAccessReadyEmail(userEmail).catch((e) =>
      console.error("[auth/callback] sendAccessReadyEmail failed", e),
    );
  }

  return NextResponse.redirect(`${origin}/dashboard?purchase=success`);
}
