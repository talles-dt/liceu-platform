import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";

export async function POST(req: Request) {
  const { calWebhookSecret } = getCommerceConfig();

  if (!calWebhookSecret) {
    return NextResponse.json({ error: "Missing CAL_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await req.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Cal.com sends two common shapes:
  // 1) Nested webhook format: { triggerEvent, payload }
  // 2) Flat event format: { id, uid, eventTypeId, attendees, startTime, endTime, ... }
  const triggerEvent = typeof parsed.triggerEvent === "string" ? parsed.triggerEvent.toLowerCase() : "";
  const payload = (parsed.payload as Record<string, unknown>) ?? {};

  const eventType = (parsed.eventType ?? triggerEvent) as string | undefined;
  const attendees = Array.isArray((parsed.attendees ?? payload.attendees))
    ? ((parsed.attendees ?? payload.attendees) as Array<{ email?: string; name?: string }>)
    : [];

  const attendeeEmail = (attendees.find((a) => a.email)?.email ?? (parsed as { email?: string }).email ?? "").toLowerCase();
  const attendeeName = (attendees.find((a) => a.name)?.name ?? (parsed as { name?: string }).name ?? "") as string;

  const calBookingId =
    (payload as { bookingUid?: string }).bookingUid ??
    (parsed as { bookingUid?: string }).bookingUid ??
    (parsed as { uid?: string }).uid ??
    (parsed as { bookingId?: string | number }).bookingId?.toString() ??
    (parsed as { id?: string | number }).id?.toString() ??
    "";

  const startTime =
    (parsed as { startTime?: string }).startTime ??
    (parsed as { start_time?: string }).start_time ??
    null;

  const endTime =
    (parsed as { endTime?: string }).endTime ??
    (parsed as { end_time?: string }).end_time ??
    null;

  const sessionId = calBookingId ? `cal_${calBookingId}` : "";

  if (sessionId && attendeeEmail) {
    const bookingRecord = {
      user_id: null,
      email: attendeeEmail,
      session_id: sessionId,
      attendee_name: attendeeName || null,
      cal_event_start: startTime,
      cal_event_end: endTime,
      cal_raw_payload: parsed,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("mentoring_bookings")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("mentoring_bookings").update(bookingRecord).eq("id", existing.id);
    } else {
      const insertPayload = {
        ...bookingRecord,
        created_at: new Date().toISOString(),
      };
      await supabase.from("mentoring_bookings").insert(insertPayload);
    }
  }

  if (eventType && sessionId) {
    const lowered = eventType.toLowerCase();
    if (lowered.includes("cancel") || lowered.includes("reject")) {
      await supabase.from("mentoring_bookings").delete().eq("session_id", sessionId);
    }
  }

  // Always accept the event — Cal.com only requires a 200.
  return NextResponse.json({ received: true });
}
