import { vi } from "vitest";

export const mockHeaders = {
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(mockHeaders),
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  }),
}));
