import { NextResponse } from "next/server";
import {
  sendDiagnosisRejeicaoEmail,
  sendDiagnosisApostilaEmail,
  sendDiagnosisVideoEmail,
  sendDiagnosisEntrevistaEmail,
  type DiagnosisResult,
} from "@/lib/email";

/**
 * POST /api/email/diagnostico
 *
 * Called by the Typebot HTTP Request block at the end of the diagnosis flow.
 *
 * Body:
 *   { email: string, nome: string, resultado: "rejeicao" | "apostila" | "video" | "entrevista" }
 *
 * Typebot setup:
 *   Method: POST
 *   URL: https://www.oliceu.com/api/email/diagnostico
 *   Headers: Content-Type: application/json
 *   Body: { "email": "{{email}}", "nome": "{{nome}}", "resultado": "video" }
 *   (swap "video" for the variable that holds the result in your Typebot flow)
 */
export async function POST(req: Request) {
  let body: { email?: string; nome?: string; resultado?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, nome, resultado } = body;

  if (!email || !nome || !resultado) {
    return NextResponse.json(
      { error: "email, nome and resultado are required" },
      { status: 400 },
    );
  }

  const validResults: DiagnosisResult[] = [
    "rejeicao",
    "apostila",
    "video",
    "entrevista",
  ];

  if (!validResults.includes(resultado as DiagnosisResult)) {
    return NextResponse.json(
      { error: `resultado must be one of: ${validResults.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    switch (resultado as DiagnosisResult) {
      case "rejeicao":
        await sendDiagnosisRejeicaoEmail(email, nome);
        break;
      case "apostila":
        await sendDiagnosisApostilaEmail(email, nome);
        break;
      case "video":
        await sendDiagnosisVideoEmail(email, nome);
        break;
      case "entrevista":
        await sendDiagnosisEntrevistaEmail(email, nome);
        break;
    }
  } catch (e) {
    console.error("[email/diagnostico] send failed", e);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resultado });
}
