import { NextResponse } from "next/server";

// Middleware: sets x-pathname so server components can know the current route
export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(request: Request) {
  // Pass current pathname to server components so admin/layout can suppress
  // redirect for /admin/login without full auth
  const requestHeaders = new Headers(request.headers);
  const url = new URL(request.url);
  requestHeaders.set("x-pathname", url.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
