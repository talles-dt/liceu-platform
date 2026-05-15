import { createSupabaseAdminClient } from "../../lib/supabaseAdmin";
import Stripe from "stripe";

const supabaseAdmin = createSupabaseAdminClient();

// Ensure Stripe secret is loaded
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function backfillCustomerIds() {
  // Fetch unbackfilled purchases
  const { data: purchases, error } = await supabaseAdmin
    .from("purchases")
    .select("id, stripe_session_id, user_id")
    .is("customer_id", null);

  if (error) {
    console.error("[BACKFILL ERROR] Fetch failed:", error);
    return { success: false, error };
  }

  if (!purchases || purchases.length === 0) {
    return { success: true, processed: 0 };
  }

  // Batch update
  const updates = await Promise.all(
    purchases.map(async (purchase) => {
      // Fetch Stripe session via Stripe API
      const stripeSession = await stripe.checkout.sessions.retrieve(
        purchase.stripe_session_id,
      );
      const customerId = stripeSession.customer as string;

      if (!customerId) {
        console.warn("[BACKFILL SKIP] No customer_id for:", purchase.id);
        return null;
      }

      // Update in Supabase
      const { error: updateError } = await supabaseAdmin
        .from("purchases")
        .update({ customer_id: customerId })
        .eq("id", purchase.id);

      if (updateError) {
        console.error("[BACKFILL ERROR] Update failed for:", purchase.id, updateError);
        return null;
      }

      return { id: purchase.id, customer_id: customerId };
    }),
  );

  const successfulUpdates = updates.filter(Boolean);
  return {
    success: true,
    processed: successfulUpdates.length,
    total: purchases.length,
  };
}

// Run immediately
backfillCustomerIds().then((result) => {
  console.log("[BACKFILL COMPLETE]", result);
});