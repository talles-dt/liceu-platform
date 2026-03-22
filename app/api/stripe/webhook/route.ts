import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { getCommerceConfig } from "@/lib/commerce";
import { ensureCourseProgressForUserAdmin } from "@/lib/provisioning";
import { recordPurchaseAdmin, type PurchaseKind } from "@/lib/purchases";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  sendAccessReadyEmail,
  sendRegistrationEmail,
  sendInterviewSchedulingEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const { webhookSecret, calInterviewLink } = getCommerceConfig();

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature") ?? "";
  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as {
    id: string;
    customer_email?: string | null;
    customer_details?: { email?: string | null } | null;
    metadata?: {
      user_id?: string;
      course_id?: string;
      purchase_kind?: string;
    };
    payment_status?: string;
    amount_total?: number | null;
    currency?: string | null;
  };

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const kind = (session.metadata?.purchase_kind ?? "video") as PurchaseKind;
  const userId = session.metadata?.user_id ?? "";
  const buyerEmail =
    session.customer_details?.email ?? session.customer_email ?? "";

  // If course_id is missing from metadata (e.g. raw Stripe Payment Link with
  // no metadata), fall back to the env vars based on kind.
  const { courseId: videoCourseId, ebookCourseId, mentoringCourseId } = getCommerceConfig();
  const metadataCourseId = session.metadata?.course_id ?? "";
  const courseId = metadataCourseId || (
    kind === "ebook"
      ? ebookCourseId
      : kind === "mentoring_program"
        ? mentoringCourseId
        : videoCourseId
  );

  if (!buyerEmail) {
    console.error("[webhook] No buyer email in session", session.id);
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // ----------------------------------------------------------------
  // MENTORING INTERVIEW — R$99 fee
  // Creates a mentoring_application and sends scheduling email.
  // No course provisioning yet.
  // ----------------------------------------------------------------
  if (kind === "mentoring_interview") {
    // Idempotency
    const { data: existing } = await supabase
      .from("mentoring_applications")
      .select("id")
      .eq("interview_stripe_session_id", session.id)
      .maybeSingle();

    if (existing) return NextResponse.json({ received: true });

    // Resolve user_id if available
    let resolvedUserId = userId || null;
    if (!resolvedUserId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const match = users?.users?.find(
        (u) => u.email?.toLowerCase() === buyerEmail.toLowerCase(),
      );
      if (match) resolvedUserId = match.id;
    }

    await supabase.from("mentoring_applications").insert({
      email: buyerEmail.toLowerCase(),
      user_id: resolvedUserId,
      status: "pending_interview",
      interview_stripe_session_id: session.id,
    });

    await recordPurchaseAdmin({
      userId: resolvedUserId ?? buyerEmail, // fallback to email if no user yet
      kind,
      stripeSessionId: session.id,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
    }).catch(() => {}); // non-fatal

    await sendInterviewSchedulingEmail(buyerEmail, calInterviewLink).catch((e) =>
      console.error("[webhook] sendInterviewSchedulingEmail failed", e),
    );

    return NextResponse.json({ received: true });
  }

  // ----------------------------------------------------------------
  // MENTORING PROGRAM — R$4.999 (sent via approve route checkout)
  // Activates the application and provisions the mentoring course.
  // ----------------------------------------------------------------
  if (kind === "mentoring_program") {
    const { data: existing } = await supabase
      .from("mentoring_applications")
      .select("id")
      .eq("program_stripe_session_id", session.id)
      .maybeSingle();

    if (existing?.id) {
      // Already processed
      return NextResponse.json({ received: true });
    }

    // Find the application by email to activate it
    const { data: application } = await supabase
      .from("mentoring_applications")
      .select("id, user_id")
      .eq("email", buyerEmail.toLowerCase())
      .eq("status", "approved_pending_payment")
      .maybeSingle();

    if (!application) {
      console.error("[webhook] No approved application found for", buyerEmail);
      return NextResponse.json({ received: true });
    }

    let resolvedUserId = application.user_id ?? userId ?? "";

    // Resolve user if we don't have them yet
    if (!resolvedUserId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const match = users?.users?.find(
        (u) => u.email?.toLowerCase() === buyerEmail.toLowerCase(),
      );
      if (match) resolvedUserId = match.id;
    }

    // Update application to active
    await supabase
      .from("mentoring_applications")
      .update({
        status: "active",
        program_stripe_session_id: session.id,
        user_id: resolvedUserId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (resolvedUserId) {
      const { mentoringCourseId } = getCommerceConfig();
      if (mentoringCourseId) {
        await ensureCourseProgressForUserAdmin(resolvedUserId, mentoringCourseId);
      }
      await recordPurchaseAdmin({
        userId: resolvedUserId,
        kind,
        stripeSessionId: session.id,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
      }).catch(() => {});
      await sendAccessReadyEmail(buyerEmail).catch((e) =>
        console.error("[webhook] sendAccessReadyEmail (mentoring) failed", e),
      );
    } else {
      // No account yet — store pending purchase so auth/callback claims it
      await supabase
        .from("pending_purchases")
        .upsert(
          {
            email: buyerEmail.toLowerCase(),
            kind,
            course_id: getCommerceConfig().mentoringCourseId,
            stripe_session_id: session.id,
            claimed: false,
          },
          { onConflict: "stripe_session_id" },
        );

      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: buyerEmail,
        options: { redirectTo: `${siteUrl}/auth/callback` },
      });

      if (linkData?.properties?.action_link) {
        await sendRegistrationEmail(buyerEmail, linkData.properties.action_link).catch(
          (e) => console.error("[webhook] sendRegistrationEmail (mentoring) failed", e),
        );
      }
    }

    return NextResponse.json({ received: true });
  }

  // ----------------------------------------------------------------
  // EBOOK / VIDEO — existing logic
  // ----------------------------------------------------------------
  const { data: existingPending } = await supabase
    .from("pending_purchases")
    .select("id, claimed")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existingPending?.claimed) {
    return NextResponse.json({ received: true });
  }

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const match = users?.users?.find(
      (u) => u.email?.toLowerCase() === buyerEmail.toLowerCase(),
    );
    if (match) resolvedUserId = match.id;
  }

  if (resolvedUserId) {
    await recordPurchaseAdmin({
      userId: resolvedUserId,
      kind,
      stripeSessionId: session.id,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
    });
    if (courseId) {
      await ensureCourseProgressForUserAdmin(resolvedUserId, courseId);
    }
    await supabase
      .from("pending_purchases")
      .update({ claimed: true })
      .eq("stripe_session_id", session.id);
    await sendAccessReadyEmail(buyerEmail).catch((e) =>
      console.error("[webhook] sendAccessReadyEmail failed", e),
    );
  } else {
    await supabase
      .from("pending_purchases")
      .upsert(
        {
          email: buyerEmail.toLowerCase(),
          kind,
          course_id: courseId,
          stripe_session_id: session.id,
          claimed: false,
        },
        { onConflict: "stripe_session_id" },
      );

    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: buyerEmail,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkData?.properties?.action_link) {
      await sendRegistrationEmail(buyerEmail, linkData.properties.action_link).catch(
        (e) => console.error("[webhook] sendRegistrationEmail failed", e),
      );
    }
  }

  return NextResponse.json({ received: true });
}
