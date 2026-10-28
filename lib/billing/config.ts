export function billingConfig() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  if (!site || !priceId || process.env.STRIPE_SALES_ENABLED !== "true")
    throw new Error("As assinaturas ainda não estão abertas.");
  const origin = new URL(site).origin;
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https://")) throw new Error("Configure um domínio HTTPS.");
  return { origin, priceId };
}
