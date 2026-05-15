"use server";

import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { stripe_session_id, customer_id, user_id } = await request.json();
  const supabaseAdmin = createSupabaseAdminClient();

  // Idempotency check
  const { data: existing } = await supabaseAdmin
    .from("purchases")
    .select()
    .eq("stripe_session_id", stripe_session_id)
    .eq("customer_id", customer_id)
    .maybeSingle();

  if (existing?.status === "claimed") {
    return NextResponse.json({ success: true });
  }

  try {
    // RPC fallback (atomically: claim + provision)
    const { error: rpcError } = await supabaseAdmin.rpc(
      "claim_and_process_purchase",
      {
        p_stripe_session_id: stripe_session_id,
        p_customer_id: customer_id,
        p_user_id: user_id,
      },
    );
    if (rpcError) throw rpcError;

    // Update status
    await supabaseAdmin
      .from("purchases")
      .update({ status: "claimed" })
      .eq("stripe_session_id", stripe_session_id)
      .eq("customer_id", customer_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Mark as failed
    await supabaseAdmin
      .from("purchases")
      .update({ status: "failed" })
      .eq("stripe_session_id", stripe_session_id)
      .eq("customer_id", customer_id);

    return NextResponse.json(
      { success: false, error: "Purchase claiming failed", details: error },
      { status: 500 },
    );
  }
}