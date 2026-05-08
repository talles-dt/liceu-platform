import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// Ensure the next/headers mock is loaded
import { mockSupabase } from "../../mocks/supabase";

describe("POST /api/auth/logout", () => {
  it("only allows POST (no GET handler exported)", async () => {
    const mod = await import("../../../../app/api/auth/logout/route");

    // The route only exports POST
    expect(mod.GET).toBeUndefined();
    expect(mod.POST).toBeDefined();
  });

  it("calls signOut and returns 200 on POST", async () => {
    const { POST } = await import("../../../../app/api/auth/logout/route");

    const res = await POST();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
