import { vi } from "vitest";

export const mockConstructEvent = vi.fn();

export const mockStripe = {
  webhooks: {
    constructEvent: mockConstructEvent,
  },
};

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => mockStripe,
}));
