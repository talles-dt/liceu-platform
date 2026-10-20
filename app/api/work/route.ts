import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin,uuid,databaseFailure} from "@/lib/formation/server";
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem inválida"},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await request.json().catch(()=>null);
 if(!uuid(b?.exerciseId)||typeof b?.content!=="string"||b.content.length>50000||!Number.isInteger(b.revision)||b.revision<0||(b.publish===true&&!uuid(b.requestId)))return NextResponse.json({error:"Conteúdo ou revisão inválidos."},{status:400});
 const {data,error}=await createSupabaseAdminClient().rpc("liceu_save_work",{p_user:user.id,p_exercise:b.exerciseId,p_content:b.content,p_revision:b.revision,p_publish:b.publish===true,p_request:b.requestId??null});
 return error?databaseFailure(error):NextResponse.json({saved:true,...data});
}
