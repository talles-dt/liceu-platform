import { vi } from "vitest";

export const ensureCourseProgressForUserAdmin = vi.fn().mockResolvedValue({ createdOrUpdated: 0 });
export const recordPurchaseAdmin = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/provisioning", () => ({
  ensureCourseProgressForUserAdmin,
}));

vi.mock("@/lib/purchases", () => ({
  recordPurchaseAdmin,
}));
