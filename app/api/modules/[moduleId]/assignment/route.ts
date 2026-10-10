import {NextResponse} from "next/server";
function retired(){return NextResponse.json({error:"Esta prática foi substituída pelas produções das lições. Abra a página de práticas do módulo. O histórico anterior foi preservado."},{status:410});}
export const GET=retired;
export const POST=retired;
