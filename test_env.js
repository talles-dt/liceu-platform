require('dotenv').config({ path: '.env.local' });
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_PRICE_VIDEO:', process.env.STRIPE_PRICE_VIDEO);
console.log('NEXT_PUBLIC_STRIPE_PRICE_EBOOK:', process.env.NEXT_PUBLIC_STRIPE_PRICE_EBOOK);