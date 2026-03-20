import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type PurchaseKind = "ebook" | "video" | "mentoring";

/**
 * Best-effort purchase recording.
 * If the `purchases` table doesn't exist, this does nothing.
 */
export async function recordPurchaseAdmin(input: {
  userId: string;
  kind: PurchaseKind;
  stripeSessionId: string;
  amountTotal?: number | null;
  currency?: string | null;
}) {
  const supabase = createSupabaseAdminClient();

  try {
    await supabase.from("purchases").insert({
      user_id: input.userId,
      kind: input.kind,
      stripe_session_id: input.stripeSessionId,
      amount_total: input.amountTotal ?? null,
      currency: input.currency ?? null,
    });
  } catch {
    // ignore: schema not installed yet
  }
}

