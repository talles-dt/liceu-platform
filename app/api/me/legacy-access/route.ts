import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin} from "@/lib/formation/server";
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data,error}=await createSupabaseAdminClient(user.id).rpc("liceu_claim_legacy",{p_user:user.id});
 return error?NextResponse.json({error:"Conciliação indisponível"},{status:503}):NextResponse.json({claimed:data});
}
