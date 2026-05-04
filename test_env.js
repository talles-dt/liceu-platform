import "dotenv/config";

function status(name) {
  return process.env[name] ? "LOADED" : "MISSING";
}

console.log("STRIPE_SECRET_KEY:", status("STRIPE_SECRET_KEY"));
console.log("STRIPE_PRICE_VIDEO:", status("STRIPE_PRICE_VIDEO"));
console.log("NEXT_PUBLIC_STRIPE_PRICE_EBOOK:", status("NEXT_PUBLIC_STRIPE_PRICE_EBOOK"));
