import {NextResponse} from "next/server";
import {assertAdmin} from "@/lib/admin/auth";
async function retired(){
 if(!await assertAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 return NextResponse.json({error:"Editor legado aposentado. Use as lições e exercícios canônicos em /admin/content; nenhum ID antigo será convertido por posição."},{status:410});
}
export const GET=retired;
export const POST=retired;
export const DELETE=retired;
