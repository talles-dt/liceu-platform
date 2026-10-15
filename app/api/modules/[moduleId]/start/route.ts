import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { canAccessLiceuModuleForUser, setLiceuCurrentModule } from "@/lib/progression";
export async function POST(_req: Request,{params}:{params:Promise<{moduleId:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const {moduleId}=await params;
 if(!await canAccessLiceuModuleForUser(user.id,moduleId))return NextResponse.json({error:"Forbidden"},{status:403});
 return await setLiceuCurrentModule(user.id,moduleId)?NextResponse.json({ok:true}):NextResponse.json({error:"Não foi possível salvar."},{status:500});
}
