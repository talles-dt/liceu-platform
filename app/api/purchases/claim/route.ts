import {NextResponse} from "next/server";
import {requireCronSecret} from "@/lib/routeSecurity";
export async function POST(request:Request){const denial=await requireCronSecret(request);if(denial)return denial;return NextResponse.json({error:"Legacy purchases require reconciliation through the billing event ledger."},{status:409});}
