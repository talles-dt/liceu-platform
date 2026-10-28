import {NextResponse} from "next/server";
import {requireCronSecret} from "@/lib/routeSecurity";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
export async function GET(request:Request){const denial=await requireCronSecret(request);if(denial)return denial;const {count,error}=await createSupabaseAdminClient().from("liceu_legacy_billing_events").select("event_id",{count:"exact",head:true}).is("resolved_at",null);if(error)return NextResponse.json({error:"Reconciliation unavailable"},{status:500});return NextResponse.json({pendingReconciliation:count,automaticProvisioning:false});}
export const POST=GET;
