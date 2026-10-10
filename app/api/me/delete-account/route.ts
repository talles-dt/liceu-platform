import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
// The former sequence partially erased history before encountering missing tables.
// Keep data intact until the resumable account/storage/billing erasure job is implemented.
export async function POST(){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 return NextResponse.json({error:"A exclusão automática está temporariamente indisponível. Solicite atendimento pelo contato da política de privacidade. Nenhum dado foi apagado."},{status:503});
}
