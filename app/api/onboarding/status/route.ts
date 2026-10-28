import {NextResponse} from "next/server";
import {getCurrentUser,createSupabaseServerClient} from "@/lib/supabaseServer";
export async function GET(){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const db=await createSupabaseServerClient();
 const [{data:modules,error},{data:diagnoses,error:diagnosticError}]=await Promise.all([
 db.from("liceu_modules").select("id,title").eq("is_active",true).order("order_index"),
 db.from("diagnostic_sessions").select("id").eq("user_id",user.id).limit(1)]);
 if(error||diagnosticError)return NextResponse.json({error:"Não foi possível carregar seu percurso."},{status:500});
 let first:null|{id:string;title:string}=null;
 for(const m of modules??[]){const {data,error}=await db.rpc("liceu_can_access_module",{p_module_id:m.id});if(error)return NextResponse.json({error:"Falha ao consultar acesso."},{status:500});if(data===true){first=m;break;}}
 return NextResponse.json({hasAccount:true,hasPurchase:!!first,hasDiagnosis:!!diagnoses?.length,firstModuleId:first?.id??null,moduleName:first?.title??null});
}
