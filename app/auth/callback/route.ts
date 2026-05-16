`use server`;

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

function getRedirectRoot(requestUrl: string): string {
  const url = new URL(requestUrl);
  // Allow override via environment, but default to request origin
  return process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : url.origin;
}

function createErrorRedirect(requestUrl: string, error: AuthError): NextResponse {
  const root = getRedirectRoot(requestUrl);
  return NextResponse.redirect(`${root}/login?error=${error}`);
}

function createHtmlRedirect(url: string): NextResponse {
  return new NextResponse(
    `<html><head>
      <meta http-equiv="refresh" content="0; url=${url}">
      <script>window.location.href = "${url}"</script>
    </head><body></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const requestUrl = request.url;
  const redirectRoot = getRedirectRoot(requestUrl);

  // FAIL FAST if no code
  if (!code) {
    console.error(`${LOG_PREFIX} Missing code`);
    return createErrorRedirect(requestUrl, AuthError.MISSING_CODE);
  }

  // --- Special case: recovery flow
  if (type === "recovery") {
    console.log(`${LOG_PREFIX} Recovery flow detected`);
    return createHtmlRedirect(`${redirectRoot}/reset-password?code=${encodeURIComponent(code)}`);
  }

  // --- Normal auth flow
  const clientSupabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  // Exchange code → session
  const { data: authData, error: exchangeError } = await clientSupabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !authData?.user) {
    console.error(`${LOG_PREFIX} Exchange failed`, exchangeError?.message);
    return createErrorRedirect(requestUrl, AuthError.INVALID_LINK);
  }

  // Persistence check
  const { data: { user: persistedUser }, error: persistenceError } = await clientSupabase.auth.getUser();
  if (persistenceError || !persistedUser || persistedUser.id !== authData.user.id) {
    console.error(`${LOG_PREFIX} Session persistence failed`);
    return createErrorRedirect(requestUrl, AuthError.SESSION_FAILURE);
  }

  const user = authData.user;
  const userEmail = user.email?.toLowerCase().trim() ?? null;
  const userId = user.id;

  // --- Process pending purchases
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
      throw new Error(`Pending purchases fetch failed: ${pendingResult.error.message}`);
    }

    const pendingPurchases = pendingResult.data ?? [];
    hasProcessedPurchases = pendingPurchases.length > 0;

    for (const purchase of pendingPurchases) {
      try {
        await adminSupabase.rpc("claim_and_process_purchase", {
          p_purchase_id: purchase.id,
          p_user_id: userId,
        });
      } catch (purchaseError) {
        console.error(`${LOG_PREFIX} Purchase claim failed`, purchaseError instanceof Error ? purchaseError.message : purchaseError);
      }
    }
  } catch (err) {
    processingError = err instanceof Error ? err : new Error(String(err));
    console.error(`${LOG_PREFIX} Purchase processing failed`, processingError.message);
  }

  // Send access ready email
  if (userEmail) {
    await sendAccessReadyEmail(userEmail).catch(err => {
      console.error(`${LOG_PREFIX} Access email failed`, err instanceof Error ? err.message : err);
    });
  }

  // Final redirect
  return NextResponse.redirect(`${redirectRoot}/dashboard${hasProcessedPurchases ? "?purchase=success" : ""}`);
}