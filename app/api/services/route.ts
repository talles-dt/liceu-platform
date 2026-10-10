import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
export async function POST(request:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await request.json().catch(()=>null);
 if(!["review","mentoring"].includes(b?.kind)||typeof b?.scope!=="string"||b.scope.length<20||b.scope.length>3000)return NextResponse.json({error:"Descreva seu objetivo em 20 a 3.000 caracteres."},{status:400});
 const db=createSupabaseAdminClient();
 if(b.kind==="review"){
  const {data:work,error}=await db.from("liceu_work_versions").select("id").eq("id",b.workVersionId).eq("user_id",user.id).maybeSingle();
  if(error||!work)return NextResponse.json({error:"Selecione uma produção sua."},{status:400});
 }
 const {data,error}=await db.from("liceu_service_orders").insert({user_id:user.id,kind:b.kind,scope:b.scope,work_version_id:b.kind==="review"?b.workVersionId:null}).select("id").single();
 return error?NextResponse.json({error:"Não foi possível registrar."},{status:500}):NextResponse.json({id:data.id});
}
