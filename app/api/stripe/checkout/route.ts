import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";

type PurchaseKind = "ebook" | "video" | "mentoring";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    kind?: PurchaseKind;
  };
  const kind: PurchaseKind = body.kind ?? "video";

  const { courseId, ebookPriceId, videoPriceId, mentoringPriceId } =
    getCommerceConfig();

  const priceId =
    kind === "ebook"
      ? ebookPriceId
      : kind === "mentoring"
        ? mentoringPriceId
        : videoPriceId;

  if (!priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price for kind=${kind}` },
      { status: 500 },
    );
  }

  // only required for the course access purchase
  if (kind === "video" && !courseId) {
    return NextResponse.json(
      { error: "Missing COURSE_ID for video purchase" },
      { status: 500 },
    );
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?purchase=success`,
    cancel_url: `${origin}/dashboard?purchase=cancel`,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
      purchase_kind: kind,
      course_id: kind === "video" ? courseId : "",
    },
  });

  return NextResponse.json({ url: session.url });
}

