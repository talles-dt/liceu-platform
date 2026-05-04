"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendAccessReadyEmail } from "@/lib/email";

// Constants
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

function getRedirectRoot(requestUrl: string): string {
  const url = new URL(requestUrl);
  // Allow override via environment, but default to request origin
  return process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : url.origin;
}

function createErrorRedirect(requestUrl: string, error: AuthError): RedirectResponse {
  const root = getRedirectRoot(requestUrl);
  return NextResponse.redirect(`${root}/login?error=${error}`);
}

function createDashboardRedirect(requestUrl: string, success: boolean): RedirectResponse {
  const root = getRedirectRoot(requestUrl);
  const url = new URL(`${root}/dashboard`);
  if (success) {
    url.searchParams.set("purchase", "success");
  }
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request): Promise<RedirectResponse> {
  // --- 1. Extract initial parameters ---
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const requestUrl = request.url;
  const redirectRoot = getRedirectRoot(requestUrl);

  // --- 2. Initialize clients ---
  const clientSupabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  let user = null;
  let authError: Error | null = null;

  // --- 3. Handle either OAuth or magic link flow ---
  if (code) {
    // Flow A: OAuth/recovery flow with code
    console.log(`${LOG_PREFIX} OAuth/recovery flow - code detected`, { type });
    const { data: authData, error: exchangeError } = await clientSupabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError || !authData?.user) {
      console.error(`${LOG_PREFIX} exchangeCodeForSession failed`, {
        error: exchangeError?.message,
        name: exchangeError?.name,
        status: exchangeError?.status,
        type,
      });
      authError = exchangeError || new Error("Exchange returned no user");
    } else {
      user = authData.user;
      // --- RECOVERY DETECTION ---
      if (type === "recovery") {
        console.log(`${LOG_PREFIX} Password recovery flow - redirecting to reset page`);
        return NextResponse.redirect(`${redirectRoot}/reset-password`);
      }
    }
  } else {
    // Flow B: Magic link flow (no code)
    console.log(`${LOG_PREFIX} Magic link flow - no code detected`);
    const { data: { user: currentUser }, error: userError } = await clientSupabase.auth.getUser();
    
    if (userError || !currentUser) {
      console.error(`${LOG_PREFIX} getUser failed`, {
        error: userError?.message,
        name: userError?.name,
        status: userError?.status,
      });
      authError = userError || new Error("getUser returned no user");
    } else {
      user = currentUser;
    }
  }

  if (authError || !user) {
    console.error(`${LOG_PREFIX} Auth failed`, { error: authError?.message });
    return createErrorRedirect(requestUrl, AuthError.INVALID_LINK);
  }

  const userEmail = user.email?.toLowerCase().trim() ?? null;
  const userId = user.id;

  // --- 4. Verify session persistence ---
  const { data: persistedUser, error: persistenceError } = await clientSupabase.auth.getUser();
  if (persistenceError || !persistedUser.user || persistedUser.user.id !== userId) {
    console.error(`${LOG_PREFIX} Session persistence failed`, {
      originalUserId: userId,
      persistenceError: persistenceError?.message
    });
    return createErrorRedirect(requestUrl, AuthError.SESSION_FAILURE);
  }

  let hasProcessedPurchases = false;
  let processingError: Error | null = null;

  try {
    // --- 5. Claim pending purchases (unchanged - atomic RPC) ---
    const pendingResult = await adminSupabase
      .from("pending_purchases")
      .select("id, kind, course_id, stripe_session_id")
      .eq("email", userEmail)
      .eq("claimed", false)
      .limit(50);

    if (pendingResult.error) {
      throw new Error(`Failed to fetch pending purchases: ${pendingResult.error.message}`);
    }

    const pendingPurchases = pendingResult.data ?? [];
    hasProcessedPurchases = pendingPurchases.length > 0;

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
    }
  }

  // --- 7. Determine redirect destination ---
  return createDashboardRedirect(requestUrl, hasProcessedPurchases);
}
