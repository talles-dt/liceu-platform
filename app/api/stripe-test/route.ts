import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";


export async function GET() {
 try {
 const stripe = getStripeClient();
 
 // Test ping to Stripe
 const balance = await stripe.balance.retrieve();
 
 // Test price retrieval
 const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_VIDEO || '');
 
 return NextResponse.json({
 status: "success",
 balance: balance.available[0].amount,
 price: price.id,
 });
 } catch (e) {
 console.error("Stripe test error:", e);
 return NextResponse.json({
 status: "error",
 error: e instanceof Error ? e.message : String(e),
 stack: e instanceof Error ? e.stack : undefined,
 }, { status: 500 });
 }
}