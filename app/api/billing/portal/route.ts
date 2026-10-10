import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";
export async function POST(request: Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const origin=process.env.NEXT_PUBLIC_SITE_URL && new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
 if(!origin || request.headers.get("origin")!==origin)return NextResponse.json({error:"Forbidden"},{status:403});
 const {data,error}=await createSupabaseAdminClient().from("liceu_billing_accounts").select("customer_id").eq("user_id",user.id).maybeSingle();
 if(error || !data?.customer_id)return NextResponse.json({error:"Nenhuma conta de cobrança encontrada."},{status:404});
 const session=await getStripeClient().billingPortal.sessions.create({customer:data.customer_id,return_url:`${origin}/conta`});
 return NextResponse.json({url:session.url});
}
