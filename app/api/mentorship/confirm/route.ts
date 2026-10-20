import { NextResponse } from "next/server";
export async function POST() {
 return NextResponse.json({ error: "Use a solicitação de mentoria em /servicos." }, { status: 410 });
}
