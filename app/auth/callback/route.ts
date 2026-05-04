"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ensureCourseProgressForUserAdmin } from "@/lib/provisioning";
import { recordPurchaseAdmin, type PurchaseKind } from "@/lib/purchases";
import { sendAccessReadyEmail } from "@/lib/email";

// Constants
const LOG_PREFIX = "[auth/callback]";
const DEFAULT_REDIRECT_ROOT = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://www.oliceu.com");

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
  // ============== STEP 1: Extract params safely ==============
  console.log("[AUTH_CALLBACK]", {
    url: request.url,
    timestamp: new Date().toISOString()
  });
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const requestUrl = request.url;
  const redirectRoot = getRedirectRoot(requestUrl);

  // ============== STEP 2: FAIL FAST if no code ==============
  if (!code) {
    console.error("[AUTH_CALLBACK] Missing code");
    return createErrorRedirect(requestUrl, AuthError.MISSING_CODE);
  }

  // --- Initialize clients ---
  const clientSupabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  // ============== STEP 3: Exchange session ==============
  const { data: authData, error: exchangeError } = await clientSupabase.auth.exchangeCodeForSession(code);
  
  // ============== STEP 4: HANDLE FAILURE ==============
  if (exchangeError || !authData?.user) {
    console.error("[AUTH_CALLBACK] Exchange failed", {
      error: exchangeError?.message,
      type,
      code
    });
    return createErrorRedirect(requestUrl, AuthError.INVALID_LINK);
  }

  const user = authData.user;
  
  // ============== STEP 5: RECOVERY FLOW (IMMEDIATE EXIT) ==============
  if (type === "recovery") {
    console.log("[AUTH_CALLBACK] Recovery flow detected");
    return NextResponse.redirect(`${redirectRoot}/reset-password`);
  }

  // --- Final auth check ---
  const { data: { user: persistedUser }, error: persistenceError } = await clientSupabase.auth.getUser();
  if (persistenceError || !persistedUser.user || persistedUser.user.id !== user.id) {
    console.error("[AUTH_CALLBACK] Session persistence failed");
    return createErrorRedirect(requestUrl, AuthError.SESSION_FAILURE);
  }

  const userEmail = user.email?.toLowerCase().trim() ?? null;
  const userId = user.id;

  // --- Purchase processing ---
  let hasProcessedPurchases = false;
  let processingError: Error | null = null;

  try {
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
        console.log("[AUTH_CALLBACK] Processing purchase", {
          purchaseId: purchase.id,
          kind: purchase.kind,
        });

        const { data: claimResult, error: claimError } = await adminSupabase.rpc(
          "claim_and_process_purchase",
          {
            p_purchase_id: purchase.id,
            p_user_id: userId,
          }
        );

        if (claimError) {
          throw new Error(`RPC failed: ${claimError.message}`);
        }

        if (!claimResult) {
          throw new Error("RPC returned no result");
        }
      } catch (purchaseError) {
        console.error("[AUTH_CALLBACK] Purchase processing error", {
          purchaseId: purchase.id,
          error: purchaseError instanceof Error ? purchaseError.message : String(purchaseError),
        });
      }
    }
  } catch (err) {
    processingError = err instanceof Error ? err : new Error(String(err));
    console.error("[AUTH_CALLBACK] Purchase processing failed", {
      error: processingError.message,
      userId,
      hasProcessedPurchases,
    });
  }

  // --- Email confirmation ---
  if (userEmail) {
    try {
      await sendAccessReadyEmail(userEmail);
      console.log("[AUTH_CALLBACK] Confirmation email sent", { userEmail });
    } catch (emailError) {
      console.error("[AUTH_CALLBACK] Failed to send confirmation email", {
        userEmail,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    }
  }

  // ============== STEP 6: DEFAULT FLOW ==============
  return createDashboardRedirect(requestUrl, hasProcessedPurchases);
}