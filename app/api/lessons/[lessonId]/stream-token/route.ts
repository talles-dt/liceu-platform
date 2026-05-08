import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getUserAccessLevel } from "@/lib/access";
import { resolveLessonAccess } from "@/lib/routeSecurity";

type Context = { params: Promise<{ lessonId: string }> };

/**
 * GET /api/lessons/[lessonId]/stream-token
 *
 * Returns a signed Cloudflare Stream token for the lesson video.
 * Token expires in 1 hour. Only issued to authenticated users with access.
 *
 * Env vars needed:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_STREAM_KEY_ID       — from Stream > Signing Keys
 *   CLOUDFLARE_STREAM_PRIVATE_KEY  — PEM private key (base64 encoded)
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const { access, denial } = await resolveLessonAccess(user.id, lessonId);
  if (denial) return denial;

  const accessLevel = await getUserAccessLevel(user.id, access.courseId);
  if (accessLevel === "ebook") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const keyId = process.env.CLOUDFLARE_STREAM_KEY_ID;
  const privateKeyB64 = process.env.CLOUDFLARE_STREAM_PRIVATE_KEY;

  if (!accountId || !keyId || !privateKeyB64) {
    return NextResponse.json({ error: "Cloudflare Stream not configured" }, { status: 500 });
  }

  // Load lesson to get the stream video ID
  const supabase = createSupabaseAdminClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("cloudflare_stream_id")
    .eq("id", lessonId)
    .maybeSingle<{ cloudflare_stream_id: string | null }>();

  if (!lesson?.cloudflare_stream_id) {
    return NextResponse.json({ error: "No video for this lesson" }, { status: 404 });
  }

  // Build a signed token using Cloudflare's JWT approach
  // https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
  const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  const payload = {
    sub: lesson.cloudflare_stream_id,
    kid: keyId,
    exp,
    // Optionally restrict to user — good for audit trail
    accessRules: [
      { type: "any", action: "allow" },
    ],
  };

  // Cloudflare uses RSA-SHA256 signed JWTs
  const privateKeyPem = Buffer.from(privateKeyB64, "base64").toString("utf-8");

  const header = { alg: "RS256", kid: keyId };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${headerB64}.${payloadB64}`;

  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKeyPem, "base64url");

  const token = `${signingInput}.${signature}`;

  return NextResponse.json({ token, videoId: lesson.cloudflare_stream_id });
}
