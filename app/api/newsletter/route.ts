import {NextResponse} from "next/server";
import {publicLimit,validEmail} from "@/lib/publicRequests";
import {sameOrigin} from "@/lib/formation/server";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Origem inválida"},{status:403});
 const b=await req.json().catch(()=>null);if(!validEmail(b?.email)||b.consent!==true)return NextResponse.json({error:"Informe o email e confirme a inscrição."},{status:400});
 const email=b.email.trim().toLowerCase();const denied=await publicLimit(req,"newsletter",email);if(denied)return denied;
 const {error}=await createSupabaseAdminClient().from("newsletter_subscribers").upsert({email,active:true,consent_at:new Date().toISOString()},{onConflict:"email"});
 return error?NextResponse.json({error:"Não foi possível registrar a inscrição."},{status:503}):NextResponse.json({ok:true});
}
