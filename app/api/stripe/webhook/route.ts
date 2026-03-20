import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { getCommerceConfig } from "@/lib/commerce";
import { ensureCourseProgressForUserAdmin } from "@/lib/provisioning";
import { recordPurchaseAdmin, type PurchaseKind } from "@/lib/purchases";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const { webhookSecret } = getCommerceConfig();
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
    };
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

