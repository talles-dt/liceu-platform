import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockHeaders } from "../../mocks/next-headers";
import { mockConstructEvent } from "../../mocks/stripe";
import { mockSupabase } from "../../mocks/supabase";
import { ensureCourseProgressForUserAdmin, recordPurchaseAdmin } from "../../mocks/provisioning";

// Commerce config that can be overridden per-test
let commerceConfigOverride: Record<string, unknown> | null = null;

vi.mock("@/lib/commerce", () => ({
  getCommerceConfig: () => {
    if (commerceConfigOverride) return commerceConfigOverride;
    return {
      webhookSecret: "whsec_test_secret",
      courseId: "course_video_id",
      ebookCourseId: "course_ebook_id",
      mentoringCourseId: "course_mentoring_id",
      calInterviewLink: "https://cal.link/interview",
    };
  },
}));

/** Expose the override setter to tests */
function setCommerceConfig(cfg: Record<string, unknown>) {
  commerceConfigOverride = cfg;
}

function resetCommerceConfig() {
  commerceConfigOverride = null;
}

/**
 * Helper: build a chainable supabase mock that supports
 *   .from("table").select("...").eq("k", "v").maybeSingle()
 *   .from("table").update({...}).eq("k", "v")
 *   .from("table").insert({...})
 *   .from("table").upsert({...}, {...})
 */
function makeSupabaseChain(selectResult: unknown = null) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    limit: vi.fn().mockResolvedValue({ data: [] }),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue({ data: selectResult }),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  resetCommerceConfig();

  mockConstructEvent.mockReset();
  mockHeaders.get.mockReset();
  mockSupabase.from.mockReset();
  ensureCourseProgressForUserAdmin.mockReset().mockResolvedValue({ createdOrUpdated: 0 });
  recordPurchaseAdmin.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/stripe/webhook", () => {
  it("returns 500 when webhook secret is missing", async () => {
    setCommerceConfig({
      webhookSecret: "",
      courseId: "course_video_id",
      ebookCourseId: "course_ebook_id",
      mentoringCourseId: "course_mentoring_id",
      calInterviewLink: "https://cal.link/interview",
    });

    const { POST } = await import("../../../app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: "Missing STRIPE_WEBHOOK_SECRET" });
  });

  it("returns 400 for invalid signature", async () => {
    mockHeaders.get.mockReturnValue("invalid_signature");
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const { POST } = await import("../../../app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload_body",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("signature");
  });

  it("returns 200 with received:true for non-checkout events", async () => {
    mockHeaders.get.mockReturnValue("valid_signature");
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      data: { object: {} },
    });

    const { POST } = await import("../../../app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload_body",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("returns 200 when payment_status is not paid", async () => {
    mockHeaders.get.mockReturnValue("valid_signature");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "sess_123",
          payment_status: "unpaid",
          customer_email: "buyer@test.com",
          metadata: { purchase_kind: "video", user_id: "", course_id: "" },
        },
      },
    });

    const { POST } = await import("../../../app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload_body",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("provisions course for valid paid video session with existing user", async () => {
    mockHeaders.get.mockReturnValue("valid_signature");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "sess_paid",
          payment_status: "paid",
          customer_email: "user@test.com",
          metadata: { purchase_kind: "video", user_id: "user_123", course_id: "course_abc" },
          amount_total: 5000,
          currency: "brl",
        },
      },
    });

    const chain = makeSupabaseChain(null);
    mockSupabase.from.mockReturnValue(chain);

    const { POST } = await import("../../../app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload_body",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("provisions course for valid paid ebook session without user (invite flow)", async () => {
    const newUserId = "invited_user_456";
    mockHeaders.get.mockReturnValue("valid_signature");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "sess_ebook",
          payment_status: "paid",
          customer_email: "newbuyer@test.com",
          metadata: { purchase_kind: "ebook", user_id: "", course_id: "" },
          amount_total: 3000,
          currency: "brl",
        },
      },
    });

    const chain = makeSupabaseChain(null);
    mockSupabase.from.mockReturnValue(chain);
    mockSupabase.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } });
    mockSupabase.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: newUserId } },
      error: null,
    });

    const { POST } = await import("../../../app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload_body",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSupabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
      "newbuyer@test.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/login"),
      }),
    );
  });
});
