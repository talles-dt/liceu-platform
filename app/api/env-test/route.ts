import { NextResponse } from "next/server";

export async function GET() {
 console.log('ENV TEST:', {
 STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
 STRIPE_PRICE_VIDEO: process.env.STRIPE_PRICE_VIDEO,
 });

 return NextResponse.json({
 stripeSecretKey: process.env.STRIPE_SECRET_KEY ? "LOADED" : "MISSING",
 stripePriceVideo: process.env.STRIPE_PRICE_VIDEO,
 });
}