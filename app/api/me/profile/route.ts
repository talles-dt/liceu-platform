import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin} from "@/lib/formation/server";
export async function PATCH(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json().catch(()=>null);
 if(typeof b?.name!=="string"||!b.name.trim()||b.name.length>200)return NextResponse.json({error:"Informe um nome de até 200 caracteres."},{status:400});
 const db=createSupabaseAdminClient(user.id);
 const {error}=await db.from("users").update({name:b.name.trim(),updated_at:new Date().toISOString()}).eq("id",user.id);
 return error?NextResponse.json({error:"Não foi possível corrigir o nome."},{status:503}):NextResponse.json({ok:true});
}
