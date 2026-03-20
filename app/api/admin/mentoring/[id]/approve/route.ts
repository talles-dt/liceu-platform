import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getStripeClient } from "@/lib/stripe";
import { getCommerceConfig } from "@/lib/commerce";
import { sendMentoringApprovedEmail } from "@/lib/email";

type Context = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Context) {
  // Admin guard
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseUser = await createSupabaseServerClient();
  const { data: profile } = await supabaseUser
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    profile?.role === "admin" ||
    (user.email && envAdmins.includes(user.email.toLowerCase()));

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  // Load the application
  const { data: application, error } = await supabase
    .from("mentoring_applications")
    .select("id, email, status, stripe_coupon_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "pending_interview") {
    return NextResponse.json(
      { error: `Cannot approve application with status: ${application.status}` },
      { status: 400 },
    );
  }

  const { mentoringProgramPriceId } = getCommerceConfig();
  if (!mentoringProgramPriceId) {
    return NextResponse.json(
      { error: "Missing STRIPE_PRICE_MENTORING_PROGRAM" },
      { status: 500 },
    );
  }

  const stripe = getStripeClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Create a single-use R$99 discount coupon
  const coupon = await stripe.coupons.create({
    amount_off: 9900, // R$99 in centavos
    currency: "brl",
    max_redemptions: 1,
    name: `Crédito entrevista — ${application.email}`,
    metadata: { application_id: id },
  });

  // Create the checkout session with coupon pre-applied
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: mentoringProgramPriceId, quantity: 1 }],
    discounts: [{ coupon: coupon.id }],
    customer_email: application.email,
    success_url: `${siteUrl}/dashboard?purchase=success`,
    cancel_url: `${siteUrl}/mentoria?purchase=cancel`,
    metadata: {
      user_id: "",
      purchase_kind: "mentoring_program",
      course_id: "",
    },
  });

  // Update application status
  await supabase
    .from("mentoring_applications")
    .update({
      status: "approved_pending_payment",
      stripe_coupon_id: coupon.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Send approval email with checkout link
  await sendMentoringApprovedEmail(application.email, session.url!).catch((e) =>
    console.error("[approve] sendMentoringApprovedEmail failed", e),
  );

  return NextResponse.json({ ok: true, checkoutUrl: session.url });
}
