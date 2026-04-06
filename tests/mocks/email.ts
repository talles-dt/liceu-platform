import { vi } from "vitest";

export const sendDiagnosisRejeicaoEmail = vi.fn().mockResolvedValue(undefined);
export const sendDiagnosisApostilaEmail = vi.fn().mockResolvedValue(undefined);
export const sendDiagnosisVideoEmail = vi.fn().mockResolvedValue(undefined);
export const sendDiagnosisEntrevistaEmail = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/email", () => ({
  sendDiagnosisRejeicaoEmail,
  sendDiagnosisApostilaEmail,
  sendDiagnosisVideoEmail,
  sendDiagnosisEntrevistaEmail,
  sendAccessReadyEmail: vi.fn().mockResolvedValue(undefined),
  sendRegistrationEmail: vi.fn().mockResolvedValue(undefined),
  sendInterviewSchedulingEmail: vi.fn().mockResolvedValue(undefined),
  sendMentoringApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendMentoringRejectedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/resend", () => ({
  getResendClient: () => ({
    emails: { send: vi.fn().mockResolvedValue({}) },
  }),
}));
