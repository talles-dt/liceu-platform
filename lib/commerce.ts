export function getCommerceConfig() {
  const courseId = process.env.COURSE_ID ?? process.env.NEXT_PUBLIC_COURSE_ID ?? "";
  const ebookCourseId = process.env.EBOOK_COURSE_ID ?? "";
  const mentoringCourseId = process.env.MENTORING_COURSE_ID ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  const ebookPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_EBOOK ?? process.env.STRIPE_PRICE_EBOOK ?? "";
  const videoPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_VIDEO ?? process.env.STRIPE_PRICE_VIDEO ?? "";
  // R$99 interview fee
  const mentoringInterviewPriceId = process.env.STRIPE_PRICE_MENTORING_INTERVIEW ?? "";
  // R$4.999 full program (used server-side only in approve route)
  const mentoringProgramPriceId = process.env.STRIPE_PRICE_MENTORING_PROGRAM ?? "";

  const calInterviewLink = process.env.CAL_INTERVIEW_LINK ?? "";
  const calMentoringLink = process.env.CAL_MENTORING_LINK ?? "";

  return {
    courseId,
    ebookCourseId,
    mentoringCourseId,
    ebookPriceId,
    videoPriceId,
    mentoringInterviewPriceId,
    mentoringProgramPriceId,
    calInterviewLink,
    calMentoringLink,
    webhookSecret,
  };
}

