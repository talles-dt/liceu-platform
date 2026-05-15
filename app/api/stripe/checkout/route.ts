import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";
import type { PurchaseKind } from "@/lib/purchases";

// Simple in-memory rate limiter for checkout
const checkoutRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkCheckoutRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = checkoutRateLimit.get(key);

  if (!entry || now > entry.resetAt) {
    checkoutRateLimit.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: Request) {
  // Rate limit: 5 checkout sessions per 10 minutes
  const rateLimitKey = `checkout:${request.headers.get("x-forwarded-for") || "unknown"}`;
  if (!checkCheckoutRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  // Auth is optional — buyers may not have an account yet.
  const user = await getCurrentUser().catch(() => null);

  const body = (await request.json().catch(() => ({}))) as { kind?: PurchaseKind };
  const kind: PurchaseKind = body.kind ?? "video";

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
    return NextResponse.json(
      { error: `Missing Stripe price for kind=${kind}` },
      { status: 500 },
    );
  }

  // course_id embedded in metadata so webhook knows what to provision.
  // mentoring_interview has no course to provision at this stage.
  const resolvedCourseId =
    kind === "ebook"
      ? ebookCourseId
      : kind === "mentoring_interview"
        ? ""
        : courseId;

  if (kind === "video" && !resolvedCourseId) {
    return NextResponse.json(
      { error: "Missing COURSE_ID for video purchase" },
      { status: 500 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://oliceu.com";

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?purchase=success`,
    cancel_url: `${origin}/programa?purchase=cancel`,
    customer_email: user?.email ?? undefined,
    metadata: {
      user_id: user?.id ?? "",
      purchase_kind: kind,
      course_id: resolvedCourseId,
    },
  });

  return NextResponse.json({ url: session.url });
}
