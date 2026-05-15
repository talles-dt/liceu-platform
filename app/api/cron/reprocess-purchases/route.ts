"use server";

import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});
export async function POST(request: Request) {
  const supabaseAdmin = createSupabaseAdminClient();

  // Reprocess failed purchases only
  const { data: failedPurchases } = await supabaseAdmin
    .from("purchases")
    .select("stripe_session_id, customer_id, user_id")
    .eq("status", "failed")
    .lt("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000)); // Older than 24h

  if (!failedPurchases || failedPurchases.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  let failed = 0;

  for (const purchase of failedPurchases) {
    try {
      // Ensure session still valid
      const stripeSession = await stripe.checkout.sessions.retrieve(
        purchase.stripe_session_id,
      );
      if (stripeSession.status !== "complete") {
        failed++;
        continue;
      }

      // Claim via REST endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/purchases/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stripe_session_id: purchase.stripe_session_id,
            customer_id: purchase.customer_id,
            user_id: purchase.user_id,
          }),
        },
      );

      if (response.ok) processed++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ processed, failed, total: failedPurchases.length });
}