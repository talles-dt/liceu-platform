export function getCommerceConfig() {
  const courseId = process.env.NEXT_PUBLIC_COURSE_ID ?? process.env.COURSE_ID ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const ebookPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_EBOOK ??
    process.env.STRIPE_PRICE_EBOOK ??
    "";
  const videoPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_VIDEO ??
    process.env.STRIPE_PRICE_VIDEO ??
    "";
  const mentoringPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MENTORING ??
    process.env.STRIPE_PRICE_MENTORING ??
    "";
  const mentoringProgramPriceId =
    process.env.MENTORING_PROGRAM_PRICE_ID ??
    process.env.STRIPE_PRICE_MENTORING_INTERVIEW ??
    "";

  return {
    courseId,
    ebookPriceId,
    videoPriceId,
    mentoringPriceId,
    mentoringProgramPriceId, // Added
    webhookSecret,
  };
}

