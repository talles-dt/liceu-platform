import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";

export async function POST(req: Request) {
  const { calWebhookSecret } = getCommerceConfig();

  if (!calWebhookSecret) {
    return NextResponse.json({ error: "Missing CAL_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = req.headers.get("x-cal-signature") ?? "";
  const body = await req.text();

  // Note: Replace with Cal.com's actual signature verification logic if needed.
  // Leaving this as a placeholder for webhook secret validation.
  // if (signature !== calWebhookSecret) {
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  // }

  let event: { triggerEvent?: string; payload?: Record<string, unknown> } = {};
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventTypeRaw = event.triggerEvent ?? "";
  const eventType = String(eventTypeRaw).toLowerCase();
  const payload = event.payload ?? {};

  if (!eventType || !payload) {
    return NextResponse.json({ error: "Missing event or payload" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const attendees = Array.isArray((payload as { attendees?: unknown[] }).attendees)
    ? ((payload as { attendees: Array<{ email?: string; name?: string }> }).attendees)
    : [];

  const attendeeEmail =
    attendees.find((a) => a.email)?.email?.toLowerCase() ??
    ((payload as { user?: { email?: string } }).user?.email ?? "").toLowerCase();

  const attendeeName =
    attendees.find((a) => a.name)?.name ??
    ((payload as { user?: { name?: string } }).user?.name ?? "");

  const calBookingId =
    (payload as { bookingUid?: string }).bookingUid ??
    (payload as { uid?: string }).uid ??
    (payload as { id?: string | number }).id?.toString() ?? "";

  const startTime =
    (payload as { startTime?: string }).startTime ??
    (payload as { start_time?: string }).start_time ??
    null;

  const endTime =
    (payload as { endTime?: string }).endTime ??
    (payload as { end_time?: string }).end_time ??
    null;

  if (!attendeeEmail || !calBookingId) {
    return NextResponse.json({ error: "Missing attendee or booking id" }, { status: 400 });
  }

  const sessionId = `cal_${calBookingId}`;

  if (eventType === "booking.created" || eventType === "booking.updated" || eventType === "booking.accepted") {
    const { data: existing } = await supabase
      .from("mentoring_bookings")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    const bookingRecord = {
      user_id: null,
      email: attendeeEmail,
      session_id: sessionId,
      attendee_name: attendeeName || null,
      cal_event_start: startTime,
      cal_event_end: endTime,
      cal_raw_payload: payload,
      created_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase
        .from("mentoring_bookings")
        .update(bookingRecord)
        .eq("id", existing.id);
    } else {
      await supabase.from("mentoring_bookings").insert(bookingRecord);
    }
  }

  if (eventType === "booking.cancelled" || eventType === "booking.rejected") {
    await supabase
      .from("mentoring_bookings")
      .delete()
      .eq("session_id", sessionId);
  }

  return NextResponse.json({ received: true });
}
