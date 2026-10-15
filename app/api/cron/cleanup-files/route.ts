import {NextResponse} from "next/server";
import {requireCronSecret} from "@/lib/routeSecurity";
// Age alone is not a retention policy for educational evidence.
export async function GET(request:Request){const denial=await requireCronSecret(request);if(denial)return denial;return NextResponse.json({status:"disabled",deleted:0,reason:"Retenção e reconciliação de referências pendentes; arquivos preservados."});}
export const POST=GET;
