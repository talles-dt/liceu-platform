"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ensureCourseProgressForUserAdmin } from "@/lib/provisioning";
import { recordPurchaseAdmin, type PurchaseKind } from "@/lib/purchases";
import { sendAccessReadyEmail } from "@/lib/email";

// Constants
const PRODUCTION_ROOT = "https://www.oliceu.com";
const LOG_PREFIX = "[auth/callback]";

// Error types
const enum AuthError {
  MISSING_CODE = "missing_code",
  INVALID_LINK = "invalid_link",
  SESSION_FAILURE = "session_failure",
  PROCESSING_FAILURE = "processing_failure",
}

// Response helpers
type RedirectResponse = NextResponse<unknown>;

function createErrorRedirect(error: AuthError): RedirectResponse {
  return NextResponse.redirect(`${PRODUCTION_ROOT}/login?error=${error}`);
}

function createDashboardRedirect(success: boolean): RedirectResponse {
  const url = new URL(`${PRODUCTION_ROOT}/dashboard`);
  if (success) {
    url.searchParams.set("purchase", "success");
  }
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request): Promise<RedirectResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = PRODUCTION_ROOT; // Always use production root

  // --- 1. Validate request ---
  if (!code) {
    console.error(`${LOG_PREFIX} Missing authorization code`);
    return createErrorRedirect(AuthError.MISSING_CODE);
  }

  // --- 2. Initialize clients ---
  const clientSupabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  // --- 3. Exchange code for session ---
  const { data: authData, error: authError } = await clientSupabase.auth.exchangeCodeForSession(code);

  if (authError || !authData?.user) {
    console.error(`${LOG_PREFIX} exchangeCodeForSession failed`, {
      error: authError?.message,
      name: authError?.name,
      status: authError?.status,
    });
    return createErrorRedirect(AuthError.INVALID_LINK);
  }

  const user = authData.user;
  const userEmail = user.email?.toLowerCase().trim() ?? null;
  const userId = user.id;

  // --- 4. Verify session persistence ---
  // We'll re-fetch the user after redirect to verify cookies persist
  const { data: persistedUser } = await clientSupabase.auth.getUser();
  if (!persistedUser.user || persistedUser.user.id !== userId) {
    console.error(`${LOG_PREFIX} Session persistence failed`, { originalUserId: userId });
    return createErrorRedirect(AuthError.SESSION_FAILURE);
  }

  let hasProcessedPurchases = false;
  let processingError: Error | null = null;

  try {
    // --- 5. Claim pending purchases (idempotent) ---
    const pendingResult = await adminSupabase
      .from("pending_purchases")
      .select("id, kind, course_id, stripe_session_id")
      .eq("email", userEmail)
      .eq("claimed", false)
      .limit(50); // Safety limit

    if (pendingResult.error) {
      throw new Error(`Failed to fetch pending purchases: ${pendingResult.error.message}`);
    }

    const pendingPurchases = pendingResult.data ?? [];
    hasProcessedPurchases = pendingPurchases.length > 0;

    // Process purchases in a transaction to ensure atomicity
    for (const purchase of pendingPurchases) {
      try {
        console.log(`${LOG_PREFIX} Processing purchase`, {
          purchaseId: purchase.id,
          kind: purchase.kind,
          courseId: purchase.course_id,
          stripeSessionId: purchase.stripe_session_id,
          userId,
          userEmail,
        });

        // Use an RPC function for atomic claim + processing
        const { data: claimResult, error: claimError } = await adminSupabase.rpc(
          "claim_and_process_purchase",
          {
            p_purchase_id: purchase.id,
            p_user_id: userId,
          }
        );

        if (claimError) {
          throw new Error(`RPC claim_and_process_purchase failed: ${claimError.message}`);
        }

        if (!claimResult) {
          throw new Error("RPC returned no result");
        }

        const { processed, provisioned, recorded } = claimResult;

        console.log(`${LOG_PREFIX} Purchase processing result`, {
          purchaseId: purchase.id,
          processed,
          provisioned,
          recorded,
        });

        if (!processed) {
          console.warn(`${LOG_PREFIX} Purchase not processed`, { purchaseId: purchase.id });
        }
      } catch (purchaseError) {
        console.error(`${LOG_PREFIX} Failed to process purchase`, {
          purchaseId: purchase.id,
          error: purchaseError instanceof Error ? purchaseError.message : String(purchaseError),
        });
        // Continue with next purchase even if one fails
      }
    }
  } catch (err) {
    processingError = err instanceof Error ? err : new Error(String(err));
    console.error(`${LOG_PREFIX} Purchase processing failed`, {
      error: processingError.message,
      stack: processingError.stack,
      userId,
      hasProcessedPurchases,
    });
  }

  // --- 6. Send confirmation email (best-effort) ---
  if (userEmail) {
    try {
      await sendAccessReadyEmail(userEmail);
      console.log(`${LOG_PREFIX} Confirmation email sent`, { userEmail });
    } catch (emailError) {
      console.error(`${LOG_PREFIX} Failed to send confirmation email`, {
        userEmail,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Email failure should not prevent successful redirect
    }
  }

  // --- 7. Determine redirect destination ---
  // Always redirect to dashboard, with success flag only if purchases were processed
  return createDashboardRedirect(hasProcessedPurchases);
}