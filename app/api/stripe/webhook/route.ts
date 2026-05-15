import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { getCommerceConfig } from "@/lib/commerce";
import { ensureCourseProgressForUserAdmin } from "@/lib/provisioning";
import { recordPurchaseAdmin, type PurchaseKind } from "@/lib/purchases";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const { webhookSecret } = getCommerceConfig();
  const adminSupabase = createSupabaseAdminClient(); // ðŸ‘ˆ Added
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    );
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

if (event.type === "checkout.session.completed") {
  const session = event.data.object as {
    id: string;
    metadata?: { user_id?: string; course_id?: string; purchase_kind?: string };
    payment_status?: string;
    amount_total?: number | null;
    currency?: string | null;
    customer?: string;
  };

  // ðŸ‘‡ Idempotency via composite key
  const stripeSession = await stripe.checkout.sessions.retrieve(session.id);
  const customerId = stripeSession.customer as string;

  // Check idempotency
  const { data: existingPurchase } = await adminSupabase
    .from("purchases")
    .select()
    .eq("stripe_session_id", stripeSession.id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (existingPurchase?.status === "claimed") {
    return NextResponse.json({ received: true });
  }

  // Insert if not exists
  if (!existingPurchase) {
    await adminSupabase.from("purchases").insert({
      stripe_session_id: stripeSession.id,
      customer_id: customerId,
      user_id: null,
      product_id: stripeSession.metadata?.product_id || "mentorship",
      status: "pending",
    });
  }

  // Claim via REST
  const claimResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/purchases/claim`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stripe_session_id: stripeSession.id,
        customer_id: customerId,
        user_id: existingPurchase?.user_id,
      }),
    },
  );

  if (!claimResponse.ok) {
    await adminSupabase
      .from("purchases")
      .update({ status: "failed" })
      .eq("stripe_session_id", stripeSession.id)
      .eq("customer_id", customerId);
  }

  // ðŸ‘‡ Keep original logic for now
  const userId = session.metadata?.user_id ?? "";
  const courseId = session.metadata?.course_id ?? "";
  const kind = (session.metadata?.purchase_kind ?? "video") as PurchaseKind;

  if (session.payment_status === "paid" && userId) {
    await recordPurchaseAdmin({
      userId,
      kind,
      stripeSessionId: session.id,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
    });

    if (kind === "video" && courseId) {
      await ensureCourseProgressForUserAdmin(userId, courseId);
    }
  }
  }

  return NextResponse.json({ received: true });
}

