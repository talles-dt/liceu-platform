import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  sendDiagnosisRejeicaoEmail,
  sendDiagnosisApostilaEmail,
  sendDiagnosisVideoEmail,
  sendDiagnosisEntrevistaEmail,
} from "../../mocks/email";

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("POST /api/email/diagnostico", () => {
  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "John", resultado: "video" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("required");
  });

  it("returns 400 when nome is missing", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", resultado: "video" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when resultado is missing", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", nome: "John" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid resultado value", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", nome: "John", resultado: "invalid" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("resultado must be one of");
  });

  it("returns 200 for valid video diagnosis", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", nome: "Joao", resultado: "video" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, resultado: "video" });
    expect(sendDiagnosisVideoEmail).toHaveBeenCalledWith("user@test.com", "Joao");
  });

  it("returns 200 for valid apostila diagnosis", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", nome: "Maria", resultado: "apostila" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(sendDiagnosisApostilaEmail).toHaveBeenCalledWith("user@test.com", "Maria");
  });

  it("returns 200 for valid entrevista diagnosis", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", nome: "Carlos", resultado: "entrevista" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(sendDiagnosisEntrevistaEmail).toHaveBeenCalledWith("user@test.com", "Carlos");
  });

  it("returns 200 for valid rejeicao diagnosis", async () => {
    const { POST } = await import("../../../../app/api/email/diagnostico/route");
    const req = new Request("http://localhost/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", nome: "Ana", resultado: "rejeicao" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(sendDiagnosisRejeicaoEmail).toHaveBeenCalledWith("user@test.com", "Ana");
  });
});
