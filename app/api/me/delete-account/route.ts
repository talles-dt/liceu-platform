import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin} from "@/lib/formation/server";
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await req.json().catch(()=>null);if(body?.confirmation!=="EXCLUIR")return NextResponse.json({error:"Digite EXCLUIR para registrar o pedido."},{status:400});
 const db=createSupabaseAdminClient(user.id);
 const saved=await db.from("liceu_privacy_requests").upsert({user_id:user.id},{onConflict:"user_id",ignoreDuplicates:true});
 if(saved.error)return NextResponse.json({error:"Não foi possível registrar o pedido."},{status:503});
 return NextResponse.json({message:"Pedido registrado. A equipe revisará obrigações financeiras e registros compartilhados antes da exclusão. Você pode exportar seus dados enquanto aguarda."},{status:202});
}
export async function GET(){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data,error}=await createSupabaseAdminClient().from("liceu_privacy_requests").select("id,status,requested_at,retention_reason,retention_until,completed_at").eq("user_id",user.id).maybeSingle();
 return error?NextResponse.json({error:"Consulta indisponível"},{status:503}):NextResponse.json({request:data},{headers:{"Cache-Control":"private, no-store"}});
}
