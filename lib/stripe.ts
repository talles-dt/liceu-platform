import Stripe from "stripe";

export function getStripeClient() {
 const secretKey = process.env.STRIPE_SECRET_KEY;

 console.log('STRIPE_SECRET_KEY:', secretKey ? 'LOADED (length: ' + secretKey.length + ')' : 'MISSING');

 if (!secretKey) {
 throw new Error("Stripe secret key is not configured.");
 }

 return new Stripe(secretKey, {
 apiVersion: "2024-06-20",
 });
}

