import { NextResponse } from "next/server";
export async function POST() {
 return NextResponse.json({ error: "O progresso é calculado pelo servidor. Envie as respostas pelo quiz do módulo." }, { status: 410 });
}
