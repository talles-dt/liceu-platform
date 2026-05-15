"use server";

import { createSupabaseAdminClient } from "../lib/supabaseAdmin";
import Stripe from "stripe";

const supabaseAdmin = createSupabaseAdminClient();

// Ensure Stripe secret is loaded
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function backfillCustomerIds() {
  // Get pending purchases
  const { data: pendingPurchases } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .is("customer_id", null)
    .eq("status", "pending");

  if (!pendingPurchases?.length) {
    console.log("[BACKFILL COMPLETE] No pending purchases to process.");
    return;
  }

  // Process each
  for (const purchase of pendingPurchases) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        purchase.stripe_session_id,
      );
      const customerId = session.customer as string;

      // Update with customer_id
      await supabaseAdmin
        .from("purchases")
        .update({ customer_id: customerId, status: "claimed" })
        .eq("stripe_session_id", purchase.stripe_session_id);

      console.log(`[UPDATED] Session ${purchase.stripe_session_id} → ${customerId}`);
    } catch (err) {
      console.error(`[ERROR] Session ${purchase.stripe_session_id}:`, err);
    }
  }

  console.log("[BACKFILL COMPLETE] All processed.");
}

// Run
backfillCustomerIds();