import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a chainable supabase mock
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

const mockSupabase = {
  from: vi.fn(() => makeSupabaseChain()),
  auth: { signOut: vi.fn(), getUser: vi.fn(), admin: { listUsers: vi.fn() } },
};

const mockGetCurrentUser = vi.fn();

vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue(mockSupabase),
  getCurrentUser: mockGetCurrentUser,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/onboarding/status", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const { GET } = await import("../../../../app/api/onboarding/status/route");
    const res = await GET();

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns status object for authenticated user with no purchases", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user_123",
      email: "user@test.com",
    });

    mockSupabase.from.mockReturnValue(makeSupabaseChain());

    const { GET } = await import("../../../../app/api/onboarding/status/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      hasAccount: true,
      hasPurchase: false,
      hasDiagnosis: false,
      firstModuleId: null,
      moduleName: null,
    });
  });

  it("returns hasPurchase:true when user has purchases", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user_123",
      email: "user@test.com",
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: "p1" }] }),
        }),
      }),
    });

    const { GET } = await import("../../../../app/api/onboarding/status/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasPurchase).toBe(true);
  });
});
