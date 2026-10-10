import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {uuid} from "@/lib/formation/server";
export async function GET(request:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const id=new URL(request.url).searchParams.get("id");if(!uuid(id))return NextResponse.json({error:"Arquivo inválido"},{status:400});
 const db=createSupabaseAdminClient();const {data,error}=await db.from("assignment_submissions").select("file_url").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(error||!data?.file_url)return NextResponse.json({error:"Arquivo não encontrado"},{status:404});
 let path:string;try{const url=new URL(data.file_url),expected=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);const prefix='/storage/v1/object/public/assignment-files/';if(url.origin!==expected.origin||!url.pathname.startsWith(prefix))throw Error();path=decodeURIComponent(url.pathname.slice(prefix.length));if(!path.startsWith(user.id+'/')||path.split('/').includes('..'))throw Error();}catch{return NextResponse.json({error:"Referência antiga precisa de reconciliação."},{status:409});}
 const signed=await db.storage.from("assignment-files").createSignedUrl(path,300,{download:true});if(signed.error)return NextResponse.json({error:"Download indisponível"},{status:503});
 return NextResponse.redirect(signed.data.signedUrl,{status:303,headers:{"Cache-Control":"private, no-store"}});
}
