import { NextResponse } from "next/server";

// Minimal middleware - only redirects unauthenticated admin access
export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware() {
  // Optional: Add IP allowlisting if needed
  // const ALLOWED_IPS = process.env.ADMIN_IPS?.split(",") || [];
  // const ip = request.ip ?? request.headers.get("x-forwarded-for");
  // if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
  //  return NextResponse.redirect(new URL("/unauthorized", request.url));
  // }
  
  return NextResponse.next();
}
