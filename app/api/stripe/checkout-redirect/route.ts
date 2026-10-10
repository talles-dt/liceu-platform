import { NextResponse } from "next/server";
/** Old emailed links remain navigable; a GET must never create a charge session. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/conta", request.url), 303);
}
