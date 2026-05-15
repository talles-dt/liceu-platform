import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";
import type { PurchaseKind } from "@/lib/purchases";

/**
 * GET /api/stripe/checkout-redirect?kind=video
 *
 * Used by Typebot buttons and email links — a plain URL redirect that creates
 * a Stripe checkout session and sends the user straight to Stripe's hosted page.
 *
 * kind: ebook | video | mentoring_interview
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const kind = (searchParams.get("kind") ?? "video") as PurchaseKind;

  const validKinds: PurchaseKind[] = ["ebook", "video", "mentoring_interview"];
  if (!validKinds.includes(kind)) {
    return NextResponse.redirect(`${origin}/programa?error=invalid_kind`);
  }

  const {
    courseId,
    ebookCourseId,
    ebookPriceId,
    videoPriceId,
    mentoringInterviewPriceId,
  } = getCommerceConfig();

  const priceId =
    kind === "ebook"
      ? ebookPriceId
      : kind === "mentoring_interview"
        ? mentoringInterviewPriceId
        : videoPriceId;

  if (!priceId) {
    return NextResponse.redirect(`${origin}/programa?error=missing_price`);
  }

  const resolvedCourseId =
    kind === "ebook"
      ? ebookCourseId
      : kind === "mentoring_interview"
        ? ""
        : courseId;

  // Auth is optional — pre-registration buyers won't have a session
  const user = await getCurrentUser().catch(() => null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?purchase=success`,
      cancel_url: `${siteUrl}/programa?purchase=cancel`,
      customer_email: user?.email ?? undefined,
      metadata: {
        user_id: user?.id ?? "",
        purchase_kind: kind,
        course_id: resolvedCourseId,
      },
    });

    if (!session.url) {
      return NextResponse.redirect(`${siteUrl}/programa?error=stripe_failed`);
    }

    return NextResponse.redirect(session.url);
  } catch (e) {
    console.error("[checkout-redirect] Stripe error", e);
    return NextResponse.redirect(`${siteUrl}/programa?error=stripe_failed`);
  }
}
