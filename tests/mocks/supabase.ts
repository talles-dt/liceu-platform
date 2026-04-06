import { vi } from "vitest";

export const mockSupabase = {
  from: vi.fn(() => mockTable),
  auth: {
    signOut: vi.fn().mockResolvedValue({}),
    getUser: vi.fn(),
    admin: {
      listUsers: vi.fn(),
      inviteUserByEmail: vi.fn(),
    },
  },
};

export const mockTable = {
  select: vi.fn(() => mockSelect),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn(() => mockUpdate),
  eq: vi.fn(() => mockEq),
  limit: vi.fn(),
  in: vi.fn(() => mockEq),
  order: vi.fn(() => mockEq),
  maybeSingle: vi.fn(),
};

export const mockSelect = {
  eq: vi.fn(() => mockEq),
  limit: vi.fn(),
  in: vi.fn(() => mockEq),
  order: vi.fn(() => mockEq),
};

export const mockEq = {
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn(() => mockEq),
  in: vi.fn(() => mockEq),
};

export const mockUpdate = {
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdminClient: () => mockSupabase,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue(mockSupabase),
  getCurrentUser: vi.fn(),
}));
